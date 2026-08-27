import type { LocalScoreResult, PresenceScoreCategory, TenantOpportunity } from "../types";

export interface ScoreDataInputs {
  tenant: {
    id: string;
    name: string;
    slug: string;
    google_rating?: number | null;
    google_reviews_count?: number | null;
  };
  profile: {
    name?: string | null;
    business_category?: string | null;
    phone_whatsapp?: string | null;
    phone?: string | null;
    address?: string | null;
    description?: string | null;
    editorial_summary?: string | null;
    logo_url?: string | null;
    opening_hours_json?: any;
    place_photos?: any;
    latitude?: number | null;
    longitude?: number | null;
    google_rating?: number | null;
    rating?: number | null;
    google_reviews_count?: number | null;
    review_count?: number | null;
  } | null;
  servicesCount: number;
  productsCount: number;
  postsCount: number;
  reviews: Array<{
    id: string;
    rating: number;
    text?: string | null;
    reply_text?: string | null;
  }>;
  portfolioCount: number;
}

/**
 * Motor Modular de Cálculo do EssMendes Local Score (0 a 100)
 */
export function calculateLocalPresenceScore(inputs: ScoreDataInputs): {
  scoreResult: LocalScoreResult;
  opportunities: Omit<TenantOpportunity, "id" | "tenant_id" | "created_at" | "updated_at">[];
} {
  const { tenant, profile, servicesCount, productsCount, postsCount, reviews, portfolioCount } = inputs;
  const opps: Omit<TenantOpportunity, "id" | "tenant_id" | "created_at" | "updated_at">[] = [];

  // ==========================================
  // 1. CATEGORIA: PERFIL (PESO 20%)
  // ==========================================
  const hasName = Boolean((profile?.name || tenant.name)?.trim());
  const hasCategory = Boolean(profile?.business_category?.trim());
  const hasPhone = Boolean((profile?.phone_whatsapp || profile?.phone)?.trim() && (profile?.phone_whatsapp || profile?.phone)!.length >= 10);
  const hasAddress = Boolean(profile?.address?.trim() && profile.address.length >= 8);
  const hasHours = Boolean(profile?.opening_hours_json && (Array.isArray(profile.opening_hours_json) ? profile.opening_hours_json.length > 0 : true));
  const hasLogo = Boolean(profile?.logo_url?.trim());

  const profileItems = [
    {
      name: "Nome Oficial do Negócio",
      pointsEarned: hasName ? 4 : 0,
      maxPoints: 4,
      completed: hasName,
      recommendation: hasName ? undefined : "Defina o nome comercial oficial do estabelecimento.",
    },
    {
      name: "Categoria / Segmento Comercial",
      pointsEarned: hasCategory ? 4 : 0,
      maxPoints: 4,
      completed: hasCategory,
      recommendation: hasCategory ? undefined : "Informe a categoria principal da sua empresa para melhorar o posicionamento.",
    },
    {
      name: "Telefone & WhatsApp de Atendimento",
      pointsEarned: hasPhone ? 4 : 0,
      maxPoints: 4,
      completed: hasPhone,
      recommendation: hasPhone ? undefined : "Adicione seu telefone celular com DDD para contato direto.",
    },
    {
      name: "Endereço Físico Completo com Bairro",
      pointsEarned: hasAddress ? 4 : 0,
      maxPoints: 4,
      completed: hasAddress,
      recommendation: hasAddress ? undefined : "Preencha rua, número, bairro e cidade para ser encontrado na região.",
    },
    {
      name: "Horários Semanais de Funcionamento",
      pointsEarned: hasHours ? 2 : 0,
      maxPoints: 2,
      completed: hasHours,
      recommendation: hasHours ? undefined : "Sincronize com o Google para exibir se o local está aberto ou fechado agora.",
    },
    {
      name: "Logotipo / Foto de Apresentação",
      pointsEarned: hasLogo ? 2 : 0,
      maxPoints: 2,
      completed: hasLogo,
      recommendation: hasLogo ? undefined : "Adicione seu logotipo ou foto de capa para transmitir profissionalismo.",
    },
  ];

  const profileScore = profileItems.reduce((acc, i) => acc + i.pointsEarned, 0);

  if (!hasLogo) {
    opps.push({
      title: "Adicionar Logotipo ou Foto de Fachada",
      description: "Estabelecimentos com foto geram 42% mais solicitações de rota no Google.",
      priority: "low",
      impact: "medium",
      action_label: "Enviar Foto",
      action_url: "/admin/configuracoes",
      category: "profile",
      status: "pending",
    });
  }

  if (!hasCategory || !hasAddress) {
    opps.push({
      title: "Completar dados de Endereço e Categoria",
      description: "O Google prioriza estabelecimentos que possuem categoria e endereço com consistência NAP.",
      priority: "high",
      impact: "high",
      action_label: "Ajustar Informações",
      action_url: "/admin/configuracoes",
      category: "profile",
      status: "pending",
    });
  }

  // ==========================================
  // 2. CATEGORIA: REPUTAÇÃO (PESO 25%)
  // ==========================================
  const reviewsCount = reviews.length;
  const rating = profile?.google_rating ?? tenant.google_rating ?? 5.0;
  const unansweredCount = reviews.filter((r) => !r.reply_text).length;

  const hasEnoughReviews = reviewsCount >= 5;
  const hasGoodRating = rating >= 4.5;
  const hasLowUnanswered = reviewsCount > 0 ? unansweredCount <= 2 : true;
  const hasRecentReviews = reviewsCount > 0;

  const reputationItems = [
    {
      name: "Volume de Avaliações Reais (Mín. 5)",
      pointsEarned: reviewsCount >= 5 ? 8 : reviewsCount >= 2 ? 4 : reviewsCount > 0 ? 2 : 0,
      maxPoints: 8,
      completed: hasEnoughReviews,
      recommendation: hasEnoughReviews ? undefined : "Incentive clientes satisfeitos a avaliarem sua empresa no Google.",
    },
    {
      name: "Nota Média de Satisfação (>= 4.5)",
      pointsEarned: hasGoodRating ? 8 : rating >= 4.0 ? 5 : 2,
      maxPoints: 8,
      completed: hasGoodRating,
      recommendation: hasGoodRating ? undefined : "Mantenha a nota acima de 4.5 estrelas para ter destaque nas buscas.",
    },
    {
      name: "Taxa de Resposta às Avaliações",
      pointsEarned: reviewsCount === 0 ? 5 : unansweredCount === 0 ? 5 : unansweredCount <= 2 ? 3 : 0,
      maxPoints: 5,
      completed: hasLowUnanswered,
      recommendation: unansweredCount > 0 ? `Você tem ${unansweredCount} avaliações sem resposta.` : undefined,
    },
    {
      name: "Avaliações Recentes Importadas",
      pointsEarned: hasRecentReviews ? 4 : 0,
      maxPoints: 4,
      completed: hasRecentReviews,
      recommendation: hasRecentReviews ? undefined : "Sincronize com o Google para importar seus depoimentos oficiais.",
    },
  ];

  const reputationScore = reputationItems.reduce((acc, i) => acc + i.pointsEarned, 0);

  if (unansweredCount > 0 && reviewsCount > 0) {
    opps.push({
      title: `Responder ${unansweredCount} avaliações pendentes com IA`,
      description: "Responder a comentários no Google demonstra atenção ao cliente e eleva a posição no algoritmo local.",
      priority: unansweredCount >= 3 ? "high" : "medium",
      impact: "high",
      action_label: "Responder Avaliações",
      action_url: "/admin/avaliacoes",
      category: "reputation",
      status: "pending",
    });
  }

  if (reviewsCount === 0) {
    opps.push({
      title: "Sincronizar Avaliações Reais do Google Meu Negócio",
      description: "Importe suas notas e depoimentos reais para gerar confiança imediata em quem acessa sua vitrine.",
      priority: "high",
      impact: "high",
      action_label: "Sincronizar Google",
      action_url: "/admin/avaliacoes",
      category: "reputation",
      status: "pending",
    });
  }

  // ==========================================
  // 3. CATEGORIA: CONTEÚDO (PESO 15%)
  // ==========================================
  let photosCount = 0;
  if (profile?.place_photos) {
    if (Array.isArray(profile.place_photos)) photosCount = profile.place_photos.length;
  }
  const hasPhotos = photosCount >= 3;
  const hasPosts = postsCount >= 1;
  const hasPortfolio = portfolioCount >= 1;

  const contentItems = [
    {
      name: "Galeria de Fotos do Local (Mín. 3)",
      pointsEarned: photosCount >= 3 ? 6 : photosCount >= 1 ? 3 : 0,
      maxPoints: 6,
      completed: hasPhotos,
      recommendation: hasPhotos ? undefined : "Adicione fotos reais do espaço e do atendimento.",
    },
    {
      name: "Publicações Ativas / Posts de SEO",
      pointsEarned: postsCount >= 2 ? 6 : postsCount === 1 ? 4 : 0,
      maxPoints: 6,
      completed: hasPosts,
      recommendation: hasPosts ? undefined : "Gere e publique um post semanal com IA para manter seu feed dinâmico.",
    },
    {
      name: "Transformações Antes & Depois / Portfólio",
      pointsEarned: hasPortfolio ? 3 : 0,
      maxPoints: 3,
      completed: hasPortfolio,
      recommendation: hasPortfolio ? undefined : "Cadastre fotos comparativas para comprovar a excelência do seu trabalho.",
    },
  ];

  const contentScore = contentItems.reduce((acc, i) => acc + i.pointsEarned, 0);

  if (postsCount === 0) {
    opps.push({
      title: "Publicar primeiro artigo semanal com IA para SEO Local",
      description: "Posts frequentes mantêm a empresa ativa para o Google e atraem pesquisas orgânicas da região.",
      priority: "medium",
      impact: "high",
      action_label: "Criar Post com IA",
      action_url: "/admin/posts",
      category: "content",
      status: "pending",
    });
  }

  // ==========================================
  // 4. CATEGORIA: CONVERSÃO & CATÁLOGO (PESO 20%)
  // ==========================================
  const hasWhatsapp = hasPhone;
  const hasServices = servicesCount >= 3;
  const hasProducts = productsCount >= 1;
  const hasBooking = servicesCount >= 1;

  const catalogItems = [
    {
      name: "WhatsApp Click-to-Chat Formatado",
      pointsEarned: hasWhatsapp ? 5 : 0,
      maxPoints: 5,
      completed: hasWhatsapp,
      recommendation: hasWhatsapp ? undefined : "Configure seu WhatsApp para receber contatos em 1 clique.",
    },
    {
      name: "Catálogo de Serviços Detalhado (Mín. 3)",
      pointsEarned: servicesCount >= 3 ? 5 : servicesCount >= 1 ? 3 : 0,
      maxPoints: 5,
      completed: hasServices,
      recommendation: hasServices ? undefined : "Cadastre procedimentos com preços e durações transparentes.",
    },
    {
      name: "Vitrine de Produtos Físicos Cadastrada",
      pointsEarned: productsCount >= 3 ? 5 : productsCount >= 1 ? 3 : 0,
      maxPoints: 5,
      completed: hasProducts,
      recommendation: hasProducts ? undefined : "Cadastre peças ou produtos físicos com botão de pedido pelo WhatsApp.",
    },
    {
      name: "Agendamento Online Ativo",
      pointsEarned: hasBooking ? 5 : 0,
      maxPoints: 5,
      completed: hasBooking,
      recommendation: hasBooking ? undefined : "Habilite horários marcados para agilizar reservas sem perda de tempo.",
    },
  ];

  const catalogScore = catalogItems.reduce((acc, i) => acc + i.pointsEarned, 0);

  if (productsCount === 0) {
    opps.push({
      title: "Cadastrar produtos na vitrine de busca orgânica",
      description: "Permita que pessoas que procuram peças e produtos na sua cidade comprem via WhatsApp.",
      priority: "medium",
      impact: "high",
      action_label: "Cadastrar Produtos",
      action_url: "/admin/produtos",
      category: "catalog",
      status: "pending",
    });
  }

  if (servicesCount < 3) {
    opps.push({
      title: "Cadastrar pelo menos 3 serviços no catálogo",
      description: "Vitrines com 3 ou mais serviços convertem 3x mais do que páginas genéricas.",
      priority: "high",
      impact: "high",
      action_label: "Gerenciar Serviços",
      action_url: "/admin/servicos",
      category: "catalog",
      status: "pending",
    });
  }

  // ==========================================
  // 5. CATEGORIA: SEO LOCAL & ESTRUTURA (PESO 20%)
  // ==========================================
  const hasEditorial = Boolean((profile?.editorial_summary || profile?.description)?.trim() && (profile?.editorial_summary || profile?.description)!.length >= 40);
  const hasCoords = typeof profile?.latitude === "number" && typeof profile?.longitude === "number";
  const hasStructured = hasAddress && hasName && servicesCount > 0;
  const hasPostTags = postsCount > 0;

  const seoItems = [
    {
      name: "Apresentação & Resumo Editorial Otimizado",
      pointsEarned: hasEditorial ? 6 : 2,
      maxPoints: 6,
      completed: hasEditorial,
      recommendation: hasEditorial ? undefined : "Escreva uma apresentação do negócio com palavras-chave da sua especialidade.",
    },
    {
      name: "Coordenadas Geográficas GPS (Lat / Lng)",
      pointsEarned: hasCoords ? 4 : 0,
      maxPoints: 4,
      completed: hasCoords,
      recommendation: hasCoords ? undefined : "Sincronize o local do Google Maps para traçar rotas via Waze e Maps.",
    },
    {
      name: "Tags e Palavras-chave Locais Ativas",
      pointsEarned: hasPostTags ? 5 : 1,
      maxPoints: 5,
      completed: hasPostTags,
      recommendation: hasPostTags ? undefined : "Crie publicações com tags da sua cidade e especialidade.",
    },
    {
      name: "Dados Estruturados Schema.org JSON-LD",
      pointsEarned: hasStructured ? 5 : 2,
      maxPoints: 5,
      completed: hasStructured,
      recommendation: hasStructured ? undefined : "Mantenha serviços e endereço preenchidos para indexação no Google.",
    },
  ];

  const seoScore = seoItems.reduce((acc, i) => acc + i.pointsEarned, 0);

  // Total consolidado (máx 100)
  const totalScore = Math.min(100, profileScore + reputationScore + contentScore + catalogScore + seoScore);

  const getStatusLevel = (score: number): "excelente" | "forte" | "moderada" | "critica" => {
    if (score >= 85) return "excelente";
    if (score >= 70) return "forte";
    if (score >= 50) return "moderada";
    return "critica";
  };

  const getCategoryStatus = (score: number, max: number): "excellent" | "good" | "needs_attention" | "poor" => {
    const ratio = score / max;
    if (ratio >= 0.85) return "excellent";
    if (ratio >= 0.70) return "good";
    if (ratio >= 0.50) return "needs_attention";
    return "poor";
  };

  const categories: PresenceScoreCategory[] = [
    {
      category: "profile",
      title: "Perfil do Estabelecimento",
      score: profileScore,
      maxScore: 20,
      weight: 20,
      status: getCategoryStatus(profileScore, 20),
      items: profileItems,
    },
    {
      category: "reputation",
      title: "Reputação & Avaliações Google",
      score: reputationScore,
      maxScore: 25,
      weight: 25,
      status: getCategoryStatus(reputationScore, 25),
      items: reputationItems,
    },
    {
      category: "content",
      title: "Conteúdo & Presença Ativa",
      score: contentScore,
      maxScore: 15,
      weight: 15,
      status: getCategoryStatus(contentScore, 15),
      items: contentItems,
    },
    {
      category: "catalog",
      title: "Conversão, Catálogo & Produtos",
      score: catalogScore,
      maxScore: 20,
      weight: 20,
      status: getCategoryStatus(catalogScore, 20),
      items: catalogItems,
    },
    {
      category: "seo",
      title: "SEO Local & Indexação Google",
      score: seoScore,
      maxScore: 20,
      weight: 20,
      status: getCategoryStatus(seoScore, 20),
      items: seoItems,
    },
  ];

  return {
    scoreResult: {
      totalScore,
      statusLevel: getStatusLevel(totalScore),
      categories,
      totalOpportunities: opps.length,
    },
    opportunities: opps,
  };
}
