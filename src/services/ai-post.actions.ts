"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant, resolveTenantNiche } from "@/lib/supabase/tenant";
import { CONTENT_PILLARS, type ContentPillar } from "@/lib/constants/pillars";
import {
  generateContentWithGemini,
  extractValidJson,
  sanitizeAiText,
} from "@/lib/gemini";

export type { ContentPillar };

export interface GeneratePostParams {
  businessName?: string;
  businessCategory?: string;
  niche?: string;
  servicesList?: string[];
  targetCity?: string;
  focusTopic?: string;
  pillarId?: string;
  excludeTitles?: string[];
  excludeImageUrls?: string[];
}

export interface GeneratedPostData {
  title: string;
  content: string;
  tags: string;
  metaDescription: string;
  ctaType: "booking" | "whatsapp" | "link";
  ctaLabel: string;
  ctaUrl?: string;
  imageUrl?: string;
  source: "gemini" | "fallback";
  pillar?: string;
}

export interface GeneratePostResult {
  success: boolean;
  data?: GeneratedPostData;
  error?: string;
}

const KNOWN_DF_REGIONS = [
  "Taguatinga",
  "Ceilândia",
  "Águas Claras",
  "Samambaia",
  "Vicente Pires",
  "Guará",
  "Gama",
  "Sobradinho",
  "Planaltina",
  "Asa Sul",
  "Asa Norte",
  "Sudoeste",
  "Octogonal",
  "Noroeste",
  "Lago Sul",
  "Lago Norte",
  "Recanto das Emas",
  "Riacho Fundo",
  "Santa Maria",
  "Núcleo Bandeirante",
  "Park Way",
  "Cruzeiro",
  "Brazlândia",
  "Paranoá",
  "São Sebastião",
  "Jardim Botânico",
  "Brasília",
];

function isPlaceholderCity(value?: string | null): boolean {
  const clean = String(value || "").trim().toLowerCase();
  if (!clean) return true;
  return (
    clean === "sua cidade" ||
    clean === "minha cidade" ||
    clean === "cidade" ||
    clean === "sua região" ||
    clean === "região" ||
    clean === "local"
  );
}

/**
 * Extrai a cidade/bairro real do tenant a partir do cadastro ou endereço formatado.
 * Nunca retorna "sua cidade".
 */
function extractRealCity(
  paramsCity?: string | null,
  tenantRow?: any,
  profileAddress?: string | null
): string {
  const candidates = [
    paramsCity,
    tenantRow?.city,
    tenantRow?.region,
    tenantRow?.theme_settings?.city,
    tenantRow?.theme_settings?.region,
  ];

  for (const cand of candidates) {
    if (cand && !isPlaceholderCity(cand)) {
      return String(cand).trim();
    }
  }

  const combinedAddress = [profileAddress, tenantRow?.address]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (combinedAddress) {
    const lowerAddr = combinedAddress.toLowerCase();
    for (const region of KNOWN_DF_REGIONS) {
      if (lowerAddr.includes(region.toLowerCase())) {
        return region === "Brasília" ? "Brasília - DF" : `${region} - DF`;
      }
    }

    // Tenta extrair padrão "Cidade - UF" ou penúltimo segmento do endereço
    const cityUfMatch = combinedAddress.match(
      /([A-Za-zÀ-ÿ\s]{3,35})\s*[-–,]\s*([A-Z]{2})\b/
    );
    if (cityUfMatch && cityUfMatch[1] && !isPlaceholderCity(cityUfMatch[1])) {
      return `${cityUfMatch[1].trim()} - ${cityUfMatch[2].trim()}`;
    }

    const parts = combinedAddress
      .split(/[-–,]/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 3 && !/^\d{5}-?\d{3}$/.test(p));
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 2];
      if (candidate && !isPlaceholderCity(candidate) && !/^\d+$/.test(candidate)) {
        return candidate;
      }
    }
  }

  return "Brasília - DF";
}

/**
 * Remove qualquer placeholder genérico ("sua cidade", "segmento de serviços") que a IA possa ter emitido.
 */
function enforceNoPlaceholders(
  text: string,
  realCity: string,
  nicheLabel: string
): string {
  if (!text) return "";
  return text
    .replace(/\b(em|na|da|de)\s+sua cidade\b/gi, `$1 ${realCity}`)
    .replace(/\bsua cidade\b/gi, realCity)
    .replace(/\bsegmento de serviços\b/gi, nicheLabel.toLowerCase())
    .trim();
}

/**
 * Resolve o bucket de nicho real combinando o campo niche/theme_niche com palavras-chave do nome/categoria do estabelecimento.
 */
