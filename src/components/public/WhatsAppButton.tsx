"use client";

import { recordAnalyticsEvent } from "@/actions/analytics";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  tenantId: string;
  url: string;
  businessName: string;
  className?: string;
  size?: "default" | "large";
}

export function WhatsAppButton({
  tenantId,
  url,
  businessName,
  className = "",
  size = "default",
}: WhatsAppButtonProps) {
  const handleClick = () => {
    // Determina tipo de dispositivo básico sem PII
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    recordAnalyticsEvent(
      tenantId,
      "click_whatsapp",
      isMobile ? "mobile" : "desktop"
    );
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2.5 rounded-xl font-bold transition shadow-sm ${
        size === "large"
          ? "w-full py-4 px-6 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-lg"
          : "px-4 py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
      } ${className}`}
    >
      <MessageCircle className={size === "large" ? "h-5 w-5" : "h-4 w-4"} />
      <span>Falar no WhatsApp</span>
    </a>
  );
}
