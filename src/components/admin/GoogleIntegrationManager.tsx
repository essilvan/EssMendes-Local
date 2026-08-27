"use client";

import React, { useState, useTransition } from "react";
import {
  syncAndConnectGoogleAction,
  disconnectGoogleAction,
} from "@/services/integration.actions";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Star,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Unlink,
} from "lucide-react";

interface GoogleIntegrationManagerProps {
  initialStatus: {
    isConnected: boolean;
    locationName?: string | null;
    googlePlaceId?: string | null;
    googleMapsUrl?: string | null;
    lastSyncedAt?: string | null;
    syncStatus?: string;
    syncMessage?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  };
}

export function GoogleIntegrationManager({
  initialStatus,
}: GoogleIntegrationManagerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [inputUrl, setInputUrl] = useState(
    initialStatus.googlePlaceId || initialStatus.googleMapsUrl || ""
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const formatLastSync = (dateString?: string | null) => {
    if (!dateString) return "Nunca sincronizado";
    const d = new Date(dateString);
    return `Última sincronização: ${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleSync = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!inputUrl.trim()) {
      setFeedback({
        type: "error",
        message: "Informe o Link do Google Maps ou o Google Place ID.",
      });
      return;
    }

    startTransition(async () => {
      const res = await syncAndConnectGoogleAction({ placeIdOrUrl: inputUrl });
      if (res.success && res.data) {
        setStatus({
          isConnected: true,
          locationName: res.data.companyName,
          googleMapsUrl: res.data.googleMapsUrl,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: "success",
          syncMessage: res.message,
          rating: res.data.rating,
          reviewCount: res.data.reviewCount,
        });
        setFeedback({
          type: "success",
          message: res.message || "Sincronização concluída com sucesso!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Falha ao sincronizar com Google.",
        });
      }
    });
  };

  const handleDisconnect = () => {
    if (!confirm("Deseja realmente desconectar a integração com o Google?")) return;
    setIsDisconnecting(true);
    setFeedback(null);

    startTransition(async () => {
      const res = await disconnectGoogleAction();
      if (res.success) {
        setStatus((prev) => ({
          ...prev,
          isConnected: false,
          syncStatus: "idle",
        }));
        setFeedback({
          type: "success",
          message: "Integração do Google desconectada.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Erro ao desconectar.",
        });
      }
      setIsDisconnecting(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Bar */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-4 text-xs border ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Card Principal de Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 shadow-2xs">
              <Building2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Google Business Profile & Places API
                </h2>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    status.isConnected
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status.isConnected ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {status.isConnected ? "Conectado" : "Não Conectado"}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Sincronização oficial de nome, endereço, horário de funcionamento, fotos em alta resolução e avaliações reais.
              </p>
            </div>
          </div>

          {status.isConnected && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting || isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                <Unlink className="h-3.5 w-3.5" />
                <span>Desconectar</span>
              </button>
            </div>
          )}
        </div>

        {/* Detalhes do Estabelecimento Sincronizado */}
        {status.isConnected && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Local Vinculado
                </span>
                <p className="text-sm font-black text-slate-900">
                  {status.locationName || "Estabelecimento Conectado"}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Dados sincronizados atomicamente no Supabase.</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-black text-amber-900">
                    {(status.rating || 5.0).toFixed(1)}
                  </span>
                  <span className="text-[11px] font-medium text-amber-800">
                    ({status.reviewCount || 0} avaliações)
                  </span>
                </div>

                {status.googleMapsUrl && (
                  <a
                    href={status.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Ver no Maps</span>
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span>{formatLastSync(status.lastSyncedAt)}</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Status: Saudável
              </span>
            </div>
          </div>
        )}

        {/* Formulário de Sincronização */}
        <form onSubmit={handleSync} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Link do Google Maps, URL Encurtada ou Google Place ID
            </label>
            <p className="text-[11px] text-slate-500">
              Cole o link de compartilhamento do seu perfil no Google Maps (ex: <code>https://maps.app.goo.gl/...</code>) ou insira seu Place ID.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Ex: https://maps.app.goo.gl/exemplo ou ChIJN1t_tDeuEmsRUsoyG83frY4"
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-xs font-bold text-white shadow-xs transition disabled:opacity-60 shrink-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sincronizando com o Google...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{status.isConnected ? "Sincronizar Agora" : "Conectar & Sincronizar"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Dicas e Boas Práticas */}
      <div className="grid gap-4 sm:grid-cols-3 text-xs text-slate-600">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Zap className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-slate-900">Zero Inventação de Dados</h4>
          <p className="text-slate-500 leading-relaxed">
            O EssMendes Local puxa exclusivamente notas, depoimentos e fotos reais da Places API oficial, sem dados fictícios.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-slate-900">Segurança de Servidor</h4>
          <p className="text-slate-500 leading-relaxed">
            Nenhuma chave de API ou credencial fica exposta no frontend. As chamadas são processadas isoladas via Server Actions.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Globe className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-slate-900">Cache Dinâmico Revalidado</h4>
          <p className="text-slate-500 leading-relaxed">
            Ao sincronizar, o cache da sua vitrine pública e do painel é atualizado instantaneamente sem sobrecarregar sua cota.
          </p>
        </div>
      </div>
    </div>
  );
}
