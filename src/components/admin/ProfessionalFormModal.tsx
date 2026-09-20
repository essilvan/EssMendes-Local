"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  User,
  Phone,
  Briefcase,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  createProfessionalAction,
  updateProfessionalAction,
} from "@/services/professional.actions";
import type { TenantProfessional } from "@/types";

interface ProfessionalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalToEdit?: TenantProfessional | null;
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
  onSuccess,
}: ProfessionalFormModalProps) {
  const isEditing = Boolean(professionalToEdit);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
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
        setIsActive(professionalToEdit.is_active ?? true);
      } else {
        setName("");
        setPhone("");
        setRoleTitle("");
        setAvatarUrl("");
        setIsActive(true);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
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

          {/* Foto / Avatar URL */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Foto / Avatar (URL)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="url"
                placeholder="https://exemplo.com/fotos/carlos.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
            {avatarUrl && (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2">
                <img
                  src={avatarUrl}
                  alt="Prévia do avatar"
                  className="h-10 w-10 rounded-full object-cover border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="text-[11px] text-slate-500">
                  Prévia da foto de perfil
                </span>
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
              disabled={isPending}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition cursor-pointer disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando...</span>
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
