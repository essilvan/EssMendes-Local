"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  ImageIcon,
  Upload,
  Link as LinkIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  uploadTenantCoverAction,
  updateTenantCoverUrlAction,
  removeTenantCoverAction,
} from "@/services/tenant-cover.actions";

interface CoverImageUploaderProps {
  tenantId?: string;
  initialCoverUrl?: string | null;
  onCoverChange?: (newUrl: string) => void;
}

export function CoverImageUploader({
  tenantId,
  initialCoverUrl = "",
  onCoverChange,
}: CoverImageUploaderProps) {
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string>(initialCoverUrl || "");
  const [urlInput, setUrlInput] = useState<string>("");
  const [isUploading, startUploadTransition] = useTransition();
  const [isApplyingUrl, startApplyTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Upload direto de arquivo do computador
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFeedback({
        type: "error",
        message: "Formato inválido. Por favor, envie uma foto em JPG, PNG ou WebP.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: "O arquivo excede o tamanho máximo permitido de 5MB.",
      });
      return;
    }

    setFeedback(null);

    const formData = new FormData();
    formData.append("file", file);
    if (tenantId) {
      formData.append("tenantId", tenantId);
    }

    startUploadTransition(async () => {
      const res = await uploadTenantCoverAction(formData);
      if (res.success && res.coverUrl) {
        setCurrentCoverUrl(res.coverUrl);
        setUrlInput("");
        if (onCoverChange) onCoverChange(res.coverUrl);
        setFeedback({
          type: "success",
          message: "Foto de capa enviada com sucesso para o Supabase Storage e aplicada à vitrine!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Erro ao realizar upload da foto de capa.",
        });
      }

      // Limpa o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  // 2. Aplicar link / URL manual
  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setFeedback({
        type: "error",
        message: "Cole uma URL de imagem válida (iniciando com http:// ou https://).",
      });
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setFeedback({
        type: "error",
        message: "O link informado deve começar com http:// ou https://",
      });
      return;
    }

    setFeedback(null);

    startApplyTransition(async () => {
      const res = await updateTenantCoverUrlAction({
        tenantId,
        coverUrl: trimmed,
      });

      if (res.success && res.coverUrl) {
        setCurrentCoverUrl(res.coverUrl);
        setUrlInput("");
        if (onCoverChange) onCoverChange(res.coverUrl);
        setFeedback({
          type: "success",
          message: "URL da foto de capa atualizada e salva com sucesso!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Erro ao atualizar a foto de capa por URL.",
        });
      }
    });
  };

  // 3. Remover foto de capa
  const handleRemoveCover = () => {
    if (!confirm("Deseja realmente remover a foto de capa customizada? A vitrine voltará a usar as fotos do Google ou o padrão do tema.")) {
      return;
    }

    setFeedback(null);

    startApplyTransition(async () => {
      const res = await removeTenantCoverAction(tenantId);
      if (res.success) {
        setCurrentCoverUrl("");
        setUrlInput("");
        if (onCoverChange) onCoverChange("");
        setFeedback({
          type: "success",
          message: "Foto de capa removida. A vitrine exibirá a imagem padrão do estabelecimento.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Erro ao remover a foto de capa.",
        });
      }
    });
  };

  const isWorking = isUploading || isApplyingUrl;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      {/* Cabeçalho do Bloco */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-600/20">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                🖼️ Foto de Capa da Vitrine (Hero)
              </h3>
              <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-teal-800">
                Destaque
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Esta foto é exibida no topo da sua vitrine pública (Hero), transmitindo autoridade e a atmosfera do seu negócio.
            </p>
          </div>
        </div>

        {currentCoverUrl && (
          <button
            type="button"
            onClick={handleRemoveCover}
            disabled={isWorking}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remover Foto</span>
          </button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-3.5 text-xs animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Visual Preview */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Pré-visualização da Capa
        </label>

        <div className="relative aspect-video sm:aspect-21/9 w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-950 shadow-inner group">
          {currentCoverUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentCoverUrl}
                alt="Foto de Capa Atual"
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent pointer-events-none" />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/80 px-3 py-1 text-[11px] font-medium backdrop-blur-md border border-white/20">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>Foto Personalizada Ativa</span>
                </div>

                <a
                  href={currentCoverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md transition"
                >
                  Ver Original ↗
                </a>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-500 mb-3 border border-slate-800">
                <ImageIcon className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-300">Nenhuma foto de capa customizada enviada</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                A vitrine está utilizando o fundo padrão do tema ou as fotos importadas do Google Places.
              </p>
            </div>
          )}

          {isWorking && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
              <Loader2 className="h-7 w-7 animate-spin text-teal-400" />
              <span className="text-xs font-semibold">
                {isUploading ? "Enviando foto para o Supabase Storage..." : "Salvando URL da capa..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controles de Entrada: Upload Local ou Input de URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Opção A: Upload de Arquivo do Computador */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-900">Upload do Computador</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Envie uma foto em alta resolução do seu computador direto para o armazenamento do Supabase.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isWorking}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>📁 Escolher Foto do Computador</span>
              </>
            )}
          </button>
          <div className="text-[10px] text-slate-400 text-center">
            Formatos: JPG, PNG ou WebP • Tamanho máx: 5MB
          </div>
        </div>

        {/* Opção B: URL Direta da Imagem */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-900">Inserir Link Direto de Imagem</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Se a foto já estiver hospedada online (Unsplash, CDN ou Google), cole a URL pública abaixo.
          </p>

          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              disabled={isWorking}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              disabled={isWorking || !urlInput.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isApplyingUrl ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>Aplicar URL</span>
              )}
            </button>
          </div>
          <div className="text-[10px] text-slate-400 text-center">
            Aceita links https:// de fotos em alta qualidade
          </div>
        </div>
      </div>
    </div>
  );
}

export { CoverImageUploader as CoverPhotoManager };
