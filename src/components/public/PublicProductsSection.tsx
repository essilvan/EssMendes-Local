"use client";

import React from "react";
import type { TenantProduct } from "@/types";
import { ShoppingBag, MessageCircle, Tag, Star, ArrowRight } from "lucide-react";
import { sanitizePhoneNumber } from "@/utils/phone";

interface PublicProductsSectionProps {
  products: TenantProduct[];
  tenantName: string;
  phoneWhatsapp?: string | null;
}

export function PublicProductsSection({
  products,
  tenantName,
  phoneWhatsapp,
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

  return (
    <section id="produtos" className="scroll-mt-20 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 ring-1 ring-teal-700/20">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Vitrine & Produtos Físicos</span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Peças e Itens Disponíveis para Retirada
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Consulte a disponibilidade em tempo real e faça seu pedido direto pelo WhatsApp de {tenantName}.
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-500 self-start sm:self-auto">
          {activeProducts.length} {activeProducts.length === 1 ? "item disponível" : "itens disponíveis"}
        </span>
      </div>

      {/* Grid de Produtos */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeProducts.map((p) => {
          const hasPromo = p.promotional_price && p.promotional_price > 0 && p.promotional_price < p.price;
          const currentPrice = hasPromo ? p.promotional_price! : p.price;
          const orderUrl = cleanPhone ? getWhatsAppProductLink(p.name, currentPrice) : "#";

          return (
            <div
              key={p.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all hover:border-teal-300 hover:shadow-md"
            >
              <div>
                {/* Imagem do Produto */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <ShoppingBag className="h-12 w-12" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {p.category || "Produto"}
                      </span>
                    </div>
                  )}

                  {p.is_featured && (
                    <div className="absolute top-2.5 left-2.5 rounded-full bg-amber-500/95 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Destaque
                    </div>
                  )}

                  {hasPromo && (
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                      Promoção
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4 space-y-2">
                  {p.category && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      <Tag className="h-2.5 w-2.5" />
                      {p.category}
                    </span>
                  )}

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                    {p.name}
                  </h3>

                  {p.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Preços */}
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">
                      {formatCurrency(currentPrice)}
                    </span>
                    {hasPromo && (
                      <span className="text-xs font-semibold text-slate-400 line-through">
                        {formatCurrency(p.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão de WhatsApp */}
              <div className="p-4 pt-0">
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Pedir / Retirar no WhatsApp</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
