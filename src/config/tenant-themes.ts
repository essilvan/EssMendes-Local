export type ThemeNiche = 'auto' | 'health_beauty' | 'food' | 'retail_default';

export interface NicheThemeConfig {
  id: ThemeNiche;
  name: string;
  icon: string;
  description: string;
  isDark: boolean;
  bgPage: string;
  bgCard: string;
  textPrimary: string;
  textMuted: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  roundedClass: string;
  ctaButtonClass: string;
  heroTagline: string;
  icons: {
    hero: string;
    services: string;
    products: string;
    reviews: string;
    contact: string;
  };
}

export const NICHE_THEMES: Record<ThemeNiche, NicheThemeConfig> = {
  auto: {
    id: 'auto',
    name: 'Industrial / Auto Center',
    icon: '🔧',
    description: 'Estilo escuro de alta performance com detalhes âmbar e laranja',
    isDark: true,
    bgPage: 'bg-zinc-950 text-zinc-100',
    bgCard: 'bg-zinc-900/90 border border-zinc-800 shadow-xl shadow-black/40',
    textPrimary: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accentColor: '#f97316',
    accentBg: 'bg-amber-500 hover:bg-amber-600',
    accentText: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border border-amber-500/30',
    badgeText: 'text-amber-400',
    borderClass: 'border-zinc-800',
    roundedClass: 'rounded-xl',
    ctaButtonClass: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all',
    heroTagline: 'Serviço de Confiança e Agilidade Mecânica',
    icons: {
      hero: '⚡',
      services: '🛠️',
      products: '⚙️',
      reviews: '⭐',
      contact: '📍',
    },
  },
  health_beauty: {
    id: 'health_beauty',
    name: 'Saúde & Estética Premium',
    icon: '🌿',
    description: 'Estilo clean sofisticado com tons verde menta, teal e efeito vidro',
    isDark: false,
    bgPage: 'bg-slate-50 text-slate-800',
    bgCard: 'bg-white/95 border border-slate-200/80 shadow-md shadow-slate-200/50 backdrop-blur-sm',
    textPrimary: 'text-slate-900',
    textMuted: 'text-slate-500',
    accentColor: '#0d9488',
    accentBg: 'bg-teal-600 hover:bg-teal-700',
    accentText: 'text-teal-700',
    badgeBg: 'bg-teal-50 border border-teal-200',
    badgeText: 'text-teal-800',
    borderClass: 'border-slate-200',
    roundedClass: 'rounded-2xl',
    ctaButtonClass: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold shadow-md shadow-teal-600/20 hover:scale-[1.02] transition-all',
    heroTagline: 'Cuidado Especializado & Bem-Estar',
    icons: {
      hero: '✨',
      services: '🩺',
      products: '🧴',
      reviews: '🌟',
      contact: '📍',
    },
  },
  food: {
    id: 'food',
    name: 'Gastronomia & Delivery',
    icon: '🍔',
    description: 'Estilo escuro dinâmico com realce vermelho para estimular apetite e pedidos',
    isDark: true,
    bgPage: 'bg-stone-950 text-stone-100',
    bgCard: 'bg-stone-900 border border-stone-800 shadow-xl shadow-stone-950/50',
    textPrimary: 'text-stone-100',
    textMuted: 'text-stone-400',
    accentColor: '#dc2626',
    accentBg: 'bg-red-600 hover:bg-red-700',
    accentText: 'text-red-500',
    badgeBg: 'bg-red-950/60 border border-red-800/40',
    badgeText: 'text-red-400',
    borderClass: 'border-stone-800',
    roundedClass: 'rounded-2xl',
    ctaButtonClass: 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-lg shadow-red-600/25 hover:scale-[1.02] transition-all',
    heroTagline: 'Sabor Incomparável & Pedido Rápido',
    icons: {
      hero: '🔥',
      services: '🍽️',
      products: '🍕',
      reviews: '⭐',
      contact: '🛵',
    },
  },
  retail_default: {
    id: 'retail_default',
    name: 'Comércio & Serviços em Geral',
    icon: '🏪',
    description: 'Estilo moderno e corporativo focado em clareza, confiança e conversão',
    isDark: false,
    bgPage: 'bg-gray-50 text-gray-900',
    bgCard: 'bg-white border border-gray-200 shadow-sm',
    textPrimary: 'text-gray-900',
    textMuted: 'text-gray-500',
    accentColor: '#2563eb',
    accentBg: 'bg-blue-600 hover:bg-blue-700',
    accentText: 'text-blue-600',
    badgeBg: 'bg-blue-50 border border-blue-200',
    badgeText: 'text-blue-700',
    borderClass: 'border-gray-200',
    roundedClass: 'rounded-xl',
    ctaButtonClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:scale-[1.02] transition-all',
    heroTagline: 'Qualidade, Variedade e Atendimento Direto',
    icons: {
      hero: '🚀',
      services: '💼',
      products: '🛍️',
      reviews: '⭐',
      contact: '📍',
    },
  },
};

export function getTenantTheme(themeKey?: string | null, category?: string | null, googleTypes?: string[]): NicheThemeConfig {
  if (themeKey && themeKey in NICHE_THEMES) {
    return NICHE_THEMES[themeKey as ThemeNiche];
  }
  const text = `${category || ''} ${(googleTypes || []).join(' ')}`.toLowerCase();
  if (text.includes('car') || text.includes('auto') || text.includes('mecanic') || text.includes('oficina') || text.includes('pneu') || text.includes('guincho') || text.includes('veiculo') || text.includes('lavajato') || text.includes('funilaria')) {
    return NICHE_THEMES.auto;
  }
  if (text.includes('dent') || text.includes('saude') || text.includes('medic') || text.includes('clinica') || text.includes('estetica') || text.includes('beleza') || text.includes('salao') || text.includes('terapia') || text.includes('farmacia') || text.includes('fisio')) {
    return NICHE_THEMES.health_beauty;
  }
  if (text.includes('restaurante') || text.includes('food') || text.includes('bar') || text.includes('pizz') || text.includes('hamburg') || text.includes('cafe') || text.includes('lanche') || text.includes('padaria') || text.includes('confeitaria') || text.includes('delivery')) {
    return NICHE_THEMES.food;
  }
  return NICHE_THEMES.retail_default;
}

export function detectNicheTheme(category?: string | null, googleTypes?: string[]): ThemeNiche {
  return getTenantTheme(undefined, category, googleTypes).id;
}
