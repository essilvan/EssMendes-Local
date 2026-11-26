export type ProspectingNicheKey =
  | "towing"
  | "mechanic"
  | "car_wash"
  | "petshop"
  | "beauty"
  | "restaurant"
  | "bakery"
  | "services";

export interface DemoCatalogItem {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  duration_minutes?: number;
}

export interface NicheDemoConfig {
  key: ProspectingNicheKey;
  tenantNiche: string;
  themeNiche: string;
  label: string;
  primaryColor: string;
  heroTitle: string;
  ctaText: string;
  fallbackCoverUrl: string;
  description: string;
  editorialSummary: (businessName: string, city?: string) => string;
  items: DemoCatalogItem[];
}

export function detectProspectingNiche(
  businessName?: string | null,
  placeTypes?: string[] | null,
  primaryType?: string | null
): ProspectingNicheKey {
  const haystack = [
    businessName || "",
    primaryType || "",
    ...(Array.isArray(placeTypes) ? placeTypes : []),
  ]
    .join(" ")
    .toLowerCase();

  // 1. Subnicho: Guincho / Reboque / Socorro Veicular 24h (PRIORIDADE MÁXIMA antes de oficina!)
  if (
    /\b(guincho|reboque|socorro|auto\s*socorro|resgate\s*veicular|plataforma|towing)\b/i.test(
      haystack
    ) ||
    haystack.includes("guincho") ||
    haystack.includes("reboque") ||
    haystack.includes("auto socorro") ||
    haystack.includes("resgate veicular")
  ) {
    return "towing";
  }

  // 2. Subnicho: Lava-Jato e Estética Automotiva
  if (
    /\b(lava\s*-?\s*jato|lavajato|est[eé]tica\s*automotiva|polimento|higieniza[çc][aã]o|detalhamento|vitrifica[çc][aã]o|car_wash)\b/i.test(
      haystack
    ) ||
    haystack.includes("lava jato") ||
    haystack.includes("lava-jato") ||
    haystack.includes("estética automotiva") ||
    haystack.includes("estetica automotiva")
  ) {
    return "car_wash";
  }

  // 3. Subnicho: Oficina Mecânica / Auto Center / Troca de Óleo
  if (
    /\b(oficina|mec[aâ]nic|auto\s*center|autocenter|centro\s*automotivo|motor|freio|suspens[aã]o|alinhamento|inje[çc][aã]o|ret[ií]fica|pneu|borracharia|funilaria|car_repair|tire_shop|auto_parts_store)\b/i.test(
      haystack
    ) ||
    haystack.includes("mecânic") ||
    haystack.includes("mecanic") ||
    haystack.includes("oficina")
  ) {
    return "mechanic";
  }

  // 4. Subnicho: Pet Shop & Clínica Veterinária
  if (
    /\b(pet|vet|veterin|ra[çc][aã]o|banho|tosa|animal|pet_store|veterinary_care|agropec)\b/i.test(
      haystack
    ) ||
    haystack.includes("veterin") ||
    haystack.includes("petshop") ||
    haystack.includes("pet shop")
  ) {
    return "petshop";
  }

  // 5. Subnicho: Barbearia, Salão de Beleza, Manicure, Estética
  if (
    /\b(barbearia|barber|sal[aã]o|cabelo|cabeleireir|unha|manicure|pedicure|sobrancelha|est[eé]tica|hair_care|beauty_salon|barber_shop)\b/i.test(
      haystack
    ) ||
    haystack.includes("barbearia") ||
    haystack.includes("salão") ||
    haystack.includes("manicure")
  ) {
    return "beauty";
  }

  // 6. Subnicho: Bar, Espetinho, Restaurante, Hamburgueria, Pizzaria, Açaiteria
  if (
    /\b(bar|espet|restaurante|burger|hamburgu|pizz|a[çc]a[ií]|lanchonete|snooker|petisc|churras|boteco|buteco|cervejaria|bistr[oô]|pub|restaurant|steak_house|pizza_restaurant|hamburger_restaurant|brazilian_restaurant)\b/i.test(
      haystack
    ) ||
    haystack.includes("espet") ||
    haystack.includes("petisc") ||
    haystack.includes("churras") ||
    haystack.includes("pizz") ||
    haystack.includes("açaí")
  ) {
    return "restaurant";
  }

  // 7. Confeitaria / Padaria / Doceria
  if (
    /\b(bolo|confeit|doce|doceria|padaria|panific|caf[eé]|sorvet|gelat|bakery|cafe|dessert_shop)\b/i.test(
      haystack
    )
  ) {
    return "bakery";
  }

  return "services";
}

