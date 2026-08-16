"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRightLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { PortfolioItem } from "@/types";

interface BeforeAfterShowcaseProps {
  items: PortfolioItem[];
}

export function BeforeAfterShowcase({ items }: BeforeAfterShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState(false);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setSliderPosition(50);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setSliderPosition(50);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
            <Sparkles className="h-3 w-3" />
            <span>Resultados Comprovados</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Transformações Antes & Depois
          </h2>
          <p className="text-xs text-slate-500">
            Arraste a linha central para comparar o resultado dos nossos procedimentos.
          </p>
        </div>

        {items.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {currentIndex + 1} de {items.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Item anterior"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Próximo item"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Slider Container */}
      <div className="space-y-4">
        <div
          onMouseMove={(e) => isDragging && handleSliderMove(e)}
          onTouchMove={handleSliderMove}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleSliderMove(e);
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className="relative aspect-4/3 sm:aspect-16/9 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 select-none cursor-ew-resize shadow-inner"
        >
          {/* Imagem do DEPOIS (Fundo Completo) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentItem.after_image_url}
            alt={`Depois: ${currentItem.title}`}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute top-3 right-3 rounded-lg bg-teal-900/80 px-2.5 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider backdrop-blur-xs shadow-xs">
            Depois
          </div>

          {/* Imagem do ANTES (Cortada Dinamicamente) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentItem.before_image_url}
              alt={`Antes: ${currentItem.title}`}
              className="absolute inset-y-0 left-0 h-full max-w-none object-cover"
              style={{
                width: "100%",
                minWidth: "100%",
                aspectRatio: "inherit",
              }}
            />

            <div className="absolute top-3 left-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider backdrop-blur-xs shadow-xs">
              Antes
            </div>
          </div>

          {/* Linha Divisória Interativa */}
          <div
            className="absolute inset-y-0 w-0.5 bg-white shadow-xl pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-teal-800 shadow-lg ring-2 ring-teal-600/30">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Detalhes da Transformação Atual */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            {currentItem.title}
          </h3>
          {currentItem.description && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentItem.description}
            </p>
          )}
        </div>

        {/* Miniaturas de Navegação Rápida se houver múltiplos itens */}
        {items.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setSliderPosition(50);
                }}
                className={`relative shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition ${
                  idx === currentIndex
                    ? "border-teal-700 ring-2 ring-teal-600/20"
                    : "border-slate-200 opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.after_image_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
