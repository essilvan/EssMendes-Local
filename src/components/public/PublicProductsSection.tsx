"use client";

import React from "react";
import type { TenantProduct } from "@/types";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";
import { ShoppingBag, MessageCircle, Tag, Star, ArrowRight } from "lucide-react";
import { sanitizePhoneNumber } from "@/utils/phone";

interface PublicProductsSectionProps {
  products: TenantProduct[];
  tenantName: string;
  phoneWhatsapp?: string | null;
  theme?: NicheThemeConfig;
}

export function PublicProductsSection({
  products,
  tenantName,
  phoneWhatsapp,
  theme,
}: PublicProductsSectionProps) {
  const activeProducts = products.filter((p) => p.is_available);

  if (activeProducts.length === 0) {
    return null;
  }

  const cleanPhone = phoneWhatsapp ? sanitizePhoneNumber(phoneWhatsapp) : "";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const getWhatsAppProductLink = (productName: string, price: number) => {
    const formattedPrice = formatCurrency(price);
    const message = encodeURIComponent(
      `👋 Olá! Vi no site o produto *${productName}* por ${formattedPrice}. Gostaria de confirmar a disponibilidade para retirada ou entrega.`
    );
    return `https://wa.me/55${cleanPhone}?text=${message}`;
  };

  const currentTheme = theme || NICHE_THEMES.retail_default;

  return (
    <section id="produtos" className="scroll-mt-20 space-y-6">
      {/* Section Header */}
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b ${currentTheme.borderClass} pb-4`}>
        <div>
          <div className={`inline-flex items-center gap-1.5 rounded-full ${currentTheme.badgeBg} px-3 py-1 text-xs font-bold ${currentTheme.badgeText}`}>
            <span>{currentTheme.icons?.products || "🛍️"}</span>
            <span>Vitrine & Produtos Físicos</span>
          </div>
          <h2 className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight ${currentTheme.textPrimary}`}>
            Peças e Itens Disponíveis para Retirada
          </h2>
          <p className={`mt-1 text-xs sm:text-sm ${currentTheme.textMuted}`}>
            Consulte a disponibilidade em tempo real e faça seu pedido direto pelo WhatsApp de {tenantName}.
          </p>
        </div>

        <span className={`text-xs font-semibold ${currentTheme.textMuted} self-start sm:self-auto`}>
          {activeProducts.length} {activeProducts.length === 1 ? "item disponível" : "itens disponíveis"}
        </span>
      </div>

      {/* Grid de Produtos */}
      <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeProducts.map((p) => {
          const hasPromo = p.promotional_price && p.promotional_price > 0 && p.promotional_price < p.price;
          const currentPrice = hasPromo ? p.promotional_price! : p.price;
          const orderUrl = cleanPhone ? getWhatsAppProductLink(p.name, currentPrice) : "#";

          return (
            <div
              key={p.id}
              className={`group flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200/80 dark:border-white/10 ${currentTheme.bgCard} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              <div>
                {/* Imagem do Produto */}
                <div className={`relative aspect-square w-full overflow-hidden ${currentTheme.isDark ? 'bg-neutral-900' : 'bg-neutral-100'} flex items-center justify-center`}>
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                      <ShoppingBag className="h-12 w-12" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {p.category || "Produto"}
                      </span>
                    </div>
                  )}

                  {p.is_featured && (
                    <div className="absolute top-3 left-3 rounded-full bg-amber-500/95 px-3 py-1 text-[10px] font-extrabold text-white shadow-sm flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span>Destaque</span>
                    </div>
                  )}

                  {hasPromo && (
                    <div className="absolute top-3 right-3 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold text-white shadow-sm">
                      <span>Promoção</span>
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-5 space-y-2.5">
                  {p.category && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${currentTheme.badgeText} ${currentTheme.badgeBg} px-2.5 py-0.5 rounded-md`}>
                      <Tag className="h-2.5 w-2.5" />
                      {p.category}
                    </span>
                  )}

                  <h3 className={`font-bold text-sm sm:text-base ${currentTheme.textPrimary} line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`}>
                    {p.name}
                  </h3>

                  {p.description && (
                    <p className={`text-xs ${currentTheme.textMuted} line-clamp-2 leading-relaxed`}>
                      {p.description}
                    </p>
                  )}

                  {/* Preços */}
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className={`text-xl font-extrabold ${currentTheme.textPrimary}`}>
                      {formatCurrency(currentPrice)}
                    </span>
                    {hasPromo && (
                      <span className="text-xs font-semibold text-neutral-400 line-through">
                        {formatCurrency(p.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão de WhatsApp usando theme.ctaButtonClass */}
              <div className="p-5 pt-0">
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full rounded-2xl ${currentTheme.ctaButtonClass} px-4 py-3 text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Pedir no WhatsApp</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
