"use client";

import React, { useState } from "react";
import type { Service, TenantProfile } from "@/types";
import { PublicBookingFlow } from "./PublicBookingFlow";
import { generateWhatsAppUrl } from "@/utils/phone";
import { recordAnalyticsEvent } from "@/actions/analytics";
import {
  Scissors,
  Clock,
  Calendar,
  MessageCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";

interface PublicServicesViewProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  profile: TenantProfile | null;
  services: Service[];
  isBookingOpen?: boolean;
  theme?: NicheThemeConfig;
  onOpenBooking?: (serviceId?: string) => void;
  onCloseBooking?: () => void;
}

export function PublicServicesView({
  tenant,
  profile,
  services,
  isBookingOpen: externalIsOpen,
  theme,
  onOpenBooking: externalOnOpen,
  onCloseBooking: externalOnClose,
}: PublicServicesViewProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const isControlled = typeof externalIsOpen !== "undefined";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleOpenBooking = (serviceId?: string) => {
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    recordAnalyticsEvent(tenant.id, "click_booking", isMobile ? "mobile" : "desktop");

    setSelectedServiceId(serviceId || (services.length > 0 ? services[0].id : null));

    if (externalOnOpen) {
      externalOnOpen(serviceId);
    } else {
      setInternalIsOpen(true);
    }
  };

  const handleCloseBooking = () => {
    setSelectedServiceId(null);
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleWhatsAppClick = () => {
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    recordAnalyticsEvent(tenant.id, "click_whatsapp", isMobile ? "mobile" : "desktop");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <>
      <div
        id="servicos"
        className={`${currentTheme.roundedClass} border ${currentTheme.borderClass} ${currentTheme.bgCard} p-6 sm:p-8 shadow-sm space-y-6`}
      >
        {/* Header do Catálogo */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${currentTheme.borderClass} pb-4`}>
          <div>
            <div className={`inline-flex items-center gap-1.5 rounded-full ${currentTheme.badgeBg} px-2.5 py-0.5 text-xs font-semibold ${currentTheme.badgeText}`}>
              <span>{currentTheme.icons?.services || "✂️"}</span>
              <span>Catálogo de Serviços</span>
            </div>
            <h2 className={`mt-1 text-lg font-bold ${currentTheme.textPrimary}`}>
              Nossos Serviços & Agendamento
            </h2>
            <p className={`text-xs ${currentTheme.textMuted}`}>
              Selecione o serviço desejado para reservar seu horário de forma rápida e segura.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText} px-3 py-1 text-xs font-bold`}>
              {services.length} {services.length === 1 ? "serviço disponível" : "serviços disponíveis"}
            </span>
          </div>
        </div>

        {/* Lista de Serviços em Cards Elegantes */}
        {services.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs space-y-2">
            <Scissors className="h-8 w-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">Nenhum serviço cadastrado no momento.</p>
            <p className="text-slate-400">Entre em contato via WhatsApp para consultar os horários e valores.</p>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {services.map((service) => (
              <div
                key={service.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 hover:border-slate-300 hover:bg-slate-50/90 transition shadow-2xs"
              >
                {/* Informações do Serviço */}
                <div className="space-y-1 sm:max-w-[62%]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-700 transition">
                      {service.name}
                    </h3>
                  </div>

                  {service.description && (
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{service.duration_minutes} min</span>
                    </span>
                  </div>
                </div>

                {/* Preço e Botões de Conversão */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                  {service.price !== null && Number(service.price) > 0 ? (
                    <span
                      className="text-lg sm:text-xl font-black"
                      style={{ color: "var(--primary-color, #0d9488)" }}
                    >
                      {formatCurrency(Number(service.price))}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Sob Consulta
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {profile?.phone_whatsapp && (
                      <a
                        href={generateWhatsAppUrl(
                          profile.phone_whatsapp,
                          `👋 Olá! Gostaria de um orçamento/agendamento para o serviço: *${service.name}*.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleWhatsAppClick}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                          service.price === null || Number(service.price) <= 0
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-200"
                        }`}
                        title="Solicitar orçamento via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>
                          {service.price === null || Number(service.price) <= 0
                            ? "💬 Solicitar Orçamento via WhatsApp"
                            : "WhatsApp"}
                        </span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenBooking(service.id)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition hover:opacity-90 active:scale-95 shadow-xs ${
                        service.price !== null && Number(service.price) > 0
                          ? "text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      style={
                        service.price !== null && Number(service.price) > 0
                          ? { backgroundColor: "var(--primary-color, #0d9488)" }
                          : undefined
                      }
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>📅 Agendar Horário</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Agendamento */}
      <PublicBookingFlow
        tenantId={tenant.id}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        businessPhone={profile?.phone_whatsapp}
        businessAddress={profile?.address}
        services={services}
        selectedServiceId={selectedServiceId}
        isOpen={isOpen}
        onClose={handleCloseBooking}
      />
    </>
  );
}
