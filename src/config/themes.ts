import {
  Dog,
  Cat,
  Bone,
  PawPrint,
  Heart,
  Sparkles,
  ShieldCheck,
  Star,
  Scissors,
  Wrench,
  Utensils,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export type ThemeId =
  | "default"
  | "petshop"
  | "automotivo"
  | "gastronomia"
  | "barbearia"
  | "estetica_saude"
  | "servicos";

export interface ThemePalette {
  primary: string;         // Cor primária HEX de destaque (ex: #f59e0b / #ea580c)
  primaryHover: string;    // Hover do botão principal
  secondary: string;       // Cor de apoio / calor
  accent: string;          // Realces luminosos
  background: string;      // Fundo principal da página (ex: #fffbf5 claro aconchegante)
  surface: string;         // Superfície de cards principais
  surfaceMuted: string;    // Superfície suave para badges e blocos internos
  textPrimary: string;     // Cor de texto principal
  textMuted: string;       // Cor de texto secundário
  border: string;          // Cor de borda
  badgeBg: string;         // Fundo de pill/badge
  badgeText: string;       // Texto de pill/badge
  gradientHero: string;    // Gradiente sutil decorativo
}

export interface ThemeHighlight {
  icon: LucideIcon;
  title: string;
  desc: string;
  animationClass?: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  isDark: boolean;
  palette: ThemePalette;
  classes: {
    root: string;
    card: string;
    textPrimary: string;
    textMuted: string;
    border: string;
    badge: string;
    ctaButton: string;
    heroGlow: string;
  };
  icons: {
    hero: LucideIcon;
    services: LucideIcon;
    products: LucideIcon;
    reviews: LucideIcon;
    contact: LucideIcon;
    themeIcons: {
      dog: LucideIcon;
      cat: LucideIcon;
      bone: LucideIcon;
      pawPrint: LucideIcon;
      footprints: LucideIcon;
    };
  };
  hero: {
    badgeText: string;
    tagline: string;
    subheadline: string;
    highlights: ThemeHighlight[];
  };
  animations: {
    tailWagClass: string;
    pawFloatClass: string;
    pawPulseClass: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  petshop: {
    id: "petshop",
    name: "Pet Shop & Veterinária",
    tagline: "Aconchegante, Lúdico & Dedicado",
    description: "Paleta quente em tons de âmbar e laranja suave, fundo claro aconchegante, ícones temáticos da Lucide (Dog, Cat, Bone, PawPrint) e microanimações de patinhas e rabo abanando.",
    isDark: false,
    palette: {
      primary: "#ea580c",        // Laranja âmbar vibrante e quente
      primaryHover: "#c2410c",
      secondary: "#f59e0b",      // Âmbar dourado
      accent: "#fbbf24",
      background: "#fffbf5",     // Fundo creme suave aconchegante
      surface: "#ffffff",
      surfaceMuted: "#fef3c7",   // Âmbar clarinho
      textPrimary: "#451a03",    // Marrom terroso profundo
      textMuted: "#92400e",      // Âmbar escuro suave
      border: "#fed7aa",         // Borda laranja pêssego suave
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-900",
      gradientHero: "from-amber-500/15 via-orange-500/10 to-transparent",
    },
    classes: {
      root: "bg-[#fffbf5] text-stone-900 selection:bg-amber-500 selection:text-white",
      card: "bg-white/95 border border-amber-200/90 text-stone-900 shadow-md shadow-amber-950/5 backdrop-blur-sm",
      textPrimary: "text-stone-900",
      textMuted: "text-stone-600",
      border: "border-amber-200/80",
      badge: "bg-amber-100/90 text-amber-900 border border-amber-300/60 shadow-2xs",
      ctaButton: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold shadow-md shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all",
      heroGlow: "rgba(245, 158, 11, 0.22)",
    },
    icons: {
      hero: Dog,
      services: Scissors,
      products: Bone,
      reviews: Star,
      contact: PawPrint,
      themeIcons: {
        dog: Dog,
        cat: Cat,
        bone: Bone,
        pawPrint: PawPrint,
        footprints: PawPrint,
      },
    },
    hero: {
      badgeText: "🐾 Amor, Cuidado & Dedicação Pet • Atendimento Especializado",
      tagline: "Amor, Cuidado & Carinho para o Seu Melhor Amigo",
      subheadline: "Banho & tosa humanizados, consultas veterinárias, mimos e produtos selecionados com respeito e carinho que seu pet merece.",
      highlights: [
        {
          icon: Dog,
          title: "Banho & Tosa Humanizada",
          desc: "Estética com carinho e sem estresse",
          animationClass: "animate-tail-wag",
        },
        {
          icon: Cat,
          title: "Espaço Cat-Friendly",
          desc: "Ambiente calmo e aconchegante para felinos",
          animationClass: "animate-paw-float",
        },
        {
          icon: Bone,
          title: "Mimos & Nutrição Pet",
          desc: "Petiscos saudáveis e brinquedos seguros",
          animationClass: "animate-tail-wag",
        },
        {
          icon: PawPrint,
          title: "Acompanhamento Carinhoso",
          desc: "Profissionais apaixonados por animais",
          animationClass: "animate-paw-pulse",
        },
      ],
    },
    animations: {
      tailWagClass: "animate-tail-wag",
      pawFloatClass: "animate-paw-float",
      pawPulseClass: "animate-paw-pulse",
    },
  },

  default: {
    id: "default",
    name: "Padrão / Serviços Gerais",
    tagline: "Corporativo, Claro & Alta Conversão",
    description: "Design moderno equilibrado focado em confiança, catálogo de serviços e chamadas diretas para agendamento e WhatsApp.",
    isDark: false,
    palette: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      secondary: "#3b82f6",
      accent: "#60a5fa",
      background: "#f8fafc",
      surface: "#ffffff",
      surfaceMuted: "#eff6ff",
      textPrimary: "#0f172a",
      textMuted: "#64748b",
      border: "#e2e8f0",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      gradientHero: "from-blue-600/10 via-indigo-600/5 to-transparent",
    },
    classes: {
      root: "bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white",
      card: "bg-white border border-slate-200/90 text-slate-900 shadow-sm",
      textPrimary: "text-slate-900",
      textMuted: "text-slate-500",
      border: "border-slate-200",
      badge: "bg-blue-50 text-blue-700 border border-blue-200/80",
      ctaButton: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all",
      heroGlow: "rgba(37, 99, 235, 0.15)",
    },
    icons: {
      hero: Sparkles,
      services: Briefcase,
      products: Sparkles,
      reviews: Star,
      contact: Heart,
      themeIcons: {
        dog: Dog,
        cat: Cat,
        bone: Bone,
        pawPrint: PawPrint,
        footprints: PawPrint,
      },
    },
    hero: {
      badgeText: "Atendimento Profissional • Qualidade Garantida",
      tagline: "Qualidade, Variedade & Atendimento Direto",
      subheadline: "Conheça nossos serviços especializados e agende seu horário online com rapidez e garantia de satisfação.",
      highlights: [
        {
          icon: ShieldCheck,
          title: "Profissionais Qualificados",
          desc: "Equipe especializada e capacitada",
        },
        {
          icon: Star,
          title: "Avaliações Positivas",
          desc: "Satisfação comprovada no Google",
        },
        {
          icon: Briefcase,
          title: "Atendimento Dedicado",
          desc: "Compromisso com o melhor resultado",
        },
      ],
    },
    animations: {
      tailWagClass: "",
      pawFloatClass: "",
      pawPulseClass: "",
    },
  },

  automotivo: {
    id: "automotivo",
    name: "Automotivo & Mecânica",
    tagline: "Industrial, Alta Performance & Detalhes Âmbar",
    description: "Estilo escuro moderno de alta intensidade visual com contraste âmbar e laranja, ideal para oficinas e estética veicular.",
    isDark: true,
    palette: {
      primary: "#f97316",
      primaryHover: "#ea580c",
      secondary: "#f59e0b",
      accent: "#fbbf24",
      background: "#09090b",
      surface: "#18181b",
      surfaceMuted: "#27272a",
      textPrimary: "#f4f4f5",
      textMuted: "#a1a1aa",
      border: "#27272a",
      badgeBg: "bg-amber-500/10",
      badgeText: "text-amber-400",
      gradientHero: "from-amber-500/15 via-orange-600/10 to-transparent",
    },
    classes: {
      root: "bg-zinc-950 text-zinc-100 dark selection:bg-orange-500 selection:text-white",
      card: "bg-zinc-900/95 border border-zinc-800 text-zinc-100 shadow-xl shadow-black/50",
      textPrimary: "text-zinc-100",
      textMuted: "text-zinc-400",
      border: "border-zinc-800",
      badge: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      ctaButton: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all",
      heroGlow: "rgba(249, 115, 22, 0.2)",
    },
    icons: {
      hero: Wrench,
      services: Wrench,
      products: Sparkles,
      reviews: Star,
      contact: ShieldCheck,
      themeIcons: {
        dog: Dog,
        cat: Cat,
        bone: Bone,
        pawPrint: PawPrint,
        footprints: PawPrint,
      },
    },
    hero: {
      badgeText: "⚡ Alta Performance & Confiança Mecânica",
      tagline: "Serviço de Confiança e Agilidade Mecânica",
      subheadline: "Equipamentos de diagnóstico avançados, peças de procedência e atendimento pontual para seu veículo.",
      highlights: [
        {
          icon: Wrench,
          title: "Diagnóstico Preciso",
          desc: "Tecnologia e ferramentas de ponta",
        },
        {
          icon: ShieldCheck,
          title: "Garantia de Serviço",
          desc: "Peças com procedência certificada",
        },
        {
          icon: Star,
          title: "Agilidade & Pontualidade",
          desc: "Compromisso com o prazo de entrega",
        },
      ],
    },
    animations: {
      tailWagClass: "",
      pawFloatClass: "",
      pawPulseClass: "",
    },
  },

  gastronomia: {
    id: "gastronomia",
    name: "Gastronomia & Delivery",
    tagline: "Apetitoso, Quente & Visual Marcante",
    description: "Estilo escuro dinâmico com realce estimulante para restaurantes, cafeterias, hamburguerias e delivery.",
    isDark: true,
    palette: {
      primary: "#dc2626",
      primaryHover: "#b91c1c",
      secondary: "#ea580c",
      accent: "#f97316",
      background: "#0c0a09",
      surface: "#1c1917",
      surfaceMuted: "#292524",
      textPrimary: "#fafaf9",
      textMuted: "#a8a29e",
      border: "#292524",
      badgeBg: "bg-red-950/60",
      badgeText: "text-red-400",
      gradientHero: "from-red-600/15 via-rose-600/10 to-transparent",
    },
    classes: {
      root: "bg-stone-950 text-stone-100 dark selection:bg-red-600 selection:text-white",
      card: "bg-stone-900 border border-stone-800 text-stone-100 shadow-xl shadow-stone-950/50",
      textPrimary: "text-stone-100",
      textMuted: "text-stone-400",
      border: "border-stone-800",
      badge: "bg-red-950/60 text-red-400 border border-red-800/40",
      ctaButton: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold shadow-lg shadow-red-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all",
      heroGlow: "rgba(220, 38, 38, 0.2)",
    },
    icons: {
      hero: Utensils,
      services: Utensils,
      products: Sparkles,
      reviews: Star,
      contact: Heart,
      themeIcons: {
        dog: Dog,
        cat: Cat,
        bone: Bone,
        pawPrint: PawPrint,
        footprints: PawPrint,
      },
    },
    hero: {
      badgeText: "🔥 Sabor Incomparável & Ingredientes Frescos",
      tagline: "Sabor Incomparável & Pedido Rápido",
      subheadline: "Receitas artesanais preparadas com os melhores ingredientes. Atendimento presencial e delivery ágil.",
      highlights: [
        {
          icon: Utensils,
          title: "Receitas Especiais",
          desc: "Preparo artesanal e sabor marcante",
        },
        {
          icon: Sparkles,
          title: "Ingredientes Selecionados",
          desc: "Frescor e padrão de excelência",
        },
        {
          icon: Heart,
          title: "Ambiente Acolhedor",
          desc: "Ideal para família e amigos",
        },
      ],
    },
    animations: {
      tailWagClass: "",
      pawFloatClass: "",
      pawPulseClass: "",
    },
  },

  barbearia: {
    id: "barbearia",
    name: "Barbearia & Grooming",
    tagline: "Clássico, Vintage & Detalhes Dourados",
    description: "Estilo escuro sofisticado com tons âmbar/dourado e visual vintage refinado para barbearias tradicionais.",
    isDark: true,
    palette: {
      primary: "#d97706",
      primaryHover: "#b45309",
      secondary: "#f59e0b",
      accent: "#fbbf24",
      background: "#0c0a09",
      surface: "#1c1917",
      surfaceMuted: "#292524",
      textPrimary: "#fafaf9",
      textMuted: "#a8a29e",
      border: "#292524",
      badgeBg: "bg-amber-500/10",
      badgeText: "text-amber-400",
      gradientHero: "from-amber-600/15 via-amber-700/10 to-transparent",
    },
    classes: {
      root: "bg-stone-950 text-stone-100 dark selection:bg-amber-600 selection:text-white",
      card: "bg-stone-900/95 border border-stone-800 text-stone-100 shadow-xl shadow-black/40",
      textPrimary: "text-stone-100",
      textMuted: "text-stone-400",
      border: "border-stone-800",
      badge: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      ctaButton: "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold shadow-lg shadow-amber-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all",
      heroGlow: "rgba(217, 119, 6, 0.2)",
    },
    icons: {
      hero: Scissors,
      services: Scissors,
      products: Sparkles,
      reviews: Star,
      contact: ShieldCheck,
      themeIcons: {
        dog: Dog,
        cat: Cat,
        bone: Bone,
        pawPrint: PawPrint,
        footprints: PawPrint,
      },
    },
    hero: {
      badgeText: "💈 Corte Tradicional, Estilo & Navalha Afiada",
      tagline: "Corte Tradicional, Estilo & Atendimento de Primeira",
      subheadline: "O ambiente clássico e descontraído que você procura para barba, cabelo e bigode com precisão de mestre.",
      highlights: [
        {
          icon: Scissors,
          title: "Corte na Tesoura & Navalha",
          desc: "Técnica tradicional e moderna",
        },
        {
          icon: Sparkles,
          title: "Toalha Quente & Barboterapia",
          desc: "Relaxamento e cuidado completo",
        },
        {
          icon: Star,
          title: "Pontualidade & Conforto",
          desc: "Seu horário respeitado sempre",
        },
      ],
    },
    animations: {
      tailWagClass: "",
      pawFloatClass: "",
      pawPulseClass: "",
    },
  },

  estetica_saude: {
    id: "estetica_saude",
    name: "Saúde & Estética Premium",
    tagline: "Clean, Bem-Estar & Efeito Vidro",
    description: "Estilo clean sofisticado com tons menta, teal e efeito vidro, transmitindo higiene, tranquilidade e cuidado.",
    isDark: false,
    palette: {
      primary: "#0d9488",
      primaryHover: "#0f766e",
      secondary: "#14b8a6",
      accent: "#2dd4bf",
      background: "#f8fafc",
      surface: "#ffffff",
      surfaceMuted: "#f0fdfa",
      textPrimary: "#0f172a",
      textMuted: "#64748b",
      border: "#ccfbf1",
      badgeBg: "bg-teal-50",
      badgeText: "text-teal-800",
      gradientHero: "from-teal-600/10 via-emerald-600/5 to-transparent",
    },
    classes: {
      root: "bg-slate-50 text-slate-800 selection:bg-teal-600 selection:text-white",
      card: "bg-white/95 border border-slate-200/80 text-slate-800 shadow-md shadow-slate-200/50 backdrop-blur-sm",
      textPrimary: "text-slate-900",
      textMuted: "text-slate-500",
      border: "border-slate-200",
      badge: "bg-teal-50 text-teal-800 border border-teal-200",
      ctaButton: "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-md shadow-teal-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all",
      heroGlow: "rgba(13, 148, 136, 0.15)",
    },
    icons: {
      hero: Sparkles,
      services: Heart,
      products: Sparkles,
      reviews: Star,
      contact: ShieldCheck,
      themeIcons: {
        dog: Dog,
        cat: Cat,
        bone: Bone,
        pawPrint: PawPrint,
        footprints: PawPrint,
      },
    },
    hero: {
      badgeText: "✨ Cuidado Especializado & Bem-Estar Integral",
      tagline: "Cuidado Especializado & Bem-Estar",
      subheadline: "Tratamentos personalizados com profissionais dedicados ao seu bem-estar, saúde e beleza natural.",
      highlights: [
        {
          icon: Heart,
          title: "Atendimento Humanizado",
          desc: "Cuidado centrado em suas necessidades",
        },
        {
          icon: Sparkles,
          title: "Protocolos Modernos",
          desc: "Segurança e eficácia comprovadas",
        },
        {
          icon: ShieldCheck,
          title: "Ambiente Seguro & Relaxante",
          desc: "Estrutura completa e higienizada",
        },
      ],
    },
    animations: {
      tailWagClass: "",
      pawFloatClass: "",
      pawPulseClass: "",
    },
  },

  servicos: {
    id: "servicos",
    name: "Serviços Gerais & Negócios",
    tagline: "Corporativo, Claro & Alta Conversão",
    description: "Design moderno equilibrado focado em confiança, catálogo de serviços e chamadas diretas para agendamento e WhatsApp.",
    isDark: false,
    palette: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      secondary: "#3b82f6",
      accent: "#60a5fa",
      background: "#f8fafc",
      surface: "#ffffff",
      surfaceMuted: "#eff6ff",
      textPrimary: "#0f172a",
      textMuted: "#64748b",
      border: "#e2e8f0",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      gradientHero: "from-blue-600/10 via-indigo-600/5 to-transparent",
    },
    classes: {
      root: "bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white",
      card: "bg-white border border-slate-200/90 text-slate-900 shadow-sm",
      textPrimary: "text-slate-900",
      textMuted: "text-slate-500",
      border: "border-slate-200",
      badge: "bg-blue-50 text-blue-700 border border-blue-200/80",
      ctaButton: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all",
      heroGlow: "rgba(37, 99, 235, 0.15)",
    },
    icons: {
      hero: Sparkles,
      services: Briefcase,
      products: Sparkles,
      reviews: Star,
      contact: Heart,
      themeIcons: {
        dog: Dog,
        cat: Cat,
        bone: Bone,
        pawPrint: PawPrint,
        footprints: PawPrint,
      },
    },
    hero: {
      badgeText: "Atendimento Profissional • Qualidade Garantida",
      tagline: "Qualidade, Variedade & Atendimento Direto",
      subheadline: "Conheça nossos serviços especializados e agende seu horário online com rapidez e garantia de satisfação.",
      highlights: [
        {
          icon: ShieldCheck,
          title: "Profissionais Qualificados",
          desc: "Equipe especializada e capacitada",
        },
        {
          icon: Star,
          title: "Avaliações Positivas",
          desc: "Satisfação comprovada no Google",
        },
        {
          icon: Briefcase,
          title: "Atendimento Dedicado",
          desc: "Compromisso com o melhor resultado",
        },
      ],
    },
    animations: {
      tailWagClass: "",
      pawFloatClass: "",
      pawPulseClass: "",
    },
  },
};