export function resolvePublicSubniche(
  tenant: any,
  profile?: any
): ProspectingNicheKey {
  const explicit = String(
    tenant?.niche ||
      tenant?.theme_settings?.niche ||
      tenant?.theme_niche ||
      ""
  )
    .trim()
    .toLowerCase();

  if (explicit === "towing" || explicit === "guincho") return "towing";
  if (explicit === "car_wash" || explicit === "lava_jato") return "car_wash";
  if (explicit === "mechanic" || explicit === "mecanica") return "mechanic";
  if (explicit === "beauty" || explicit === "barbearia" || explicit === "salao")
    return "beauty";
  if (explicit === "petshop" || explicit === "pet") return "petshop";
  if (explicit === "restaurant" || explicit === "gastronomia")
    return "restaurant";
  if (explicit === "bakery" || explicit === "confeitaria") return "bakery";

  // Para tenants antigos salvos como "automotive", diferencia guincho vs lava-jato vs mecânica pelo nome/categoria
  const detected = detectProspectingNiche(
    tenant?.name || profile?.name,
    tenant?.google_types || [],
    tenant?.category || profile?.business_category
  );

  if (explicit === "automotive" || explicit === "automotivo" || explicit === "auto") {
    if (detected === "towing" || detected === "car_wash") return detected;
    return "mechanic";
  }

  return detected;
}

