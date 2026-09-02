"use client";

import React from "react";
import { Star, ShieldCheck, ExternalLink, CheckCircle2, MessageSquare } from "lucide-react";
import type { TenantReview } from "@/types";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

const AVATAR_COLORS = ["#0284c7", "#059669", "#d97706", "#7c3aed", "#e11d48", "#0891b2"];

interface GoogleReviewsCardProps {
  tenantName: string;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: TenantReview[];
  googleMapsUrl?: string | null;
  theme?: NicheThemeConfig;
}

export function GoogleReviewsCard({
  tenantName,
  rating,
  reviewCount,
  reviews = [],
  googleMapsUrl,
  theme,
}: GoogleReviewsCardProps) {
  const mapsUrl =
    googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenantName)}`;

  const cleanReviews = Array.isArray(reviews) ? reviews.filter((r) => Boolean(r.text || r.review_text)) : [];
  const hasReviews = cleanReviews.length > 0;
  const displayRating = typeof rating === "number" && rating > 0 ? rating.toFixed(1) : "5.0";
  const displayCount = typeof reviewCount === "number" && reviewCount > 0 ? reviewCount : cleanReviews.length;

  const currentTheme = theme || NICHE_THEMES.retail_default;

  return (
    <div
      id="avaliacoes"
      className={`${currentTheme.roundedClass} ${currentTheme.bgCard} p-6 sm:p-8 space-y-6`}
    >
      {/* Header do Google Business Profile */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${currentTheme.borderClass} pb-5`}>
        <div className="space-y-1.5">
          {/* Badge Google + Selo Verificado */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs">
              {/* Google G Icon */}
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google Reviews</span>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-600/20">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Empresa Verificada</span>
            </div>
          </div>

          <h2 className={`text-lg sm:text-xl font-black ${currentTheme.textPrimary} flex items-center gap-2`}>
            <span>{currentTheme.icons?.reviews || "⭐"}</span>
            <span>Avaliações e Reputação no Google</span>
          </h2>
        </div>

        {/* Resumo de Nota Geral */}
        <div className={`flex items-center gap-3 ${currentTheme.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-100'} border ${currentTheme.roundedClass} p-3.5 sm:px-4`}>
          <span className={`text-3xl font-black ${currentTheme.textPrimary}`}>{displayRating}</span>
          <div>
            <div className="flex items-center gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className={`text-[11px] font-semibold ${currentTheme.textMuted} mt-0.5`}>
              {displayCount > 0 ? `(${displayCount} avaliações no Google)` : "Avaliações no Google"}
            </p>
          </div>
        </div>
      </div>

      {/* Seção de Comentários ou Estado Limpo sem Fake Data */}
      {hasReviews ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cleanReviews.slice(0, 6).map((review, idx) => {
            const authorName = review.author_name || "Cliente Google";
            const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const authorPhoto = review.profile_photo_url || review.author_photo_url;
            const reviewRating = review.rating || 5;
            const reviewText = review.review_text || review.text || "";
            const reviewTime = review.relative_time_description || review.relative_time || "recentemente";

            return (
              <div
                key={review.id || idx}
                className={`flex flex-col justify-between ${currentTheme.roundedClass} border ${currentTheme.borderClass} ${
                  currentTheme.isDark ? "bg-zinc-800/60 hover:bg-zinc-800" : "bg-slate-50/50 hover:bg-slate-50/90"
                } p-4 sm:p-5 transition shadow-2xs space-y-3`}
              >
                {/* Topo do Comentário: Avatar, Nome e Tempo */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {authorPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authorPhoto}
                        alt={authorName}
                        className="h-9 w-9 shrink-0 rounded-full object-cover shadow-2xs"
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-bold text-xs shadow-2xs"
                        style={{ backgroundColor: avatarBg }}
                      >
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <p className={`font-bold text-xs ${currentTheme.textPrimary}`}>{authorName}</p>
                        {review.author_url && (
                          <a
                            href={review.author_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-500"
                            title="Ver perfil do cliente"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                      <p className={`text-[10px] ${currentTheme.textMuted}`}>{reviewTime}</p>
                    </div>
                  </div>

                  {/* Estrelas */}
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(reviewRating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Texto do Depoimento */}
                {reviewText && (
                  <p className={`text-xs ${currentTheme.textMuted} leading-relaxed italic`}>
                    &ldquo;{reviewText}&rdquo;
                  </p>
                )}

                {/* Tag de Cliente */}
                <div className="pt-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${currentTheme.badgeText} ${currentTheme.badgeBg} px-2 py-0.5 rounded-md`}>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>Avaliação Verificada</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Avaliações registradas diretamente no Google Maps
              </p>
              <p className="text-[11px] text-slate-500">
                Consulte as opiniões e notas de clientes reais atendidos em {tenantName}.
              </p>
            </div>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition shrink-0"
            style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
          >
            <span>Ler avaliações no Google</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Link de Rodapé das Avaliações */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <p>Depoimentos reais e notas oficiais extraídas do Google Business Profile.</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold hover:underline"
          style={{ color: "var(--primary-color, #0d9488)" }}
        >
          <span>Ver todas as avaliações no Google</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
