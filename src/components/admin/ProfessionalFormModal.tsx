"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  X,
  User,
  Phone,
  Briefcase,
  Image as ImageIcon,
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  createProfessionalAction,
  updateProfessionalAction,
  uploadProfessionalAvatarAction,
} from "@/services/professional.actions";
import { createClient } from "@/lib/supabase/client";
import type { TenantProfessional } from "@/types";

interface ProfessionalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalToEdit?: TenantProfessional | null;
  tenantId?: string;
  onSuccess?: () => void;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function ProfessionalFormModal({
  isOpen,
  onClose,
  professionalToEdit,
  tenantId,
  onSuccess,
}: ProfessionalFormModalProps) {
  const isEditing = Boolean(professionalToEdit);
  const [isPending, startTransition] = useTransition();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-fill fields on edit or reset on create
  useEffect(() => {
    if (isOpen) {
      if (professionalToEdit) {
        setName(professionalToEdit.name || "");
        setPhone(formatPhone(professionalToEdit.phone || ""));
        setRoleTitle(
          professionalToEdit.role_title ||
            professionalToEdit.specialty ||
            ""
        );
        setAvatarUrl(professionalToEdit.avatar_url || "");
        setPreviewUrl(professionalToEdit.avatar_url || null);
        setIsActive(professionalToEdit.is_active ?? true);
        setShowUrlInput(
          Boolean(
            professionalToEdit.avatar_url &&
              !professionalToEdit.avatar_url.includes("tenant-media")
          )
        );
      } else {
        setName("");
        setPhone("");
        setRoleTitle("");
        setAvatarUrl("");
        setPreviewUrl(null);
        setIsActive(true);
        setShowUrlInput(false);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsUploadingImage(false);
    }
  }, [isOpen, professionalToEdit]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 2. Upload de Foto/Avatar usando bucket 'tenant-media' na pasta 'professionals/'
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset para permitir re-selecionar o mesmo arquivo
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Selecione um arquivo de imagem válido (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("A imagem deve ter no máximo 5MB.");
      return;
    }

    setErrorMsg(null);
    setIsUploadingImage(true);

    // Preview imediato
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const targetTenantId = tenantId || professionalToEdit?.tenant_id || "tenant";
      const filePath = `professionals/${targetTenantId}-${Date.now()}.${fileExt}`;

      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("tenant-media")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) {
        console.warn("[upload] Falha no client storage upload, tentando Server Action:", error.message);
        // Fallback seguro via Server Action protegida com Service Role
        const formData = new FormData();
        formData.append("file", file);
        const serverRes = await uploadProfessionalAvatarAction(formData);

        if (serverRes.success && serverRes.url) {
          setAvatarUrl(serverRes.url);
          setPreviewUrl(serverRes.url);
        } else {
          throw new Error(serverRes.error || error.message);
        }
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("tenant-media")
          .getPublicUrl(filePath);

        const newAvatarUrl = publicUrlData.publicUrl;
        setAvatarUrl(newAvatarUrl);
        setPreviewUrl(newAvatarUrl);
      }
    } catch (err: any) {
      console.error("[handleImageFileChange] Erro:", err);
      setErrorMsg(`Erro ao enviar foto: ${err.message || "Tente novamente."}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("");
    setPreviewUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("O nome do profissional deve ter pelo menos 2 caracteres.");
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMsg("Informe um WhatsApp válido com DDD (mínimo 10 dígitos).");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        phone: cleanPhone,
        role_title: roleTitle.trim() || "Profissional",
        specialty: roleTitle.trim() || "Profissional",
        avatar_url: avatarUrl.trim() || null,
        is_active: isActive,
      };

      const res = isEditing && professionalToEdit
        ? await updateProfessionalAction(professionalToEdit.id, payload)
        : await createProfessionalAction(payload);

      if (res.success) {
        setSuccessMsg(
          isEditing
            ? "Profissional atualizado com sucesso!"
            : "Profissional cadastrado com sucesso!"
        );
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || "Ocorreu um erro ao salvar o profissional.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Editar Profissional" : "Novo Profissional"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Atualize as informações do profissional ou atendente."
                  : "Cadastre um membro da equipe com seu WhatsApp individual."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nome */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Nome do Profissional <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ex: Carlos Oliveira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              WhatsApp Individual com DDD <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                required
                placeholder="(11) 99999-8888"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              O agendamento do cliente será direcionado diretamente para este número.
            </p>
          </div>

          {/* Cargo / Especialidade */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Cargo / Especialidade
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: Barbeiro Master, Designer de Sobrancelhas, Tatuador"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Foto / Avatar do Profissional */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Foto / Avatar do Profissional
              </label>
              {isUploadingImage && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Enviando imagem...</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Circular da Foto */}
              <div className="relative group shrink-0">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-2 border-dashed border-slate-300 bg-white shadow-2xs flex items-center justify-center overflow-hidden transition group-hover:border-teal-600">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Prévia do avatar"
                      className="h-full w-full object-cover"
                      onError={() => {
                        setPreviewUrl(null);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <User className="h-10 w-10 text-slate-300 stroke-[1.5]" />
                      <span className="text-[10px] font-medium text-slate-400 mt-1">Sem foto</span>
                    </div>
                  )}

                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-slate-900/60 rounded-full flex flex-col items-center justify-center text-white backdrop-blur-2xs">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-300" />
                      <span className="text-[10px] font-bold mt-1">Enviando...</span>
                    </div>
                  )}
                </div>

                {previewUrl && !isUploadingImage && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="Remover foto"
                    className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                <p className="text-xs text-slate-600">
                  Capture uma foto com a câmera ou escolha da galeria/computador (JPG, PNG ou WebP até 5MB).
                </p>

                {/* Inputs ocultos acionados pelos botões */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                  {/* Botão 1: Tirar Foto */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploadingImage || isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4 text-teal-700" />
                    <span>📸 Tirar Foto</span>
                  </button>

                  {/* Botão 2: Escolher Arquivo */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage || isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4 text-teal-700" />
                    <span>📁 Escolher Arquivo</span>
                  </button>
                </div>

                {/* Alternador para URL direta */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] font-medium text-slate-500 hover:text-teal-700 transition underline cursor-pointer"
                  >
                    {showUrlInput ? "Ocultar link direto" : "Ou colar URL da imagem"}
                  </button>
                </div>
              </div>
            </div>

            {/* Input opcional de URL se o usuário desejar */}
            {showUrlInput && (
              <div className="pt-2 border-t border-slate-200/60">
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://exemplo.com/fotos/profissional.jpg"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setPreviewUrl(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Ativo / Inativo */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div>
              <p className="font-bold text-slate-800">Status Ativo</p>
              <p className="text-[11px] text-slate-500">
                Profissionais ativos aparecem para seleção no agendamento público.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending || isUploadingImage}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || isUploadingImage}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition cursor-pointer disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : isUploadingImage ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Enviando imagem...</span>
                </>
              ) : (
                <span>{isEditing ? "Salvar Alterações" : "Cadastrar Profissional"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
