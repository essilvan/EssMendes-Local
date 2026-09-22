"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Pencil,
  Trash2,
  Filter,
  Sparkles,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import AppointmentStatusButton from "@/app/(admin)/admin/agendamentos/AppointmentStatusButton";
import NewAppointmentModal, {
  type ServiceOption,
} from "@/components/admin/NewAppointmentModal";
import EditAppointmentModal from "@/components/admin/EditAppointmentModal";
import { deleteAppointmentAction } from "@/services/appointment.actions";
import type { Appointment, TenantProfessional, AppointmentStatus } from "@/types";

interface AppointmentsClientProps {
  initialAppointments: Appointment[];
  professionals: TenantProfessional[];
  services: ServiceOption[];
  tenantName: string;
  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;
  googleReviewUrl?: string | null;
}

export function AppointmentsClient({
  initialAppointments,
  professionals,
  services,
  tenantName,
  googlePlaceId,
  googleMapsUrl,
  googleReviewUrl,
}: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sincroniza se os dados iniciais forem recarregados pelo servidor
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const professionalsMap = new Map<string, TenantProfessional>(
    professionals.map((p) => [p.id, p])
  );

  const activeProfessionals = professionals.filter((p) => p.is_active);

  // Formatadores
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  // Contadores globais
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  // Contagem por filtro de profissional
  const unassignedCount = appointments.filter((a) => !a.professional_id).length;

  // Filtragem da lista
  const filteredAppointments = appointments.filter((app) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "unassigned") return !app.professional_id;
    return app.professional_id === selectedFilter;
  });

  // Ação de exclusão
  const handleDeleteConfirm = async () => {
    if (!deletingAppointment) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteAppointmentAction(deletingAppointment.id);
    setIsDeleting(false);

    if (!res.success) {
      setDeleteError(res.error || "Não foi possível excluir o agendamento.");
      return;
    }

    // Remove do estado local imediatamente
    setAppointments((prev) => prev.filter((a) => a.id !== deletingAppointment.id));
    setDeletingAppointment(null);
  };

  // Ação ao salvar edição
  const handleAppointmentSaved = (updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    );
  };

  // Atualiza status localmente
  const handleStatusChange = (appId: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="h-6 w-6 text-teal-700" />
            <span>Gestão de Agendamentos</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhe, filtre por profissional e gerencie os atendimentos do seu negócio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/profissionais"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Users className="h-4 w-4 text-teal-700" />
            <span>Gerenciar Equipe</span>
          </Link>
          <NewAppointmentModal
            services={services}
            professionals={activeProfessionals}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Pendentes
          </p>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
          <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            Confirmados
          </p>
          <p className="text-2xl font-black text-teal-900 mt-1">{confirmedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Concluídos
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Barra de Filtros por Profissional (Tabs / Pills) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <Filter className="w-3.5 h-3.5 text-teal-700" />
          <span>Filtrar por Profissional:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Pill "Todos" */}
          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              selectedFilter === "all"
                ? "bg-teal-800 text-white border-teal-800 shadow-2xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>Todos</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedFilter === "all"
                  ? "bg-teal-900/60 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {appointments.length}
            </span>
          </button>

          {/* Pill "Primeiro disponível" */}
          <button
            type="button"
            onClick={() => setSelectedFilter("unassigned")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              selectedFilter === "unassigned"
                ? "bg-teal-800 text-white border-teal-800 shadow-2xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Primeiro disponível</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedFilter === "unassigned"
                  ? "bg-teal-900/60 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {unassignedCount}
            </span>
          </button>

          {/* Pills para cada profissional ativo */}
          {activeProfessionals.map((prof) => {
            const count = appointments.filter((a) => a.professional_id === prof.id).length;
            const isSelected = selectedFilter === prof.id;

            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => setSelectedFilter(prof.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  isSelected
                    ? "bg-teal-800 text-white border-teal-800 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {/* Avatar miniatura */}
                {prof.avatar_url ? (
                  <img
                    src={prof.avatar_url}
                    alt={prof.name}
                    className="w-5 h-5 rounded-full object-cover border border-white/40"
                  />
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected
                        ? "bg-teal-900 text-white"
                        : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {prof.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <span>{prof.name}</span>

                {prof.role_title && (
                  <span
                    className={`text-[10px] font-normal ${
                      isSelected ? "text-teal-200" : "text-slate-500"
                    }`}
                  >
                    ({prof.role_title})
                  </span>
                )}

                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-teal-900/60 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-slate-400" />
          <p className="font-semibold text-slate-700">
            {appointments.length === 0
              ? "Nenhum agendamento registrado ainda."
              : "Nenhum agendamento encontrado para este filtro."}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {appointments.length === 0
              ? "Assim que clientes realizarem reservas através do seu link público, os atendimentos aparecerão organizados aqui."
              : "Tente selecionar outro profissional ou a aba 'Todos' para visualizar todos os atendimentos da empresa."}
          </p>
          {selectedFilter !== "all" && appointments.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition mt-2"
            >
              <span>Ver todos os agendamentos</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((app) => {
            const professional = app.professional_id
              ? professionalsMap.get(app.professional_id)
              : null;

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
              >
                <div className="space-y-2.5 flex-1">
                  {/* Cliente e Status */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" /> {app.customer_name}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        app.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : app.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {app.status === "confirmed" && "Confirmado"}
                      {app.status === "pending" && "Aguardando Confirmação"}
                      {app.status === "completed" && "Concluído"}
                      {app.status === "canceled" && "Cancelado"}
                    </span>

                    <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                      {app.service_name}
                    </span>

                    {/* Badge do Profissional */}
                    {professional ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-bold text-teal-900">
                        {professional.avatar_url ? (
                          <img
                            src={professional.avatar_url}
                            alt={professional.name}
                            className="w-3.5 h-3.5 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-3.5 h-3.5 text-teal-700" />
                        )}
                        <span>{professional.name}</span>
                        {professional.role_title && (
                          <span className="text-[10px] font-normal text-teal-700">
                            ({professional.role_title})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>Primeiro disponível</span>
                      </span>
                    )}
                  </div>

                  {/* Detalhes de Data, Hora e Telefone */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-700" />
                      <strong className="text-slate-800">{formatDate(app.start_time)}</strong>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      <span>
                        {formatTime(app.start_time)} - {formatTime(app.end_time)} (
                        {app.total_duration} min)
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <a
                        href={`https://wa.me/55${app.customer_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-medium hover:underline"
                        title="WhatsApp do cliente"
                      >
                        {app.customer_phone}
                      </a>
                    </span>

                    {professional?.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <a
                          href={`https://wa.me/55${professional.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 font-medium hover:underline"
                          title={`WhatsApp direto de ${professional.name}`}
                        >
                          Whats Profissional: {professional.phone}
                        </a>
                      </span>
                    )}

                    {app.customer_email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.customer_email}</span>
                      </span>
                    )}

                    <span className="font-bold text-slate-900">
                      {formatCurrency(Number(app.price))}
                    </span>
                  </div>

                  {/* Observações */}
                  {app.notes && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="italic">{app.notes}</span>
                    </div>
                  )}
                </div>

                {/* Botões de Ação: Editar, Excluir e Status */}
                <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex-wrap justify-end">
                  {/* Botão Editar (Pencil) */}
                  <button
                    type="button"
                    onClick={() => setEditingAppointment(app)}
                    className="p-2 text-slate-500 hover:text-teal-800 hover:bg-teal-50 border border-slate-200 rounded-xl transition shadow-2xs"
                    title="Editar data, horário ou profissional"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Botão Excluir (Trash2) */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingAppointment(app);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition shadow-2xs"
                    title="Excluir este agendamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Botões de Atualização de Status com Google Review no 'Concluir' */}
                  <AppointmentStatusButton
                    appointmentId={app.id}
                    currentStatus={app.status}
                    customerName={app.customer_name}
                    customerPhone={app.customer_phone}
                    tenantName={tenantName}
                    googlePlaceId={googlePlaceId}
                    googleMapsUrl={googleMapsUrl}
                    googleReviewUrl={googleReviewUrl}
                    onStatusChange={(newStatus) => handleStatusChange(app.id, newStatus)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edição de Agendamento */}
      {editingAppointment && (
        <EditAppointmentModal
          isOpen={true}
          onClose={() => setEditingAppointment(null)}
          appointment={editingAppointment}
          professionals={professionals}
          onSaved={handleAppointmentSaved}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeletingAppointment(null);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Excluir Agendamento?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja excluir o agendamento de{" "}
                  <strong className="text-slate-700">
                    {deletingAppointment.customer_name}
                  </strong>{" "}
                  para o serviço{" "}
                  <strong className="text-slate-700">
                    {deletingAppointment.service_name}
                  </strong>
                  ? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingAppointment(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsClient;
