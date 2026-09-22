"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Calendar,
  Clock,
  User,
  X,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
} from "lucide-react";
import { updateAppointmentDetailsAction } from "@/services/appointment.actions";
import type { Appointment, TenantProfessional } from "@/types";

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  professionals: TenantProfessional[];
  onSaved?: (updated: Appointment) => void;
}

export function EditAppointmentModal({
  isOpen,
  onClose,
  appointment,
  professionals,
  onSaved,
}: EditAppointmentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [professionalId, setProfessionalId] = useState("");

  useEffect(() => {
    if (appointment) {
      setErrorMsg(null);
      // Extrair YYYY-MM-DD em UTC
      const startDt = new Date(appointment.start_time);
      const year = startDt.getUTCFullYear();
      const month = String(startDt.getUTCMonth() + 1).padStart(2, "0");
      const day = String(startDt.getUTCDate()).padStart(2, "0");
      setDate(`${year}-${month}-${day}`);

      // Extrair HH:mm em UTC
      const hours = String(startDt.getUTCHours()).padStart(2, "0");
      const minutes = String(startDt.getUTCMinutes()).padStart(2, "0");
      setTime(`${hours}:${minutes}`);

      setProfessionalId(appointment.professional_id || "");
    }
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!date) {
      setErrorMsg("Selecione uma data para o atendimento.");
      return;
    }

    if (!time) {
      setErrorMsg("Informe um horário válido (HH:MM).");
      return;
    }

    startTransition(async () => {
      const result = await updateAppointmentDetailsAction({
        appointmentId: appointment.id,
        date,
        time,
        professionalId: professionalId.trim() !== "" ? professionalId.trim() : null,
      });

      if (!result.success) {
        setErrorMsg(result.error || "Não foi possível atualizar o agendamento.");
        return;
      }

      if (result.data && onSaved) {
        onSaved(result.data);
      }
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-700" />
              Editar Agendamento
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Altere a data, o horário ou o profissional responsável por este atendimento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Atendimento */}
        <div className="px-6 py-3 bg-teal-50/50 border-b border-teal-100/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-teal-900">
            <User className="w-4 h-4 text-teal-700" />
            <span>{appointment.customer_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
              {appointment.service_name}
            </span>
            <span className="text-teal-700 font-medium">
              ({appointment.total_duration} min)
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Data e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Data do Atendimento *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Horário de Início *
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Profissional Responsável */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Profissional Responsável
            </label>
            <div className="relative">
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                disabled={isPending}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 bg-white"
              >
                <option value="">Primeiro disponível (sem profissional específico)</option>
                {professionals.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} {prof.role_title ? `(${prof.role_title})` : ""}
                    {!prof.is_active ? " [Inativo]" : ""}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O cliente pode ter agendado sem preferência ou para um atendente específico.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAppointmentModal;