export function getNicheDemoConfig(
  niche: ProspectingNicheKey,
  businessName: string,
  primaryType?: string | null,
  city = "Brasília e Região"
): NicheDemoConfig {
  switch (niche) {
    case "towing":
      return {
        key: "towing",
        tenantNiche: "towing",
        themeNiche: "towing",
        label: "Guincho 24h",
        primaryColor: "#dc2626",
        heroTitle: "Socorro Veicular & Guincho 24 Horas",
        ctaText: "Chamar Guincho Agora (WhatsApp)",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
        description: `Atendimento rápido no local onde você estiver em ${city}. Envie sua localização pelo WhatsApp para despacho imediato.`,
        editorialSummary: (name, loc = city) =>
          `${name} atua com socorro veicular e reboque plataforma 24 horas em ${loc}. Chegada rápida, seguro total no transporte e despacho imediato via WhatsApp.`,
        items: [
          {
            name: "Reboque Plataforma Local (Carros e SUVs)",
            description:
              "Remoção segura em caminhão plataforma hidráulica com seguro total no transporte urbano.",
            price: 150.0,
            category: "Resgate 24h",
            duration_minutes: 30,
            image_url:
              "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Socorro Pane Seca / Carga de Bateria 24h",
            description:
              "Atendimento emergencial no local para partida auxiliar (chupeta) ou abastecimento de emergência.",
            price: 90.0,
            category: "Socorro Rápido",
            duration_minutes: 25,
            image_url:
              "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Troca de Pneu Furado no Local",
            description:
              "Auxílio rápido e seguro para substituição de estepe em vias urbanas ou rodovias.",
            price: 80.0,
            category: "Socorro Rápido",
            duration_minutes: 20,
            image_url:
              "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Transporte Intermunicipal / Viagens",
            description:
              "Transporte agendado ou emergencial de veículos leves, motos e utilitários para outras cidades (valor sob consulta).",
            price: 0,
            category: "Viagens",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80",
          },
        ],
      };

    case "mechanic":
      return {
        key: "mechanic",
        tenantNiche: "mechanic",
        themeNiche: "mechanic",
        label: "Oficina Mecânica",
        primaryColor: "#2563eb",
        heroTitle: "Triagem Técnica por Placa • Orçamento Rápido",
        ctaText: "Solicitar Orçamento por Placa",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80",
        description:
          "Informe a placa, modelo e sintoma do veículo para adiantar seu diagnóstico direto no WhatsApp da oficina.",
        editorialSummary: (name) =>
          `Manutenção automotiva especializada, diagnóstico eletrônico preciso e orçamento transparente no ${name}. Envie a placa do seu veículo e agilize seu atendimento.`,
        items: [
          {
            name: "Revisão Completa & Diagnóstico Scanner",
            description:
              "Leitura computadorizada da injeção eletrônica + check-up completo de 25 itens de segurança.",
            price: 160.0,
            category: "Diagnóstico",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Troca de Óleo + Filtros",
            description:
              "Óleo sintético homologado pelo fabricante, filtro de óleo, filtro de ar e inspeção de fluidos.",
            price: 189.0,
            category: "Manutenção",
            duration_minutes: 45,
            image_url:
              "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Alinhamento 3D e Balanceamento",
            description:
              "Alinhamento computadorizado de alta precisão e balanceamento completo das 4 rodas.",
            price: 120.0,
            category: "Pneus & Direção",
            duration_minutes: 50,
            image_url:
              "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Manutenção de Freios e Suspensão",
            description:
              "Inspeção e revisão de pastilhas, discos, amortecedores, pivôs, buchas e fluido de freio.",
            price: 150.0,
            category: "Freios & Suspensão",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=800&q=80",
          },
        ],
      };

    case "car_wash":
      return {
        key: "car_wash",
        tenantNiche: "car_wash",
        themeNiche: "car_wash",
        label: "Estética Automotiva",
        primaryColor: "#0284c7",
        heroTitle: "Estética Automotiva & Lavagem Detalhada",
        ctaText: "Agendar Lavagem no WhatsApp",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80",
        description:
          "Lavagem detalhada, higienização interna e proteção de pintura com agendamento rápido no WhatsApp.",
        editorialSummary: (name) =>
          `Cuidado estético de alto padrão para o seu veículo na ${name}. Produtos biodegradáveis, acabamento impecável e horário agendado sem espera.`,
        items: [
          {
            name: "Lavagem Completa + Cera",
            description:
              "Lavagem técnica externa, aspiração completa, limpeza de painel e aplicação de cera protetora.",
            price: 70.0,
            category: "Lavagem",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Higienização Interna de Bancos e Teto",
            description:
              "Extração profunda de sujeiras, manchas e ácaros em bancos, carpetes, forros e cinto de segurança.",
            price: 240.0,
            category: "Higienização",
            duration_minutes: 150,
            image_url:
              "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Polimento Técnico e Vitrificação",
            description:
              "Correção de micro-riscos, restauração do brilho espelhado e proteção cerâmica de longa duração.",
            price: 490.0,
            category: "Proteção",
            duration_minutes: 240,
            image_url:
              "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Lavagem de Motor a Seco",
            description:
              "Limpeza segura com verniz de motor, protegendo componentes eletrônicos e renovando plásticos.",
            price: 90.0,
            category: "Detalhamento",
            duration_minutes: 45,
            image_url:
              "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80",
          },
        ],
      };

    case "petshop":
      return {
        key: "petshop",
        tenantNiche: "petshop",
        themeNiche: "petshop",
        label: "Pet Shop & Vet",
        primaryColor: "#059669",
        heroTitle: "Cuidado Completo, Banho & Tosa e Atendimento Veterinário",
        ctaText: "Agendar Banho & Tosa",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80",
        description:
          "Banho & Tosa, consultas veterinárias, vacinação e agendamento rápido direto no WhatsApp.",
        editorialSummary: (name) =>
          `Cuidado completo, carinho e atendimento especializado para o seu pet no ${name}. Agende Banho & Tosa ou consulta veterinária em poucos segundos pelo WhatsApp.`,
        items: [
          {
            name: "Banho & Tosa Higiênica",
            description:
              "Banho morno com produtos hipoalergênicos, secagem cuidadosa, limpeza de ouvidos e tosa higiênica.",
            price: 75.0,
            category: "Banho & Tosa",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Consulta Veterinária",
            description:
              "Avaliação clínica completa com médico veterinário, diagnóstico preventivo e orientação nutricional.",
            price: 120.0,
            category: "Clínica Veterinária",
            duration_minutes: 40,
            image_url:
              "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Vacinação Completa",
            description:
              "Vacinas importadas (V10, Antirrábica, Gripe) com carteira atualizada e avaliação prévia.",
            price: 95.0,
            category: "Vacinação",
            duration_minutes: 20,
            image_url:
              "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Hidratação e Corte de Unhas",
            description:
              "Hidratação profunda da pelagem com brilho e maciez + corte seguro de unhas.",
            price: 55.0,
            category: "Estética Pet",
            duration_minutes: 35,
            image_url:
              "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80",
          },
        ],
      };

    case "beauty":
      return {
        key: "beauty",
        tenantNiche: "beauty",
        themeNiche: "beauty",
        label: "Beleza & Barbearia",
        primaryColor: "#9333ea",
        heroTitle: "Agende seu Horário Sem Filas",
        ctaText: "Reservar Horário Agora",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
        description:
          "Agendamento online sem filas, profissionais especializados e atendimento personalizado pelo WhatsApp.",
        editorialSummary: (name) =>
          `Estilo, cuidado e atendimento com hora marcada no ${name}. Escolha seu serviço e reserve seu horário sem filas direto pelo WhatsApp.`,
        items: [
          {
            name: "Corte Masculino / Feminino",
            description:
              "Corte personalizado com visagismo, lavagem e finalização profissional.",
            price: 45.0,
            category: "Cabelo",
            duration_minutes: 40,
            image_url:
              "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Barba Terapia / Escova",
            description:
              "Modelagem completa com toalha quente e óleos essenciais ou escova modelada de alto brilho.",
            price: 40.0,
            category: "Finalização",
            duration_minutes: 35,
            image_url:
              "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Combo Completo",
            description:
              "Experiência completa combinando corte + barba ou hidratação + escova com valor especial.",
            price: 75.0,
            category: "Combos",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Sobrancelha / Manicure",
            description:
              "Design de sobrancelhas ou cutilagem e esmaltação impecável com materiais esterilizados.",
            price: 35.0,
            category: "Cuidados",
            duration_minutes: 30,
            image_url:
              "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
          },
        ],
      };

    case "restaurant":
      return {
        key: "restaurant",
        tenantNiche: "restaurant",
        themeNiche: "restaurant",
        label: "Bar & Restaurante",
        primaryColor: "#f59e0b",
        heroTitle: "Cardápio Digital & Pedido Rápido na Mesa",
        ctaText: "Ver Cardápio Digital",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
        description:
          "Cardápio digital inteligente com pedidos direto na mesa via QR Code e comanda individual.",
        editorialSummary: (name) =>
          `Prévia exclusiva do cardápio digital e sistema de mesas do ${name}. Seus clientes escaneiam o QR Code, fazem pedidos na hora e acompanham a conta em tempo real.`,
        items: [
          {
            name: "Espetinho Completo na Brasa",
            description:
              "Espeto suculento na brasa acompanhado de arroz branco, mandioca cozida, vinagrete e farofa crocante.",
            price: 24.9,
            category: "Pratos",
            image_url:
              "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Cerveja 600ml Trincando",
            description:
              "Garrafa 600ml servida na temperatura ideal com copos gelados direto na sua mesa.",
            price: 14.9,
            category: "Bebidas",
            image_url:
              "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Porção de Batata com Cheddar e Bacon",
            description:
              "Batata frita sequinha e crocante coberta com creme de cheddar cremoso e bacon em cubos.",
            price: 32.0,
            category: "Entradas",
            image_url:
              "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Burger Artesanal da Casa",
            description:
              "Hambúrguer 180g na brasa, queijo prato, maionese da casa, pão brioche selado e fritas.",
            price: 36.9,
            category: "Pratos",
            image_url:
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
          },
        ],
      };

    case "bakery":
      return {
        key: "bakery",
        tenantNiche: "bakery",
        themeNiche: "confeitaria",
        label: "Confeitaria & Padaria",
        primaryColor: "#e11d48",
        heroTitle: "Bolos Artesanais & Encomendas Sob Medida",
        ctaText: "Fazer Encomenda no WhatsApp",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80",
        description:
          "Bolos artesanais, doces finos, kits festa e encomendas rápidas pelo WhatsApp.",
        editorialSummary: (name) =>
          `Sabores artesanais preparados diariamente com ingredientes selecionados no ${name}. Confira nosso catálogo e faça sua encomenda sob medida direto pelo WhatsApp.`,
        items: [
          {
            name: "Bolo Vulcão Gourmet",
            description:
              "Massa fofinha de chocolate 50% com cobertura generosa de brigadeiro cremoso belga.",
            price: 68.0,
            category: "Bolos",
            duration_minutes: 30,
            image_url:
              "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Torta Holandesa Fatia",
            description:
              "Base crocante de biscoito, creme suave de baunilha e ganache de chocolate meio amargo.",
            price: 16.9,
            category: "Tortas & Doces",
            duration_minutes: 15,
            image_url:
              "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Kit Festa 50 Salgados + Bolo",
            description:
              "Combo completo para comemorações com 50 salgados variados quentinhos e bolo decorado.",
            price: 149.0,
            category: "Encomendas",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Copo Açaí Completo 500ml",
            description:
              "Açaí cremoso batido na hora com leite ninho, morango, granola crocante e leite condensado.",
            price: 22.0,
            category: "Gelados",
            duration_minutes: 15,
            image_url:
              "https://images.unsplash.com/photo-1590301157890-4815ed356577?auto=format&fit=crop&w=800&q=80",
          },
        ],
      };

    default: {
      const catLabel = primaryType?.trim() || "Atendimento Especializado";
      return {
        key: "services",
        tenantNiche: "services",
        themeNiche: "servicos",
        label: "Negócio Local",
        primaryColor: "#4f46e5",
        heroTitle: `${businessName} • Atendimento Profissional`,
        ctaText: "Falar no WhatsApp",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        description: `${catLabel} com atendimento profissional, catálogo online e agendamento rápido pelo WhatsApp.`,
        editorialSummary: (name) =>
          `Conheça a vitrine profissional do ${name}. Veja nossos principais serviços, avaliações reais no Google e agende seu atendimento direto pelo WhatsApp.`,
        items: [
          {
            name: `Atendimento Personalizado ${businessName}`,
            description:
              "Sessão completa com avaliação inicial e atendimento sob medida para sua necessidade.",
            price: 90.0,
            category: catLabel,
            duration_minutes: 45,
            image_url:
              "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Pacote Completo Premium",
            description:
              "Nosso serviço mais procurado pelos clientes, com garantia de qualidade e horário agendado.",
            price: 150.0,
            category: catLabel,
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Avaliação & Orçamento Rápido",
            description:
              "Diagnóstico rápido com recomendação transparente e agendamento sem burocracia.",
            price: 50.0,
            category: catLabel,
            duration_minutes: 30,
            image_url:
              "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Manutenção / Retorno Programado",
            description:
              "Acompanhamento periódico com condições exclusivas para clientes recorrentes.",
            price: 110.0,
            category: catLabel,
            duration_minutes: 40,
            image_url:
              "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
          },
        ],
      };
    }
  }
}

