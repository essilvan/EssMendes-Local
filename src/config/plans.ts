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
    name: 'Profissional Pro',
    badge: 'Mais Recomendado',
    priceMonthly: 49.90,
    priceYearly: 499.00, // Equivalente a ~R$ 41,58/mês
    description: 'Para negócios locais que buscam máxima conversão, agendamentos ilimitados e destaque no Google.',
    maxServices: Infinity,
    maxMonthlyAppointments: Infinity,
    features: [
      'Serviços e procedimentos ilimitados',
      'Agendamentos e base de clientes ilimitados',
      'SEO Local Avançado com Schema.org Rich Data',
      'Diagnóstico de Presença Local completo',
      'Métricas de conversão em tempo real',
      'Painel de gestão de agenda com status',
      'Suporte para Domínio Próprio (.com.br)',
      'Suporte prioritário via WhatsApp',
    ],
    ctaLabel: 'Assinar Plano Pro',
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
