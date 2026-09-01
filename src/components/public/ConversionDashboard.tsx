"use client";

import React from "react";
import type { Service, PortfolioItem, TenantProfile, TenantPost } from "@/types";
import { BeforeAfterShowcase } from "./BeforeAfterShowcase";
import { BookingWidgetCard } from "./BookingWidgetCard";
import { generateWhatsAppUrl } from "@/utils/phone";
import {
  Sparkles,
  Clock,
  Calendar,
  Gift,
  Copy,
  Check,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface ConversionDashboardProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
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
  onOpenBookingModal,
}: ConversionDashboardProps) {
  const [copiedCoupon, setCopiedCoupon] = React.useState(false);

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

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* =========================================================================
          COLUNA 1: Nossos Serviços (Catálogo Universal de Serviços)
         ========================================================================= */}
      <div
        id="servicos"
        className={`${
          hasMiddleColumn ? "lg:col-span-4" : "lg:col-span-7"
        } ${currentTheme.roundedClass} ${currentTheme.bgCard} p-6 sm:p-7 space-y-4`}
      >
        <div className={`flex items-center justify-between border-b ${currentTheme.borderClass} pb-3.5`}>
          <div>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
            >
              <span>{currentTheme.icons?.services || "🛠️"}</span>
              <span>Nossos Serviços</span>
            </div>
            <h3 className={`mt-1 text-base sm:text-lg font-black ${currentTheme.textPrimary}`}>
              Catálogo & Preços
            </h3>
          </div>

          <span className={`text-xs font-bold ${currentTheme.badgeText} ${currentTheme.badgeBg} px-2.5 py-1 rounded-full`}>
            {services.length} {services.length === 1 ? "opção" : "opções"}
          </span>
        </div>

        {/* Lista de Cards de Serviços Reais */}
        {services.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs space-y-2">
            <p className={`font-semibold ${currentTheme.textPrimary}`}>Nenhum serviço cadastrado no momento.</p>
            <p className={currentTheme.textMuted}>
              Faça seu agendamento ou tire dúvidas diretamente pelo WhatsApp.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const hasPrice = service.price !== null && Number(service.price) > 0;
              const phone = profile?.phone_whatsapp || profile?.phone;
              const whatsappOrderText = `👋 Olá! Gostaria de um orçamento/agendamento para o serviço: *${service.name}*.`;

              return (
                <div
                  key={service.id}
                  className={`group ${currentTheme.roundedClass} border ${currentTheme.borderClass} ${
                    currentTheme.isDark ? 'bg-zinc-800/60 hover:bg-zinc-800' : 'bg-slate-50/60 hover:bg-slate-50'
                  } p-4 space-y-3 transition shadow-2xs`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className={`text-xs sm:text-sm font-black ${currentTheme.textPrimary} transition`}>
                        {service.name}
                      </h4>
                      {service.description && (
                        <p className={`text-[11px] sm:text-xs ${currentTheme.textMuted} line-clamp-2 leading-relaxed`}>
                          {service.description}
                        </p>
                      )}
                    </div>

                    {hasPrice ? (
                      <span
                        className="text-sm sm:text-base font-black shrink-0"
                        style={{ color: "var(--primary-color, #0d9488)" }}
                      >
                        {formatCurrency(Number(service.price))}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 shrink-0">
                        Sob Consulta
                      </span>
                    )}
                  </div>

                  <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t ${currentTheme.borderClass}`}>
                    <span className={`text-[11px] font-bold ${currentTheme.textMuted} flex items-center gap-1`}>
                      <Clock className="h-3 w-3" />
                      {service.duration_minutes} min
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Botão de Orçamento no WhatsApp */}
                      {phone && (
                        <a
                          href={generateWhatsAppUrl(phone, whatsappOrderText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 ${currentTheme.roundedClass} px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                            !hasPrice
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : currentTheme.isDark
                                ? "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-600"
                                : "border border-slate-200 bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-200"
                          }`}
                          title="Solicitar orçamento diretamente no WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>
                            {!hasPrice ? "💬 Solicitar Orçamento via WhatsApp" : "WhatsApp"}
                          </span>
                        </a>
                      )}

                      {/* Botão de Agendamento */}
                      <button
                        type="button"
                        onClick={() => onOpenBookingModal(service.id)}
                        className={`inline-flex items-center gap-1.5 ${currentTheme.roundedClass} px-3.5 py-1.5 text-xs font-black transition cursor-pointer shadow-2xs hover:opacity-95 active:scale-95 ${
                          hasPrice
                            ? "text-white"
                            : currentTheme.isDark
                              ? "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        style={hasPrice ? { backgroundColor: "var(--primary-color, #0d9488)" } : undefined}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>📅 Agendar Horário</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          COLUNA 2: Antes & Depois + Banner de Cupom Real (se houver dados reais)
         ========================================================================= */}
      {hasMiddleColumn && (
        <div className="lg:col-span-4 space-y-6">
          {/* Card Antes & Depois (Apenas itens reais do banco) */}
          {hasPortfolio && <BeforeAfterShowcase items={portfolioItems} />}

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
          onSuccessOpenModal={() => {}}
        />
      </div>

    </section>
  );
}