export function buildProspectingWhatsAppMessage(params: {
  niche: ProspectingNicheKey;
  businessName: string;
  demoUrl: string;
}): string {
  const { niche, businessName, demoUrl } = params;

  if (niche === "towing") {
    return `Opa, tudo bem? Vi o perfil da *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine 24h de vocês para o cliente enviar a localização e chamar o guincho direto no WhatsApp com 1 clique: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  if (niche === "restaurant") {
    return `Opa, tudo bem? Vi o perfil do *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine e o cardápio digital com QR Code nas mesas de vocês (sem precisar gastar com impressora na cozinha): ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  if (niche === "petshop") {
    return `Opa, tudo bem? Vi o perfil do *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de vocês com catálogo de Banho & Tosa / serviços e agendamento direto no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  if (niche === "mechanic") {
    return `Opa, tudo bem? Vi o perfil da *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de vocês com triagem rápida por placa e orçamento direto no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  if (niche === "car_wash") {
    return `Opa, tudo bem? Vi o perfil da *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de estética automotiva de vocês com serviços e agendamento rápido no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  if (niche === "beauty") {
    return `Opa, tudo bem? Vi o perfil do *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de vocês com catálogo de serviços e agendamento sem filas direto no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  return `Opa, tudo bem? Vi o perfil do *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de vocês no Google com catálogo de serviços e agendamento direto no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
}
