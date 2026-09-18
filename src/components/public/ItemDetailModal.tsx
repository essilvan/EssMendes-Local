"use client";

import React, { useEffect } from "react";
import {
  X,
  MessageCircle,
  Clock,
  ShoppingBag,
  Sparkles,
  Tag,
  Package,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { sanitizePhoneNumber } from "@/utils/phone";

export interface ItemDetailData {
  title: string;
  description?: string | null;
  price?: number | null;
  promotional_price?: number | null;
  image_url?: string | null;
  category?: string | null;
  duration_minutes?: number | null;
  show_duration?: boolean;
  isService?: boolean;
  stock_quantity?: number | null;
}

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDetailData | null;
  phone?: string | null;
  tenantName?: string;
  themeNiche?: string | null;
}

export function ItemDetailModal({
  isOpen,
  onClose,
  item,
  phone,
  tenantName,
  themeNiche,
}: ItemDetailModalProps) {
  // Fecha com a tecla ESC e trava o scroll do body quando aberto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const cleanPhone = phone ? sanitizePhoneNumber(phone) : "";
  const isOutOfStock = typeof item.stock_quantity === "number" && item.stock_quantity === 0;
  const whatsappText = isOutOfStock
    ? `👋 Olá! Vi no site o item *${item.title}*, mas consta como esgotado. Gostaria de consultar encomenda ou previsão de reposição.`
    : `Olá! Gostaria de mais informações sobre: ${item.title}`;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`
    : null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const isTimeBasedNiche = ["barbearia", "salao", "estetica", "salao_beleza", "beleza"].some((n) =>
    (themeNiche || "").toLowerCase().includes(n)
  );

  const shouldShowDuration =
    item.duration_minutes &&
    item.duration_minutes > 0 &&
    (isTimeBasedNiche || item.show_duration);

  const hasPromo =
    item.promotional_price &&
    item.promotional_price > 0 &&
    item.price &&
    item.promotional_price < item.price;

  const currentPrice = hasPromo ? item.promotional_price! : item.price;
  const hasPrice = currentPrice !== null && currentPrice !== undefined && Number(currentPrice) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar no Topo */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 z-20 rounded-full bg-black/50 hover:bg-black/75 dark:bg-white/10 dark:hover:bg-white/20 p-2 text-white transition-colors backdrop-blur-md cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          {/* Imagem em Destaque de Alta Qualidade */}
          {item.image_url ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          ) : (
            <div className="h-28 w-full rounded-2xl bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-850 dark:to-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
              <div className="flex items-center gap-2 font-medium text-xs">
                {item.isService ? (
                  <Sparkles className="h-6 w-6 text-neutral-400" />
                ) : (
                  <ShoppingBag className="h-6 w-6 text-neutral-400" />
                )}
                <span>{item.category || (item.isService ? "Serviço Profissional" : "Item do Catálogo")}</span>
              </div>
            </div>
          )}

          {/* Badges de Categoria e Duração */}
          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <Tag className="h-3 w-3" />
                <span>{item.category}</span>
              </span>
            )}

            {shouldShowDuration && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <Clock className="h-3.5 w-3.5 text-neutral-500" />
                <span>⏱️ {item.duration_minutes} min</span>
              </span>
            )}

            {typeof item.stock_quantity === "number" && item.stock_quantity > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Em Estoque: {item.stock_quantity} {item.stock_quantity === 1 ? "unidade" : "unidades"}</span>
              </span>
            )}

            {isOutOfStock && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>Esgotado / Sob Encomenda</span>
              </span>
            )}
          </div>

          {/* Cabeçalho: Título Completo e Preço */}
          <div className="space-y-3 border-b border-neutral-100 dark:border-white/10 pb-5">
            <h2
              id="item-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white leading-tight tracking-tight"
            >
              {item.title}
            </h2>

            {/* Preço em Destaque */}
            <div className="flex items-baseline gap-3">
              {hasPrice ? (
                <>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(Number(currentPrice))}
                  </span>
                  {hasPromo && item.price && (
                    <span className="text-sm sm:text-base font-semibold text-neutral-400 line-through">
                      {formatCurrency(Number(item.price))}
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-block rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3.5 py-1.5 text-xs sm:text-sm font-bold">
                  Sob Consulta / Orçamento
                </span>
              )}
            </div>
          </div>

          {/* Descrição Completa Sem Truncamento */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Detalhes & Descrição
            </h3>
            <div className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
              {item.description && item.description.trim().length > 0
                ? item.description
                : "Nenhuma descrição adicional informada para este item."}
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-850/80 border-t border-neutral-100 dark:border-white/10 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            Fechar
          </button>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl ${
                isOutOfStock
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              } text-xs sm:text-sm font-bold shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
            >
              <MessageCircle className="h-4 w-4 fill-white" />
              <span>
                {isOutOfStock
                  ? "Consultar Encomenda no WhatsApp"
                  : "Pedir / Tirar Dúvidas no WhatsApp"}
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
