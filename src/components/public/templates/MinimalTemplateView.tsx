"use client";

import React from "react";
import {
  MessageCircle,
  Phone,
  Clock,
  MapPin,
  Calendar,
  ExternalLink,
  Star,
  Check,
} from "lucide-react";
import type { TemplateViewProps } from "./ConversionTemplateView";
import { generateWhatsAppUrl, sanitizePhoneNumber, formatBrazilianPhone } from "@/utils/phone";
import { getContrastTextColor } from "@/utils/color";

export function MinimalTemplateView({
  tenant,
  profile,
  services,
  portfolioItems,
  reviews = [],
  posts = [],
  products = [],
  isOpenNow,
  statusBadgeText,
  statusDetailText,
  brandColor,
  theme,
  onOpenBooking,
}: TemplateViewProps) {
  const contrastText = getContrastTextColor(brandColor);
  const rawPhone = profile?.phone_whatsapp || profile?.phone || "";
  const cleanPhone = sanitizePhoneNumber(rawPhone);
  const formattedPhone = formatBrazilianPhone(rawPhone);
  const whatsappUrl = generateWhatsAppUrl(rawPhone, tenant.name);

  const realRating = profile?.google_rating ?? profile?.rating ?? tenant.google_rating ?? 5.0;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? tenant.google_reviews_count ?? reviews.length;

  const googleMapsUrl =
    profile?.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      tenant.name + " " + (profile?.address || "")
    )}`;

  // Formatação de horários da semana
  const hoursList = tenant.opening_hours || profile?.opening_hours_json || [];

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-8 sm:py-14 px-4 sm:px-6 bg-white text-neutral-900">
      
      {/* 1. HEADER MINIMALISTA & NOME DO NEGÓCIO */}
      <header className="space-y-4 border-b border-neutral-200 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
            {profile?.business_category || tenant.category || "Estabelecimento Local"}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono uppercase ${
              isOpenNow
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 border border-neutral-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isOpenNow ? "bg-emerald-400" : "bg-neutral-400"
              }`}
            />
            <span>{statusBadgeText || (isOpenNow ? "Aberto Agora" : "Fechado")}</span>
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-950 font-sans">
          {tenant.name}
        </h1>

        {profile?.address && (
          <p className="text-sm text-neutral-600 font-normal">
            {profile.address}
          </p>
        )}

        {(profile?.editorial_summary || profile?.description) && (
          <p className="text-base text-neutral-700 leading-relaxed max-w-2xl pt-2">
            {profile.editorial_summary || profile.description}
          </p>
        )}

        {/* Avaliação Discreta */}
        {realReviewCount > 0 && (
          <div className="flex items-center gap-2 pt-1 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-900">{Number(realRating).toFixed(1)} ★</span>
            <span>•</span>
            <span>{realReviewCount} avaliações no Google</span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600 transition"
            >
              Ver no Maps ↗
            </a>
          </div>
        )}
      </header>

      {/* 2. SERVIÇOS & CARDÁPIO COM PREÇOS CLAROS */}
      {services.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950 uppercase font-mono">
              Serviços & Preços
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              {services.length} itens disponíveis
            </span>
          </div>

          <div className="divide-y divide-neutral-200">
            {services.map((service) => {
              const serviceWhatsappUrl = generateWhatsAppUrl(
                rawPhone,
                tenant.name,
                `Olá! Gostaria de agendar o serviço: ${service.name}.`
              );

              return (
                <div
                  key={service.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 group"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-base font-semibold text-neutral-900 group-hover:text-neutral-600 transition">
                        {service.name}
                      </h3>
                      {service.duration_minutes > 0 && (
                        <span className="text-xs font-mono text-neutral-400">
                          {service.duration_minutes}m
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:self-center">
                    <div className="text-right">
                      {service.price && Number(service.price) > 0 ? (
                        <span className="text-base font-mono font-bold text-neutral-950">
                          R$ {Number(service.price).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-neutral-500">
                          Sob consulta
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenBooking(service.id)}
                      className="text-xs font-medium px-3.5 py-1.5 rounded border border-neutral-300 hover:border-neutral-900 text-neutral-800 hover:bg-neutral-950 hover:text-white transition cursor-pointer"
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. PRODUTOS (SE HOUVER) */}
      {products.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950 uppercase font-mono">
              Produtos & Itens
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              {products.length} produtos
            </span>
          </div>

          <div className="divide-y divide-neutral-200">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">
                    {prod.name}
                  </h3>
                  {prod.description && (
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {prod.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono font-bold text-neutral-950">
                    R$ {Number(prod.price).toFixed(2)}
                  </span>
                  <a
                    href={generateWhatsAppUrl(
                      rawPhone,
                      tenant.name,
                      `Olá! Tenho interesse no produto: ${prod.name}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium px-3 py-1 rounded border border-neutral-300 hover:border-neutral-900 text-neutral-800 hover:bg-neutral-950 hover:text-white transition"
                  >
                    Pedir
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. HORÁRIO E ENDEREÇO */}
      <section className="border-t border-neutral-200 pt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna 1: Horários */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-mono flex items-center gap-2">
            <Clock className="h-4 w-4 text-neutral-500" />
            <span>Horário de Funcionamento</span>
          </h2>

          {hoursList.length > 0 ? (
            <div className="space-y-1.5 text-xs font-mono text-neutral-600 divide-y divide-neutral-100">
              {hoursList.map((h: string, idx: number) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex justify-between">
                  <span>{h}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 font-mono">
              Consulte horários diretamente via WhatsApp.
            </p>
          )}
        </div>

        {/* Coluna 2: Endereço & Localização */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-mono flex items-center gap-2">
            <MapPin className="h-4 w-4 text-neutral-500" />
            <span>Localização</span>
          </h2>

          <p className="text-xs text-neutral-700 leading-relaxed font-mono">
            {profile?.address || "Atendimento local"}
          </p>

          <div className="pt-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-900 hover:text-neutral-600 underline underline-offset-4 transition"
            >
              <span>Abrir no Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* 5. BOTÕES DE CONTATO OUTLINED DISCRETOS */}
      <footer className="border-t border-neutral-200 pt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="text-xs text-neutral-500 font-mono">
          © {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {cleanPhone && (
            <a
              href={`tel:+55${cleanPhone}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-800 hover:border-neutral-900 text-xs font-medium transition"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{formattedPhone || "Ligar"}</span>
            </a>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-900 bg-white hover:bg-neutral-900 hover:text-white text-neutral-900 text-xs font-medium transition"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Falar no WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => onOpenBooking()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            style={{ backgroundColor: brandColor, color: contrastText }}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Agendar Horário</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
