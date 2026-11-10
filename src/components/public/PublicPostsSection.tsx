"use client";

import React, { useState } from "react";
import type { TenantPost } from "@/types";
import {
  Newspaper,
  Calendar,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Tag,
  BookOpen,
  X,
} from "lucide-react";
import { generateWhatsAppUrl } from "@/utils/phone";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface PublicPostsSectionProps {
  posts: TenantPost[];
  tenantName: string;
  phoneWhatsapp?: string | null;
  theme?: NicheThemeConfig;
  brandColor?: string;
  onOpenBooking: () => void;
}

export function PublicPostsSection({
  posts,
  tenantName,
  phoneWhatsapp,
  theme,
  brandColor,
  onOpenBooking,
}: PublicPostsSectionProps) {
  const [selectedPost, setSelectedPost] = useState<TenantPost | null>(null);
  const currentTheme = theme || NICHE_THEMES.retail_default;

  const activePosts = (posts || []).filter(
    (p: any) =>
      p &&
      p.is_active !== false &&
      (p.status === undefined || p.status === null || p.status === "published")
  );

  if (!activePosts || activePosts.length === 0) {
    return null;
  }

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Recente";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recente";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const handleCtaClick = (post: TenantPost) => {
    if (post.cta_type === "whatsapp") {
      const waUrl = generateWhatsAppUrl(
        phoneWhatsapp || "",
        tenantName,
        `Olá! Vi a publicação "${post.title}" no site de ${tenantName} e gostaria de saber mais.`
      );
      window.open(waUrl, "_blank");
    } else if (post.cta_type === "link" && post.cta_url) {
      window.open(post.cta_url, "_blank");
    } else {
      onOpenBooking();
    }
  };

  const primaryBg = brandColor || "var(--brand-primary, #2563eb)";

  return (
    <section
      id="novidades"
      className={`${currentTheme.roundedClass} ${currentTheme.bgCard} p-6 sm:p-8 space-y-6 border ${currentTheme.borderClass}`}
    >
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${currentTheme.borderClass} pb-4`}
      >
        <div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
          >
            <Newspaper className="h-3.5 w-3.5" />
            <span>Blog & Conteúdo Especializado</span>
          </div>
          <h2
            className={`mt-2 text-xl sm:text-2xl font-extrabold tracking-tight ${currentTheme.textPrimary}`}
          >
            Dicas, Artigos & Novidades
          </h2>
          <p className={`text-xs sm:text-sm ${currentTheme.textMuted} mt-1`}>
            Confira orientações práticas, cuidados preventivos e novidades de{" "}
            {tenantName}.
          </p>
        </div>
      </div>

      {/* Grid Responsivo de Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePosts.slice(0, 6).map((post) => {
          const coverImage =
            post.image_url || (post as any).cover_image || null;
          const dateToDisplay =
            post.published_at || post.created_at || new Date().toISOString();

          return (
            <article
              key={post.id}
              className={`group flex flex-col justify-between rounded-2xl border ${currentTheme.borderClass} ${
                currentTheme.isDark
                  ? "bg-slate-900/80 hover:bg-slate-900 text-slate-100"
                  : "bg-white hover:bg-slate-50/80 text-slate-900"
              } overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Foto de Capa (cover_image / image_url) */}
              {coverImage && (
                <div
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-16/9 w-full bg-slate-800 overflow-hidden cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-md backdrop-blur-md"
                      style={{ backgroundColor: primaryBg }}
                    >
                      <Sparkles className="h-3 w-3" />
                      Artigo
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-medium opacity-75">
                    <span>{formatDate(dateToDisplay)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="inline-flex items-center gap-1 font-bold hover:underline cursor-pointer"
                    >
                      <BookOpen className="h-3 w-3" />
                      <span>Ler artigo</span>
                    </button>
                  </div>

                  <h3
                    onClick={() => setSelectedPost(post)}
                    className={`text-base sm:text-lg font-extrabold ${currentTheme.textPrimary} leading-snug cursor-pointer group-hover:opacity-90 transition`}
                  >
                    {post.title}
                  </h3>

                  <p
                    className={`text-xs sm:text-sm ${currentTheme.textMuted} leading-relaxed line-clamp-3`}
                  >
                    {post.content}
                  </p>

                  {/* Tags SEO do Post */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            currentTheme.isDark
                              ? "bg-slate-800 text-slate-300 border border-slate-700"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <Tag className="h-2.5 w-2.5 opacity-70" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão de Leitura / CTA */}
                <div
                  className={`pt-3 border-t ${currentTheme.borderClass} flex items-center gap-2`}
                >
                  <button
                    type="button"
                    onClick={() => handleCtaClick(post)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-extrabold text-white shadow-sm hover:opacity-95 active:scale-95 transition cursor-pointer"
                    style={{ backgroundColor: primaryBg }}
                  >
                    {post.cta_type === "whatsapp" && (
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {post.cta_type === "booking" && (
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {post.cta_type === "link" && (
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">
                      {post.cta_label || "Saiba mais"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal de Leitura Completa do Artigo */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {(selectedPost.image_url || (selectedPost as any).cover_image) && (
              <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    selectedPost.image_url || (selectedPost as any).cover_image
                  }
                  alt={selectedPost.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {formatDate(
                  selectedPost.published_at || selectedPost.created_at
                )}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">
                {selectedPost.title}
              </h3>
            </div>

            <div className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {selectedPost.content}
            </div>

            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedPost.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const post = selectedPost;
                  setSelectedPost(null);
                  handleCtaClick(post);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md hover:opacity-95 transition cursor-pointer"
                style={{ backgroundColor: primaryBg }}
              >
                <span>{selectedPost.cta_label || "Agendar Serviço"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
