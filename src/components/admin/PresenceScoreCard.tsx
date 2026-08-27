"use client";

import React, { useState } from "react";
import type { LocalScoreResult } from "@/types";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface PresenceScoreCardProps {
  scoreData: LocalScoreResult;
}

export function PresenceScoreCard({ scoreData }: PresenceScoreCardProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { totalScore, statusLevel, categories } = scoreData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-teal-800 bg-teal-50 border-teal-200";
    if (score >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-teal-600";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getBadgeText = (level: string) => {
    switch (level) {
      case "excelente":
        return "Presença Digital Excelente";
      case "forte":
        return "Presença Digital Forte";
      case "moderada":
        return "Presença Moderada (Oportunidade de Crescimento)";
      default:
        return "Presença Crítica (Ação Imediata Necessária)";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Top Header com Pontuação Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200/60">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              EssMendes Local Score
            </span>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${getScoreColor(totalScore)}`}>
              {getBadgeText(statusLevel)}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Pontuação de Presença Digital Local
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Diagnóstico algorítmico contínuo dividido em 5 pilares estratégicos para máxima conversão no Google e retenção de clientes.
          </p>
        </div>

        {/* Círculo / Box da Pontuação Geral */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50/90 border border-slate-200/80 px-4 py-3 rounded-2xl">
          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Score Total
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">{totalScore}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-teal-800 text-white shadow-xs">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Barra de Progresso Geral */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Progresso Geral de Presença</span>
          <span className="font-bold text-slate-900">{totalScore}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getProgressColor(totalScore)}`}
            style={{ width: `${totalScore}%` }}
          />
        </div>
      </div>

      {/* Grade com as 5 Categorias Modulares */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.category;
          const percentage = Math.round((cat.score / cat.maxScore) * 100);

          return (
            <div
              key={cat.category}
              className={`flex flex-col justify-between rounded-xl border p-3.5 text-xs transition ${
                isExpanded
                  ? "border-teal-500 bg-teal-50/20 shadow-xs"
                  : "border-slate-200/90 bg-white hover:border-slate-300"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 leading-tight">
                    {cat.title}
                  </span>
                  <span className="text-[11px] font-black text-teal-800">
                    {cat.score}/{cat.maxScore}
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-teal-800 pt-1"
              >
                <span>{cat.items.filter((i) => i.completed).length} de {cat.items.length} itens</span>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Detalhes da Categoria Expandida */}
      {expandedCategory && (
        <div className="rounded-xl border border-teal-100 bg-slate-50/80 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Detalhamento: {categories.find((c) => c.category === expandedCategory)?.title}
            </h4>
            <button
              type="button"
              onClick={() => setExpandedCategory(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Fechar
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {categories
              .find((c) => c.category === expandedCategory)
              ?.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-white p-3 text-xs"
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({item.pointsEarned}/{item.maxPoints} pts)
                      </span>
                    </div>
                    {item.recommendation && (
                      <p className="text-[11px] text-amber-700">
                        {item.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
