export type ThemeNiche = 'auto' | 'health_beauty' | 'food' | 'retail_default';

export interface NicheThemeConfig {
  id: ThemeNiche;
  name: string;
  isDark: boolean;
  bgPage: string;
  bgCard: string;
  textPrimary: string;
  textMuted: string;
  accentColor: string; // Hex ou classe Tailwind
  accentBg: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  roundedClass: string;
  ctaButtonClass: string;
  heroTagline: string;
}

export const NICHE_THEMES: Record<ThemeNiche, NicheThemeConfig> = {
  auto: {
    id: 'auto',
    name: 'Industrial / Auto Center',
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
  },
  health_beauty: {
    id: 'health_beauty',
    name: 'Saúde & Estética Premium',
    isDark: false,
    bgPage: 'bg-slate-50 text-slate-800',
    bgCard: 'bg-white/90 border border-slate-200/80 shadow-md shadow-slate-200/50 backdrop-blur-sm',
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
  },
  food: {
    id: 'food',
    name: 'Gastronomia & Delivery',
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
  },
  retail_default: {
    id: 'retail_default',
    name: 'Comércio & Serviços em Geral',
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
  }
};

export function detectNicheTheme(category?: string | null, googleTypes?: string[]): ThemeNiche {
  const text = `${category || ''} ${(googleTypes || []).join(' ')}`.toLowerCase();
  
  if (
    text.includes('car') ||
    text.includes('auto') ||
    text.includes('mecanic') ||
    text.includes('oficina') ||
    text.includes('pneu') ||
    text.includes('guincho') ||
    text.includes('veiculo') ||
    text.includes('veículo') ||
    text.includes('lavajato') ||
    text.includes('funilaria') ||
    text.includes('motocicleta') ||
    text.includes('moto')
  ) {
    return 'auto';
  }
  if (
    text.includes('dent') ||
    text.includes('saude') ||
    text.includes('saúde') ||
    text.includes('medic') ||
    text.includes('médic') ||
    text.includes('clinica') ||
    text.includes('clínica') ||
    text.includes('estetica') ||
    text.includes('estética') ||
    text.includes('beleza') ||
    text.includes('salao') ||
    text.includes('salão') ||
    text.includes('barbearia') ||
    text.includes('barber') ||
    text.includes('terapia') ||
    text.includes('farmacia') ||
    text.includes('farmácia') ||
    text.includes('fisio') ||
    text.includes('pilates') ||
    text.includes('podologia')
  ) {
    return 'health_beauty';
  }
  if (
    text.includes('restaurante') ||
    text.includes('food') ||
    text.includes('bar') ||
    text.includes('pizz') ||
    text.includes('hamburg') ||
    text.includes('cafe') ||
    text.includes('café') ||
    text.includes('lanche') ||
    text.includes('padaria') ||
    text.includes('confeitaria') ||
    text.includes('delivery') ||
    text.includes('sorveteria') ||
    text.includes('acai') ||
    text.includes('açaí') ||
    text.includes('churrascaria')
  ) {
    return 'food';
  }
  return 'retail_default';
}
