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
  imageUrl?: string;
  source: "gemini" | "fallback";
  pillar?: string;
}

export interface GeneratePostResult {
  success: boolean;
  data?: GeneratedPostData;
  error?: string;
}

/**
 * Mapeamento de contexto e dores reais por nicho para calibrar o prompt da IA
 */
function getNichePromptInstructions(niche: string, services: string[]): {
  nicheLabel: string;
  domainGuidelines: string;
  defaultServices: string[];
  defaultCtaType: "booking" | "whatsapp";
  defaultCtaLabel: string;
} {
  const norm = (niche || "").toLowerCase();

  if (
    norm === "automotive" ||
    norm === "auto" ||
    norm.includes("auto") ||
    norm.includes("mecanic") ||
    norm.includes("oficina")
  ) {
    return {
      nicheLabel: "Oficina Mecânica e Centro Automotivo",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO AUTOMOTIVO:
- Aborde dicas práticas e reais de manutenção preventiva e corretiva automotiva: troca de óleo e filtros no prazo correto, revisão do sistema de freios (pastilhas, discos e fluido), alinhamento, balanceamento e suspensão (amortecedores, buchas, pivôs), barulhos no motor, kit de embreagem, direção hidráulica/elétrica, correia dentada ou higienização de ar-condicionado automotivo.
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

  if (
    norm.includes("barbea") ||
    norm.includes("barber") ||
    norm.includes("corte")
  ) {
    return {
      nicheLabel: "Barbearia e Estética Masculina",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO BARBEARIA:
- Aborde exclusivamente cuidados masculinos: corte degradê (fade), corte social, alinhamento e hidratação de barba, barbaterapia com toalha quente, cuidados com o couro cabeludo e visual impecável para o dia a dia ou eventos.`,
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
      defaultCtaLabel: "Agendar Horário Online",
    };
  }

  if (
    norm.includes("pet") ||
    norm.includes("veterin") ||
    norm.includes("bicho") ||
    norm.includes("animal")
  ) {
    return {
      nicheLabel: "Pet Shop e Clínica Veterinária",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO PET & VETERINÁRIA:
- Aborde exclusivamente saúde, higiene e bem-estar de cães e gatos: banho e tosa higiênica, hidratação de pelagem, vacinação em dia, check-up veterinário preventivo, controle de pulgas/carrapatos e alimentação saudável para pets.`,
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
      defaultCtaLabel: "Agendar Atendimento Pet",
    };
  }

  if (
    norm.includes("confeit") ||
    norm.includes("bolo") ||
    norm.includes("doce")
  ) {
    return {
      nicheLabel: "Confeitaria Artesanal e Doceria",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO CONFEITARIA:
- Aborde exclusivamente bolos artesanais, tortas especiais, doces finos para festas e aniversários, ingredientes selecionados e encomendas personalizadas.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Bolos Decorados sob Encomenda",
              "Doces Finos e Brigadeiros Gourmet",
              "Tortas Artesanais e Kits Festa",
            ],
      defaultCtaType: "whatsapp",
      defaultCtaLabel: "Fazer Encomenda no WhatsApp",
    };
  }

  if (
    norm.includes("estetica") ||
    norm.includes("beleza") ||
    norm.includes("salao") ||
    norm.includes("cilios") ||
    norm.includes("lash") ||
    norm.includes("clinica")
  ) {
    return {
      nicheLabel: "Estética, Beleza e Bem-Estar",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO ESTÉTICA & BELEZA:
- Aborde exclusivamente autoestima, cuidados estéticos faciais e corporais, durabilidade dos procedimentos, biossegurança, técnicas modernas e atendimento personalizado.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Procedimentos Estéticos Personalizados",
              "Cuidados Faciais e Beleza",
              "Atendimento com Hora Marcada",
            ],
      defaultCtaType: "booking",
      defaultCtaLabel: "Agendar Horário Online",
    };
  }

  return {
    nicheLabel: niche || "Comércio e Serviços Locais",
    domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO:
- Aborde exclusivamente os serviços reais da empresa, resolvendo dúvidas reais dos clientes da cidade e destacando a qualidade do atendimento local.`,
    defaultServices:
      services.length > 0
        ? services
        : ["Atendimento Especializado", "Serviços de Qualidade"],
    defaultCtaType: "booking",
    defaultCtaLabel: "Agendar Horário Online",
  };
}

/**
 * Subtemas rotativos por nicho para evitar qualquer repetição de ângulo nos posts gerados pela IA
 */
const NICHE_ROTATING_SUBTOPICS: Record<
  string,
  Array<{ angle: string; matchKeywords: string[] }>
> = {
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

function resolveBucketKeyForNiche(niche: string): string {
  const normNiche = (niche || "").toLowerCase();
  if (
    normNiche.includes("auto") ||
    normNiche.includes("mecanic") ||
    normNiche.includes("oficina")
  ) {
    return "automotive";
  }
  if (normNiche.includes("barbea") || normNiche.includes("barber")) {
    return "barbearia";
  }
  if (
    normNiche.includes("pet") ||
    normNiche.includes("veterin") ||
    normNiche.includes("bicho")
  ) {
    return "petshop";
  }
  if (normNiche.includes("confeit") || normNiche.includes("bolo")) {
    return "confeitaria";
  }
  if (
    normNiche.includes("estetica") ||
    normNiche.includes("beleza") ||
    normNiche.includes("salao")
  ) {
    return "estetica_saude";
  }
  return "default";
}

/**
 * Seleciona um subtema do nicho que ainda NÃO foi abordado nos títulos anteriores
 */
function pickFreshSubtopicForNiche(
  niche: string,
  existingTitles: string[]
): string {
  const bucketKey = resolveBucketKeyForNiche(niche);
  const subtopics = NICHE_ROTATING_SUBTOPICS[bucketKey] || [];
  if (subtopics.length === 0) {
    return "Destaque um diferencial prático e responda uma dúvida comum dos clientes da cidade (variando completamente dos títulos anteriores)";
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
  niche: string,
  postDescription: string,
  existingImages: string[] = []
): { id: string; url: string } {
  const bucketKey = resolveBucketKeyForNiche(niche);
  const normDesc = (postDescription || "").toLowerCase();

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
  niche: string;
  businessName: string;
  targetCity: string;
  freshSubtopic: string;
  existingTitles: string[];
}): {
  title: string;
  content: string;
  keywords: string;
  meta_description: string;
} {
  const bucketKey = resolveBucketKeyForNiche(params.niche);
  const city = params.targetCity || "sua cidade";
  const name = params.businessName || "nossa equipe";
  const usedLower = (params.existingTitles || []).map((t) => t.toLowerCase());

  const fallbackTemplates: Record<
    string,
    Array<{
      title: string;
      content: string;
      keywords: string;
      meta_description: string;
    }>
  > = {
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
    const supabase = await createClient();

    // 1. Buscar dados completos do tenant, perfil, serviços e histórico dos últimos 10 posts
    const [tenantRes, profileRes, servicesRes, historyData] =
      await Promise.all([
        supabase
          .from("tenants")
          .select("id, name, slug, niche, theme_niche, theme_settings")
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
    const { existingTitles, existingImages } = historyData;

    const existingTitlesFormatted =
      existingTitles.length > 0
        ? existingTitles.map((t, idx) => `${idx + 1}. "${t}"`).join("\n")
        : "Nenhum post anterior registrado.";

    const selectedPillar =
      CONTENT_PILLARS.find((p) => p.id === params?.pillarId) ||
      CONTENT_PILLARS[Math.floor(Math.random() * CONTENT_PILLARS.length)];

    // 2. Captura dinâmica de tenant.name, tenant.niche, tenant.city e services
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

    const address = profile?.address || "";
    let extractedCity = params?.targetCity || (tenantRow as any)?.city || "";
    if (!extractedCity && address) {
      const parts = address.split(/[-–,]/);
      if (parts.length >= 2) {
        extractedCity = parts[parts.length - 2].trim();
      }
    }
    const targetCity: string = extractedCity || "sua cidade";

    const rawServices =
      params?.servicesList && params.servicesList.length > 0
        ? params.servicesList
        : servicesData.map((s) => s.name).filter(Boolean);

    const nicheContext = getNichePromptInstructions(resolvedNiche, rawServices);

    // 3. Sorteia um subtema específico do nicho que ainda NÃO aparece nos existingTitles
    const freshSubtopic =
      params?.focusTopic ||
      pickFreshSubtopicForNiche(resolvedNiche, existingTitles);

    const randomGenerationSeed = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // 4. Prompt estrito em PT-BR com bloqueio explícito de repetição de temas
    const prompt = `Gere uma publicação inédita e persuasiva de blog/novidades otimizada para SEO Local no Google.
Semente de variação única: ${randomGenerationSeed}

DADOS REAIS DO ESTABELECIMENTO:
- Nome da Empresa: ${businessName}
- Nicho de Atuação: ${nicheContext.nicheLabel} (código: ${resolvedNiche})
- Cidade / Região: ${targetCity}
- Serviços Principais: ${nicheContext.defaultServices.join(", ")}
- Pilar Editorial: ${selectedPillar.name} (${selectedPillar.angleDescription})
- PAUTA / ÂNGULO OBRIGATÓRIO DESTE NOVO POST: ${freshSubtopic}

${nicheContext.domainGuidelines}

TEMAS JÁ PUBLICADOS (PROIBIDO REPETIR QUALQUER UM DELES):
${existingTitlesFormatted}

INSTRUÇÃO DE DIVERSIFICAÇÃO OBRIGATÓRIA:
- Escolha um ângulo, problema prático e título 100% DIFERENTES de todos os itens listados em "TEMAS JÁ PUBLICADOS".
- Desenvolva especificamente a pauta "${freshSubtopic}", trazendo dicas práticas e reais que ainda não foram abordadas nos títulos acima.

REGRAS ESTRITAS E OBRIGATÓRIAS DE SAÍDA:
1. Retorne APENAS um objeto JSON puro e válido, sem blocos markdown (\`\`\`json) e sem nenhuma frase antes ou depois do JSON.
2. O conteúdo deve ser 100% em Português do Brasil (PT-BR) natural, humano e persuasivo.
3. PROIBIDO incluir termos técnicos de prompt ou meta-comentários dentro dos textos, tais como "SEO Specialist", "Copywriter", "placeholder", "[insira aqui]" ou textos em inglês.
4. O campo "title" deve ter entre 35 e 70 caracteres, em PT-BR, inédito e atrativo para clientes locais.
5. O campo "content" deve ter entre 120 e 180 palavras divididas em 2 ou 3 parágrafos claros, educando o cliente sobre o tema e convidando-o a falar com a equipe da ${businessName} em ${targetCity}.
6. O campo "keywords" deve conter 5 palavras-chave locais separadas por vírgula em PT-BR (incluindo o serviço específico abordado e ${targetCity}).
7. O campo "meta_description" deve ter até 155 caracteres em PT-BR resumindo o benefício do artigo para o Google.

FORMATO EXATO DO JSON:
{
  "title": "...",
  "content": "...",
  "keywords": "...",
  "meta_description": "..."
}`;

    const fallbackTemplate = buildStructuredNicheFallbackPost({
      niche: resolvedNiche,
      businessName,
      targetCity,
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

    const parsedTitle =
      sanitizeAiText(postData.title) || fallbackTemplate.title;

    const parsedContent =
      sanitizeAiText(postData.content) || fallbackTemplate.content;
    const rawKeywords =
      postData.keywords || postData.tags || fallbackTemplate.keywords;
    const parsedTags =
      typeof rawKeywords === "string"
        ? sanitizeAiText(rawKeywords)
        : Array.isArray(rawKeywords)
        ? rawKeywords.map((k: string) => sanitizeAiText(k)).join(", ")
        : fallbackTemplate.keywords;
    const parsedMetaDesc = sanitizeAiText(
      postData.meta_description ||
        postData.metaDescription ||
        fallbackTemplate.meta_description
    ).slice(0, 160);

    // 5. Seleciona ou gera imagem baseada na descrição exata do novo post, garantindo que NÃO esteja em existingImages
    const selectedImage = selectCuratedImageForNicheAndTitle(
      resolvedNiche,
      `${parsedTitle} ${parsedContent} ${freshSubtopic}`,
      existingImages
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
    const supabase = await createClient();

    // 1. Consulta histórico de imagens já utilizadas nos últimos 10 posts do tenant
    const { existingImages } = await fetchTenantRecentPostsHistory(
      supabase,
      tenantId,
      [],
      input?.excludeImageUrls || []
    );

    const resolvedNiche =
      input?.niche || resolveTenantNiche(tenantContext.tenant) || "general";
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
      resolvedNiche,
      exactPostDescription || resolvedNiche,
      existingImages
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
