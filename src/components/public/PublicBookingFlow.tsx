"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  MessageCircle,
  Scissors,
  ArrowRight,
  ShieldCheck,
  Users,
  Check,
} from "lucide-react";
import {
  getAvailableSlotsAction,
  createAppointmentAction,
} from "@/services/appointment.actions";
import { recordAnalyticsEvent } from "@/actions/analytics";
import type { Service, AvailableSlot, Appointment, TenantProfessional } from "@/types";
import { sanitizePhoneNumber } from "@/utils/phone";
import { createClient } from "@/lib/supabase/client";

interface PublicBookingFlowProps {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPhone?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  services: Service[];
  professionals?: TenantProfessional[];
  selectedServiceId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicBookingFlow({
  tenantId,
  tenantName,
  tenantSlug,
  tenantPhone,
  businessPhone,
  businessAddress,
  services,
  professionals = [],
  selectedServiceId,
  isOpen,
  onClose,
}: PublicBookingFlowProps) {
  // Service selection
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Professional selection (null = qualquer / primeiro disponível)
  const [selectedProfessional, setSelectedProfessional] = useState<TenantProfessional | null>(null);
  const [activeProfessionals, setActiveProfessionals] = useState<TenantProfessional[]>(professionals);

  // Sincronizar quando a prop professionals mudar
  useEffect(() => {
    if (professionals && professionals.length > 0) {
      setActiveProfessionals(professionals);
    }
  }, [professionals]);

  // Carregamento dinâmico resiliente caso a prop venha vazia
  useEffect(() => {
    if (!isOpen || (activeProfessionals.length > 0 && professionals.length > 0) || !tenantId) return;

    let isMounted = true;
    const loadProfessionals = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("tenant_professionals")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (!error && data && isMounted && data.length > 0) {
          setActiveProfessionals(
            data.map((p: any) => ({
              id: p.id,
              tenant_id: p.tenant_id,
              name: p.name,
              phone: p.phone,
              role_title: p.role_title || p.specialty || "Profissional",
              specialty: p.role_title || p.specialty || "Profissional",
              avatar_url: p.avatar_url || null,
              is_active: p.is_active ?? true,
              created_at: p.created_at,
            }))
          );
        }
      } catch (err) {
        console.error("Erro ao carregar profissionais:", err);
      }
    };

    loadProfessionals();
    return () => {
      isMounted = false;
    };
  }, [isOpen, tenantId, professionals, activeProfessionals.length]);

  // Date selection (default today YYYY-MM-DD)
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Slots state & Occupied appointments
  const [occupiedAppointments, setOccupiedAppointments] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Grade de horários padrão de atendimento
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00"
  ];

  // Customer form state
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Submission state
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Sync service selection when modal opens
  useEffect(() => {
    if (selectedServiceId) {
      const match = services.find((s) => s.id === selectedServiceId);
      if (match) setSelectedService(match);
    } else if (services.length > 0 && !selectedService) {
      setSelectedService(services[0]);
    }
  }, [selectedServiceId, services, selectedService]);

  // Busca reativa dos agendamentos existentes no Supabase ao alterar selectedDate ou selectedProfessional
  useEffect(() => {
    if (!isOpen || !tenantId || !selectedDate) return;

    let isMounted = true;
    setIsLoadingSlots(true);
    setSlotsError(null);
    setSelectedTime("");

    const loadOccupied = async () => {
      try {
        const supabase = createClient();
        const startOfDay = `${selectedDate}T00:00:00.000Z`;
        const endOfDay = `${selectedDate}T23:59:59.999Z`;

        let query = supabase
          .from("appointments")
          .select("id, start_time, end_time, status, professional_id, total_duration, service_name")
          .eq("tenant_id", tenantId)
          .gte("start_time", startOfDay)
          .lte("start_time", endOfDay)
          .neq("status", "canceled");

        if (selectedProfessional?.id) {
          query = query.eq("professional_id", selectedProfessional.id);
        }

        const { data, error } = await query;

        if (!isMounted) return;

        if (error) {
          console.error("Erro ao carregar agendamentos existentes:", error);
          setSlotsError("Não foi possível verificar a disponibilidade de horários.");
          setOccupiedAppointments([]);
        } else {
          setOccupiedAppointments(data || []);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Exceção ao buscar horários ocupados:", err);
        setSlotsError("Erro ao consultar agenda.");
        setOccupiedAppointments([]);
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    };

    loadOccupied();

    return () => {
      isMounted = false;
    };
  }, [isOpen, tenantId, selectedDate, selectedProfessional?.id]);

  // Normalizar para "HH:mm" e checar se o horário está ocupado
  const isTimeSlotOccupied = (timeSlot: string) => {
    const formattedSlot = timeSlot.slice(0, 5); // Garante "08:30"
    const [slotH, slotM] = formattedSlot.split(":").map(Number);
    const slotStartM = slotH * 60 + slotM;
    const currentDuration = selectedService?.duration_minutes || 30;
    const slotEndM = slotStartM + currentDuration;

    const checkAppOccupies = (app: any) => {
      if (app.status === "canceled" || app.status === "cancelled") return false;

      // Normaliza para "HH:mm" (seja de appointment_time ou start_time)
      const rawTime =
        app.appointment_time ||
        (app.start_time
          ? app.start_time.includes("T")
            ? app.start_time.split("T")[1]
            : app.start_time
          : "");
      const appTime = rawTime ? rawTime.slice(0, 5) : "";

      if (!appTime) return false;

      // 1. Comparação direta exata de horário (ex: "08:30" === "08:30")
      if (appTime === formattedSlot) return true;

      // 2. Sobreposição por duração do serviço
      const [appH, appM] = appTime.split(":").map(Number);
      const appStartM = appH * 60 + appM;
      const appDuration = app.total_duration || 30;
      const appEndM = appStartM + appDuration;

      return slotStartM < appEndM && slotEndM > appStartM;
    };

    // CASO A: Se tiver profissional selecionado:
    if (selectedProfessional?.id) {
      return occupiedAppointments.some(
        (app) => app.professional_id === selectedProfessional.id && checkAppOccupies(app)
      );
    }

    // CASO B: Se for "Qualquer Profissional":
    const overlappingCount = occupiedAppointments.filter((app) => checkAppOccupies(app)).length;
    const totalPros = activeProfessionals.length > 0 ? activeProfessionals.length : 1;
    return overlappingCount >= totalPros;
  };

  if (!isOpen) return null;

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Generate date chips for the next 7 days
  const generateUpcomingDays = () => {
    const days: { dateStr: string; dayNumber: number; weekDay: string; isToday: boolean }[] = [];
    const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      days.push({
        dateStr,
        dayNumber: d.getDate(),
        weekDay: i === 0 ? "Hoje" : i === 1 ? "Amanhã" : weekDaysShort[d.getDay()],
        isToday: i === 0,
      });
    }
    return days;
  };

  const upcomingDays = generateUpcomingDays();

  // Handle Booking Submission
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) {
      setSubmitError("Por favor, selecione o serviço, a data e o horário.");
      return;
    }

    if (!customerName.trim()) {
      setSubmitError("Por favor, informe seu nome.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 10) {
      setSubmitError("Informe um número de WhatsApp válido com DDD.");
      return;
    }

    setSubmitError(null);

    startTransition(async () => {
      // 1. Sanitização estrita do professional_id no payload
      const cleanProfessionalId =
        selectedProfessional?.id &&
        typeof selectedProfessional.id === "string" &&
        selectedProfessional.id.trim() !== ""
          ? selectedProfessional.id.trim()
          : null;

      const res = await createAppointmentAction({
        tenantId,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        professionalId: cleanProfessionalId,
        price: selectedService.price ? Number(selectedService.price) : 0,
        durationMinutes: selectedService.duration_minutes || 30,
        date: selectedDate,
        time: selectedTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.error) {
        setSubmitError(res.error);
      } else if (res.data) {
        const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        recordAnalyticsEvent(tenantId, "booking_completed", isMobile ? "mobile" : "desktop");
        setConfirmedAppointment(res.data);

        // 3. Roteamento Dinâmico para o WhatsApp individual ou geral
        const rawPhone =
          (selectedProfessional?.phone && selectedProfessional.phone.trim()) ||
          tenantPhone ||
          businessPhone ||
          "";

        const cleanDigits = rawPhone.replace(/\D/g, "");
        if (cleanDigits) {
          const targetPhone = sanitizePhoneNumber(cleanDigits);
          const professionalGreeting = selectedProfessional
            ? `Olá, ${selectedProfessional.name}!`
            : `Olá, equipe ${tenantName}!`;

          const appointmentDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          const appointmentTime = selectedTime;
          const serviceName = selectedService.name;
          const clientName = customerName.trim();
          const clientPhone = customerPhone.trim();

          const message = [
            `${professionalGreeting} Gostaria de confirmar meu agendamento realizado pela vitrine:`,
            ``,
            `👤 *Cliente:* ${clientName}`,
            `✂️ *Serviço:* ${serviceName}`,
            `📅 *Data e Horário:* ${appointmentDate} às ${appointmentTime}`,
            `📱 *Meu WhatsApp:* ${clientPhone}`,
            selectedProfessional ? `💈 *Profissional:* ${selectedProfessional.name}` : ``,
            ``,
            `Aguardo sua confirmação!`
          ].filter(Boolean).join('\n');

          const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
          try {
            window.open(whatsappUrl, '_blank');
          } catch (err) {
            console.warn("Abertura automática de popup bloqueada pelo navegador:", err);
          }
        }
      }
    });
  };

  // Generate WhatsApp confirmation URL
  const getConfirmationWhatsAppUrl = () => {
    const rawPhone =
      (selectedProfessional?.phone && selectedProfessional.phone.trim()) ||
      tenantPhone ||
      businessPhone ||
      "";

    const cleanDigits = rawPhone.replace(/\D/g, "");
    if (!cleanDigits) return "#";

    const targetPhone = sanitizePhoneNumber(cleanDigits);
    const professionalGreeting = selectedProfessional
      ? `Olá, ${selectedProfessional.name}!`
      : `Olá, equipe ${tenantName}!`;

    const appointmentDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const appointmentTime = selectedTime;
    const serviceName = confirmedAppointment?.service_name || selectedService?.name || "Serviço";
    const clientName = customerName.trim();
    const clientPhone = customerPhone.trim();

    const message = [
      `${professionalGreeting} Gostaria de confirmar meu agendamento realizado pela vitrine:`,
      ``,
      `👤 *Cliente:* ${clientName}`,
      `✂️ *Serviço:* ${serviceName}`,
      `📅 *Data e Horário:* ${appointmentDate} às ${appointmentTime}`,
      `📱 *Meu WhatsApp:* ${clientPhone}`,
      selectedProfessional ? `💈 *Profissional:* ${selectedProfessional.name}` : ``,
      ``,
      `Aguardo sua confirmação!`
    ].filter(Boolean).join('\n');

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  };

  // Reset modal state
  const handleClose = () => {
    setConfirmedAppointment(null);
    setSubmitError(null);
    setSelectedTime("");
    setSelectedProfessional(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
            >
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {confirmedAppointment ? "Agendamento Confirmado!" : "Agendar Atendimento"}
              </h2>
              <p className="text-xs text-slate-500">{tenantName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {confirmedAppointment ? (
            /* Tela de Sucesso / Confirmação */
            <div className="text-center space-y-6 py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Horário Reservado com Sucesso!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Seu agendamento foi registrado com sucesso em nosso sistema.
                </p>
              </div>

              {/* Resumo do Agendamento */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Serviço:</span>
                  <span className="font-bold text-slate-900">{confirmedAppointment.service_name}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Profissional:</span>
                  <span className="font-bold text-slate-900">
                    {selectedProfessional ? selectedProfessional.name : "Qualquer Profissional / Equipe"}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Data e Horário:</span>
                  <span
                    className="font-bold"
                    style={{ color: "var(--primary-color, #0d9488)" }}
                  >
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR")} às {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Duração Estimada:</span>
                  <span className="font-medium text-slate-800">{confirmedAppointment.total_duration} minutos</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Valor Previsto:</span>
                  {confirmedAppointment.price && Number(confirmedAppointment.price) > 0 ? (
                    <span className="font-bold text-slate-900">{formatCurrency(Number(confirmedAppointment.price))}</span>
                  ) : (
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                      Orçamento sob consulta
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-medium text-slate-800">{confirmedAppointment.customer_name}</span>
                </div>
              </div>

              {/* Ações de Conclusão */}
              <div className="space-y-2.5 pt-2">
                <a
                  href={getConfirmationWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#1EBE5D] transition-all shadow-md mt-4"
                >
                  <span>🟢 Confirmar Agendamento no WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Fechar Janela
                </button>
              </div>
            </div>
          ) : (
            /* Formulário de Agendamento em 3 Etapas */
            <form onSubmit={handleSubmitBooking} className="space-y-6">
              
              {/* Mensagem de Erro Geral */}
              {submitError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* 1. Escolha do Serviço */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Selecione o Serviço
                </label>
                <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
                  {services.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedService(service)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900/10 shadow-2xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">{service.name}</p>
                          {service.duration_minutes && Number(service.duration_minutes) > 0 ? (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration_minutes} min
                            </p>
                          ) : null}
                        </div>
                        {service.price !== null && Number(service.price) > 0 ? (
                          <span
                            className="text-xs font-extrabold"
                            style={{ color: "var(--primary-color, #0d9488)" }}
                          >
                            {formatCurrency(Number(service.price))}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Sob Consulta
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Seleção do Profissional */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Selecione o Profissional
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedProfessional ? selectedProfessional.name : "Qualquer atendente"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 max-h-52 overflow-y-auto pr-1">
                  {/* Opção Padrão */}
                  <button
                    type="button"
                    onClick={() => setSelectedProfessional(null)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                      selectedProfessional === null
                        ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-xs uppercase text-neutral-700 shrink-0">
                      <Users className="w-4 h-4 text-neutral-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-neutral-800 truncate">
                        Qualquer Profissional
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        Primeiro disponível
                      </p>
                    </div>
                    {selectedProfessional === null && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>

                  {/* Profissionais Cadastrados */}
                  {activeProfessionals?.map((prof) => {
                    const isSelected = selectedProfessional?.id === prof.id;
                    const isDirectPhoto =
                      prof.avatar_url &&
                      (prof.avatar_url.startsWith("http://") || prof.avatar_url.startsWith("https://")) &&
                      !prof.avatar_url.includes("instagram.com") &&
                      !prof.avatar_url.includes("facebook.com") &&
                      !prof.avatar_url.includes("tiktok.com");

                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => setSelectedProfessional(prof)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        {isDirectPhoto ? (
                          <img
                            src={prof.avatar_url!}
                            alt={prof.name}
                            className="w-8 h-8 rounded-full object-cover border border-neutral-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                              const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-8 h-8 rounded-full bg-neutral-200 items-center justify-center font-bold text-xs uppercase text-neutral-800 shrink-0 ${
                            isDirectPhoto ? "hidden" : "flex"
                          }`}
                        >
                          {prof.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-neutral-800 truncate">
                            {prof.name}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {prof.role_title || "Profissional"}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Escolha de Data e Horário */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    3. Escolha o Dia
                  </label>
                  <input
                    type="date"
                    min={getTodayStr()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1 text-slate-700 bg-slate-50 focus:outline-none"
                  />
                </div>

                {/* Quick Date Chips */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                  {upcomingDays.map((day) => {
                    const isSelected = selectedDate === day.dateStr;
                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(day.dateStr)}
                        className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition ${
                          isSelected
                            ? "text-white shadow-xs font-bold"
                            : "border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: "var(--primary-color, #0d9488)" }
                            : undefined
                        }
                      >
                        <span className="text-[10px] opacity-90">{day.weekDay}</span>
                        <span className="text-sm font-extrabold">{day.dayNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horário */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Horário Disponível
                </label>

                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                    <span>Consultando horários disponíveis...</span>
                  </div>
                ) : slotsError ? (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    {slotsError}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {timeSlots.map((time) => {
                      const isOccupied = isTimeSlotOccupied(time);
                      const formattedTime = time.slice(0, 5);
                      const isSelected = selectedTime === formattedTime;

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => !isOccupied && setSelectedTime(formattedTime)}
                          className={`p-2.5 rounded-lg text-sm font-medium transition border text-center ${
                            isOccupied
                              ? "bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-neutral-800 cursor-not-allowed line-through opacity-60"
                              : isSelected
                              ? "bg-teal-700 text-white border-teal-700 shadow-sm font-bold"
                              : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-teal-500"
                          }`}
                          style={
                            isSelected && !isOccupied
                              ? {
                                  backgroundColor: "var(--primary-color, #0d9488)",
                                  borderColor: "var(--primary-color, #0d9488)",
                                }
                              : undefined
                          }
                          title={
                            isOccupied
                              ? "Horário já reservado ou indisponível"
                              : `Selecionar ${formattedTime}`
                          }
                        >
                          {formattedTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Dados do Cliente */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  4. Seus Dados de Contato
                </label>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Maria Oliveira"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (11) 99999-8888"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      E-mail (opcional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="Ex: seuemail@exemplo.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Observações (opcional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ex: Primeira vez no local, preferência de atendimento..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Finalização */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending || !selectedTime || !selectedService}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Confirmando Reserva...</span>
                    </>
                  ) : (
                    <>
                      <span>Concluir Agendamento</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
