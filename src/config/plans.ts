export type PlanTier = 'free' | 'pro';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  maxServices: number;
  maxMonthlyAppointments: number;
  features: string[];
  notIncluded?: string[];
  ctaLabel: string;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Perfeito para iniciar sua presença digital e receber agendamentos.',
    maxServices: 3,
    maxMonthlyAppointments: 50,
    features: [
      'Até 3 serviços cadastrados',
      'Página pública profissional ([slug])',
      'Agendamento online com anti double-booking',
      'Botão e conversão direta via WhatsApp',
      'Métricas e telemetria básica',
      'Indexação básica no Google (Sitemap)',
    ],
    notIncluded: [
      'Serviços e procedimentos ilimitados',
      'Diagnóstico de Presença Local 100%',
      'Rich Snippets avançados (Schema.org Pro)',
      'Suporte prioritário via WhatsApp',
      'Domínio próprio personalizado (.com.br)',
    ],
    ctaLabel: 'Começar Grátis',
  },
  pro: {
    id: 'pro',
    name: 'Plano Pro EssMendes',
    badge: 'Mais Recomendado • Teste Grátis 7 Dias',
    priceMonthly: 97.00,
    priceYearly: 970.00, // 2 meses grátis
    description: 'A solução definitiva para dominar o Google Maps, automatizar agendamentos e gerar autoridade local.',
    maxServices: Infinity,
    maxMonthlyAppointments: Infinity,
    features: [
      'Teste Grátis de 7 Dias sem compromisso',
      'Sincronização em Tempo Real com Google Maps & Reviews',
      'Cálculo Preciso de Horários com Fuso de Brasília',
      'Gerador Canvas de Antes e Depois para Redes Sociais',
      'Temas especializados por nicho (Oficinas, Saúde, Gastronomia, Varejo)',
      'Agendamentos e base de clientes ilimitados',
      'Agendamento e conversão direta pelo WhatsApp',
      'SEO Local Avançado com Schema.org LocalBusiness',
      'Pagamento facilitado via Pix Instantâneo ou Cartão em 12x',
      'Suporte prioritário via WhatsApp',
    ],
    ctaLabel: 'Começar Teste Grátis de 7 Dias',
  },
};

/**
 * Retorna os detalhes de um plano pelo ID com fallback seguro para 'free'
 */
export function getPlanConfig(planTier?: string | null): PlanConfig {
  if (planTier === 'pro') return PLANS.pro;
  return PLANS.free;
}

/**
 * Valida se o tenant pode cadastrar mais serviços de acordo com seu plano
 */
export function validateServiceLimit(
  currentActiveServices: number,
  planTier: string = 'free'
): { allowed: boolean; limit: number; remaining: number } {
  const plan = getPlanConfig(planTier);
  const limit = plan.maxServices;

  if (limit === Infinity) {
    return { allowed: true, limit: Infinity, remaining: Infinity };
  }

  const remaining = Math.max(0, limit - currentActiveServices);
  return {
    allowed: currentActiveServices < limit,
    limit,
    remaining,
  };
}
