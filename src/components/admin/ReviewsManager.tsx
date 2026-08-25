"use client";

import React, { useState, useTransition } from "react";
import {
  addTenantReviewAction,
  deleteTenantReviewAction,
  type ReviewActionState,
} from "@/services/review.actions";
import type { TenantReview } from "@/types";
import {
  Star,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface ReviewsManagerProps {
  initialReviews: TenantReview[];
}

export function ReviewsManager({ initialReviews }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<TenantReview[]>(initialReviews);
  const [isAdding, setIsAdding] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [relativeTime, setRelativeTime] = useState("há 2 dias");

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

      {/* Header com Botão de Adicionar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Gerencie os depoimentos e notas exibidos no card oficial do Google Business Profile.
        </p>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isAdding ? "Cancelar" : "Nova Avaliação Manual"}</span>
        </button>
      </div>

      {/* Formulário de Adicionar Nova Avaliação */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="h-4 w-4 text-teal-700" />
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
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nota em Estrelas (1 a 5) *
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                <option value={5}>★★★★★ (5 Estrelas - Excelente)</option>
                <option value={4}>★★★★☆ (4 Estrelas - Muito Bom)</option>
                <option value={3}>★★★☆☆ (3 Estrelas - Bom)</option>
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
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-900 disabled:opacity-60 transition"
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
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500 space-y-2">
            <Star className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">Nenhuma avaliação cadastrada ainda.</p>
            <p>Utilize o importador automático do Google Maps em Perfil ou adicione avaliações manualmente.</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-xs">
                      {rev.author_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">{rev.author_name}</p>
                      <p className="text-[10px] text-slate-400">{rev.relative_time || "recentemente"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic leading-relaxed">
                  &ldquo;{rev.text}&rdquo;
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
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
          ))
        )}
      </div>
    </div>
  );
}