function resolveBucketKeyForNiche(
  niche?: string | null,
  businessName?: string | null,
  businessCategory?: string | null
): string {
  const combined = `${niche || ""} ${businessCategory || ""} ${businessName || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Guincho & Socorro 24h (prioridade antes de automotive)
  if (
    combined.includes("towing") ||
    combined.includes("guincho") ||
    combined.includes("reboque") ||
    combined.includes("auto socorro") ||
    combined.includes("socorro veicular") ||
    combined.includes("resgate veicular")
  ) {
    return "towing";
  }

  // 2. Bares, Cervejarias, Espetarias e Restaurantes
  if (
    combined.includes("restaurant") ||
    combined.includes("gastronomia") ||
    combined.includes("cervejaria") ||
    combined.includes("choperia") ||
    combined.includes("petisc") ||
    combined.includes("espet") ||
    combined.includes("pizz") ||
    combined.includes("burger") ||
    combined.includes("hamburg") ||
    combined.includes("boteco") ||
    combined.includes("churrasc") ||
    combined.includes("lanchonete") ||
    combined.includes("bistro") ||
    combined.includes("sushi") ||
    /\bbar\b/.test(combined)
  ) {
    return "restaurant";
  }

  // 2.5 Revenda de Veículos & Multimarcas (PRIORIDADE antes de oficina mecânica!)
  if (
    combined.includes("car_dealership") ||
    combined.includes("veiculos") ||
    combined.includes("multimarcas") ||
    combined.includes("seminovos") ||
    combined.includes("semi-novos") ||
    combined.includes("automoveis") ||
    combined.includes("motors") ||
    combined.includes("carros") ||
    combined.includes("concessionaria") ||
    combined.includes("revenda")
  ) {
    return "car_dealership";
  }

  // 3. Oficina Mecânica / Automotivo
  if (
    combined.includes("automotive") ||
    combined.includes("mechanic") ||
    combined.includes("mecanic") ||
    combined.includes("oficina") ||
    combined.includes("auto center") ||
    combined.includes("funilaria") ||
    combined.includes("borracharia") ||
    combined.includes("lava jato") ||
    combined.includes("car_wash")
  ) {
    return "automotive";
  }

  // 4. Barbearia
  if (combined.includes("barbea") || combined.includes("barber")) {
    return "barbearia";
  }

  // 5. Pet Shop & Veterinária
  if (
    combined.includes("pet") ||
    combined.includes("veterin") ||
    combined.includes("bicho") ||
    combined.includes("animal")
  ) {
    return "petshop";
  }

  // 6. Confeitaria & Doceria
  if (
    combined.includes("confeit") ||
    combined.includes("bakery") ||
    combined.includes("bolo") ||
    combined.includes("doce") ||
    combined.includes("padaria")
  ) {
    return "confeitaria";
  }

  // 7. Estética, Salão e Beleza
  if (
    combined.includes("beauty") ||
    combined.includes("estetica") ||
    combined.includes("beleza") ||
    combined.includes("salao") ||
    combined.includes("cilios") ||
    combined.includes("lash") ||
    combined.includes("clinica")
  ) {
    return "estetica_saude";
  }

  return "default";
}

/**
 * Mapeamento de contexto, pilares e CTAs reais por nicho para calibrar o prompt da IA
 */
function getNichePromptInstructions(
  bucketKey: string,
  services: string[],
  targetCity: string,
  tenantSlug?: string
): {
  nicheLabel: string;
  domainGuidelines: string;
  defaultServices: string[];
  defaultCtaType: "booking" | "whatsapp" | "link";
  defaultCtaLabel: string;
  defaultCtaUrl?: string;
} {
  if (bucketKey === "restaurant") {
    return {
      nicheLabel: "Bar, Cervejaria, Petiscaria e Restaurante",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO GASTRONOMIA / BAR & CERVEJARIA:
- Escreva com linguagem convidativa, saborosa e descontraída de bar, cervejaria e petiscaria em ${targetCity}.
- Cite pratos, porções e bebidas REAIS da lista de produtos do cardápio (ex: "${services.slice(0, 4).join('", "') || "Carne de Sol, Picanha na Chapa, Porções e Cerveja Gelada"}").
- Explore os 3 pilares do segmento:
  1. Happy Hour & Cerveja Gelada: cerveja trincando, long necks e petiscos na brasa para reunir os amigos hoje em ${targetCity}.
  2. Destaque do Cardápio: dar água na boca destacando pratos reais servidos na casa.
  3. Fim de Semana / Confraternização: ambiente animado, porções fartas e atendimento rápido direto na mesa via QR Code.
- Palavras-chave SEO devem incluir termos como "bar e petiscaria em ${targetCity}", "cerveja gelada ${targetCity}", "onde comer em ${targetCity}" e nomes reais dos pratos.
- PROIBIDO usar termos de escritório, consultório ou "agende seu atendimento" / "materiais de alto padrão". Convide para abrir o cardápio digital ou vir curtir hoje!`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Carne de Sol na Chapa",
              "Picanha na Chapa",
              "Porções e Petiscos na Brasa",
              "Cervejas Long Neck e Chopp Trincando",
            ],
      defaultCtaType: "link",
      defaultCtaLabel: "Ver Cardápio & Pedir",
      defaultCtaUrl: tenantSlug ? `/${tenantSlug}#cardapio` : "#cardapio",
    };
  }

  if (bucketKey === "towing") {
    return {
      nicheLabel: "Guincho, Reboque e Socorro Veicular 24h",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO GUINCHO & SOCORRO 24H:
- Aborde exclusivamente situações reais de resgate e transporte veicular em ${targetCity}: atendimento rápido 24 horas, transporte seguro em caminhão plataforma sem danificar câmbio ou para-choque, socorro para pane elétrica, pane seca, bateria descarregada, pneu furado ou remoção de carros e motos.
- Destaque agilidade no envio de localização pelo WhatsApp, segurança no transporte e disponibilidade 24h em ${targetCity} e rodovias próximas.
- PROIBIDO mencionar agendamento de salão, barbearia ou "materiais de alto padrão".`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Guincho Plataforma 24 Horas",
              "Socorro para Pane Elétrica e Bateria",
              "Resgate de Carros, SUVs e Motos",
              "Transporte Seguro em Caminhão Plataforma",
            ],
      defaultCtaType: "whatsapp",
      defaultCtaLabel: "Solicitar Guincho 24h",
    };
  }

  if (bucketKey === "car_dealership") {
    return {
      nicheLabel: "Revenda de Veículos, Seminovos e Multimarcas",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO REVENDA DE VEÍCULOS & MULTIMARCAS:
- Aborde exclusivamente compra segura de carros seminovos em ${targetCity}: importância do laudo cautelar 100% aprovado, financiamento facilitado em até 60x, troca com troco e avaliação justa do usado, garantia de motor e câmbio e revisão pré-entrega.
- Destaque procedência, transparência na negociação e simulação rápida pelo WhatsApp em ${targetCity}.
- PROIBIDO falar de conserto mecânico de oficina, troca de óleo avulsa ou salão de beleza.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Seminovos com Laudo Cautelar Aprovado",
              "Financiamento Facilitado em até 60x",
              "Troca com Troco e Avaliação do Usado",
              "Veículos Revisados com Garantia",
            ],
      defaultCtaType: "link",
      defaultCtaLabel: "Ver Estoque & Simular",
      defaultCtaUrl: tenantSlug ? `/${tenantSlug}#produtos` : "#produtos",
    };
  }

  if (bucketKey === "automotive") {
    return {
      nicheLabel: "Oficina Mecânica e Centro Automotivo",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO AUTOMOTIVO:
- Aborde dicas práticas e reais de manutenção preventiva e corretiva automotiva em ${targetCity}: troca de óleo e filtros no prazo correto, revisão do sistema de freios (pastilhas, discos e fluido), alinhamento, balanceamento e suspensão (amortecedores, buchas, pivôs), barulhos no motor, kit de embreagem, direção hidráulica/elétrica, correia dentada ou higienização de ar-condicionado automotivo.
- Destaque a segurança da família nas ruas e estradas, economia de combustível, prevenção de quebras inesperadas e diagnóstico técnico transparente por placa.
- NUNCA mencione serviços de salão, barbearia ou estética corporal.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Troca de Óleo e Filtros",
              "Revisão de Freios e Suspensão",
              "Manutenção de Embreagem e Direção",
              "Diagnóstico Eletrônico por Scanner",
              "Revisão Preventiva por Quilometragem",
            ],
      defaultCtaType: "whatsapp",
      defaultCtaLabel: "Solicitar Orçamento por Placa",
    };
  }

  if (bucketKey === "barbearia") {
    return {
      nicheLabel: "Barbearia e Estética Masculina",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO BARBEARIA:
- Aborde exclusivamente cuidados masculinos em ${targetCity}: corte degradê (fade), corte social, alinhamento e hidratação de barba, barbaterapia com toalha quente, cuidados com o couro cabeludo e visual impecável para o dia a dia ou eventos.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Corte Degradê e Social",
              "Barba Completa e Barbaterapia",
              "Acabamento e Sobrancelha",
              "Hidratação Capilar e de Barba",
            ],
      defaultCtaType: "booking",
      defaultCtaLabel: "Reservar Horário",
    };
  }

  if (bucketKey === "petshop") {
    return {
      nicheLabel: "Pet Shop e Clínica Veterinária",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO PET & VETERINÁRIA:
- Aborde exclusivamente saúde, higiene e bem-estar de cães e gatos em ${targetCity}: banho e tosa higiênica, hidratação de pelagem, vacinação em dia, check-up veterinário preventivo, controle de pulgas/carrapatos e alimentação saudável para pets.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Banho e Tosa Especializada",
              "Consulta Veterinária e Check-up",
              "Vacinação e Vermifugação",
              "Hidratação e Cuidados para Pets",
            ],
      defaultCtaType: "booking",
      defaultCtaLabel: "Agendar Banho & Tosa",
    };
  }

  if (bucketKey === "confeitaria") {
    return {
      nicheLabel: "Confeitaria Artesanal e Doceria",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO CONFEITARIA:
- Aborde exclusivamente bolos artesanais, tortas especiais, doces finos para festas e aniversários, ingredientes selecionados e encomendas personalizadas em ${targetCity}.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Bolos Decorados sob Encomenda",
              "Doces Finos e Brigadeiros Gourmet",
              "Tortas Artesanais e Kits Festa",
            ],
      defaultCtaType: "whatsapp",
      defaultCtaLabel: "Fazer Encomenda",
    };
  }

  if (bucketKey === "estetica_saude") {
    return {
      nicheLabel: "Estética, Beleza e Bem-Estar",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO ESTÉTICA & BELEZA:
- Aborde exclusivamente autoestima, cuidados estéticos faciais e corporais, durabilidade dos procedimentos, biossegurança, técnicas modernas e atendimento personalizado em ${targetCity}.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Procedimentos Estéticos Personalizados",
              "Cuidados Faciais e Beleza",
              "Atendimento com Hora Marcada",
            ],
      defaultCtaType: "booking",
      defaultCtaLabel: "Reservar Horário",
    };
  }

  return {
    nicheLabel: "Serviços Especializados Locais",
    domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO:
- Aborde exclusivamente os serviços reais da empresa em ${targetCity}, resolvendo dúvidas reais dos clientes da região e destacando atendimento ágil e transparente.`,
    defaultServices:
      services.length > 0
        ? services
        : ["Atendimento Especializado", "Orçamento Rápido no WhatsApp"],
    defaultCtaType: "whatsapp",
    defaultCtaLabel: "Falar no WhatsApp",
  };
}

/**
 * Subtemas rotativos por nicho para evitar qualquer repetição de ângulo nos posts gerados pela IA
 */
const NICHE_ROTATING_SUBTOPICS: Record<
  string,
  Array<{ angle: string; matchKeywords: string[] }>
> = {
  restaurant: [
    {
      angle:
        "Happy Hour & Cerveja Gelada: cerveja trincando, long necks e petiscos na brasa para reunir os amigos hoje",
      matchKeywords: ["happy hour", "cerveja", "gelada", "long neck", "amigos"],
    },
    {
      angle:
        "Destaque do Cardápio: porções caprichadas, carnes na chapa e pratos mais pedidos da casa para compartilhar na mesa",
      matchKeywords: ["cardápio", "cardapio", "porção", "porcao", "chapa", "destaque"],
    },
    {
      angle:
        "Fim de Semana e Confraternização: ambiente animado, porções fartas e pedido rápido direto na mesa via QR Code sem espera",
      matchKeywords: ["fim de semana", "confraterniza", "qr code", "mesa", "sábado"],
    },
    {
      angle:
        "Combinação perfeita de petiscos crocantes, entradas quentes e bebidas geladas para curtir o fim de tarde",
      matchKeywords: ["petisco", "entrada", "crocante", "fim de tarde"],
    },
    {
      angle:
        "Noite de sabores na brasa: cortes selecionados, acompanhamentos frescos e atendimento ágil no bar e petiscaria",
      matchKeywords: ["brasa", "corte", "carne", "noite"],
    },
  ],
  towing: [
    {
      angle:
        "Socorro Veicular e Guincho 24 Horas: atendimento rápido enviando sua localização pelo WhatsApp em qualquer horário",
      matchKeywords: ["24 horas", "24h", "localização", "socorro", "emergência"],
    },
    {
      angle:
        "Transporte seguro em caminhão plataforma: por que a plataforma protege câmbio automático, suspensão e para-choque",
      matchKeywords: ["plataforma", "câmbio", "cambio", "transporte", "seguro"],
    },
    {
      angle:
        "Pane elétrica, bateria descarregada ou pane seca: como agir com segurança no acostamento enquanto o guincho chega",
      matchKeywords: ["pane", "bateria", "elétrica", "acostamento", "seca"],
    },
    {
      angle:
        "Remoção segura de motos, carros baixos e utilitários com cintas certificadas e acompanhamento em tempo real",
      matchKeywords: ["moto", "utilitário", "cinta", "remoção"],
    },
  ],
  car_dealership: [
    {
      angle:
        "Compra segura de seminovos: por que exigir laudo cautelar aprovado e histórico transparente antes de fechar negócio",
      matchKeywords: ["laudo", "cautelar", "procedência", "segura"],
    },
    {
      angle:
        "Financiamento facilitado em até 60x: como simular parcelas que cabem no bolso com aprovação rápida",
      matchKeywords: ["financiamento", "parcela", "60x", "simular"],
    },
    {
      angle:
        "Troca com troco e avaliação justa do seu carro usado para sair de seminovo revisado no mesmo dia",
      matchKeywords: ["troca", "usado", "avaliação", "troco"],
    },
    {
      angle:
        "Revisão pré-entrega e garantia de motor e câmbio: a tranquilidade de comprar seu próximo carro em uma multimarcas de confiança",
      matchKeywords: ["revisão", "garantia", "motor", "câmbio", "pré-entrega"],
    },
  ],
  automotive: [
    {
      angle:
        "Troca de óleo do motor e substituição dos filtros (óleo, ar e combustível) no prazo correto para evitar borra e desgaste",
      matchKeywords: ["óleo", "oleo", "filtro", "lubrific"],
    },
    {
      angle:
        "Revisão do sistema de freios: sinais de desgaste nas pastilhas, discos, nível do fluido de freio e ruídos ao frear",
      matchKeywords: ["freio", "pastilha", "disco"],
    },
    {
      angle:
        "Suspensão automotiva e barulhos ao passar em buracos: amortecedores, buchas, pivôs, bieletas e estabilidade nas curvas",
      matchKeywords: ["suspensão", "suspensao", "amortecedor", "barulho"],
    },
    {
      angle:
        "Sistema de embreagem e câmbio: pedal duro, embreagem patinando em subidas e dificuldade para engatar marchas",
      matchKeywords: ["embreagem", "câmbio", "cambio", "pedal"],
    },
    {
      angle:
        "Ar-condicionado automotivo: higienização de dutos, troca do filtro de cabine (antipólen) e eficiência na refrigeração",
      matchKeywords: ["ar-condicionado", "ar condicionado", "cabine", "higieniza"],
    },
    {
      angle:
        "Sistema de arrefecimento e radiador: importância do aditivo, limpeza, válvula termostática e prevenção de superaquecimento",
      matchKeywords: ["arrefecimento", "radiador", "superaquecimento", "aditivo", "água"],
    },
    {
      angle:
        "Injeção eletrônica e diagnóstico computadorizado por scanner: luz da injeção acesa no painel, falhas e consumo elevado de combustível",
      matchKeywords: ["injeção", "injecao", "scanner", "consumo", "painel"],
    },
    {
      angle:
        "Correia dentada e correia de acessórios: quando inspecionar e substituir preventivamente para proteger as válvulas do motor",
      matchKeywords: ["correia", "dentada", "tensor"],
    },
    {
      angle:
        "Alinhamento de direção, balanceamento de rodas e rodízio de pneus: como evitar o desgaste irregular dos pneus",
      matchKeywords: ["alinhamento", "balanceamento", "pneu", "volante"],
    },
    {
      angle:
        "Bateria automotiva, alternador e sistema elétrico: sinais de partida pesada e teste preventivo de carga",
      matchKeywords: ["bateria", "alternador", "elétric", "partida"],
    },
  ],
  petshop: [
    {
      angle:
        "Alimentação saudável e nutrição equilibrada para cães e gatos em cada fase da vida",
      matchKeywords: ["alimentação", "alimentacao", "ração", "nutrição"],
    },
    {
      angle:
        "Banho e tosa higiênica regular: saúde da pele, pelagem macia, corte de unhas e prevenção de nós",
      matchKeywords: ["banho", "tosa", "pelagem"],
    },
    {
      angle:
        "Cuidados dentários em cães e gatos: prevenção de tártaro, mau hálito e saúde bucal veterinária",
      matchKeywords: ["dent", "tártaro", "tartaro", "bucal", "hálito"],
    },
    {
      angle:
        "Calendário de vacinação e vermifugação em dia: proteção essencial contra viroses e doenças graves",
      matchKeywords: ["vacina", "vermifug", "imuniza"],
    },
    {
      angle:
        "Controle e prevenção de parasitas: pulgas, carrapatos e dermatites alérgicas no seu pet",
      matchKeywords: ["pulga", "carrapato", "parasita", "coceira"],
    },
    {
      angle:
        "Cuidados especiais com pets idosos (sênior): check-up veterinário preventivo, articulações e qualidade de vida",
      matchKeywords: ["idoso", "sênior", "senior", "articula"],
    },
    {
      angle:
        "Exercícios diários, passeios seguros e enriquecimento ambiental para reduzir a ansiedade do pet",
      matchKeywords: ["exercício", "passeio", "ansiedade", "brinquedo"],
    },
  ],
  barbearia: [
    {
      angle:
        "Corte degradê (fade) e visagismo masculino: como escolher o acabamento ideal para o seu formato de rosto",
      matchKeywords: ["degradê", "degrade", "fade", "visagismo"],
    },
    {
      angle:
        "Hidratação e alinhamento de barba com óleos essenciais e balm para fios macios e sem frizz",
      matchKeywords: ["hidratação", "alinhamento de barba", "óleo", "balm"],
    },
    {
      angle:
        "Barbaterapia com toalha quente e navalha: relaxamento e cuidado com a pele do rosto sem irritação",
      matchKeywords: ["barbaterapia", "toalha quente", "navalha"],
    },
    {
      angle:
        "Cuidados com o couro cabeludo masculino: controle de oleosidade, caspa e fortalecimento dos fios",
      matchKeywords: ["couro cabeludo", "oleosidade", "caspa", "queda"],
    },
    {
      angle:
        "Design de sobrancelha masculina, acabamento do pezinho e contorno da barba para um visual limpo",
      matchKeywords: ["sobrancelha", "pezinho", "contorno"],
    },
    {
      angle:
        "Corte social e executivo moderno: praticidade para o dia a dia de trabalho e eventos",
      matchKeywords: ["social", "executivo", "trabalho"],
    },
  ],
  estetica_saude: [
    {
      angle:
        "Limpeza de pele profunda e renovação celular para manter o rosto saudável e iluminado",
      matchKeywords: ["limpeza de pele", "rosto", "poros"],
    },
    {
      angle:
        "Cuidados diários pós-procedimento para prolongar a durabilidade e o brilho do seu resultado",
      matchKeywords: ["durabilidade", "pós", "manutenção"],
    },
    {
      angle:
        "Biossegurança, materiais esterilizados e atendimento personalizado com hora marcada",
      matchKeywords: ["biossegurança", "esteriliza", "segurança"],
    },
    {
      angle:
        "Protocolo de hidratação e revitalização rápida para eventos e ocasiões especiais",
      matchKeywords: ["revitaliza", "evento", "hidrata"],
    },
  ],
  confeitaria: [
    {
      angle:
        "Bolos artesanais personalizados para aniversários e comemorações especiais em família",
      matchKeywords: ["aniversário", "bolo", "personalizado"],
    },
    {
      angle:
        "Doces finos e brigadeiros gourmet feitos com chocolate nobre e ingredientes frescos",
      matchKeywords: ["brigadeiro", "doce", "chocolate"],
    },
    {
      angle:
        "Como planejar e encomendar o kit festa ideal de acordo com o número de convidados",
      matchKeywords: ["kit festa", "convidado", "encomenda"],
    },
  ],
};

/**
 * Seleciona um subtema do nicho que ainda NÃO foi abordado nos títulos anteriores
 */
function pickFreshSubtopicForNiche(
  bucketKey: string,
  existingTitles: string[]
): string {
  const subtopics = NICHE_ROTATING_SUBTOPICS[bucketKey] || [];
  if (subtopics.length === 0) {
    return "Destaque um diferencial prático e responda uma dúvida comum dos clientes da região (variando completamente dos títulos anteriores)";
  }

  const joinedTitles = existingTitles.join(" | ").toLowerCase();

  // Filtra subtemas cujas palavras-chave NÃO aparecem nos títulos anteriores
  const unusedSubtopics = subtopics.filter(
    (item) => !item.matchKeywords.some((kw) => joinedTitles.includes(kw.toLowerCase()))
  );

  const pool = unusedSubtopics.length > 0 ? unusedSubtopics : subtopics;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex].angle;
}

/**
 * Curadoria ampla de imagens de alta definição por nicho e palavras-chave do post,
 * com ID único (`id`) para rastrear e impedir repetição de fotos já utilizadas pelo tenant.
 */
const NICHE_ILLUSTRATIVE_IMAGES: Record<
  string,
  Array<{ id: string; keywords: string[]; url: string }>
> = {
  restaurant: [
    {
      id: "rest-beer-happyhour",
      keywords: ["cerveja", "chopp", "happy hour", "long neck", "gelada", "drink"],
      url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "rest-grill-steak",
      keywords: ["carne", "picanha", "chapa", "brasa", "churrasco", "espeto"],
      url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "rest-petiscos-table",
      keywords: ["petisco", "porção", "porcao", "mesa", "amigos", "confraterniza"],
      url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "rest-beer-glasses",
      keywords: ["brinde", "fim de semana", "noite", "cervejaria", "bar"],
      url: "https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "rest-fries-appetizer",
      keywords: ["frito", "batata", "entrada", "crocante", "cardápio"],
      url: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  towing: [
    {
      id: "tow-roadside-rescue",
      keywords: ["guincho", "reboque", "socorro", "plataforma", "24h"],
      url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "tow-highway-assist",
      keywords: ["rodovia", "estrada", "pane", "acostamento", "resgate"],
      url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "tow-car-battery",
      keywords: ["bateria", "elétrica", "motor", "emergência"],
      url: "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da35?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  car_dealership: [
    {
      id: "dealer-suv-showroom",
      keywords: ["suv", "seminovo", "estoque", "laudo", "procedência"],
      url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "dealer-sedan-exec",
      keywords: ["sedan", "financiamento", "parcela", "executivo"],
      url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "dealer-sports-lot",
      keywords: ["troca", "usado", "multimarcas", "garantia"],
      url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "dealer-pickup-4x4",
      keywords: ["picape", "diesel", "4x4", "revisão"],
      url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  automotive: [
    {
      id: "auto-oil-engine",
      keywords: ["óleo", "oleo", "filtro", "lubrific"],
      url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-brakes-wheel",
      keywords: ["freio", "pastilha", "disco"],
      url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-suspension-lift",
      keywords: ["suspens", "amortecedor", "buchas", "pivô", "barulho"],
      url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-scanner-diag",
      keywords: ["scanner", "diagnóstic", "eletrônic", "injeção", "injecao", "painel"],
      url: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-clutch-gearbox",
      keywords: ["embreagem", "câmbio", "cambio", "marcha", "transmissão"],
      url: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-ac-cooling",
      keywords: ["ar-condicionado", "ar condicionado", "cabine", "higieniza", "climatiza"],
      url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-radiator-engine",
      keywords: ["arrefecimento", "radiador", "superaquecimento", "aditivo", "motor"],
      url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-tires-align",
      keywords: ["alinhamento", "balanceamento", "pneu", "roda", "direção"],
      url: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-battery-elec",
      keywords: ["bateria", "alternador", "elétric", "partida", "correia"],
      url: "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da35?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-workshop-bay",
      keywords: ["oficina", "revisão", "manutenção", "check-up"],
      url: "https://images.unsplash.com/photo-1597762470488-3877b1f538c6?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "auto-mechanic-tools",
      keywords: ["mecânico", "ferramenta", "preventiva", "segurança"],
      url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  barbearia: [
    {
      id: "barber-beard-trim",
      keywords: ["barba", "toalha", "navalha", "barbaterapia"],
      url: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "barber-fade-cut",
      keywords: ["corte", "degradê", "fade", "cabelo"],
      url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "barber-classic-chair",
      keywords: ["social", "executivo", "cadeira", "estilo"],
      url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "barber-clippers-detail",
      keywords: ["pezinho", "sobrancelha", "contorno", "acabamento"],
      url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "barber-hair-care",
      keywords: ["hidratação", "couro cabeludo", "óleo", "pomada"],
      url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  petshop: [
    {
      id: "pet-cat-care",
      keywords: ["gato", "felino"],
      url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "pet-grooming-bath",
      keywords: ["banho", "tosa", "higiene", "pelagem"],
      url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "pet-vet-vaccine",
      keywords: ["veterin", "vacina", "consulta", "saúde", "check-up"],
      url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "pet-happy-dogs",
      keywords: ["passeio", "exercício", "brincadeira"],
      url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "pet-nutrition-bowl",
      keywords: ["alimentação", "ração", "nutrição", "dent", "tártaro"],
      url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "pet-senior-golden",
      keywords: ["idoso", "sênior", "pulga", "carrapato", "parasita"],
      url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  confeitaria: [
    {
      id: "bakery-cake-party",
      keywords: ["bolo", "festa", "aniversário"],
      url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "bakery-sweets-choco",
      keywords: ["doce", "brigadeiro", "chocolate"],
      url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "bakery-pastry-tart",
      keywords: ["torta", "encomenda", "artesanal"],
      url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  estetica_saude: [
    {
      id: "beauty-salon-care",
      keywords: ["beleza", "salão", "procedimento"],
      url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "beauty-facial-skin",
      keywords: ["pele", "rosto", "limpeza", "facial", "hidrata"],
      url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "beauty-spa-wellness",
      keywords: ["autoestima", "bem-estar", "revitaliza"],
      url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  default: [
    {
      id: "default-biz-1",
      keywords: ["promoção", "desconto"],
      url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "default-biz-2",
      keywords: ["atendimento", "equipe"],
      url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1280&q=80",
    },
    {
      id: "default-biz-3",
      keywords: ["serviço", "qualidade"],
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&q=80",
    },
  ],
};

/**
 * Verifica se um item de imagem já foi utilizado nas URLs anteriores do tenant
 */
function isImageCandidateAlreadyUsed(
  candidate: { id: string; url: string },
  existingImages: string[]
): boolean {
  if (!existingImages || existingImages.length === 0) return false;
  const basePhotoIdMatch = candidate.url.match(/photo-[a-z0-9-]+/i);
  const basePhotoId = basePhotoIdMatch ? basePhotoIdMatch[0].toLowerCase() : "";

  return existingImages.some((usedUrl) => {
    const normUsed = (usedUrl || "").toLowerCase();
    if (!normUsed) return false;
    if (normUsed === candidate.url.toLowerCase()) return true;
    if (normUsed.includes(candidate.id.toLowerCase())) return true;
    if (basePhotoId && normUsed.includes(basePhotoId)) return true;
    return false;
  });
}

function selectCuratedImageForNicheAndTitle(
  bucketKey: string,
  postDescription: string,
  existingImages: string[] = [],
  preferredRealPhotos: string[] = []
): { id: string; url: string } {
  const normDesc = (postDescription || "").toLowerCase();

  // 0. Se o estabelecimento (ex: restaurante/bar) possui fotos reais de pratos/produtos ainda não usadas, prioriza-as!
  if (preferredRealPhotos && preferredRealPhotos.length > 0) {
    const validReal = preferredRealPhotos.filter(
      (u) => typeof u === "string" && /^https?:\/\//i.test(u.trim())
    );
    const unusedReal = validReal.filter(
      (u) => !isImageCandidateAlreadyUsed({ id: "tenant-real", url: u }, existingImages)
    );
    const realPool = unusedReal.length > 0 ? unusedReal : validReal;
    if (realPool.length > 0) {
      const pickedReal = realPool[Math.floor(Math.random() * realPool.length)];
      return { id: "tenant-catalog", url: pickedReal };
    }
  }

  const allCandidates =
    NICHE_ILLUSTRATIVE_IMAGES[bucketKey] || NICHE_ILLUSTRATIVE_IMAGES.default;

  // Filtra primeiro apenas imagens que NUNCA foram usadas nos últimos 10 posts do tenant
  const unusedCandidates = allCandidates.filter(
    (c) => !isImageCandidateAlreadyUsed(c, existingImages)
  );

  const pool = unusedCandidates.length > 0 ? unusedCandidates : allCandidates;

  // 1. Tenta encontrar candidatos não usados que batem com as palavras-chave da descrição do post
  const keywordMatches = pool.filter(
    (item) =>
      item.keywords.length > 0 &&
      item.keywords.some((kw) => normDesc.includes(kw.toLowerCase()))
  );

  if (keywordMatches.length > 0) {
    const picked =
      keywordMatches[Math.floor(Math.random() * keywordMatches.length)];
    const seed = Math.random().toString(36).substring(2, 8);
    const sep = picked.url.includes("?") ? "&" : "?";
    return {
      id: picked.id,
      url: `${picked.url}${sep}v=${Date.now()}-${seed}`,
    };
  }

  // 2. Caso contrário, sorteia aleatoriamente entre as opções inéditas do nicho
  const picked = pool[Math.floor(Math.random() * pool.length)];
  const seed = Math.random().toString(36).substring(2, 8);
  const sep = picked.url.includes("?") ? "&" : "?";
  return {
    id: picked.id,
    url: `${picked.url}${sep}v=${Date.now()}-${seed}`,
  };
}

/**
 * Consulta os últimos 10 posts do tenant (suportando tanto 'tenant_posts' quanto 'posts')
 * e retorna títulos e URLs de imagens já publicados para deduplicação estrita.
 */
async function fetchTenantRecentPostsHistory(
  supabase: any,
  tenantId: string,
  extraTitles: string[] = [],
  extraImages: string[] = []
): Promise<{ existingTitles: string[]; existingImages: string[] }> {
  const titlesSet = new Set<string>();
  const imagesSet = new Set<string>();

  for (const t of extraTitles || []) {
    if (t && t.trim()) titlesSet.add(t.trim());
  }
  for (const img of extraImages || []) {
    if (img && img.trim()) imagesSet.add(img.trim());
  }

  try {
    const { data: tenantPosts } = await supabase
      .from("tenant_posts")
      .select("title, tags, image_url")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10);

    const safeTenantTitles = (tenantPosts || []).map((p: any) => p?.title);
    for (const title of safeTenantTitles) {
      if (title) titlesSet.add(String(title).trim());
    }
    for (const p of tenantPosts || []) {
      if (p?.image_url) imagesSet.add(String(p.image_url).trim());
    }
  } catch {
    // prossegue silenciosamente
  }

  try {
    const { data: existingPosts } = await supabase
      .from("posts")
      .select("title, category, cover_image")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10);

    const existingTitlesFromPosts = (existingPosts || []).map((p: any) => p?.title);
    for (const title of existingTitlesFromPosts) {
      if (title) titlesSet.add(String(title).trim());
    }
    for (const p of existingPosts || []) {
      if (p?.cover_image) imagesSet.add(String(p.cover_image).trim());
    }
  } catch {
    // prossegue caso a tabela 'posts' seja representada por 'tenant_posts'
  }

  return {
    existingTitles: Array.from(titlesSet),
    existingImages: Array.from(imagesSet),
  };
}

/**
 * Fallback estruturado e calibrado por nicho caso a API do Gemini falhe no parse ou atinja timeout.
 * Garante que a requisição NUNCA falhe sem resposta e NUNCA repita títulos anteriores.
 */
function buildStructuredNicheFallbackPost(params: {
  bucketKey: string;
  businessName: string;
  targetCity: string;
  catalogItems: string[];
  freshSubtopic: string;
  existingTitles: string[];
}): {
  title: string;
  content: string;
  keywords: string;
  meta_description: string;
} {
  const bucketKey = params.bucketKey;
  const city = params.targetCity || "Brasília - DF";
  const name = params.businessName || "Nosso Estabelecimento";
  const usedLower = (params.existingTitles || []).map((t) => t.toLowerCase());
  const item1 = params.catalogItems[0] || "Carne de Sol na Chapa";
  const item2 = params.catalogItems[1] || "Picanha na Chapa";
  const item3 = params.catalogItems[2] || "Cerveja Gelada";

  const fallbackTemplates: Record<
    string,
    Array<{
      title: string;
      content: string;
      keywords: string;
      meta_description: string;
    }>
  > = {
    restaurant: [
      {
        title: `Happy Hour e Cerveja Gelada em ${city}: Venha pro ${name}`,
        content: `Nada melhor do que encerrar o dia com cerveja trincando, long necks selecionadas e petiscos feitos na hora para reunir os amigos em ${city}.\n\nNo ${name}, você aproveita porções caprichadas como ${item1} e ${item2}, com atendimento rápido direto na mesa via QR Code. Confira nosso cardápio digital e venha curtir hoje mesmo!`,
        keywords: `${name}, bar e petiscaria em ${city}, cerveja gelada ${city}, onde comer em ${city}, ${item1}`,
        meta_description: `Happy hour com cerveja gelada, ${item1} e petiscos em ${city} no ${name}. Veja o cardápio digital!`,
      },
      {
        title: `Destaque do Cardápio em ${city}: Experimente ${item1} no ${name}`,
        content: `Está procurando onde comer bem em ${city}? Nosso cardápio reúne receitas caprichadas e porções generosas perfeitas para dividir na mesa com quem você gosta.\n\nExperimente nossa ${item1}, além de ${item2} e ${item3}, sempre servidos na temperatura ideal. Abra nosso cardápio digital agora e escolha seus favoritos!`,
        keywords: `${item1}, ${item2}, onde comer em ${city}, bar e petiscaria em ${city}, ${name}`,
        meta_description: `Experimente ${item1} e ${item2} no ${name} em ${city}. Porções fartas e pedido rápido na mesa!`,
      },
      {
        title: `Fim de Semana e Confraternização em ${city} é no ${name}`,
        content: `Reúna a galera ou a família para curtir um ambiente descontraído, comida saborosa e bebidas sempre geladas em ${city}.\n\nNo ${name}, você pede direto da mesa pelo cardápio digital com QR Code sem enfrentar demora e aproveita destaques como ${item1} e ${item2}. Acesse o cardápio e venha aproveitar!`,
        keywords: `confraternização ${city}, bar em ${city}, cerveja gelada ${city}, petiscaria ${city}, ${name}`,
        meta_description: `Curta o fim de semana no ${name} em ${city} com porções fartas, cerveja gelada e cardápio digital na mesa.`,
      },
    ],
    towing: [
      {
        title: `Guincho e Socorro Veicular 24h em ${city}: Chegada Rápida`,
        content: `Ficou na mão com pane elétrica, bateria descarregada ou pneu furado em ${city}? Conte com o atendimento rápido 24 horas da ${name}.\n\nBasta enviar sua localização pelo WhatsApp para acionar nosso caminhão plataforma com total segurança para carros, SUVs e motos. Salve nosso contato e chame sempre que precisar!`,
        keywords: `guincho 24h ${city}, reboque ${city}, auto socorro ${city}, caminhão plataforma, ${name}`,
        meta_description: `Precisa de guincho 24h em ${city}? A ${name} oferece resgate veicular rápido em caminhão plataforma.`,
      },
      {
        title: `Transporte em Caminhão Plataforma em ${city}: Proteja seu Veículo`,
        content: `Em caso de pane mecânica ou acidente, o transporte em caminhão plataforma evita danos ao câmbio automático, suspensão e para-choque do seu carro.\n\nA ${name} atende ${city} e região 24 horas com cintas certificadas, agilidade e preço justo combinado antes da saída. Solicite seu guincho agora pelo WhatsApp!`,
        keywords: `caminhão plataforma ${city}, guincho para carro automático, socorro veicular ${city}, ${name}`,
        meta_description: `Transporte seguro em caminhão plataforma 24h em ${city}. Chame a ${name} no WhatsApp!`,
      },
    ],
    car_dealership: [
      {
        title: `Seminovos com Laudo Cautelar Aprovado em ${city}: Compre com Segurança`,
        content: `Comprar um carro seminovo exige tranquilidade e procedência comprovada. O laudo cautelar verifica a estrutura, histórico de leilão e documentação completa do veículo antes da entrega.\n\nNa ${name}, em ${city}, todos os veículos do estoque passam por revisão pré-entrega e contam com garantia de motor e câmbio. Confira nosso estoque online e simule seu financiamento agora!`,
        keywords: `seminovos ${city}, loja de carros ${city}, laudo cautelar aprovado, multimarcas ${city}, ${name}`,
        meta_description: `Compre seminovos com laudo cautelar aprovado e garantia em ${city} na ${name}. Veja o estoque e simule!`,
      },
      {
        title: `Financiamento em até 60x e Troca com Troco em ${city}`,
        content: `Quer trocar de carro sem burocracia? Avaliamos seu usado com transparência na troca e oferecemos financiamento facilitado com as melhores taxas e parcelas que cabem no seu orçamento.\n\nAcesse o estoque selecionado da ${name} em ${city} e faça uma simulação rápida pelo WhatsApp sem compromisso!`,
        keywords: `financiamento de carros ${city}, troca com troco ${city}, revenda de veículos ${city}, carros seminovos, ${name}`,
        meta_description: `Simule seu financiamento em até 60x e avalie seu usado na troca na ${name} em ${city}.`,
      },
    ],
    automotive: [
      {
        title: `Troca de Óleo e Filtros em ${city}: Proteja o Motor do Seu Carro`,
        content: `Manter a troca de óleo lubrificante e dos filtros de óleo, ar e combustível rigorosamente no prazo é o cuidado mais importante para evitar a formação de borra e o superaquecimento do motor.\n\nNa ${name}, em ${city}, utilizamos lubrificantes na especificação exata da montadora e realizamos uma checagem preventiva completa. Solicite seu orçamento rápido pela placa ou fale com nossa equipe no WhatsApp!`,
        keywords: `troca de óleo, revisão automotiva, filtro de óleo, oficina mecânica, ${city}`,
        meta_description: `Saiba quando trocar o óleo e os filtros do seu veículo em ${city} com a equipe da ${name}.`,
      },
      {
        title: `Sinais de Desgaste nos Freios: Faça sua Revisão em ${city}`,
        content: `Notou ruído metálico ao pisar no freio, pedal mais baixo ou trepidação no volante em frenagens? Esses sintomas indicam desgaste nas pastilhas, discos ou necessidade de substituição do fluido de freio.\n\nGaranta a segurança da sua família nas ruas e estradas: traga seu veículo até a ${name} em ${city} para uma inspeção técnica transparente do sistema de freios.`,
        keywords: `revisão de freios, pastilha de freio, disco de freio, segurança automotiva, ${city}`,
        meta_description: `Identifique sinais de desgaste nas pastilhas e discos de freio e agende uma avaliação em ${city}.`,
      },
      {
        title: `Barulho na Suspensão ao Passar em Buracos? Avaliação em ${city}`,
        content: `Estalos, batidas secas ou carro puxando para o lado são sinais de folga em amortecedores, buchas, bieletas ou pivôs da suspensão. Rodar com a suspensão comprometida acelera o desgaste dos pneus e reduz a estabilidade.\n\nNa ${name}, em ${city}, fazemos o diagnóstico completo de suspensão e direção para devolver o conforto e a segurança ao seu veículo.`,
        keywords: `suspensão automotiva, amortecedores, alinhamento, direção, ${city}`,
        meta_description: `Barulhos na suspensão ou direção instável? Confira como cuidar dos amortecedores e buchas em ${city}.`,
      },
      {
        title: `Sistema de Arrefecimento e Radiador: Evite Superaquecimento`,
        content: `O controle da temperatura do motor depende diretamente da água desmineralizada com aditivo na proporção correta, além de mangueiras e válvula termostática em perfeito estado.\n\nPrevina panes graves na estrada! A equipe da ${name} em ${city} realiza a limpeza e revisão completa do sistema de arrefecimento do seu carro com garantia e precisão.`,
        keywords: `arrefecimento, limpeza de radiador, aditivo de radiador, revisão preventiva, ${city}`,
        meta_description: `Evite o superaquecimento do motor com a revisão do sistema de arrefecimento e radiador em ${city}.`,
      },
      {
        title: `Embreagem Dura ou Patinando? Diagnóstico Especializado em ${city}`,
        content: `Se o pedal da embreagem está pesado, alto demais ou o motor sobe de giro sem ganhar velocidade nas subidas, o kit de embreagem pode estar no fim da vida útil.\n\nConte com a ${name} em ${city} para avaliar o sistema de transmissão e embreagem do seu veículo com orçamento transparente por placa.`,
        keywords: `kit de embreagem, câmbio automotivo, pedal duro, mecânica especializada, ${city}`,
        meta_description: `Pedal de embreagem duro ou patinando? Solicite um diagnóstico mecânico em ${city} com a ${name}.`,
      },
    ],
    petshop: [
      {
        title: `Banho e Tosa Higiênica em ${city}: Saúde e Bem-Estar para seu Pet`,
        content: `A higiene regular com produtos específicos para cães e gatos previne dermatites, elimina nós na pelagem e mantém seu melhor amigo sempre confortável e cheiroso.\n\nNa ${name}, em ${city}, cuidamos do seu pet com carinho, toalhas esterilizadas e profissionais apaixonados por animais. Agende o horário do seu pet!`,
        keywords: `banho e tosa, pet shop, higiene pet, cuidados com cães e gatos, ${city}`,
        meta_description: `Banho e tosa com carinho e segurança para cães e gatos em ${city} é na ${name}.`,
      },
      {
        title: `Cuidados Preventivos e Vacinação Pet em ${city}: Proteja quem Você Ama`,
        content: `Manter o calendário de vacinação, vermifugação e controle de pulgas e carrapatos em dia é essencial para garantir uma vida longa e saudável ao seu cão ou gato.\n\nConte com a equipe da ${name} em ${city} para orientar a rotina de saúde e nutrição ideal para o seu pet em todas as fases da vida.`,
        keywords: `saúde pet, vacinação animal, prevenção de pulgas, clínica pet, ${city}`,
        meta_description: `Mantenha a saúde, vacinação e prevenção do seu pet em dia com a ${name} em ${city}.`,
      },
    ],
    barbearia: [
      {
        title: `Corte Degradê e Barba Alinhada em ${city}: Estilo Impecável`,
        content: `Um corte bem executado e a barba hidratada com toalha quente fazem toda a diferença na sua apresentação pessoal no trabalho e nos momentos de lazer.\n\nNa ${name}, em ${city}, unimos técnicas modernas de visagismo e produtos premium. Reserve seu horário online sem filas!`,
        keywords: `barbearia, corte degradê, barba com toalha quente, estilo masculino, ${city}`,
        meta_description: `Agende seu corte degradê e alinhamento de barba com toalha quente na ${name} em ${city}.`,
      },
    ],
    default: [
      {
        title: `Atendimento Especializado em ${city}: Qualidade e Confiança`,
        content: `Cuidar de cada detalhe com transparência, pontualidade e materiais de alto padrão é o nosso compromisso diário com você.\n\nEntre em contato com a equipe da ${name} em ${city} e agende seu atendimento com praticidade pelo site ou WhatsApp!`,
        keywords: `atendimento especializado, serviços de qualidade, agendamento rápido, ${name}, ${city}`,
        meta_description: `Conheça os serviços especializados da ${name} em ${city} e agende seu atendimento.`,
      },
    ],
  };

  const candidates =
    fallbackTemplates[bucketKey] || fallbackTemplates.default;
  const unused = candidates.filter(
    (c) => !usedLower.includes(c.title.toLowerCase())
  );
  const pool = unused.length > 0 ? unused : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Server Action: Gera Post Semanal Otimizado para SEO Local com IA
 * Calibrado estritamente pelo nicho do tenant (tenant.name, tenant.niche, tenant.city e services)
 * com deduplicação estrita dos últimos 10 posts e imagens.
 */
export async function generateLocalSeoPost(
  params?: GeneratePostParams
): Promise<GeneratePostResult> {
  try {
    const { data: tenantContext, error: tenantError } =
      await getAuthenticatedTenant();
    if (tenantError || !tenantContext) {
      return {
        success: false,
        error: tenantError || "Sessão expirada. Faça login novamente.",
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY não configurada no servidor.",
      };
    }

    const tenantId = tenantContext.tenantId;
    const supabase = createAdminClient();

    // 1. Buscar dados completos do tenant, perfil, cardápio/serviços/produtos e histórico dos últimos 10 posts
    const [tenantRes, profileRes, servicesRes, menuItemsRes, productsRes, historyData] =
      await Promise.all([
        supabase
          .from("tenants")
          .select("*")
          .eq("id", tenantId)
          .maybeSingle(),
        supabase
          .from("tenant_profiles")
          .select("name, business_category, address, phone_whatsapp")
          .eq("tenant_id", tenantId)
          .maybeSingle(),
        supabase
          .from("services")
          .select("name")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .limit(10),
        supabase
          .from("menu_items")
          .select("name, image_url, category")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("tenant_products")
          .select("name, image_url")
          .eq("tenant_id", tenantId)
          .limit(10),
        fetchTenantRecentPostsHistory(
          supabase,
          tenantId,
          params?.excludeTitles || [],
          params?.excludeImageUrls || []
        ),
      ]);

    const tenantRow = tenantRes.data || tenantContext.tenant;
    const profile = profileRes.data;
    const servicesData = servicesRes.data || [];
    const menuItemsData = menuItemsRes.data || [];
    const productsData = productsRes.data || [];
    const { existingTitles, existingImages } = historyData;

    const existingTitlesFormatted =
      existingTitles.length > 0
        ? existingTitles.map((t, idx) => `${idx + 1}. "${t}"`).join("\n")
        : "Nenhum post anterior registrado.";

    const selectedPillar =
      CONTENT_PILLARS.find((p) => p.id === params?.pillarId) ||
      CONTENT_PILLARS[Math.floor(Math.random() * CONTENT_PILLARS.length)];

    // 2. Captura dinâmica de tenant.name, nicho efetivo, cidade real e top 5 produtos/serviços
    const businessName =
      params?.businessName ||
      tenantRow?.name ||
      profile?.name ||
      "Nosso Estabelecimento";

    const resolvedNiche =
      params?.niche ||
      resolveTenantNiche(tenantRow) ||
      params?.businessCategory ||
      profile?.business_category ||
      "general";

    const bucketKey = resolveBucketKeyForNiche(
      resolvedNiche,
      businessName,
      profile?.business_category || params?.businessCategory
    );

    const targetCity = extractRealCity(
      params?.targetCity,
      tenantRow,
      profile?.address
    );

    const catalogNames = Array.from(
      new Set([
        ...(params?.servicesList || []),
        ...menuItemsData.map((m: any) => m?.name).filter(Boolean),
        ...productsData.map((p: any) => p?.name).filter(Boolean),
        ...servicesData.map((s: any) => s?.name).filter(Boolean),
      ])
    ).slice(0, 8);

    const top5CatalogItems = catalogNames.slice(0, 5);

    const realCatalogImageUrls = [
      ...menuItemsData.map((m: any) => m?.image_url).filter(Boolean),
      ...productsData.map((p: any) => p?.image_url).filter(Boolean),
    ].filter((u: string) => /^https?:\/\//i.test(String(u)));

    const nicheContext = getNichePromptInstructions(
      bucketKey,
      top5CatalogItems,
      targetCity,
      tenantRow?.slug
    );

    // 3. Sorteia um subtema específico do nicho que ainda NÃO aparece nos existingTitles
    const freshSubtopic =
      params?.focusTopic ||
      pickFreshSubtopicForNiche(bucketKey, existingTitles);

    const randomGenerationSeed = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // 4. Prompt estrito em PT-BR com bloqueio explícito de repetição e de placeholders
    const prompt = `Gere uma publicação inédita e persuasiva de novidades/artigo otimizada para SEO Local no Google.
Semente de variação única: ${randomGenerationSeed}

DADOS REAIS DO ESTABELECIMENTO:
- Nome do Estabelecimento: ${businessName}
- Nicho Real: ${nicheContext.nicheLabel} (bucket: ${bucketKey})
- Cidade / Região Real: ${targetCity}
- Top Produtos / Pratos / Serviços Reais: ${nicheContext.defaultServices.join(", ")}
- Pilar Editorial: ${selectedPillar.name} (${selectedPillar.angleDescription})
- PAUTA / ÂNGULO OBRIGATÓRIO DESTE NOVO POST: ${freshSubtopic}

${nicheContext.domainGuidelines}

TEMAS JÁ PUBLICADOS (PROIBIDO REPETIR QUALQUER UM DELES):
${existingTitlesFormatted}

INSTRUÇÃO DE DIVERSIFICAÇÃO OBRIGATÓRIA:
- Escolha um ângulo e título 100% DIFERENTES de todos os itens listados em "TEMAS JÁ PUBLICADOS".
- Desenvolva especificamente a pauta "${freshSubtopic}", citando naturalmente os itens reais do estabelecimento quando pertinente.

REGRAS ESTRITAS E OBRIGATÓRIAS DE SAÍDA:
1. Retorne APENAS um objeto JSON puro e válido, sem blocos markdown (\`\`\`json) e sem nenhuma frase antes ou depois do JSON.
2. O conteúdo deve ser 100% em Português do Brasil (PT-BR) natural, humano e persuasivo.
3. PROIBIDO usar strings genéricas ou placeholders como "sua cidade", "segmento de serviços", "SEO Specialist", "Copywriter", "[insira aqui]" ou textos em inglês. Sempre escreva "${targetCity}" e "${businessName}".
4. O campo "title" deve ter entre 35 e 70 caracteres, em PT-BR, inédito e atrativo para clientes de ${targetCity}.
5. O campo "content" deve ter entre 110 e 170 palavras divididas em 2 ou 3 parágrafos claros, alinhados ao tom real de ${nicheContext.nicheLabel} e chamando para "${nicheContext.defaultCtaLabel}".
6. O campo "keywords" deve conter 5 palavras-chave locais separadas por vírgula em PT-BR (incluindo ${targetCity} e termos reais do nicho).
7. O campo "meta_description" deve ter até 155 caracteres em PT-BR resumindo o benefício do artigo para o Google.

FORMATO EXATO DO JSON:
{
  "title": "...",
  "content": "...",
  "keywords": "...",
  "meta_description": "..."
}`;

    const fallbackTemplate = buildStructuredNicheFallbackPost({
      bucketKey,
      businessName,
      targetCity,
      catalogItems: top5CatalogItems,
      freshSubtopic,
      existingTitles,
    });

    let postData: Record<string, any> = fallbackTemplate;
    let sourceUsed: "gemini" | "fallback" = "gemini";

    try {
      const responseText = await generateContentWithGemini(prompt, {
        apiKey,
        temperature: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        timeoutMs: 11500,
      });

      // Limpeza obrigatória de delimitadores markdown antes do parse
      let cleanJson = (responseText || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const firstBrace = cleanJson.indexOf("{");
      const lastBrace = cleanJson.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }

      try {
        const parsed = JSON.parse(cleanJson);
        if (parsed && typeof parsed === "object" && parsed.title && parsed.content) {
          postData = parsed;
        } else {
          postData = extractValidJson(responseText, fallbackTemplate);
        }
      } catch (parseErr) {
        console.warn("[generateLocalSeoPost] JSON.parse falhou, usando parser/fallback:", parseErr);
        postData = extractValidJson(responseText, fallbackTemplate);
      }
    } catch (aiErr) {
      console.warn(
        "[generateLocalSeoPost] Timeout ou falha na API Gemini, utilizando fallback estruturado do nicho:",
        aiErr
      );
      postData = fallbackTemplate;
      sourceUsed = "fallback";
    }

    const parsedTitle = enforceNoPlaceholders(
      sanitizeAiText(postData.title) || fallbackTemplate.title,
      targetCity,
      nicheContext.nicheLabel
    );

    const parsedContent = enforceNoPlaceholders(
      sanitizeAiText(postData.content) || fallbackTemplate.content,
      targetCity,
      nicheContext.nicheLabel
    );
    const rawKeywords =
      postData.keywords || postData.tags || fallbackTemplate.keywords;
    const parsedTags = enforceNoPlaceholders(
      typeof rawKeywords === "string"
        ? sanitizeAiText(rawKeywords)
        : Array.isArray(rawKeywords)
        ? rawKeywords.map((k: string) => sanitizeAiText(k)).join(", ")
        : fallbackTemplate.keywords,
      targetCity,
      nicheContext.nicheLabel
    );
    const parsedMetaDesc = enforceNoPlaceholders(
      sanitizeAiText(
        postData.meta_description ||
          postData.metaDescription ||
          fallbackTemplate.meta_description
      ),
      targetCity,
      nicheContext.nicheLabel
    ).slice(0, 160);

    // 5. Seleciona imagem real do cardápio (para restaurantes) ou foto curada do nicho sem repetir
    const selectedImage = selectCuratedImageForNicheAndTitle(
      bucketKey,
      `${parsedTitle} ${parsedContent} ${freshSubtopic}`,
      existingImages,
      bucketKey === "restaurant" ? realCatalogImageUrls : []
    );

    return {
      success: true,
      data: {
        title: parsedTitle,
        content: parsedContent,
        tags: parsedTags,
        metaDescription: parsedMetaDesc,
        ctaType: nicheContext.defaultCtaType,
        ctaLabel: nicheContext.defaultCtaLabel,
        ctaUrl: nicheContext.defaultCtaUrl,
        imageUrl: selectedImage.url,
        source: sourceUsed,
        pillar: selectedPillar.name,
      },
    };
  } catch (err: any) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro inesperado ao gerar post de SEO.";
    console.error("[generateLocalSeoPost] Exceção:", err);
    return { success: false, error: message };
  }
}

