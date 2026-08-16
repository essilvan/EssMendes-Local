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
} from "lucide-react";
import {
  getAvailableSlotsAction,
  createAppointmentAction,
} from "@/services/appointment.actions";
import { recordAnalyticsEvent } from "@/actions/analytics";
import type { Service, AvailableSlot, Appointment } from "@/types";
import { sanitizePhoneNumber } from "@/utils/phone";

interface PublicBookingFlowProps {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  businessPhone?: string | null;
  businessAddress?: string | null;
  services: Service[];
  selectedServiceId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicBookingFlow({
  tenantId,
  tenantName,
  tenantSlug,
  businessPhone,
  businessAddress,
  services,
  selectedServiceId,
  isOpen,
  onClose,
}: PublicBookingFlowProps) {
  // Service selection
  const [selectedService, setSelectedService] = useState<Service | null>(null);

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

  // Slots state
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

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

  // Load available slots when date or service changes
  useEffect(() => {
    if (!isOpen || !selectedService || !selectedDate) return;

    let isMounted = true;
    setIsLoadingSlots(true);
    setSlotsError(null);
    setSelectedTime("");

    getAvailableSlotsAction({
      tenantId,
      date: selectedDate,
      totalDuration: selectedService.duration_minutes,
    })
      .then((res) => {
        if (!isMounted) return;
        if (res.error) {
          setSlotsError(res.error);
          setSlots([]);
        } else if (res.data) {
          setSlots(res.data);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSlotsError("Erro ao carregar horários disponíveis.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedDate, selectedService, tenantId]);

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
      const res = await createAppointmentAction({
        tenantId,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: Number(selectedService.price),
        durationMinutes: selectedService.duration_minutes,
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
      }
    });
  };

  // Generate WhatsApp confirmation URL
  const getConfirmationWhatsAppUrl = () => {
    if (!confirmedAppointment || !businessPhone) return "#";
    const phone = sanitizePhoneNumber(businessPhone);
    const dateFormatted = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const msg = encodeURIComponent(
      `Olá! Acabei de realizar o agendamento pelo site:\n\n` +
        `• *Cliente:* ${confirmedAppointment.customer_name}\n` +
        `• *Serviço:* ${confirmedAppointment.service_name}\n` +
        `• *Data:* ${dateFormatted}\n` +
        `• *Horário:* ${selectedTime}\n` +
        `• *Valor:* ${formatCurrency(Number(confirmedAppointment.price))}\n\n` +
        `Gostaria de confirmar o meu horário. Obrigado!`
    );

    return `https://wa.me/${phone}?text=${msg}`;
  };

  // Reset modal state
  const handleClose = () => {
    setConfirmedAppointment(null);
    setSubmitError(null);
    setSelectedTime("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
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
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Serviço:</span>
                  <span className="font-bold text-slate-900">{confirmedAppointment.service_name}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Data e Horário:</span>
                  <span className="font-bold text-teal-800">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR")} às {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Duração Estimada:</span>
                  <span className="font-medium text-slate-800">{confirmedAppointment.total_duration} minutos</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Valor Previsto:</span>
                  <span className="font-bold text-teal-900">{formatCurrency(Number(confirmedAppointment.price))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-medium text-slate-800">{confirmedAppointment.customer_name}</span>
                </div>
              </div>

              {/* Ações de Conclusão */}
              <div className="space-y-2.5 pt-2">
                {businessPhone && (
                  <a
                    href={getConfirmationWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Confirmar no WhatsApp da Empresa</span>
                  </a>
                )}

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
            /* Formulário de Agendamento */
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
                            ? "border-teal-600 bg-teal-50/60 ring-1 ring-teal-600"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">{service.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration_minutes} min
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-teal-800">
                          {formatCurrency(Number(service.price))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Seleção de Data */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Escolha o Dia
                  </label>
                  <input
                    type="date"
                    min={getTodayStr()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 px-2 py-1 text-slate-700 bg-slate-50 focus:border-teal-600 focus:outline-none"
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
                            ? "bg-teal-800 text-white shadow-xs font-bold"
                            : "border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span className="text-[10px] opacity-80">{day.weekDay}</span>
                        <span className="text-sm font-extrabold">{day.dayNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Seleção de Horário */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Selecione o Horário
                </label>

                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
                    <span>Consultando disponibilidade em tempo real...</span>
                  </div>
                ) : slotsError ? (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    {slotsError}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
                    Nenhum horário disponível para esta data. Por favor, selecione outro dia.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`rounded-lg py-2 px-2.5 text-xs font-semibold transition text-center ${
                            !slot.available
                              ? "bg-slate-100 text-slate-300 cursor-not-allowed line-through"
                              : isSelected
                              ? "bg-teal-700 text-white shadow-xs"
                              : "border border-slate-200 bg-white text-slate-800 hover:border-teal-500 hover:bg-teal-50/50"
                          }`}
                        >
                          {slot.time}
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
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
                        placeholder="Ex: Primeira vez no local, preferência de horário..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
