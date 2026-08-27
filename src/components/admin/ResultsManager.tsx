"use client";

import React, { useState, useTransition } from "react";
import type { ExecutiveReportData } from "@/services/report.actions";
import { generateMonthlyExecutiveReportAction } from "@/services/report.actions";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Share2,
  Printer,
  Compass,
  ArrowUpRight,
  Eye,
  MessageCircle,
  CalendarCheck,
  Star,
} from "lucide-react";

interface ResultsManagerProps {
  initialReport: ExecutiveReportData;
}

export function ResultsManager({ initialReport }: ResultsManagerProps) {
  const [report, setReport] = useState<ExecutiveReportData>(initialReport);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await generateMonthlyExecutiveReportAction();
      if (res.success && res.data) {
        setReport(res.data);
      }
    });
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getTrendBadge = (trend: "up" | "down" | "neutral", pct: number) => {
    if (trend === "up") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
          ↑ +{pct}%
        </span>
      );
    }
    if (trend === "down") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800 border border-red-200">
          ↓ -{pct}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
        → Estável
      </span>
    );
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Top Action Bar (Escondido na impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-700" />
            <span>Métricas Consolidadas & Comparativo Mensal</span>
          </h2>
          <p className="text-xs text-slate-500">
            Período: {report.periodLabel} vs Período Anterior
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Imprimir / Salvar PDF</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Atualizando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Regenerar com IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cards Comparativos: Mês Atual vs Mês Anterior */}
      <div className="grid gap-4 sm:grid-cols-3">
        {report.comparisons.map((c, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {c.metric}
              </span>
              {getTrendBadge(c.trend, c.growthPercentage)}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                {c.currentMonth}
              </span>
              <span className="text-xs text-slate-400">
                vs {c.previousMonth} no ciclo anterior
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
              {getTrendIcon(c.trend)}
              <span>
                {c.trend === "up"
                  ? "Crescimento contínuo no período"
                  : c.trend === "down"
                  ? "Redução identificada nas buscas"
                  : "Desempenho consistente"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Relatório Mensal Executivo Gerado com IA */}
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-white via-teal-50/20 to-indigo-50/20 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Relatório Mensal de Presença Digital
              </h3>
              <p className="text-xs text-teal-800 font-medium">
                Síntese Executiva Gerada com Inteligência Artificial
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs self-start sm:self-auto">
            {report.companyName} • {report.periodLabel}
          </span>
        </div>

        {/* Resumo Textual */}
        <div className="rounded-xl border border-teal-100 bg-white p-5 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p className="font-bold text-xs uppercase tracking-wider text-teal-900">
            Resumo Executivo do Desempenho:
          </p>
          <p>{report.executiveSummary}</p>
        </div>

        {/* Grade de Conquistas e Recomendações */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Principais Conquistas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Pontos Fortes & Conquistas</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {report.strengths.map((s, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white p-3 shadow-2xs"
                >
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Oportunidades Prioritárias */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-teal-700" />
              <span>Prioridades Estratégicas Recomendadas</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {report.growthRecommendations.map((r, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white p-3 shadow-2xs"
                >
                  <span className="text-teal-700 font-bold">➔</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Palavras-chave e Termos de Pesquisa Local */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="h-4 w-4 text-teal-700" />
            <span>Como Seus Clientes Encontram Sua Empresa (Termos de Pesquisa)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Padrões de busca orgânica local identificados na sua região para direcionamento de produtos e posts.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {report.topSearchTerms.map((st, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">&ldquo;{st.term}&rdquo;</span>
                <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                  ~{st.estimatedSearches}/mês
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                💡 <span className="font-semibold">Oportunidade:</span> {st.opportunityRecommendation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