/**
 * Server Action: Gera uma imagem ilustrativa com IA condizente com a descrição exata do novo post,
 * utilizando semente randômica e verificando o histórico de posts para NUNCA repetir foto.
 */
export async function generatePostCoverImageAction(input?: {
  title?: string;
  content?: string;
  niche?: string;
  excludeImageUrls?: string[];
}): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    const { data: tenantContext, error: tenantError } =
      await getAuthenticatedTenant();
    if (tenantError || !tenantContext) {
      return {
        success: false,
        error: tenantError || "Sessão expirada. Faça login novamente.",
      };
    }

    const tenantId = tenantContext.tenantId;
    const supabase = createAdminClient();

    // 1. Consulta histórico de imagens já utilizadas e possíveis fotos reais do cardápio
    const [{ existingImages }, { data: menuPhotos }] = await Promise.all([
      fetchTenantRecentPostsHistory(
        supabase,
        tenantId,
        [],
        input?.excludeImageUrls || []
      ),
      supabase
        .from("menu_items")
        .select("image_url")
        .eq("tenant_id", tenantId)
        .not("image_url", "is", null)
        .limit(20),
    ]);

    const resolvedNiche =
      input?.niche || resolveTenantNiche(tenantContext.tenant) || "general";
    const bucketKey = resolveBucketKeyForNiche(
      resolvedNiche,
      tenantContext.tenant?.name
    );
    const realMenuPhotos = (menuPhotos || [])
      .map((m: any) => m?.image_url)
      .filter((u: any) => typeof u === "string" && /^https?:\/\//i.test(u));
    const postTitle = (input?.title || "").trim();
    const postContent = (input?.content || "").trim();
    const exactPostDescription = [postTitle, postContent]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 320);

    const randomSeed = Math.floor(Math.random() * 1000000);
    const randomToken = Math.random().toString(36).substring(2, 8);
    const visualAngles = [
      "close-up detailed shot, natural daylight",
      "wide angle editorial perspective, warm studio lighting",
      "dynamic action angle showing professional equipment in use",
      "clean modern workspace environment, cinematic depth of field",
    ];
    const chosenAngle =
      visualAngles[Math.floor(Math.random() * visualAngles.length)];

    const apiKey = process.env.GEMINI_API_KEY;

    // 2. Tenta gerar imagem exclusiva via Gemini Imagen 3 usando a descrição exata do post + semente randômica (timeout 6s)
    if (apiKey) {
      const imagenController = new AbortController();
      const imagenTimer = setTimeout(() => imagenController.abort(), 6000);
      try {
        const subjectPrompt =
          resolvedNiche === "automotive"
            ? `Photorealistic automotive service photography illustrating: "${exactPostDescription || "preventive car maintenance"}". Style: ${chosenAngle}, modern clean mechanic workshop, 16:9 banner, no text, no watermarks, seed ${randomSeed}-${Date.now()}`
            : `Photorealistic local business photography for ${resolvedNiche} illustrating: "${exactPostDescription || "professional service"}". Style: ${chosenAngle}, high-end commercial photography, 16:9 banner, no text, no watermarks, seed ${randomSeed}-${Date.now()}`;

        const imagenRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: imagenController.signal,
            body: JSON.stringify({
              instances: [{ prompt: subjectPrompt }],
              parameters: {
                sampleCount: 1,
                seed: randomSeed,
                aspectRatio: "16:9",
                outputOptions: { mimeType: "image/jpeg" },
              },
            }),
          }
        );

        if (imagenRes.ok) {
          const imagenData = await imagenRes.json();
          const b64 =
            imagenData?.predictions?.[0]?.bytesBase64Encoded ||
            imagenData?.predictions?.[0]?.bytesBase64;

          if (b64) {
            const buffer = Buffer.from(b64, "base64");
            const adminSupabase = createAdminClient();
            const filePath = `posts/${tenantId}-imagen-${Date.now()}-${randomToken}.jpg`;

            const { error: upErr } = await adminSupabase.storage
              .from("establishment-photos")
              .upload(filePath, buffer, {
                contentType: "image/jpeg",
                upsert: true,
              });

            if (!upErr) {
              const { data: pubData } = adminSupabase.storage
                .from("establishment-photos")
                .getPublicUrl(filePath);
              if (pubData?.publicUrl) {
                clearTimeout(imagenTimer);
                return { success: true, imageUrl: pubData.publicUrl };
              }
            }
          }
        }
      } catch (imgErr) {
        console.warn("[generatePostCoverImageAction] Fallback curado ativado:", imgErr);
      } finally {
        clearTimeout(imagenTimer);
      }
    }

    // 3. Seleção inteligente baseada na descrição exata do post e garantindo que NÃO exista em existingImages
    const selectedCandidate = selectCuratedImageForNicheAndTitle(
      bucketKey,
      exactPostDescription || bucketKey,
      existingImages,
      bucketKey === "restaurant" ? realMenuPhotos : []
    );

    const dlController = new AbortController();
    const dlTimer = setTimeout(() => dlController.abort(), 5000);
    try {
      const imgResponse = await fetch(selectedCandidate.url, {
        signal: dlController.signal,
      });
      if (imgResponse.ok) {
        const arrayBuffer = await imgResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const adminSupabase = createAdminClient();
        // Inclui o ID da foto no nome do arquivo salvo no bucket para que futuras verificações saibam qual imagem base foi usada
        const filePath = `posts/${tenantId}-${selectedCandidate.id}-${Date.now()}-${randomToken}.jpg`;

        const { error: upErr } = await adminSupabase.storage
          .from("establishment-photos")
          .upload(filePath, buffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!upErr) {
          const { data: pubData } = adminSupabase.storage
            .from("establishment-photos")
            .getPublicUrl(filePath);
          if (pubData?.publicUrl) {
            clearTimeout(dlTimer);
            return { success: true, imageUrl: pubData.publicUrl };
          }
        }
      }
    } catch (storageErr) {
      console.warn(
        "[generatePostCoverImageAction] Retornando URL direta:",
        storageErr
      );
    } finally {
      clearTimeout(dlTimer);
    }

    return {
      success: true,
      imageUrl: selectedCandidate.url,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Não foi possível gerar a imagem com IA.",
    };
  }
}

