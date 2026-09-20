"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  Plus,
  Phone,
  Briefcase,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { ProfessionalFormModal } from "./ProfessionalFormModal";
import {
  toggleProfessionalStatusAction,
  deleteProfessionalAction,
} from "@/services/professional.actions";
import type { TenantProfessional } from "@/types";

interface ProfessionalsClientProps {
  initialProfessionals: TenantProfessional[];
}

function formatDisplayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function ProfessionalsClient({
  initialProfessionals,
}: ProfessionalsClientProps) {
  const [professionals, setProfessionals] = useState<TenantProfessional[]>(
    initialProfessionals
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] =
    useState<TenantProfessional | null>(null);

  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync state if initialProfessionals changes via SSR
  React.useEffect(() => {
    setProfessionals(initialProfessionals);
  }, [initialProfessionals]);

  const handleOpenCreate = () => {
    setSelectedProfessional(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prof: TenantProfessional) => {
    setSelectedProfessional(prof);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (prof: TenantProfessional) => {
    setActionError(null);
    setTogglingId(prof.id);
    const newStatus = !prof.is_active;

    startTransition(async () => {
      const res = await toggleProfessionalStatusAction(prof.id, newStatus);
      setTogglingId(null);
      if (res.success) {
        setProfessionals((prev) =>
          prev.map((p) =>
            p.id === prof.id ? { ...p, is_active: newStatus } : p
          )
        );
      } else {
        setActionError(res.error || "Falha ao alterar status.");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (
      !window.confirm(
        `Tem certeza que deseja remover o profissional "${name}"? Os agendamentos anteriores serão mantidos no histórico.`
      )
    ) {
      return;
    }

    setActionError(null);
    setDeletingId(id);

    startTransition(async () => {
      const res = await deleteProfessionalAction(id);
      setDeletingId(null);
      if (res.success) {
        setProfessionals((prev) => prev.filter((p) => p.id !== id));
      } else {
        setActionError(res.error || "Falha ao excluir profissional.");
      }
    });
  };

  const filteredProfessionals = professionals.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.role_title && p.role_title.toLowerCase().includes(q)) ||
      (p.specialty && p.specialty.toLowerCase().includes(q)) ||
      p.phone.includes(q)
    );
  });

  const activeCount = professionals.filter((p) => p.is_active).length;
  const inactiveCount = professionals.length - activeCount;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total na Equipe
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {professionals.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Ativos no Agendamento
          </p>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {activeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Inativos / Pausados
          </p>
          <p className="text-2xl font-black text-slate-700 mt-1">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Control Bar: Search & New Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 active:scale-[0.98] transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>+ Cadastrar Profissional</span>
        </button>
      </div>

      {/* List / Grid of Professionals */}
      {filteredProfessionals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">
              {searchQuery
                ? "Nenhum profissional encontrado para a busca."
                : "Nenhum profissional cadastrado ainda."}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? "Tente buscar por outro termo ou limpe o campo de pesquisa."
                : "Cadastre sua equipe com o número de WhatsApp individual para rotear os agendamentos diretamente para cada atendente."}
            </p>
          </div>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Primeiro Profissional</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfessionals.map((prof) => {
            const role = prof.role_title || prof.specialty || "Profissional";
            const cleanPhone = prof.phone.replace(/\D/g, "");
            const waPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

            return (
              <div
                key={prof.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Card */}
                <div className="flex items-start gap-3.5">
                  {prof.avatar_url ? (
                    <img
                      src={prof.avatar_url}
                      alt={prof.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-800 font-extrabold text-sm border border-teal-100 shrink-0">
                      {prof.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="truncate font-bold text-sm text-slate-900 leading-tight">
                        {prof.name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          prof.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {prof.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <p className="flex items-center gap-1 text-xs text-slate-500 font-medium truncate">
                      <Briefcase className="h-3 w-3 shrink-0 text-slate-400" />
                      <span>{role}</span>
                    </p>
                  </div>
                </div>

                {/* WhatsApp Link Bar */}
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-semibold">
                      {formatDisplayPhone(prof.phone)}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Conversar no WhatsApp"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Abrir Chat</span>
                  </a>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(prof)}
                    disabled={togglingId === prof.id}
                    className="text-slate-600 hover:text-slate-900 transition flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {togglingId === prof.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : prof.is_active ? (
                      <XCircle className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    <span>{prof.is_active ? "Pausar" : "Ativar"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prof)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3 text-slate-500" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(prof.id, prof.name)}
                      disabled={deletingId === prof.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === prof.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <ProfessionalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        professionalToEdit={selectedProfessional}
        onSuccess={() => {
          // Re-fetch or rely on revalidatePath
        }}
      />
    </div>
  );
}
