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
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  getAvailableSlotsAction,
  createAppointmentAction,
} from "@/services/appointment.actions";
import { recordAnalyticsEvent } from "@/actions/analytics";
import type { Service, AvailableSlot, Appointment } from "@/types";

interface BookingWidgetCardProps {
  tenantId: string;
  tenantName: string;
  services: Service[];
  businessPhone?: string | null;
  onSuccessOpenModal?: (appointment: Appointment) => void;
}

export function BookingWidgetCard({
  tenantId,
  tenantName,
  services,
  businessPhone,
  onSuccessOpenModal,
}: BookingWidgetCardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services.length > 0 ? services[0].id : ""
  );

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Slots
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Submission
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0] || null;

  // Load available slots
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    let isMounted = true;
    setIsLoadingSlots(true);
    setSlotsError(null);

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
          const firstAvail = res.data.find((s) => s.available);
          if (firstAvail && !selectedTime) {
            setSelectedTime(firstAvail.time);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setSlotsError("Erro ao consultar horários disponíveis.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedService, tenantId, selectedTime]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handleNext = () => {
    setSubmitError(null);
    if (currentStep === 1) {
      if (!selectedServiceId) {
        setSubmitError("Selecione um serviço para continuar.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedDate || !selectedTime) {
        setSubmitError("Selecione a data e o horário desejado.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) {
      setSubmitError("Preencha todos os passos do agendamento.");
      return;
    }

    if (!customerName.trim()) {
      setSubmitError("Por favor, informe seu nome completo.");
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
        const isMobile =
          typeof navigator !== "undefined" &&
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        recordAnalyticsEvent(tenantId, "booking_completed", isMobile ? "mobile" : "desktop");
        setConfirmedAppointment(res.data);
        if (onSuccessOpenModal) {
          onSuccessOpenModal(res.data);
        }
      }
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between h-full">
      {/* Header do Widget */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CalendarIcon
                className="h-4 w-4"
                style={{ color: "var(--primary-color, #0d9488)" }}
              />
              <span>Faça seu Agendamento</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Reserve seu horário em 3 etapas simples.
            </p>
          </div>

          <span
            className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--primary-alpha-10, rgba(13, 148, 136, 0.1))",
              color: "var(--primary-color, #0d9488)",
            }}
          >
            Passo {currentStep} de 3
          </span>
        </div>

        {/* 3 Progress Steps Bar */}
        <div className="grid grid-cols-3 gap-2 pt-3">
          {[
            { step: 1, label: "1. Serviço" },
            { step: 2, label: "2. Data & Hora" },
            { step: 3, label: "3. Seus Dados" },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step < currentStep) setCurrentStep(item.step as 1 | 2 | 3);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition text-center ${
                  isCurrent
                    ? "text-white shadow-2xs"
                    : isCompleted
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-slate-50 text-slate-400 cursor-not-allowed"
                }`}
                style={
                  isCurrent
                    ? { backgroundColor: "var(--primary-color, #0d9488)" }
                    : undefined
                }
              >
                {isCompleted && <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo dos Passos */}
      {confirmedAppointment ? (
        /* Sucesso */
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-slate-900">
              Agendamento Confirmado!
            </h4>
            <p className="text-xs text-slate-500">
              {confirmedAppointment.service_name} • {selectedDate} às {selectedTime}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedAppointment(null);
              setCurrentStep(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Realizar Novo Agendamento
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
          
          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: Seleção de Serviço */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Escolha o Serviço
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {services.map((service) => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedServiceId(service.id)}
                      className={`w-full flex items-center justify-between rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900/10 shadow-2xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold text-slate-900">{service.name}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} min
                        </p>
                      </div>

                      <span
                        className="text-xs font-black"
                        style={{ color: "var(--primary-color, #0d9488)" }}
                      >
                        {formatCurrency(Number(service.price))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Seleção de Data e Hora */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Selecione a Data e Horário
                </label>
                <input
                  type="date"
                  min={getTodayStr()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-slate-50 font-medium"
                />
              </div>

              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  <span>Consultando horários disponíveis...</span>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  Nenhum horário disponível nesta data.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`rounded-xl py-2 px-1 text-xs font-bold transition text-center ${
                          !slot.available
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed line-through"
                            : isSelected
                            ? "text-white shadow-2xs"
                            : "border border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                        }`}
                        style={
                          isSelected && slot.available
                            ? { backgroundColor: "var(--primary-color, #0d9488)" }
                            : undefined
                        }
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Dados de Contato */}
          {currentStep === 3 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Seus Dados de Contato
              </label>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Nome Completo *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp / Telefone com DDD *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="E-mail (opcional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Botões de Navegação do Widget */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-black text-white shadow-sm hover:opacity-95 active:scale-95 transition"
                style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
              >
                <span>Continuar</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-black text-white shadow-md hover:opacity-95 active:scale-95 disabled:opacity-50 transition"
                style={{ backgroundColor: "var(--primary-color, #0d9488)" }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Agendamento</span>
                    <Check className="h-4 w-4 stroke-[3]" />
                  </>
                )}
              </button>
            )}
          </div>

        </form>
      )}
    </div>
  );
}
