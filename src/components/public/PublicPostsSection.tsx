"use client";

import React from "react";
import type { TenantPost } from "@/types";
import {
  Newspaper,
  Calendar,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Tag,
} from "lucide-react";
import { generateWhatsAppUrl } from "@/utils/phone";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface PublicPostsSectionProps {
  posts: TenantPost[];
  tenantName: string;
  phoneWhatsapp?: string | null;
  theme?: NicheThemeConfig;
  onOpenBooking: () => void;
}

export function PublicPostsSection({
  posts,
  tenantName,
  phoneWhatsapp,
  theme,
  onOpenBooking,
}: PublicPostsSectionProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;
  const activePosts = posts.filter((p) => p.is_active);

  if (!activePosts || activePosts.length === 0) {
    return null;
  }

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const handleCtaClick = (post: TenantPost) => {
    if (post.cta_type === "booking" || !post.cta_type) {
      onOpenBooking();
    } else if (post.cta_type === "whatsapp") {
      const waUrl = generateWhatsAppUrl(
        phoneWhatsapp || "",
        `Olá! Vi a publicação "${post.title}" no site e gostaria de saber mais.`
      );
      window.open(waUrl, "_blank");
    } else if (post.cta_type === "link" && post.cta_url) {
      window.open(post.cta_url, "_blank");
    }
  };

  return (
    <section id="novidades" className={`${currentTheme.roundedClass} ${currentTheme.bgCard} p-6 sm:p-8 space-y-6`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${currentTheme.borderClass} pb-4`}>
        <div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
          >
            <Newspaper className="h-3.5 w-3.5" />
            <span>Novidades & Destaques</span>
          </div>
          <h2 className={`mt-1 text-lg sm:text-xl font-black ${currentTheme.textPrimary}`}>
            Avisos, Ofertas & Atualizações
          </h2>
          <p className={`text-xs ${currentTheme.textMuted} mt-0.5`}>
            Acompanhe as novidades e comunicados oficiais de {tenantName}.
          </p>
        </div>
      </div>

      {/* Grid de Posts Reais */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activePosts.map((post) => (
          <div
            key={post.id}
            className={`group flex flex-col justify-between ${currentTheme.roundedClass} border ${currentTheme.borderClass} ${
              currentTheme.isDark ? 'bg-zinc-800/60 hover:bg-zinc-800' : 'bg-slate-50/50 hover:bg-white'
            } overflow-hidden hover:shadow-sm transition`}
          >
            {/* Foto do Post */}
            {post.image_url && (
              <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-xs backdrop-blur-md"
                    style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                  >
                    <Sparkles className="h-3 w-3" />
                    Destaque
                  </span>
                </div>
              </div>
            )}

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <span className={`text-[11px] font-semibold ${currentTheme.textMuted}`}>
                  {formatDate(post.published_at)}
                </span>
                <h3 className={`text-sm font-extrabold ${currentTheme.textPrimary} leading-snug transition`}>
                  {post.title}
                </h3>
                <p className={`text-xs ${currentTheme.textMuted} leading-relaxed line-clamp-3`}>
                  {post.content}
                </p>

                {/* Tags SEO do Post */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {post.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-0.5 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                      >
                        <Tag className="h-2.5 w-2.5 text-slate-400" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Ação do Post */}
              <div className="pt-3 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => handleCtaClick(post)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-black text-white shadow-2xs hover:opacity-95 active:scale-95 transition"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  {post.cta_type === "whatsapp" && <MessageCircle className="h-3.5 w-3.5" />}
                  {post.cta_type === "booking" && <Calendar className="h-3.5 w-3.5" />}
                  {post.cta_type === "link" && <ExternalLink className="h-3.5 w-3.5" />}
                  <span>{post.cta_label || "Agendar Horário"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
