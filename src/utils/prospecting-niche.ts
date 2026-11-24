export type ProspectingNicheKey =
  | "petshop"
  | "restaurant"
  | "bakery"
  | "automotive"
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
  fallbackCoverUrl: string;
  description: string;
  editorialSummary: (businessName: string) => string;
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

  // 1. Pet Shop / Clínica Veterinária
  if (
    /\b(pet|vet|veterin|ra[çc][aã]o|banho|tosa|animal|pet_store|veterinary_care|agropec|dog|cat)\b/i.test(
      haystack
    ) ||
    haystack.includes("veterin") ||
    haystack.includes("petshop") ||
    haystack.includes("pet shop")
  ) {
    return "petshop";
  }

  // 2. Confeitaria / Padaria / Doceria / Açaí
  if (
    /\b(bolo|confeit|doce|doceria|padaria|panific|caf[eé]|a[çc]a[ií]|sorvet|gelat|bakery|cafe|ice_cream_shop|dessert_shop)\b/i.test(
      haystack
    ) ||
    haystack.includes("confeit") ||
    haystack.includes("sorvet") ||
    haystack.includes("doceria")
  ) {
    return "bakery";
  }

  // 3. Oficina Mecânica / Auto Peças / Estética Automotiva
  if (
    /\b(oficina|mec[aâ]nic|auto|pneu|lava|funilaria|martelinho|borracharia|suspens[aã]o|car_repair|car_wash|auto_parts_store|tire_shop|est[eé]tica automotiva)\b/i.test(
      haystack
    ) ||
    haystack.includes("mecânic") ||
    haystack.includes("mecanic") ||
    haystack.includes("auto center") ||
    haystack.includes("autocenter") ||
    haystack.includes("auto peças") ||
    haystack.includes("autopecas")
  ) {
    return "automotive";
  }

  // 4. Bar / Espetinho / Restaurante / Hamburgueria
  if (
    /\b(bar|espet|restaurante|burger|hamburgu|pizz|churras|snooker|petisc|boteco|buteco|lanchonete|cervejaria|bistr[oô]|pub|restaurant|steak_house|pizza_restaurant|hamburger_restaurant|brazilian_restaurant)\b/i.test(
      haystack
    ) ||
    haystack.includes("espet") ||
    haystack.includes("petisc") ||
    haystack.includes("churras") ||
    haystack.includes("pizz")
  ) {
    return "restaurant";
  }

  // 5. Fallback inteligente: Outros Negócios Locais
  return "services";
}

export function getNicheDemoConfig(
  niche: ProspectingNicheKey,
  businessName: string,
  primaryType?: string | null
): NicheDemoConfig {
  switch (niche) {
    case "petshop":
      return {
        key: "petshop",
        tenantNiche: "petshop",
        themeNiche: "petshop",
        label: "Pet Shop & Vet",
        primaryColor: "#059669",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80",
        description:
          "Banho & Tosa, consultas veterinárias e agendamento rápido direto no WhatsApp.",
        editorialSummary: (name) =>
          `Cuidado completo, carinho e atendimento especializado para o seu pet no ${name}. Agende Banho & Tosa ou consulta veterinária em poucos segundos pelo WhatsApp.`,
        items: [
          {
            name: "Banho & Tosa Completo",
            description:
              "Banho morno com produtos hipoalergênicos, secagem, corte de unhas, limpeza de ouvidos e tosa higiênica.",
            price: 75.0,
            category: "Banho & Tosa",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Consulta Veterinária 24h",
            description:
              "Avaliação clínica completa com médico veterinário, diagnóstico preventivo e orientação nutricional.",
            price: 120.0,
            category: "Clínica Veterinária",
            duration_minutes: 40,
            image_url:
              "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Vacina Polivalente V10",
            description:
              "Imunização importada com carteira de vacinação atualizada e avaliação prévia do animal.",
            price: 95.0,
            category: "Vacinação",
            duration_minutes: 20,
            image_url:
              "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Ração Premium 15kg",
            description:
              "Alimento super premium balanceado para cães adultos com ômega 3, 6 e alta digestibilidade.",
            price: 189.9,
            category: "Pet Shop",
            duration_minutes: 15,
            image_url:
              "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80",
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
            name: "Combo Burger Artesanal",
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

    case "automotive":
      return {
        key: "automotive",
        tenantNiche: "automotive",
        themeNiche: "automotive",
        label: "Automotivo & Oficina",
        primaryColor: "#2563eb",
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80",
        description:
          "Orçamento rápido por placa via WhatsApp, revisão preventiva e serviços automotivos especializados.",
        editorialSummary: (name) =>
          `Manutenção automotiva de confiança, diagnóstico transparente e agendamento ágil no ${name}. Solicite seu orçamento rápido direto pelo WhatsApp.`,
        items: [
          {
            name: "Troca de Óleo + Filtro",
            description:
              "Óleo sintético especificado pelo fabricante, filtro novo e check-up gratuito de 15 itens.",
            price: 189.0,
            category: "Manutenção",
            duration_minutes: 45,
            image_url:
              "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Alinhamento e Balanceamento 3D",
            description:
              "Alinhamento computadorizado de precisão e balanceamento das 4 rodas para maior segurança e economia.",
            price: 120.0,
            category: "Pneus & Rodas",
            duration_minutes: 50,
            image_url:
              "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Revisão Preventiva de Freios e Suspensão",
            description:
              "Inspeção completa de pastilhas, discos, amortecedores, buchas e fluido de freio.",
            price: 150.0,
            category: "Revisão",
            duration_minutes: 60,
            image_url:
              "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=800&q=80",
          },
          {
            name: "Higienização Interna Completa",
            description:
              "Limpeza profunda de bancos, teto, carpetes e ozonização do sistema de ar-condicionado.",
            price: 240.0,
            category: "Estética Automotiva",
            duration_minutes: 120,
            image_url:
              "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
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
        fallbackCoverUrl:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        description: `${catLabel} com atendimento profissional, catálogo online e agendamento rápido pelo WhatsApp.`,
        editorialSummary: (name) =>
          `Conheça a vitrine profissional do ${name}. Veja nossos principais serviços, avaliações reais no Google e agende seu horário direto pelo WhatsApp.`,
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

  if (niche === "restaurant") {
    return `Opa, tudo bem? Vi o perfil do *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine e o cardápio digital com QR Code nas mesas de vocês (sem precisar gastar com impressora na cozinha): ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  if (niche === "petshop") {
    return `Opa, tudo bem? Vi o perfil do *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de vocês com catálogo de Banho & Tosa / serviços e agendamento direto no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  if (niche === "automotive") {
    return `Opa, tudo bem? Vi o perfil da *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de vocês com catálogo de serviços e orçamento rápido direto no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  if (niche === "bakery") {
    return `Opa, tudo bem? Vi o perfil da *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de vocês com catálogo de bolos/encomendas e pedidos direto no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
  }

  return `Opa, tudo bem? Vi o perfil do *${businessName}* aqui no Google e montei uma prévia rápida de como ficaria a vitrine profissional de vocês no Google com catálogo de serviços e agendamento direto no WhatsApp: ${demoUrl} — Posso te mostrar em 1 minuto como funciona?`;
}
