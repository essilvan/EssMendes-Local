"use client";

import React from "react";
import type { Service, PortfolioItem, TenantProfile, TenantPost } from "@/types";
import { BeforeAfterShowcase } from "./BeforeAfterShowcase";
import { BookingWidgetCard } from "./BookingWidgetCard";
import { generateWhatsAppUrl } from "@/utils/phone";
import {
  Sparkles,
  Clock,
  Clock as ClockIcon,
  Calendar,
  Gift,
  Copy,
  Check,
  ArrowRight,
  MessageCircle,
  Eye,
} from "lucide-react";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";
import { ItemDetailModal, type ItemDetailData } from "./ItemDetailModal";

interface ConversionDashboardProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    category?: string | null;
    segment?: string | null;
    template?: string | null;
    theme_niche?: string | null;
    [key: string]: any;
  };
  profile: TenantProfile | null;
  services: Service[];
  portfolioItems: PortfolioItem[];
  posts?: TenantPost[];
  activeCoupon?: {
    code: string;
    title?: string;
    discountText?: string;
    description?: string;
  } | null;
  theme?: NicheThemeConfig;
  brandColor?: string;
  onOpenBookingModal: (serviceId?: string) => void;
}

export function ConversionDashboard({
  tenant,
  profile,
  services,
  portfolioItems,
  posts = [],
  activeCoupon,
  theme,
  brandColor,
  onOpenBookingModal,
}: ConversionDashboardProps) {
  const [copiedCoupon, setCopiedCoupon] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ItemDetailData | null>(null);

  // Identifica se há algum cupom real ativo (via prop ou post promocional)
  const promoPostWithCoupon = posts.find(
    (p) =>
      p.is_active &&
      (p.title.toLowerCase().includes("cupom") ||
        p.content.toLowerCase().includes("cupom") ||
        p.title.toLowerCase().includes("off") ||
        p.content.toLowerCase().includes("desconto"))
  );

  const couponData =
    activeCoupon ||
    (promoPostWithCoupon
      ? {
          code:
            promoPostWithCoupon.content.match(/cupom\s+([A-Z0-9]+)/i)?.[1] ||
            promoPostWithCoupon.title.match(/([A-Z0-9]{5,})/)?.[1] ||
            "",
          title: promoPostWithCoupon.title,
          description: promoPostWithCoupon.content,
        }
      : null);

  const hasCoupon = Boolean(couponData && couponData.code);
  const hasPortfolio = portfolioItems && portfolioItems.length > 0;
  const hasMiddleColumn = hasPortfolio || hasCoupon;

  const handleCopyCoupon = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const currentTheme = theme || NICHE_THEMES.retail_default;

  const isTimeBasedNiche = ['barbearia', 'salao', 'estetica', 'salao_beleza', 'beleza'].some(n => 
    (tenant.category || tenant.segment || tenant.template || tenant.theme_niche || profile?.business_category || profile?.template_id || '').toLowerCase().includes(n)
  );

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* =========================================================================
          COLUNA 1: Nossos Serviços (Catálogo Universal de Serviços)
         ========================================================================= */}
      <div
        id="servicos"
        className={`${
          hasMiddleColumn ? "lg:col-span-4" : "lg:col-span-7"
        } rounded-3xl ${currentTheme.bgCard} border border-neutral-200/80 dark:border-white/10 p-6 sm:p-8 space-y-6 shadow-xl shadow-black/5`}
      >
        <div className={`flex items-center justify-between border-b border-neutral-200/80 dark:border-white/10 pb-4`}>
          <div>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
            >
              <span>{currentTheme.icons?.services || "🛠️"}</span>
              <span>Nossos Serviços</span>
            </div>
            <h3 className={`mt-1.5 text-lg sm:text-xl font-extrabold ${currentTheme.textPrimary} tracking-tight`}>
              Catálogo & Preços
            </h3>
          </div>

          <span className={`text-xs font-semibold ${currentTheme.badgeText} ${currentTheme.badgeBg} px-3 py-1 rounded-full`}>
            {services.length} {services.length === 1 ? "opção" : "opções"}
          </span>
        </div>

        {/* Lista de Cards de Serviços Reais */}
        {services.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs space-y-2">
            <p className={`font-semibold ${currentTheme.textPrimary}`}>Nenhum serviço cadastrado no momento.</p>
            <p className={currentTheme.textMuted}>
              Faça seu agendamento ou tire dúvidas diretamente pelo WhatsApp.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => {
              const hasPrice = service.price !== null && Number(service.price) > 0;
              const phone = profile?.phone_whatsapp || profile?.phone;
              const whatsappOrderText = `👋 Olá! Gostaria de um orçamento/agendamento para o serviço: *${service?.name ?? ""}*.`;

              // Só exibir o badge de tempo se houver valor preenchido E (for nicho de agendamento OU o lojista definiu explicitamente com show_duration)
              const shouldShowDuration = service.duration_minutes && (isTimeBasedNiche || service.show_duration);

              return (
                <div
                  key={service.id}
                  onClick={() =>
                    setSelectedItem({
                      title: service?.name ?? "",
                      description: service.description,
                      price: service.price,
                      duration_minutes: service.duration_minutes,
                      show_duration: service.show_duration,
                      isService: true,
                    })
                  }
                  className="group rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col justify-between gap-3.5 cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        {service?.name ?? ""}
                      </h3>
                      {/* Preço em destaque tipográfico legível */}
                      <span className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white shrink-0">
                        {hasPrice ? formatCurrency(Number(service.price)) : "Sob Consulta"}
                      </span>
                    </div>

                    {service.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    <div className="pt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                      <Eye className="h-3 w-3" />
                      <span>Ver detalhes</span>
                    </div>
                  </div>

                  {/* Divisória subtil */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {/* Duração (ícone de relógio + minutos) */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      <ClockIcon className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                      <span>{service.duration_minutes ? `${service.duration_minutes} min` : "Sob agendamento"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botão de Orçamento no WhatsApp */}
                      {phone && (
                        <a
                          href={generateWhatsAppUrl(phone, whatsappOrderText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition"
                          title="Tirar dúvidas no WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}

                      {/* Botão explícito de Agendar que abre o fluxo pré-selecionando o serviço */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBookingModal(service.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer"
                        style={{
                          backgroundColor: brandColor || "var(--brand-primary, #0d9488)",
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Agendar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Serviço */}
      <ItemDetailModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        phone={profile?.phone_whatsapp || profile?.phone}
        tenantName={tenant.name}
        themeNiche={tenant.theme_niche || tenant.category}
      />

      {/* =========================================================================
          COLUNA 2: Antes & Depois + Banner de Cupom Real (se houver dados reais)
         ========================================================================= */}
      {hasMiddleColumn && (
        <div className="lg:col-span-4 space-y-6">
          {/* Card Antes & Depois (Apenas itens reais do banco) */}
          {hasPortfolio && <BeforeAfterShowcase items={portfolioItems} theme={currentTheme} />}

          {/* Banner Promocional Verde / Tema (Apenas se houver cupom ativo real) */}
          {hasCoupon && couponData && (
            <div
              className="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm space-y-3.5 transition"
              style={{
                backgroundColor: "var(--primary-color, #0d9488)",
              }}
            >
              {/* Círculo decorativo */}
              <div className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10 blur-md" />

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase backdrop-blur-xs ring-1 ring-white/30">
                  <Gift className="h-3 w-3 text-amber-300 fill-current" />
                  <span>Condição Especial</span>
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black tracking-tight text-white leading-tight">
                  {couponData.title || "Oferta Promocional Ativa"}
                </h4>
                <p className="text-xs text-white/90 leading-relaxed font-normal">
                  {couponData.description ||
                    "Utilize o cupom de desconto abaixo ao realizar seu agendamento."}
                </p>
              </div>

              {/* Cupom e Botão Copiar */}
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/15 p-2 backdrop-blur-xs border border-white/20">
                <span className="font-mono text-xs font-black tracking-widest text-white px-2">
                  {couponData.code}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyCoupon(couponData.code)}
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1 text-[11px] font-black text-slate-900 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  {copiedCoupon ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-700">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-500" />
                      <span>Copiar Cupom</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          COLUNA 3: Widget de Agendamento em 3 Passos
         ========================================================================= */}
      <div className={hasMiddleColumn ? "lg:col-span-4" : "lg:col-span-5"}>
        <BookingWidgetCard
          tenantId={tenant.id}
          tenantName={tenant.name}
          services={services}
          businessPhone={profile?.phone_whatsapp}
          theme={currentTheme}
          onSuccessOpenModal={() => {}}
        />
      </div>

    </section>
  );
}
