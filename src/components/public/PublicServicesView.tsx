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
} from "lucide-react";

interface PublicServicesViewProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  profile: TenantProfile | null;
  services: Service[];
}

export function PublicServicesView({
  tenant,
  profile,
  services,
}: PublicServicesViewProps) {
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const handleOpenBooking = (serviceId?: string) => {
    // Registra evento de clique em agendamento (Zero PII)
    const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    recordAnalyticsEvent(tenant.id, "click_booking", isMobile ? "mobile" : "desktop");

    setSelectedServiceId(serviceId || (services.length > 0 ? services[0].id : null));
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedServiceId(null);
  };

  const handleWhatsAppClick = () => {
    const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header do Catálogo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-teal-700" />
              <span>Catálogo de Serviços & Agendamento</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha o serviço desejado para agendar seu horário online em segundos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {services.length} {services.length === 1 ? "opção" : "opções"}
            </span>

            {services.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-900 transition"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Agendar Agora</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de Serviços */}
        {services.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Nenhum serviço disponível no momento. Entre em contato pelo WhatsApp para mais informações.
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 hover:border-teal-300 hover:bg-slate-50/90 transition shadow-2xs"
              >
                <div className="space-y-1 sm:max-w-[58%]">
                  <h3 className="text-base font-bold text-slate-900">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      {service.duration_minutes} min
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full">
                    <span className="text-base sm:text-xl font-extrabold text-teal-900">
                      {formatCurrency(Number(service.price))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenBooking(service.id)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-900 transition"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Agendar</span>
                    </button>

                    {profile?.phone_whatsapp && (
                      <a
                        href={generateWhatsAppUrl(
                          profile.phone_whatsapp,
                          `${tenant.name} - ${service.name}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleWhatsAppClick}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 transition"
                        title="Tirar dúvidas no WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
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
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
      />
    </>
  );
}
