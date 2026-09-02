"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ZoomIn,
} from "lucide-react";

import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface PlacePhotoGalleryProps {
  photos: string[];
  tenantName: string;
  address?: string | null;
  theme?: NicheThemeConfig;
}

export function PlacePhotoGallery({
  photos,
  tenantName,
  address,
  theme,
}: PlacePhotoGalleryProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );

  const cleanPhotos = Array.isArray(photos)
    ? photos.filter((p) => Boolean(p) && typeof p === "string")
    : [];

  const handleNext = useCallback(() => {
    if (selectedPhotoIndex === null || cleanPhotos.length === 0) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % cleanPhotos.length);
  }, [selectedPhotoIndex, cleanPhotos.length]);

  const handlePrev = useCallback(() => {
    if (selectedPhotoIndex === null || cleanPhotos.length === 0) return;
    setSelectedPhotoIndex(
      (selectedPhotoIndex - 1 + cleanPhotos.length) % cleanPhotos.length
    );
  }, [selectedPhotoIndex, cleanPhotos.length]);

  // Teclado: Escape fecha, Setas navegam
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === "Escape") setSelectedPhotoIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, handleNext, handlePrev]);

  // Trava scroll da página quando o modal estiver aberto
  useEffect(() => {
    if (selectedPhotoIndex !== null) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedPhotoIndex]);

  if (cleanPhotos.length === 0) {
    return null;
  }

  return (
    <section
      id="fotos"
      className={`${currentTheme.roundedClass} border ${currentTheme.borderClass} ${currentTheme.bgCard} p-6 sm:p-8 shadow-sm space-y-6`}
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${currentTheme.borderClass} pb-4`}>
        <div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Ambiente & Estrutura</span>
          </div>
          <h2 className={`mt-1 text-lg sm:text-xl font-black ${currentTheme.textPrimary}`}>
            Conheça as Instalações de {tenantName}
          </h2>
          <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
            Fotos oficiais e registros reais do espaço sincronizados do Google
            Maps.
          </p>
        </div>

        {address && (
          <div className={`flex items-center gap-1.5 text-xs ${currentTheme.textMuted} font-semibold ${
            currentTheme.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-100'
          } border px-3 py-1.5 ${currentTheme.roundedClass} self-start sm:self-auto`}>
            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate max-w-xs">{address}</span>
          </div>
        )}
      </div>

      {/* Grid de Fotos em Alta Resolução */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {cleanPhotos.map((photoUrl, idx) => {
          const isFeatured = idx === 0;
          return (
            <button
              type="button"
              key={idx}
              onClick={() => setSelectedPhotoIndex(idx)}
              className={`group relative overflow-hidden rounded-2xl bg-slate-100 cursor-pointer shadow-2xs border border-slate-200/80 transition hover:shadow-md text-left focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                isFeatured
                  ? "col-span-2 row-span-2 aspect-square sm:aspect-auto"
                  : "aspect-4/3"
              }`}
              aria-label={`Ampliar foto ${idx + 1} de ${tenantName}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt={`Instalações ${tenantName} - Foto ${idx + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Overlay Hover com Botão Visual "Ampliar Foto" */}
              <div className="absolute inset-0 bg-slate-950/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-2xs">
                <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-md">
                  <ZoomIn className="h-3.5 w-3.5" />
                  <span>Ampliar Foto</span>
                </div>
              </div>

              {isFeatured && (
                <div className="absolute top-3 left-3 rounded-lg bg-slate-900/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-xs">
                  Destaque Principal
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal / Lightbox Interativo de Foto Ampliada em Tela Cheia */}
      {selectedPhotoIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Visualizador de foto ampliada de ${tenantName}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Botão Fechar no Canto Superior Direito */}
          <button
            type="button"
            onClick={() => setSelectedPhotoIndex(null)}
            className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 active:scale-95 transition backdrop-blur-md shadow-lg"
            aria-label="Fechar visualização de foto"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Botão Anterior na Lateral Esquerda (Desktop) */}
          {cleanPhotos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="hidden sm:flex fixed left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 active:scale-95 transition backdrop-blur-md shadow-lg"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Botão Próximo na Lateral Direita (Desktop) */}
          {cleanPhotos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="hidden sm:flex fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 active:scale-95 transition backdrop-blur-md shadow-lg"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Container Central com a Imagem Ampliada */}
          <div
            className="relative max-w-5xl w-full max-h-[88vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Foto Ampliada com Moldura Fina */}
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900 shadow-2xl max-h-[78vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cleanPhotos[selectedPhotoIndex]}
                alt={`Instalações ${tenantName} - Foto ampliada ${
                  selectedPhotoIndex + 1
                }`}
                className="max-h-[76vh] w-auto object-contain rounded-2xl shadow-inner"
              />
            </div>

            {/* Barra de Controles e Legenda Inferior */}
            <div className="flex items-center justify-between w-full max-w-md mt-4 px-2 text-white">
              <button
                type="button"
                onClick={handlePrev}
                className="sm:hidden inline-flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold hover:bg-white/30 transition backdrop-blur-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <span className="text-xs font-bold text-white/90 bg-white/15 px-3.5 py-1.5 rounded-full backdrop-blur-xs shadow-xs mx-auto">
                Foto {selectedPhotoIndex + 1} de {cleanPhotos.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="sm:hidden inline-flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold hover:bg-white/30 transition backdrop-blur-xs"
              >
                <span>Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
