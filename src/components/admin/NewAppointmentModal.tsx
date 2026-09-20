"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Plus,
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Users,
} from "lucide-react";
import { createAdminAppointmentAction } from "@/services/appointment.actions";
import type { TenantProfessional } from "@/types";

export interface ServiceOption {
  id: string;
  name: string;
  price?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean;
}

interface NewAppointmentModalProps {
  services: ServiceOption[];
  professionals?: TenantProfessional[];
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

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NewAppointmentModal({ services, professionals = [] }: NewAppointmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [customServiceName, setCustomServiceName] = useState("");
  const [price, setPrice] = useState<number | string>(0);
  const [durationMinutes, setDurationMinutes] = useState<number | string>(30);
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState("09:00");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [notes, setNotes] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset form
  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setSelectedProfessionalId("");
    const initialSvcId = services.length > 0 ? services[0].id : "custom";
    setSelectedServiceId(initialSvcId);
    if (services.length > 0) {
      setCustomServiceName("");
      setPrice(services[0].price ?? 0);
      setDurationMinutes(services[0].duration_minutes ?? 30);
    } else {
      setCustomServiceName("");
      setPrice(0);
      setDurationMinutes(30);
    }
    setDate(getTodayString());
    setTime("09:00");
    setStatus("confirmed");
    setNotes("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Pre-select first service if available on open
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle service selection change
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId === "custom" || serviceId === "") {
      setCustomServiceName("");
    } else {
      const found = services.find((s) => s.id === serviceId);
      if (found) {
        setCustomServiceName("");
        setPrice(found.price !== null && found.price !== undefined ? Number(found.price) : 0);
        setDurationMinutes(found.duration_minutes !== null && found.duration_minutes !== undefined ? Number(found.duration_minutes) : 30);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMsg("O nome do cliente deve ter pelo menos 2 caracteres.");
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMsg("Informe um telefone/WhatsApp válido com DDD (mínimo 10 dígitos).");
      return;
    }

    let finalServiceName = "";
    let finalServiceId: string | null = null;

    if (selectedServiceId && selectedServiceId !== "custom") {
      const found = services.find((s) => s.id === selectedServiceId);
      if (found) {
        finalServiceName = found.name;
        finalServiceId = found.id;
      }
    } else {
      finalServiceName = customServiceName.trim();
    }

    if (!finalServiceName) {
      setErrorMsg("Selecione um serviço ou digite o nome do serviço.");
      return;
    }

    if (!date) {
      setErrorMsg("Informe a data do agendamento.");
      return;
    }

    if (!time) {
      setErrorMsg("Informe o horário do agendamento.");
      return;
    }

    startTransition(async () => {
      const res = await createAdminAppointmentAction({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        serviceId: finalServiceId,
        serviceName: finalServiceName,
        professionalId: selectedProfessionalId ? selectedProfessionalId : undefined,
        price: Number(price) || 0,
        durationMinutes: Number(durationMinutes) || 30,
        date,
        time,
        status,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg("Agendamento criado com sucesso!");
        setTimeout(() => {
          setIsOpen(false);
          resetForm();
        }, 800);
      } else {
        setErrorMsg(res.error || "Falha ao criar o agendamento.");
      }
    });
  };

  return (
    <>
      {/* Botão Primário de Ação */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition cursor-pointer shrink-0"
      >
        <Plus className="h-4 w-4" />
        <span>+ Novo Agendamento</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Novo Agendamento Manual
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cadastre uma nova reserva diretamente no sistema
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isPending && setIsOpen(false)}
                disabled={isPending}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Alertas */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nome do Cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Cliente *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>

              {/* Seleção de Serviço */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Serviço *
                </label>
                <div className="relative">
                  <Scissors className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                  >
                    {services.length === 0 && (
                      <option value="custom">Outro / Serviço Personalizado</option>
                    )}
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name}
                        {svc.price !== null && svc.price !== undefined
                          ? ` — R$ ${Number(svc.price).toFixed(2)}`
                          : ""}
                        {svc.duration_minutes
                          ? ` (${svc.duration_minutes} min)`
                          : ""}
                      </option>
                    ))}
                    {services.length > 0 && (
                      <option value="custom">➕ Outro serviço (personalizado)...</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Se serviço personalizado for selecionado */}
              {selectedServiceId === "custom" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Serviço Personalizado *
                  </label>
                  <input
                    type="text"
                    required
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    placeholder="Ex: Consultoria especial, Manutenção..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>
              )}

              {/* Seleção de Profissional */}
              {professionals.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profissional / Atendente (opcional)
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedProfessionalId}
                      onChange={(e) => setSelectedProfessionalId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                    >
                      <option value="">Qualquer profissional / Sem preferência</option>
                      {professionals.map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.name} {prof.role_title ? `(${prof.role_title})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Valor e Duração */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duração (minutos)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      step="5"
                      min="5"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="30"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data do Agendamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>

              {/* Status Inicial */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Inicial *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "confirmed" | "pending")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                >
                  <option value="confirmed">Confirmado (Padrão)</option>
                  <option value="pending">Pendente (Aguardando Confirmação)</option>
                </select>
              </div>

              {/* Observações adicionais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferências do cliente, restrições ou detalhes importantes..."
                  maxLength={500}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Criar Agendamento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default NewAppointmentModal;
