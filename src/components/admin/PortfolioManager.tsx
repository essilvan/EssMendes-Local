"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPortfolioItemAction,
  updatePortfolioItemAction,
  togglePortfolioStatusAction,
  deletePortfolioItemAction,
} from "@/services/portfolio.actions";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { PortfolioItem } from "@/types";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ToggleLeft,
  ToggleRight,
  ArrowRightLeft,
  Eye,
} from "lucide-react";

interface PortfolioManagerProps {
  initialItems: PortfolioItem[];
}

export function PortfolioManager({ initialItems }: PortfolioManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Form image states
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [afterUrl, setAfterUrl] = useState<string>("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setBeforeUrl("");
    setAfterUrl("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setBeforeUrl(item.before_image_url);
    setAfterUrl(item.after_image_url);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setBeforeUrl("");
    setAfterUrl("");
    setModalError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError(null);
    const formData = new FormData(e.currentTarget);

    if (!beforeUrl || !afterUrl) {
      setModalError("Por favor, envie a foto do Antes e a foto do Depois.");
      return;
    }

    formData.set("beforeImageUrl", beforeUrl);
    formData.set("afterImageUrl", afterUrl);

    startTransition(async () => {
      let result;
      if (editingItem) {
        formData.append("id", editingItem.id);
        result = await updatePortfolioItemAction({}, formData);
      } else {
        result = await createPortfolioItemAction({}, formData);
      }

      if (result.error) {
        setModalError(result.error);
      } else {
        setFeedback({
          type: "success",
          message: result.message || "Salvo com sucesso!",
        });
        handleClose();
        router.refresh();
      }
    });
  };

  const handleToggle = (item: PortfolioItem) => {
    setPendingItemId(item.id);
    startTransition(async () => {
      const res = await togglePortfolioStatusAction(item.id, item.is_active);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, is_active: !i.is_active } : i
          )
        );
        router.refresh();
      }
      setPendingItemId(null);
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Deseja excluir a transformação "${title}"?`)) return;

    setPendingItemId(id);
    startTransition(async () => {
      const res = await deletePortfolioItemAction(id);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setFeedback({ type: "success", message: "Item excluído com sucesso." });
        router.refresh();
      }
      setPendingItemId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Transformações Antes & Depois ({items.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exiba a qualidade do seu trabalho com fotos comparativas na página pública.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-60 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Nova Transformação</span>
        </button>
      </div>

      {/* Global Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}
          <div className="flex-1">
            <p className="font-semibold">
              {feedback.type === "success" ? "Sucesso" : "Erro"}
            </p>
            <p className="mt-0.5 text-xs">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grid de Itens */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">
            Nenhuma transformação cadastrada ainda
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Mostre o resultado dos seus serviços com fotos de Antes & Depois para encantar novos clientes.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Meu Primeiro Antes & Depois</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const isItemPending = isPending && pendingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 bg-white shadow-sm transition ${
                  item.is_active
                    ? "border-slate-200 hover:border-slate-300"
                    : "border-slate-200 bg-slate-50/70 opacity-75"
                }`}
              >
                <div className="space-y-4">
                  {/* Status Toggle Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20"
                      }`}
                    >
                      {item.is_active ? "Visível na Página" : "Oculto"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      disabled={isPending}
                      className="text-slate-400 hover:text-slate-700 transition disabled:opacity-50"
                    >
                      {isItemPending ? (
                        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                      ) : item.is_active ? (
                        <ToggleRight className="h-6 w-6 text-teal-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Comparativo Visual Antes & Depois */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-1">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.before_image_url}
                        alt={`Antes: ${item.title}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                        Antes
                      </span>
                    </div>

                    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.after_image_url}
                        alt={`Depois: ${item.title}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 rounded bg-teal-800/90 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                        Depois
                      </span>
                    </div>
                  </div>

                  {/* Título & Descrição */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? "Editar Transformação" : "Nova Transformação (Antes & Depois)"}
                </h3>
                <p className="text-xs text-slate-500">
                  Envie as fotos e descreva o procedimento realizado.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="flex-1">{modalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Título */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Título da Transformação *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  disabled={isPending}
                  defaultValue={editingItem?.title || ""}
                  placeholder="Ex: Corte Degradê Navalhado com Barba Alinhada"
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100"
                />
              </div>

              {/* Uploads Antes & Depois */}
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUpload
                  label="Foto do ANTES *"
                  description="Foto antes do atendimento"
                  value={beforeUrl}
                  onChange={setBeforeUrl}
                  folder="portfolio_before"
                  aspectRatio="square"
                  disabled={isPending}
                />

                <ImageUpload
                  label="Foto do DEPOIS *"
                  description="Resultado final do serviço"
                  value={afterUrl}
                  onChange={setAfterUrl}
                  folder="portfolio_after"
                  aspectRatio="square"
                  disabled={isPending}
                />
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Descrição / Detalhes do Procedimento (Opcional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  disabled={isPending}
                  defaultValue={editingItem?.description || ""}
                  placeholder="Explique os produtos usados, técnica aplicada ou tempo gasto..."
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100"
                />
              </div>

              {/* Status Ativo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  disabled={isPending}
                  defaultChecked={editingItem ? editingItem.is_active : true}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <label
                  htmlFor="isActive"
                  className="text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Exibir esta transformação na página pública do estabelecimento
                </label>
              </div>

              {/* Ações do Modal */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-60 transition"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingItem ? "Atualizar" : "Salvar Transformação"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
