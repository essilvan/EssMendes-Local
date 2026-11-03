"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CarFront,
  Wrench,
  MessageCircle,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  History,
  User,
  Phone,
  Gauge,
  Trash2,
  Pencil,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import {
  createMaintenanceScheduleAction,
  updateMaintenanceScheduleAction,
  deleteMaintenanceScheduleAction,
} from "@/services/vehicle-quote.actions";
import {
  formatLicensePlateDisplay,
  normalizeLicensePlate,
} from "@/lib/validations/vehicle-quote.schema";
import { sanitizePhoneNumber } from "@/utils/phone";
import type {
  VehicleMaintenanceSchedule,
  VehicleMaintenanceStatus,
} from "@/types";

interface MaintenanceSchedulesClientProps {
  initialSchedules: VehicleMaintenanceSchedule[];
  tenantName: string;
}

const SERVICE_PRESETS = [
  "Troca de Óleo do Motor e Filtros",
  "Revisão Preventiva de Freios (Pastilhas e Fluido)",
  "Alinhamento, Balanceamento e Rodízio de Pneus",
  "Substituição de Correia Dentada e Tensor",
  "Limpeza de Bicos e Diagnóstico de Injeção",
  "Higienização do Ar-Condicionado e Filtro de Cabine",
  "Revisão Geral de Férias / Viagem (30 Itens)",
  "Troca de Fluido de Arrefecimento / Radiador",
];