/**
 * Resolução resiliente de tema a partir de chave ou categoria
 */
export function getTheme(
  themeKey?: string | null,
  category?: string | null,
  googleTypes?: string[]
): ThemeConfig {
  const normalizedKey = (themeKey || "").toLowerCase().trim();

  if (normalizedKey === "petshop" || normalizedKey === "pet") {
    return THEMES.petshop;
  }
  if (normalizedKey in THEMES) {
    return THEMES[normalizedKey as ThemeId];
  }

  const text = `${category || ""} ${(googleTypes || []).join(" ")}`.toLowerCase();

  if (
    text.includes("pet") ||
    text.includes("veterin") ||
    text.includes("canil") ||
    text.includes("banho e tosa") ||
    text.includes("racoes") ||
    text.includes("cachorro") ||
    text.includes("gato") ||
    text.includes("animal")
  ) {
    return THEMES.petshop;
  }

  if (text.includes("barber") || text.includes("barbearia") || text.includes("corte masculino")) {
    return THEMES.barbearia;
  }
  if (
    text.includes("car") ||
    text.includes("auto") ||
    text.includes("mecanic") ||
    text.includes("oficina") ||
    text.includes("pneu") ||
    text.includes("guincho") ||
    text.includes("veiculo") ||
    text.includes("lavajato") ||
    text.includes("funilaria")
  ) {
    return THEMES.automotivo;
  }
  if (
    text.includes("dent") ||
    text.includes("saude") ||
    text.includes("medic") ||
    text.includes("clinica") ||
    text.includes("estetica") ||
    text.includes("beleza") ||
    text.includes("salao") ||
    text.includes("terapia") ||
    text.includes("farmacia") ||
    text.includes("fisio")
  ) {
    return THEMES.estetica_saude;
  }
  if (
    text.includes("restaurante") ||
    text.includes("food") ||
    text.includes("bar") ||
    text.includes("pizz") ||
    text.includes("hamburg") ||
    text.includes("cafe") ||
    text.includes("lanche") ||
    text.includes("padaria") ||
    text.includes("confeitaria") ||
    text.includes("delivery")
  ) {
    return THEMES.gastronomia;
  }

  return THEMES.default;
}

