"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { sanitizePhoneNumber } from "@/utils/phone";
import { recordAnalyticsEvent } from "@/actions/analytics";

interface WhatsAppFloatingButtonProps {
  tenantId: string;
  tenantName: string;
  phoneWhatsapp?: string | null;
  customMessage?: string;
}

export function WhatsAppFloatingButton({
  tenantId,
  tenantName,
  phoneWhatsapp,
  customMessage,
}: WhatsAppFloatingButtonProps) {
  if (!phoneWhatsapp) return null;

  const cleanPhone = sanitizePhoneNumber(phoneWhatsapp);
  if (!cleanPhone) return null;

  const defaultMessage = `Olá, vi a vitrine de vocês e gostaria de agendar um atendimento/orçamento em ${tenantName}.`;
  const messageText = customMessage || defaultMessage;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleClick = () => {
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    recordAnalyticsEvent(tenantId, "click_whatsapp", isMobile ? "mobile" : "desktop");
  };

  return (
    <aside
      aria-label="Atendimento via WhatsApp"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-emerald-500/20"
        title={`Falar com ${tenantName} no WhatsApp`}
        aria-label="Abrir conversa no WhatsApp"
      >
        {/* Anel de Pulso Radiante (CRO Pulse Beacon) */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-40 animate-ping pointer-events-none" />

        {/* Ícone Nítido de Mensagem / WhatsApp */}
        <MessageCircle className="h-7 w-7 transition-transform group-hover:scale-110" />

        {/* Tooltip elegante em Desktop */}
        <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:inline-flex items-center px-3.5 py-1.5 rounded-xl bg-neutral-900/95 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-white/10 backdrop-blur-md">
          Conversar no WhatsApp
        </span>
      </a>
    </aside>
  );
}