function getDaysUntilDue(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDateStr}T00:00:00`);
  if (isNaN(due.getTime())) return 999;
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

export function MaintenanceSchedulesClient({
  initialSchedules,
  tenantName,
}: MaintenanceSchedulesClientProps) {
  const [schedules, setSchedules] =
    useState<VehicleMaintenanceSchedule[]>(initialSchedules);
  const [activeTab, setActiveTab] = useState<
    "upcoming" | "all" | "notified" | "completed"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Nova Revisão
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceType, setServiceType] = useState(
    "Troca de Óleo do Motor e Filtros"
  );
  const [lastServiceDate, setLastServiceDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [dueKm, setDueKm] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edição rápida de revisão
  const [editingSchedule, setEditingSchedule] =
    useState<VehicleMaintenanceSchedule | null>(null);
  const [editDueDate, setEditDueDate] = useState("");
  const [editDueKm, setEditDueKm] = useState("");
  const [editServiceType, setEditServiceType] = useState("");
  const [editStatus, setEditStatus] =
    useState<VehicleMaintenanceStatus>("scheduled");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Exclusão
  const [deletingSchedule, setDeletingSchedule] =
    useState<VehicleMaintenanceSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // KPIs
  const overdueCount = useMemo(
    () =>
      schedules.filter(
        (s) =>
          s.status !== "completed" &&
          s.status !== "canceled" &&
          getDaysUntilDue(s.due_date) < 0
      ).length,
    [schedules]
  );

  const dueSoonCount = useMemo(
    () =>
      schedules.filter((s) => {
        if (s.status === "completed" || s.status === "canceled") return false;
        const days = getDaysUntilDue(s.due_date);
        return days >= 0 && days <= 30;
      }).length,
    [schedules]
  );

  const notifiedCount = useMemo(
    () => schedules.filter((s) => s.status === "notified").length,
    [schedules]
  );

  const completedCount = useMemo(
    () => schedules.filter((s) => s.status === "completed").length,
    [schedules]
  );

  // Lista filtrada e ordenada por proximidade de vencimento
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((s) => {
        const days = getDaysUntilDue(s.due_date);
        if (activeTab === "upcoming") {
          if (s.status === "completed" || s.status === "canceled") return false;
          if (days > 45) return false;
        } else if (activeTab === "notified") {
          if (s.status !== "notified") return false;
        } else if (activeTab === "completed") {
          if (s.status !== "completed") return false;
        }

        if (searchTerm.trim()) {
          const term = searchTerm.trim().toLowerCase();
          const cleanPlate = normalizeLicensePlate(searchTerm).toLowerCase();
          const plateMatch = s.license_plate
            ?.toLowerCase()
            .includes(cleanPlate || term);
          const clientMatch =
            s.client_name?.toLowerCase().includes(term) ||
            s.client_phone?.toLowerCase().includes(term);
          const modelMatch = s.vehicle_model?.toLowerCase().includes(term);
          const serviceMatch = s.service_type?.toLowerCase().includes(term);
          return Boolean(
            plateMatch || clientMatch || modelMatch || serviceMatch
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Pendentes/Próximas primeiro, ordenadas por data de vencimento crescente
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        return a.due_date.localeCompare(b.due_date);
      });
  }, [schedules, activeTab, searchTerm]);

  // Mensagem de Lembrete Pronta para o WhatsApp
  const buildReminderWhatsAppUrl = (s: VehicleMaintenanceSchedule) => {
    const cleanPhone = sanitizePhoneNumber(s.client_phone);
    const targetPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    const plateDisplay = formatLicensePlateDisplay(s.license_plate);
    const days = getDaysUntilDue(s.due_date);

    const urgencyPhrase =
      days < 0
        ? `já atingiu o prazo de revisão (${formatDate(s.due_date)})`
        : days === 0
        ? `vence *hoje* (${formatDate(s.due_date)})`
        : `está próxima do vencimento (${formatDate(s.due_date)})`;

    const kmInfo = s.due_km
      ? `\n🛣️ *Quilometragem Prevista:* ${Number(s.due_km).toLocaleString(
          "pt-BR"
        )} km`
      : "";

    const notesInfo = s.notes ? `\n📝 *Observação:* ${s.notes}` : "";

    const message =
      `Olá, *${s.client_name}*! Tudo bem? 👋\n` +
      `Aqui é da equipe *${tenantName}* 🚗🔧\n\n` +
      `Passando para lembrar que a manutenção preventiva do seu veículo *${
        s.vehicle_model ? `${s.vehicle_model} ` : ""
      }(Placa ${plateDisplay})* ${urgencyPhrase}:\n\n` +
      `🛠️ *Serviço Recomendado:* ${s.service_type}\n` +
      `📅 *Data Programada:* ${formatDate(s.due_date)}${kmInfo}${notesInfo}\n\n` +
      `Manter a revisão preventiva em dia garante sua segurança e evita gastos maiores no futuro. Vamos agendar um horário para cuidar do seu veículo?`;

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleQuickStatusUpdate = async (
    scheduleId: string,
    newStatus: VehicleMaintenanceStatus
  ) => {
    const res = await updateMaintenanceScheduleAction({
      id: scheduleId,
      status: newStatus,
    });
    if (res.success && res.data) {
      setSchedules((prev) =>
        prev.map((item) => (item.id === scheduleId ? res.data! : item))
      );
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const res = await createMaintenanceScheduleAction({
      licensePlate,
      vehicleModel,
      clientName,
      clientPhone,
      serviceType,
      lastServiceDate,
      dueDate,
      dueKm: dueKm ? Number(dueKm) : null,
      status: "scheduled",
      notes: notes || null,
    });

    setIsSubmitting(false);

    if (!res.success || !res.data) {
      setFormError(res.error || "Não foi possível programar a revisão.");
      return;
    }

    setSchedules((prev) => [...prev, res.data!]);
    setIsNewModalOpen(false);
    setLicensePlate("");
    setVehicleModel("");
    setClientName("");
    setClientPhone("");
    setDueKm("");
    setNotes("");
  };

  const handleOpenEdit = (s: VehicleMaintenanceSchedule) => {
    setFormError(null);
    setEditingSchedule(s);
    setEditServiceType(s.service_type);
    setEditDueDate(s.due_date ? s.due_date.split("T")[0] : "");
    setEditDueKm(s.due_km ? String(s.due_km) : "");
    setEditStatus((s.status as VehicleMaintenanceStatus) || "scheduled");
    setEditNotes(s.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    setIsSavingEdit(true);
    setFormError(null);

    const res = await updateMaintenanceScheduleAction({
      id: editingSchedule.id,
      serviceType: editServiceType,
      dueDate: editDueDate,
      dueKm: editDueKm ? Number(editDueKm) : null,
      status: editStatus,
      notes: editNotes || null,
    });

    setIsSavingEdit(false);

    if (!res.success || !res.data) {
      setFormError(res.error || "Falha ao atualizar revisão.");
      return;
    }

    setSchedules((prev) =>
      prev.map((item) => (item.id === res.data!.id ? res.data! : item))
    );
    setEditingSchedule(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;
    setIsDeleting(true);
    const res = await deleteMaintenanceScheduleAction(deletingSchedule.id);
    setIsDeleting(false);
    if (res.success) {
      setSchedules((prev) =>
        prev.filter((item) => item.id !== deletingSchedule.id)
      );
      setDeletingSchedule(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Abas Superiores de Navegação do Módulo Automotivo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orcamentos"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            <CarFront className="h-4 w-4 text-blue-600" />
            <span>Orçamentos & Histórico por Placa</span>
          </Link>

          <Link
            href="/admin/revisoes"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition"
          >
            <CalendarClock className="h-4 w-4 text-teal-200" />
            <span>Revisões Preventivas</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Programar Nova Revisão</span>
        </button>
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <CalendarClock className="h-6 w-6 text-teal-700" />
            <span>Revisões Preventivas & Retorno Programado</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhe clientes com revisões próximas do vencimento e envie lembretes personalizados no WhatsApp com 1 clique.
          </p>
        </div>
      </div>

      {/* KPIs de Vencimento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
          <span className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span>Vencidas / Atrasadas</span>
          </span>
          <p className="text-2xl font-black text-red-950 mt-1">
            {overdueCount}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <BellRing className="h-3.5 w-3.5 text-amber-600" />
            <span>Vencendo em até 30 dias</span>
          </span>
          <p className="text-2xl font-black text-amber-950 mt-1">
            {dueSoonCount}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>Lembretes Enviados</span>
          </span>
          <p className="text-2xl font-black text-blue-950 mt-1">
            {notifiedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Revisões Realizadas</span>
          </span>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Barra de Filtro e Pesquisa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            {
              id: "all" as const,
              label: "Todas as Revisões",
              count: schedules.length,
            },
            {
              id: "upcoming" as const,
              label: "Vencimento Próximo / Atrasadas",
              count: overdueCount + dueSoonCount,
            },
            {
              id: "notified" as const,
              label: "Lembrete Enviado",
              count: notifiedCount,
            },
            {
              id: "completed" as const,
              label: "Concluídas",
              count: completedCount,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                activeTab === tab.id
                  ? "bg-teal-800 text-white border-teal-800 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === tab.id
                    ? "bg-teal-950/60 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por placa, cliente ou serviço..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Revisões Preventivas */}
      {filteredSchedules.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <CalendarClock className="h-12 w-12 mx-auto text-slate-400" />
          <p className="text-base font-bold text-slate-800">
            Nenhuma revisão preventiva encontrada para este filtro.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Programe revisões preventivas (troca de óleo, freios, correia dentada, alinhamento) para fidelizar clientes e disparar lembretes automáticos via WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-extrabold text-white transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Primeira Revisão</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchedules.map((s) => {
            const plateDisplay = formatLicensePlateDisplay(s.license_plate);
            const days = getDaysUntilDue(s.due_date);
            const isCompleted = s.status === "completed";
            const isNotified = s.status === "notified";

            let urgencyBadge = {
              text: `Vence em ${days} dias`,
              className: "bg-slate-100 text-slate-700 border-slate-300",
            };
            if (isCompleted) {
              urgencyBadge = {
                text: "✅ Revisão Realizada",
                className: "bg-emerald-100 text-emerald-900 border-emerald-300",
              };
            } else if (days < 0) {
              urgencyBadge = {
                text: `🚨 Vencida há ${Math.abs(days)} dia(s)`,
                className: "bg-red-100 text-red-900 border-red-300",
              };
            } else if (days === 0) {
              urgencyBadge = {
                text: "⚠️ Vence Hoje!",
                className: "bg-amber-100 text-amber-950 border-amber-400",
              };
            } else if (days <= 15) {
              urgencyBadge = {
                text: `⏰ Vence em ${days} dia(s)`,
                className: "bg-amber-100 text-amber-900 border-amber-300",
              };
            } else if (days <= 30) {
              urgencyBadge = {
                text: `📅 Vence em ${days} dias`,
                className: "bg-blue-50 text-blue-800 border-blue-200",
              };
            }

            return (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Dados do Veículo, Placa e Cliente */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Placa Mercosul */}
                    <div className="rounded-xl border-2 border-slate-400 bg-white text-slate-950 overflow-hidden shadow-sm shrink-0 min-w-[124px] text-center self-start">
                      <div className="bg-[#003399] text-white text-[8px] font-extrabold tracking-widest uppercase py-0.5 px-2 flex items-center justify-between">
                        <span>BR</span>
                        <span>BRASIL</span>
                      </div>
                      <div className="px-3 py-1.5 font-mono text-base font-black tracking-widest">
                        {plateDisplay}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${urgencyBadge.className}`}
                        >
                          {urgencyBadge.text}
                        </span>

                        {isNotified && !isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-300 px-2.5 py-0.5 text-[11px] font-bold text-blue-900">
                            <CheckCircle2 className="h-3 w-3 text-blue-700" />
                            <span>Lembrete Enviado</span>
                          </span>
                        )}

                        <span className="text-xs font-semibold text-slate-500">
                          Vencimento:{" "}
                          <strong className="text-slate-900">
                            {formatDate(s.due_date)}
                          </strong>
                        </span>

                        {s.due_km && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
                            <Gauge className="h-3 w-3 text-slate-500" />
                            <span>
                              {Number(s.due_km).toLocaleString("pt-BR")} km
                            </span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-teal-700 shrink-0" />
                        <span>{s.service_type}</span>
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                        {s.vehicle_model && (
                          <span className="font-bold text-slate-800">
                            🚘 {s.vehicle_model}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{s.client_name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{s.client_phone}</span>
                        </span>
                        {s.last_service_date && (
                          <span className="text-slate-400">
                            Último serviço: {formatDate(s.last_service_date)}
                          </span>
                        )}
                      </div>

                      {s.notes && (
                        <p className="text-xs text-slate-500 italic pt-0.5">
                          Obs: {s.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações Rápidas e Botão de Lembrete WhatsApp */}
                  <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 justify-end">
                    <Link
                      href={`/admin/orcamentos?placa=${encodeURIComponent(
                        s.license_plate
                      )}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition"
                      title="Consultar histórico completo desta placa"
                    >
                      <History className="h-3.5 w-3.5 text-blue-600" />
                      <span>Histórico da Placa</span>
                    </Link>

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickStatusUpdate(s.id, "completed")
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 transition cursor-pointer"
                        title="Marcar revisão como concluída"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Concluir</span>
                      </button>
                    )}

                    {/* Botão Principal: Mensagem de Lembrete Pronta para o WhatsApp */}
                    <a
                      href={buildReminderWhatsAppUrl(s)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (s.status === "scheduled") {
                          handleQuickStatusUpdate(s.id, "notified");
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-emerald-600/20 transition"
                    >
                      <MessageCircle className="h-4 w-4 fill-white text-emerald-600 shrink-0" />
                      <span>Enviar Lembrete no WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                      title="Editar revisão"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingSchedule(s)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Excluir revisão"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CADASTRAR NOVA REVISÃO PREVENTIVA */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsNewModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto">
            <div className="bg-teal-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="h-5 w-5 text-teal-200" />
                <h3 className="text-base font-extrabold">
                  Programar Nova Revisão Preventiva
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-teal-200 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={licensePlate}
                    onChange={(e) =>
                      setLicensePlate(e.target.value.toUpperCase())
                    }
                    placeholder="ABC1D23 ou ABC-1234"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-bold uppercase text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modelo / Ano do Veículo
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Ex: Jeep Compass 2022"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp do Cliente *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Revisão / Serviço Preventivo *
                </label>
                <input
                  type="text"
                  required
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="Ex: Troca de Óleo e Filtros"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setServiceType(preset)}
                      className="rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Último Serviço
                  </label>
                  <input
                    type="date"
                    value={lastServiceDate}
                    onChange={(e) => setLastServiceDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Próximo Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    KM Previsto
                  </label>
                  <input
                    type="number"
                    value={dueKm}
                    onChange={(e) => setDueKm(e.target.value)}
                    placeholder="Ex: 50000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações (Óleo utilizado, peças recomendadas, etc.)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Programar Revisão</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR REVISÃO */}
      {editingSchedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingEdit) {
              setEditingSchedule(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                Editar Revisão • Placa{" "}
                {formatLicensePlateDisplay(editingSchedule.license_plate)}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Serviço Preventivo
                </label>
                <input
                  type="text"
                  required
                  value={editServiceType}
                  onChange={(e) => setEditServiceType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    KM Previsto
                  </label>
                  <input
                    type="number"
                    value={editDueKm}
                    onChange={(e) => setEditDueKm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as VehicleMaintenanceStatus)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="scheduled">Programada (Aguardando)</option>
                  <option value="notified">Lembrete Enviado no WhatsApp</option>
                  <option value="completed">Revisão Concluída</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-2.5 text-xs font-extrabold text-white transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCLUIR REVISÃO */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Excluir Revisão da Placa{" "}
              {formatLicensePlateDisplay(deletingSchedule.license_plate)}?
            </h3>
            <p className="text-xs text-slate-600">
              Tem certeza que deseja excluir esta revisão programada de{" "}
              <strong>{deletingSchedule.client_name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSchedule(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceSchedulesClient;

