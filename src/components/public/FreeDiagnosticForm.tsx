"use client";

import React, { useState, useTransition } from "react";
import { runFreeDiagnosticAction, type DiagnosticResult } from "@/services/lead-diagnostic.actions";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
  Star,
  Building2,
  MapPin,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export function FreeDiagnosticForm() {
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [result, setResult] = useState<DiagnosticResult["data"] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await runFreeDiagnosticAction({
        companyName,
        city,
        whatsapp,
      });

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setErrorMessage(res.error || "Ocorreu um erro ao processar a análise.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Formulário de Diagnóstico */}
      {!result ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg space-y-6"
        >
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-800 border border-teal-200">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Análise Gratuita em Tempo Real</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Descubra como sua empresa aparece no Google
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Informe os dados do seu negócio para checarmos seu posicionamento local, avaliações e oportunidades imediatas.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Auto Mecânica Silva ou Studio Bella"
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cidade / Bairro *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Taguatinga - DF"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  WhatsApp com DDD *
                </label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(61) 99999-9999"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-teal-800 hover:bg-teal-900 active:scale-98 py-3.5 text-sm font-bold text-white shadow-md transition disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Consultando Google Places API...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Analisar Gratuitamente</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Tela de Resultado do Diagnóstico */
        <div className="rounded-3xl border border-teal-200 bg-white p-6 sm:p-10 shadow-lg space-y-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Header do Resultado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-0.5 rounded-full mb-1">
                Resultado Concluído
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {result.companyName}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{result.city}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl self-start sm:self-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Score Atual
                </span>
                <p className="text-3xl font-black text-teal-900">
                  {result.score}<span className="text-xs text-slate-400">/100</span>
                </p>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-teal-800 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Status Google Places */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>Status no Google Meu Negócio:</span>
              </span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  result.googleFound
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {result.googleFound ? "Encontrado no Google" : "Presença Frágil / Não Listado"}
              </span>
            </div>

            {result.googleFound && result.googleRating && (
              <p className="text-slate-600 flex items-center gap-1 pt-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>
                  Nota <strong>{result.googleRating.toFixed(1)}</strong> com{" "}
                  <strong>{result.googleReviewsCount || 0} avaliações</strong>.
                </span>
              </p>
            )}
          </div>

          {/* Problemas Encontrados */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>{result.issuesCount} Gargalos que Reduzem Seus Clientes:</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {result.issues.map((issue, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-3"
                >
                  <span className="text-red-600 font-bold">✕</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Oportunidades Identificadas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-teal-700" />
              <span>{result.opportunitiesCount} Ações para Destravar Novos Atendimentos:</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {result.opportunities.map((opp, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl border border-teal-100 bg-teal-50/40 p-3"
                >
                  <span className="text-teal-700 font-bold">➔</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA de Fechamento */}
          <div className="rounded-2xl border border-teal-300 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 p-6 sm:p-8 text-white space-y-4 shadow-md">
            <div className="space-y-1">
              <h4 className="text-lg font-black tracking-tight">
                Quer automatizar suas avaliações, posts e ter uma vitrine completa?
              </h4>
              <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                Transforme esses gargalos em clientes diários no seu WhatsApp com o <strong>EssMendes Local</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-white px-6 py-3 text-xs font-black text-teal-950 hover:bg-teal-50 shadow-sm transition"
              >
                <span>Criar Minha Vitrine Grátis Agora</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-xs text-teal-200 hover:text-white underline py-2 sm:py-0"
              >
                Fazer outra análise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
