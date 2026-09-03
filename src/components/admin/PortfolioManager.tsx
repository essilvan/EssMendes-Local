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
  createBeforeAfterCard,
  downloadCard,
  type BeforeAfterCardResult,
} from "@/lib/canvas-composer";
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
  Share2,
  Download,
  Smartphone,
  MessageCircle,
} from "lucide-react";

export interface PortfolioManagerProps {
  initialItems: PortfolioItem[];
  businessName?: string;
  whatsapp?: string;
  slug?: string;
}

export function PortfolioManager({
  initialItems,
  businessName,
  whatsapp,
  slug,
}: PortfolioManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Modal de Divulgação Imediata & Card gerado
  const [shareModalData, setShareModalData] = useState<{
    card: BeforeAfterCardResult;
    title: string;
    isNewPublish: boolean;
  } | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

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

  const handleGenerateCard = async (
    bUrl: string,
    aUrl: string,
    itemTitle: string,
    isNewPublish: boolean = false
  ) => {
    setIsGeneratingCard(true);
    setShareStatus(null);
    try {
      const card = await createBeforeAfterCard({
        beforeUrl: bUrl,
        afterUrl: aUrl,
        businessName: businessName || "Nosso Estabelecimento",
        whatsapp: whatsapp || "",
        serviceTitle: itemTitle,
      });

      setShareModalData({
        card,
        title: itemTitle,
        isNewPublish,
      });
    } catch (err: any) {
      console.error("Erro ao gerar card de Antes e Depois:", err);
      setFeedback({
        type: "error",
        message:
          "Transformação salva com sucesso, mas o card social não pôde ser gerado (verifique as fotos).",
      });
    } finally {
      setIsGeneratingCard(false);
    }
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

    const title = formData.get("title")?.toString().trim() || "";
    const savedBefore = beforeUrl;
    const savedAfter = afterUrl;

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

        // Imediatamente gera o card e abre o Modal de Divulgação
        handleGenerateCard(savedBefore, savedAfter, title, true);
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
                    onClick={() =>
                      handleGenerateCard(
                        item.before_image_url,
                        item.after_image_url,
                        item.title,
                        false
                      )
                    }
                    disabled={isPending || isGeneratingCard}
                    className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition disabled:opacity-50"
                    title="Gerar card de Antes & Depois para redes sociais"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Divulgar</span>
                  </button>

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

      {/* Modal de Divulgação Imediata */}
      {shareModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {shareModalData.isNewPublish
                    ? "🎉 Trabalho Publicado com Sucesso!"
                    : "📸 Divulgar Antes & Depois"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Montagem de alta resolução (1080x1080) pronta para atrair novos clientes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModalData(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Preview Visual da Montagem */}
              <div className="relative aspect-square w-full max-h-[340px] bg-slate-950 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shareModalData.card.dataUrl}
                  alt={shareModalData.title}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Status de Compartilhamento / Download */}
              {shareStatus && (
                <div className="rounded-lg bg-teal-50 border border-teal-200 p-2.5 text-xs font-semibold text-teal-800 text-center">
                  {shareStatus}
                </div>
              )}

              {/* Ações de Compartilhamento */}
              <div className="space-y-2.5 pt-1">
                {/* Botão 1: Compartilhar no Celular / Apps */}
                <button
                  type="button"
                  onClick={async () => {
                    const showcaseUrl =
                      typeof window !== "undefined"
                        ? slug
                          ? `${window.location.origin}/${slug}`
                          : window.location.origin
                        : "";
                    const shareText = "Confira a transformação que realizamos!";

                    if (
                      typeof navigator !== "undefined" &&
                      navigator.canShare &&
                      navigator.canShare({ files: [shareModalData.card.file] })
                    ) {
                      try {
                        await navigator.share({
                          files: [shareModalData.card.file],
                          title: businessName || "Antes e Depois",
                          text: shareText,
                        });
                        setShareStatus("Compartilhado com sucesso!");
                      } catch (err: any) {
                        if (err.name !== "AbortError") {
                          console.error("Erro ao compartilhar nativamente:", err);
                        }
                      }
                    } else if (typeof navigator !== "undefined" && navigator.share) {
                      try {
                        await navigator.share({
                          title: businessName || "Antes e Depois",
                          text: `${shareText} Veja mais em nossa vitrine:`,
                          url: showcaseUrl,
                        });
                        setShareStatus("Link compartilhado com sucesso!");
                      } catch (err: any) {
                        if (err.name !== "AbortError") {
                          console.error("Erro ao compartilhar link:", err);
                        }
                      }
                    } else {
                      downloadCard(shareModalData.card.file, shareModalData.card.dataUrl);
                      setShareStatus(
                        "Imagem baixada! O compartilhamento direto é suportado pelo navegador do celular."
                      );
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800 transition cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>📱 Compartilhar no Celular / Apps</span>
                </button>

                {/* Botão 2: Baixar Imagem (Instagram Feed / Stories) */}
                <button
                  type="button"
                  onClick={() => {
                    downloadCard(shareModalData.card.file, shareModalData.card.dataUrl);
                    setShareStatus("Download da imagem em alta resolução concluído!");
                  }}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-600" />
                  <span>📸 Baixar Imagem (Instagram Feed / Stories)</span>
                </button>

                {/* Botão 3: Mandar no WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    const showcaseUrl =
                      typeof window !== "undefined"
                        ? slug
                          ? `${window.location.origin}/${slug}`
                          : window.location.origin
                        : "";
                    const waText = `Olá! Confira este trabalho incrível (${shareModalData.title}) realizado por *${businessName || "nossa equipe"}*! ✨\n\nVeja este e outros trabalhos em nossa vitrine oficial: ${showcaseUrl}`;
                    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
                    window.open(waUrl, "_blank");
                  }}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>💬 Mandar no WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShareModalData(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Geração de Imagem */}
      {isGeneratingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl border border-slate-200">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            <span className="text-sm font-semibold text-slate-800">
              Compondo card de alta resolução (1080x1080)...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