/**
 * Server Action: Faz upload da foto de capa do post (comprimida no cliente via Canvas)
 * diretamente para o bucket 'establishment-photos' dentro da pasta 'posts/'.
 */
export async function uploadPostCoverPhotoAction(
  formData: FormData
): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    const { data: tenantContext, error: tenantError } =
      await getAuthenticatedTenant();
    if (tenantError || !tenantContext?.tenantId) {
      return {
        success: false,
        error: tenantError || "Sessão expirada. Faça login novamente.",
      };
    }

    const file = formData.get("file") as File | null;
    if (!file || typeof file.arrayBuffer !== "function") {
      return { success: false, error: "Arquivo de imagem inválido." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.type === "image/webp" ? "webp" : "jpg";
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const filePath = `posts/${tenantContext.tenantId}-${Date.now()}-${randomSuffix}.${ext}`;

    const adminSupabase = createAdminClient();
    const { error: uploadErr } = await adminSupabase.storage
      .from("establishment-photos")
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[uploadPostCoverPhotoAction] Erro storage:", uploadErr);
      return {
        success: false,
        error: "Falha ao salvar imagem no bucket establishment-photos.",
      };
    }

    const { data: publicUrlData } = adminSupabase.storage
      .from("establishment-photos")
      .getPublicUrl(filePath);

    return {
      success: true,
      imageUrl: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao enviar foto do post.",
    };
  }
}
