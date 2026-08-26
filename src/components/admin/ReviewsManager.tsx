"use client";

import React, { useState, useTransition } from "react";
import {
  addTenantReviewAction,
  deleteTenantReviewAction,
} from "@/services/review.actions";
import { generateReviewResponse } from "@/services/ai-review.actions";
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
} from "lucide-react";

interface ReviewsManagerProps {
  initialReviews: TenantReview[];
  businessName?: string;
  businessCategory?: string;
  googleMapsUrl?: string | null;
}

export function ReviewsManager({
  initialReviews,
  businessName,
  businessCategory,
  googleMapsUrl,
}: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<TenantReview[]>(initialReviews);
  const [isAdding, setIsAdding] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [relativeTime, setRelativeTime] = useState("há 2 dias");

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

      {/* Header com Botões */}
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

      {/* Formulário de Adicionar Nova Avaliação */}
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
            <p>Utilize o importador automático do Google Maps em Perfil ou adicione uma avaliação manual para testar a resposta com IA.</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthorName("Cliente Exemplo");
                  setRating(5);
                  setText("Atendimento excelente, profissionais dedicados e pontualidade nota 10!");
                  setIsAdding(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-md border border-purple-200 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Preencher Avaliação de Teste</span>
              </button>
            </div>
          </div>
        ) : (
          reviews.map((rev) => {
            const hasAiResponse = !!aiResponses[rev.id];
            const isGeneratingThis = loadingReviewId === rev.id;
            const reviewText = rev.text || rev.review_text || "";

            return (
              <div
                key={rev.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3 transition hover:shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-xs">
                        {rev.author_name ? rev.author_name.charAt(0).toUpperCase() : "C"}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{rev.author_name}</p>
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
