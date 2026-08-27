"use client";

import React, { useState, useTransition } from "react";
import {
  addTenantReviewAction,
  deleteTenantReviewAction,
} from "@/services/review.actions";
import { generateReviewResponse } from "@/services/ai-review.actions";
import { syncGoogleReviews } from "@/services/google-reviews.actions";
import type { TenantReview } from "@/types";
import {
  Star,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Bot,
  RefreshCw,
  X,
  Building2,
} from "lucide-react";

interface ReviewsManagerProps {
  initialReviews: TenantReview[];
  businessName?: string;
  businessCategory?: string;
  googleMapsUrl?: string | null;
  googlePlaceId?: string | null;
  googleRating?: number | null;
  googleReviewsCount?: number | null;
}

export function ReviewsManager({
  initialReviews,
  businessName,
  businessCategory,
  googleMapsUrl,
  googlePlaceId,
  googleRating,
  googleReviewsCount,
}: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<TenantReview[]>(initialReviews);
  const [isAdding, setIsAdding] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [relativeTime, setRelativeTime] = useState("há 2 dias");

  // Estado para Sincronização com Google Places (Link do Maps ou Place ID)
  const [inputUrlOrPlaceId, setInputUrlOrPlaceId] = useState(
    googleMapsUrl || googlePlaceId || ""
  );
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [liveRating, setLiveRating] = useState<number | null>(googleRating ?? null);
  const [liveReviewsCount, setLiveReviewsCount] = useState<number | null>(googleReviewsCount ?? null);

  // Estado para Resposta com IA em cada avaliação
  const [loadingReviewId, setLoadingReviewId] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sincronizar Avaliações Reais via Link do Google Maps ou Place ID
  const handleSyncGoogle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrlOrPlaceId.trim()) {
      setFeedback({
        type: "error",
        message: "Por favor, cole o link da sua empresa no Google Maps ou informe o Place ID.",
      });
      return;
    }

    setIsSyncingGoogle(true);
    setFeedback(null);

    try {
      const res = await syncGoogleReviews({ input: inputUrlOrPlaceId.trim() });
      if (res.success && res.data) {
        if (res.data.reviews && res.data.reviews.length > 0) {
          const mapped: TenantReview[] = res.data.reviews.map((r, idx) => ({
            id: String(Date.now() + idx),
            tenant_id: "",
            author_name: r.author_name,
            author_photo_url: r.profile_photo_url || null,
            profile_photo_url: r.profile_photo_url || null,
            author_url: r.author_url || null,
            rating: r.rating,
            text: r.text,
            review_text: r.text,
            relative_time: r.relative_time || "recentemente",
            relative_time_description: r.relative_time || "recentemente",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          setReviews(mapped);
        }
        setLiveRating(res.data.rating);
        setLiveReviewsCount(res.data.userRatingsTotal);
        setFeedback({
          type: "success",
          message: `✅ Sincronização concluída com sucesso! ${res.data.reviewsCount} avaliações reais e fotos importadas de "${res.data.placeName || 'Google Maps'}" (Nota ${res.data.rating.toFixed(1)} com ${res.data.userRatingsTotal} avaliações totais).`,
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Não foi possível sincronizar com o Google Places.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: "Erro de conexão ao sincronizar com Google Places API.",
      });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.set("authorName", authorName);
    formData.set("rating", String(rating));
    formData.set("text", text);
    formData.set("relativeTime", relativeTime);

    startTransition(async () => {
      const res = await addTenantReviewAction({}, formData);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: "Avaliação adicionada e visível na vitrine pública!",
        });
        setReviews([
          {
            id: String(Date.now()),
            tenant_id: "",
            author_name: authorName,
            rating,
            text,
            relative_time: relativeTime,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...reviews,
        ]);
        setAuthorName("");
        setText("");
        setIsAdding(false);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja realmente remover esta avaliação?")) return;
    setDeletingId(id);

    startTransition(async () => {
      const res = await deleteTenantReviewAction(id);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setReviews(reviews.filter((r) => r.id !== id));
        setFeedback({
          type: "success",
          message: "Avaliação removida com sucesso.",
        });
      }
      setDeletingId(null);
    });
  };

  // Gerar Resposta com IA para a avaliação
  const handleGenerateResponse = async (
    id: string,
    author: string,
    rate: number,
    reviewContent: string
  ) => {
    setLoadingReviewId(id);
    try {
      const result = await generateReviewResponse({
        authorName: author,
        rating: rate,
        reviewText: reviewContent,
        businessName,
        businessCategory,
      });

      if (result.success && result.data?.responseText) {
        setAiResponses((prev) => ({
          ...prev,
          [id]: result.data!.responseText,
        }));
      } else {
        setFeedback({
          type: "error",
          message: result.error || "Não foi possível gerar a resposta com IA.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: "Erro de conexão ao gerar resposta com IA.",
      });
    } finally {
      setLoadingReviewId(null);
    }
  };

  const handleCopyText = (reviewId: string, textToCopy: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedReviewId(reviewId);
      setTimeout(() => {
        setCopiedReviewId(null);
      }, 2500);
    }
  };

  const handleCloseAiResponse = (reviewId: string) => {
    setAiResponses((prev) => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
    });
  };

  const mapsLink = googleMapsUrl || (businessName ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}` : null);

  return (
    <div className="space-y-6">
      {/* Barra de Feedback */}
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

      {/* Sincronizador Oficial do Google Meu Negócio (Google Places API) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Sincronização Google Places API (Avaliações Reais)
              </h3>
              <p className="text-xs text-slate-500">
                Cole o link da sua ficha no Google Maps ou seu Place ID para importar notas oficiais, depoimentos reais e fotos.
              </p>
            </div>
          </div>

          {liveRating && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="text-xs font-black text-amber-900">{liveRating.toFixed(1)}</span>
              <span className="text-[11px] font-medium text-amber-800">
                ({liveReviewsCount ?? 0} avaliações)
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSyncGoogle} className="space-y-3">
          <div>
            <label
              htmlFor="googleInput"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Link do Google Maps ou Place ID
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <input
                  id="googleInput"
                  type="text"
                  value={inputUrlOrPlaceId}
                  onChange={(e) => setInputUrlOrPlaceId(e.target.value)}
                  placeholder="Cole o link da sua empresa no Google Maps (ex: https://maps.app.goo.gl/...)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSyncingGoogle}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-60 shrink-0"
              >
                {isSyncingGoogle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Resolvendo link e sincronizando avaliações...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>🔄 Sincronizar Avaliações pelo Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Suporta links curtos (<span className="font-mono text-slate-500">maps.app.goo.gl</span>), links completos do Maps ou identificador oficial (<span className="font-mono text-slate-500">ChIJ...</span>).
          </p>
        </form>
      </div>

      {/* Header com Botões de Ações Manuais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Gerencie depoimentos oficiais do Google e responda com IA para acelerar a reputação do seu negócio.
        </p>

        <div className="flex items-center gap-2">
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span>Ver no Google Maps</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isAdding ? "Cancelar" : "Nova Avaliação Manual"}</span>
          </button>
        </div>
      </div>

      {/* Formulário de Adicionar Nova Avaliação Manual */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Cadastrar Depoimento de Cliente
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nome do Cliente *
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Mariana Albuquerque"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nota em Estrelas (1 a 5) *
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
              >
                <option value={5}>★★★★★ (5 Estrelas - Excelente)</option>
                <option value={4}>★★★★☆ (4 Estrelas - Muito Bom)</option>
                <option value={3}>★★★☆☆ (3 Estrelas - Bom)</option>
                <option value={2}>★★☆☆☆ (2 Estrelas - Regular)</option>
                <option value={1}>★☆☆☆☆ (1 Estrela - Insatisfeito)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Texto do Comentário / Avaliação *
              </label>
              <textarea
                required
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: Atendimento impecável, equipe pontual e resultado maravilhoso!"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tempo Relativo
              </label>
              <input
                type="text"
                value={relativeTime}
                onChange={(e) => setRelativeTime(e.target.value)}
                placeholder="Ex: há 3 dias, há 1 semana"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-800 disabled:opacity-60 transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Avaliação</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Avaliações Cadastradas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500 space-y-3">
            <Star className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">Nenhuma avaliação cadastrada ainda.</p>
            <p>Utilize o sincronizador automático do Google Places acima com seu Place ID ou adicione avaliações manuais.</p>
          </div>
        ) : (
          reviews.map((rev) => {
            const hasAiResponse = !!aiResponses[rev.id];
            const isGeneratingThis = loadingReviewId === rev.id;
            const reviewText = rev.text || rev.review_text || "";
            const authorPhoto = rev.author_photo_url || rev.profile_photo_url;

            return (
              <div
                key={rev.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3 transition hover:shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {authorPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={authorPhoto}
                          alt={rev.author_name}
                          className="h-8 w-8 shrink-0 rounded-full object-cover shadow-2xs"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-xs">
                          {rev.author_name ? rev.author_name.charAt(0).toUpperCase() : "C"}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-xs text-slate-900">{rev.author_name}</p>
                          {rev.author_url && (
                            <a
                              href={rev.author_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-blue-600"
                              title="Ver autor no Google Maps"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {rev.relative_time || rev.relative_time_description || "recentemente"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Texto do Comentário do Cliente */}
                  <p className="text-xs text-slate-700 italic leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    &ldquo;{reviewText || "Sem comentário escrito."}&rdquo;
                  </p>

                  {/* Caixa de Texto com Resposta de IA Gerada */}
                  {hasAiResponse && (
                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 p-3.5 space-y-2 text-xs animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-purple-900 font-bold text-[11px]">
                          <Bot className="h-3.5 w-3.5 text-purple-600" />
                          <span>Sugestão de Resposta com IA:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCloseAiResponse(rev.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Fechar sugestão"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={aiResponses[rev.id]}
                        onChange={(e) =>
                          setAiResponses((prev) => ({
                            ...prev,
                            [rev.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-purple-200 bg-white p-2.5 text-xs text-slate-800 focus:border-purple-500 focus:outline-none leading-relaxed"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(rev.id, aiResponses[rev.id])
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-purple-700 active:scale-95 transition"
                        >
                          {copiedReviewId === rev.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-200" />
                              <span>Resposta Copiada!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>📋 Copiar Resposta</span>
                            </>
                          )}
                        </button>

                        {mapsLink && (
                          <a
                            href={mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>🔗 Abrir Perfil do Google</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card com o Botão de IA */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateResponse(rev.id, rev.author_name, rev.rating, reviewText)}
                    disabled={loadingReviewId === rev.id}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-md transition-all disabled:opacity-50"
                  >
                    {loadingReviewId === rev.id ? "⏳ Gerando resposta..." : "✨ Gerar Resposta com IA"}
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === rev.id}
                    onClick={() => handleDelete(rev.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
