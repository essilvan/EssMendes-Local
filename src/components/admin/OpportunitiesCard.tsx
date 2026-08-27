"use client";

import React from "react";
import type { TenantOpportunity } from "@/types";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
} from "lucide-react";
import Link from "next/link";

interface OpportunitiesCardProps {
  opportunities: TenantOpportunity[];
}

export function OpportunitiesCard({ opportunities }: OpportunitiesCardProps) {
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "high":
        return {
          label: "🔴 Alta Prioridade",
          className: "bg-red-50 text-red-800 border-red-200",
        };
      case "medium":
        return {
          label: "🟡 Média Prioridade",
          className: "bg-amber-50 text-amber-800 border-amber-200",
        };
      default:
        return {
          label: "🟢 Baixa Prioridade",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return "Impacto Alto no Google";
      case "medium":
        return "Impacto Médio";
      default:
        return "Impacto Gradual";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Compass className="h-4 w-4 text-teal-700" />
            <span>Oportunidades de Crescimento ({opportunities.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Ações recomendadas pela IA do EssMendes Local para destravar novos clientes.
          </p>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6 text-center text-xs text-emerald-800 space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
          <p className="font-bold text-sm">Parabéns! Nenhuma oportunidade pendente no momento.</p>
          <p className="text-emerald-700">Seu estabelecimento está com todas as melhores práticas de SEO e conversão ativas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const priorityBadge = getPriorityBadge(opp.priority);

            return (
              <div
                key={opp.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs hover:bg-slate-50 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${priorityBadge.className}`}
                    >
                      {priorityBadge.label}
                    </span>

                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {getImpactBadge(opp.impact)}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{opp.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {opp.description}
                  </p>
                </div>

                <div className="pt-2 sm:pt-0 shrink-0">
                  <Link
                    href={opp.action_url}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition"
                  >
                    <span>{opp.action_label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
