"use client";

import React from "react";
import { User, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import type { TenantProfessional } from "@/types";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface PublicProfessionalsSectionProps {
  professionals: TenantProfessional[];
  tenantName: string;
  brandColor?: string;
  theme?: NicheThemeConfig;
  onSelectProfessional: (professionalId: string) => void;
}

export function PublicProfessionalsSection({
  professionals,
  tenantName,
  brandColor,
  theme,
  onSelectProfessional,
}: PublicProfessionalsSectionProps) {
  const activeProfessionals = (professionals || []).filter((p) => p.is_active !== false);

  if (activeProfessionals.length === 0) {
    return null;
  }

  const currentTheme = theme || NICHE_THEMES.retail_default;

  return (
    <section id="equipe" className="space-y-6 sm:space-y-8 scroll-mt-20">
      {/* Cabeçalho da Secção */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Nossa Equipe</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Especialistas & Profissionais
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Escolha o profissional de sua preferência para atendimento personalizado em {tenantName}.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
          {activeProfessionals.length} {activeProfessionals.length === 1 ? "profissional" : "profissionais"}
        </span>
      </div>

      {/* Grelha Responsiva de Profissionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {activeProfessionals.map((prof) => {
          const role = prof.role_title || prof.specialty || "Profissional";
          const initials = prof.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <div
              key={prof.id}
              className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Foto do profissional em círculo com anel elegante */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full p-1 ring-2 ring-neutral-200 dark:ring-neutral-700 group-hover:ring-emerald-500/60 transition-all duration-300 mb-3.5">
                <div className="rounded-full overflow-hidden w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {prof.avatar_url ? (
                    <img
                      src={prof.avatar_url}
                      alt={prof.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700 text-neutral-700 dark:text-neutral-200 font-extrabold text-lg sm:text-xl">
                      {initials || <User className="h-8 w-8 text-neutral-400" />}
                    </div>
                  )}
                </div>
              </div>

              {/* Nome e Especialidade */}
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 tracking-tight line-clamp-1">
                {prof.name}
              </h3>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                {role}
              </p>

              {/* Status de Disponibilidade */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span>Horários Disponíveis</span>
              </div>

              {/* Botão direto "Agendar com este profissional" */}
              <button
                type="button"
                onClick={() => onSelectProfessional(prof.id)}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: brandColor || "var(--brand-primary, #0d9488)",
                }}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Agendar com este profissional</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