export function isPetShopTheme(themeKey?: string | null): boolean {
  const key = (themeKey || "").toLowerCase().trim();
  return key === "petshop" || key === "pet";
}

export interface AdminThemeOption {
  id: ThemeId;
  name: string;
  icon: string;
  desc: string;
  previewColors: string[];
  isNew?: boolean;
}

export const ADMIN_THEME_OPTIONS: AdminThemeOption[] = [
  {
    id: "petshop",
    name: "Pet Shop & Veterinária",
    icon: "🐾",
    desc: "Tons quentes de âmbar e laranja suave, ícones temáticos (Cão, Gato, Osso, Patinhas) e microanimações",
    previewColors: ["#ea580c", "#f59e0b", "#fffbf5"],
    isNew: true,
  },
  {
    id: "default",
    name: "Padrão / Serviços Gerais",
    icon: "💼",
    desc: "Design corporativo moderno em azul e cinza para comércio, consultoria e serviços especializados",
    previewColors: ["#2563eb", "#64748b", "#f8fafc"],
  },
  {
    id: "gastronomia",
    name: "Gastronomia & Delivery",
    icon: "🍽️",
    desc: "Estilo escuro com realce vermelho estimulante para restaurantes, bares e cafeterias",
    previewColors: ["#dc2626", "#ea580c", "#0c0a09"],
  },
  {
    id: "automotivo",
    name: "Automotivo & Mecânica",
    icon: "🚗",
    desc: "Visual industrial e alta performance em tons escuros e âmbar para oficinas e estética veicular",
    previewColors: ["#f97316", "#f59e0b", "#09090b"],
  },
  {
    id: "barbearia",
    name: "Barbearia Tradicional",
    icon: "✂️",
    desc: "Estilo vintage refinado com detalhes dourados e toques escuros para barbearias e studios",
    previewColors: ["#d97706", "#fbbf24", "#0c0a09"],
  },
  {
    id: "estetica_saude",
    name: "Saúde & Estética",
    icon: "🌿",
    desc: "Clean, suave e sofisticado com tons verde menta e efeito vidro para clínicas e estética",
    previewColors: ["#0d9488", "#14b8a6", "#f8fafc"],
  },
];
