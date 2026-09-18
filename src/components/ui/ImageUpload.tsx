"use client";

import React, { useState, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UploadCloud,
  Image as ImageIcon,
  Camera,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

interface ImageUploadProps {
  name?: string;
  value?: string | null;
  onChange?: (url: string) => void;
  label?: string;
  description?: string;
  folder?: string;
  aspectRatio?: "square" | "video" | "banner" | "auto";
  disabled?: boolean;
  withCamera?: boolean;
}

export function ImageUpload({
  name,
  value = "",
  onChange,
  label,
  description,
  folder = "general",
  aspectRatio = "auto",
  disabled = false,
  withCamera = true,
}: ImageUploadProps) {
  const [currentUrl, setCurrentUrl] = useState<string>(value || "");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validação básica de tipo e tamanho (máx 5MB)
    if (!file.type.startsWith("image/")) {
      setErrorMsg("O arquivo selecionado deve ser uma imagem (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("A imagem deve ter no máximo 5MB.");
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const supabase = createClient();
      const cleanFileName = file.name.replace(/[^\w.-]/g, "_");
      const filePath = `uploads/${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from("tenant-media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.warn("[ImageUpload] Erro no bucket, tentando upload:", error.message);
        // Se o bucket não existir ainda, orientamos amigavelmente
        setErrorMsg(
          error.message.includes("not found") || error.message.includes("bucket")
            ? "Bucket de armazenamento em configuração. Você também pode colar o link direto abaixo."
            : `Erro ao enviar imagem: ${error.message}`
        );
        setShowUrlInput(true);
        return;
      }

      // Obtém a URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("tenant-media").getPublicUrl(filePath);

      setCurrentUrl(publicUrl);
      if (onChange) onChange(publicUrl);
    } catch (err: any) {
      console.error("[ImageUpload] Exceção:", err);
      setErrorMsg("Erro inesperado ao enviar arquivo.");
      setShowUrlInput(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setCurrentUrl("");
    if (onChange) onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleManualUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCurrentUrl(val);
    if (onChange) onChange(val);
  };

  return (
    <div className="space-y-2">
      {/* Hidden input for Form submission */}
      {name && <input type="hidden" name={name} value={currentUrl} />}

      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] font-medium text-teal-700 hover:underline inline-flex items-center gap-1"
          >
            <LinkIcon className="h-3 w-3" />
            <span>{showUrlInput ? "Ocultar link manual" : "Colar link direto"}</span>
          </button>
        </div>
      )}

      {description && (
        <p className="text-[11px] text-slate-500">{description}</p>
      )}

      {/* Erro */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preview se já houver imagem */}
      {currentUrl ? (
        <div className="relative group rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col sm:flex-row items-start sm:items-center gap-4 overflow-hidden shadow-2xs">
          <div
            className={`relative rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 ${
              aspectRatio === "square"
                ? "h-20 w-20"
                : aspectRatio === "banner"
                ? "h-20 w-36"
                : "h-20 w-28"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 w-full">
            <p className="text-xs font-bold text-slate-900 truncate">
              Imagem Carregada com Sucesso
            </p>
            <p className="text-[11px] text-slate-500 truncate max-w-xs font-mono">
              {currentUrl}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {withCamera && (
                <>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition"
                  >
                    <Camera className="h-3 w-3" />
                    <span>Tirar Nova Foto</span>
                  </button>
                  <span className="text-slate-300">•</span>
                </>
              )}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 px-2.5 py-1 rounded-lg transition"
              >
                <ImageIcon className="h-3 w-3" />
                <span>Trocar da Galeria</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="text-[11px] font-semibold text-red-600 hover:underline px-1 py-1"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone de Upload */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) galleryInputRef.current?.click();
          }}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
            isDragging
              ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20"
              : "border-slate-300 bg-slate-50/50 hover:border-teal-500 hover:bg-slate-50"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-3 text-teal-800">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
              <p className="text-xs font-bold">Enviando foto...</p>
              <p className="text-[11px] text-slate-500">
                Processando imagem no Supabase Storage
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-1 w-full max-w-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 shadow-2xs">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Tire uma foto ou escolha da galeria do seu celular
                </p>
                <p className="text-[11px] text-slate-500">
                  PNG, JPG ou WebP até 5MB
                </p>
              </div>

              {/* Botões de Ação Rápida: Câmera Nativa e Galeria */}
              <div
                className="flex flex-wrap items-center justify-center gap-2.5 pt-2 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {withCamera && (
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Tirar Foto com a Câmera</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 text-slate-500" />
                  <span>Escolher da Galeria</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Oculto para Câmera do Celular (com capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        id={name ? `${name}-camera` : "product-photo-camera"}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Input Oculto para Galeria / Arquivos */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        id={name ? `${name}-gallery` : "product-photo-gallery"}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Input de URL Manual Opcional */}
      {showUrlInput && (
        <div className="pt-1">
          <input
            type="url"
            value={currentUrl}
            onChange={handleManualUrlChange}
            placeholder="https://exemplo.com/imagem.png"
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
