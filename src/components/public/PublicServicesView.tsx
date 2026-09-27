"use client";

import React, { useState } from "react";
import type { Service, TenantProfile, TenantProfessional } from "@/types";
import { PublicBookingFlow } from "./PublicBookingFlow";
import { generateWhatsAppUrl } from "@/utils/phone";
import { recordAnalyticsEvent } from "@/actions/analytics";
import {
  Scissors,
  Clock,
  Clock as ClockIcon,
  Calendar,
  MessageCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Eye,
} from "lucide-react";

import type { NicheThemeConfig } from "@/config/tenant-themes";
import { NICHE_THEMES } from "@/config/tenant-themes";
import { ItemDetailModal, type ItemDetailData } from "./ItemDetailModal";

interface PublicServicesViewProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    category?: string | null;
    segment?: string | null;
    template?: string | null;
    theme_niche?: string | null;
    [key: string]: any;
  };
  profile: TenantProfile | null;
  services: Service[];
  professionals?: TenantProfessional[];
  isBookingOpen?: boolean;
  theme?: NicheThemeConfig;
  brandColor?: string;
  onOpenBooking?: (serviceId?: string) => void;
  onCloseBooking?: () => void;
}

export function PublicServicesView({
  tenant,
  profile,
  services,
  professionals = [],
  isBookingOpen: externalIsOpen,
  theme,
  brandColor,
  onOpenBooking: externalOnOpen,
  onCloseBooking: externalOnClose,
}: PublicServicesViewProps) {
  const currentTheme = theme || NICHE_THEMES.retail_default;
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ItemDetailData | null>(null);

  const isControlled = typeof externalIsOpen !== "undefined";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  // Identificar segmento do tenant
  const isTimeBasedNiche = ['barbearia', 'salao', 'estetica', 'salao_beleza', 'beleza'].some(n => 
    (tenant.category || (tenant as any).segment || (tenant as any).template || (tenant as any).theme_niche || profile?.business_category || profile?.template_id || '').toLowerCase().includes(n)
  );

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
            {services.map((service) => {
              // Só exibir o badge de tempo se houver valor preenchido E (for nicho de agendamento OU o lojista definiu explicitamente com show_duration)
              const shouldShowDuration = service.duration_minutes && (isTimeBasedNiche || service.show_duration);

              return (
                <div
                  key={service.id}
                  onClick={() =>
                    setSelectedDetailItem({
                      title: service?.name ?? "",
                      description: service?.description,
                      price: service?.price,
                      duration_minutes: service?.duration_minutes,
                      show_duration: service?.show_duration,
                      isService: true,
                    })
                  }
                  className="group rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col justify-between gap-3.5 cursor-pointer"
                >
                  {/* Informações do Serviço */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {service?.name ?? ""}
                      </h3>
                      {/* Preço em destaque tipográfico legível */}
                      <span className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white shrink-0">
                        {service.price && Number(service.price) > 0
                          ? formatCurrency(Number(service.price))
                          : "Sob Consulta"}
                      </span>
                    </div>

                    {service.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    <div className="pt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                      <Eye className="h-3 w-3" />
                      <span>Ver detalhes</span>
                    </div>
                  </div>

                  {/* Divisória subtil e Botões de Conversão */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {/* Duração (ícone de relógio + minutos) */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      <ClockIcon className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                      <span>{service.duration_minutes ? `${service.duration_minutes} min` : "Sob agendamento"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {profile?.phone_whatsapp && (
                        <a
                          href={generateWhatsAppUrl(
                            profile.phone_whatsapp,
                            `👋 Olá! Gostaria de um orçamento/agendamento para o serviço: *${service?.name ?? ""}*.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsAppClick();
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition"
                          title="Solicitar orçamento via WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}

                      {/* Botão explícito de Agendar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBooking(service.id);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer"
                        style={{
                          backgroundColor: brandColor || "var(--brand-primary, #0d9488)",
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Agendar</span>
                      </button>
                    </div>
                  </div>
                </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Serviço */}
      <ItemDetailModal
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        item={selectedDetailItem}
        phone={profile?.phone_whatsapp || profile?.phone}
        tenantName={tenant.name}
        themeNiche={tenant.theme_niche || tenant.category}
      />

      {/* Modal de Agendamento */}
      <PublicBookingFlow
        tenantId={tenant.id}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        businessPhone={profile?.phone_whatsapp}
        businessAddress={profile?.address}
        services={services}
        professionals={professionals}
        selectedServiceId={selectedServiceId}
        isOpen={isOpen}
        onClose={handleCloseBooking}
      />
    </>
  );
}
