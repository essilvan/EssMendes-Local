"use client";

import React, { useState } from "react";
import { PetShopBackground } from "./PetShopBackground";
import { ConfectioneryBackground } from "./ConfectioneryBackground";
import { AutomotiveBackground } from "./AutomotiveBackground";
import { RestaurantBackground } from "./RestaurantBackground";
import type {
  Service,
  TenantProfile,
  PortfolioItem,
  TenantReview,
  TenantPost,
  TenantProduct,
  TenantProfessional,
  MenuCategory,
  MenuItem,
} from "@/types";
import { getThemeColorStyles, getContrastTextColor } from "@/utils/color";
import { getTenantTheme, NICHE_THEMES } from "@/config/tenant-themes";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { MobileStickyBar } from "./MobileStickyBar";
import { PublicBookingFlow } from "./PublicBookingFlow";
import { PublicPageTracker } from "./PublicPageTracker";
import { ConversionTemplateView } from "./templates/ConversionTemplateView";
import { MinimalTemplateView } from "./templates/MinimalTemplateView";
import { ModernTemplateView } from "./templates/ModernTemplateView";
import { PremiumTemplateView } from "./templates/PremiumTemplateView";
import { WhatsAppFloatingButton } from "./WhatsAppFloatingButton";
import { VehicleQuoteModal } from "./VehicleQuoteModal";
import { PublicRestaurantMenuSection } from "./PublicRestaurantMenuSection";
import { getUnifiedEstablishmentPhotos } from "@/utils/establishment-photos";
import { getCtaButtonText, isAutomotiveNiche, isRestaurantNiche } from "@/utils/showcase";
import { CarFront, Wrench, Gauge, ShieldCheck } from "lucide-react";
import type { BusinessAttributes as BusinessAttributesType } from "@/types";

interface PublicTenantHubProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    headline?: string | null;
    cta_text?: string | null;
    highlights?: any[] | null;
    tags?: string[] | null;
    services?: Service[];
    place_id?: string | null;
    google_place_id?: string | null;
    address?: string | null;
    category?: string | null;
    google_types?: string[] | null;
    theme_niche?: string | null;
    theme_settings?: {
      template_id?: string;
      template?: string;
      niche?: string;
      primary_color?: string;
      cta_text?: string;
      [key: string]: any;
    } | null;
    google_rating?: number | null;
    google_reviews_count?: number | null;
    opening_hours?: string[] | null;
    business_attributes?: BusinessAttributesType | null;
    cover_image_url?: string | null;
    photos?: string[] | null;
    google_photo_url?: string | null;
    phone?: string | null;
    [key: string]: any;
  };
  profile: TenantProfile | null;
  services: Service[];
  professionals?: TenantProfessional[];
  portfolioItems: PortfolioItem[];
  reviews?: TenantReview[];
  posts?: TenantPost[];
  products?: TenantProduct[];
  menuCategories?: MenuCategory[];
  menuItems?: MenuItem[];
  isOpenNow: boolean;
  statusBadgeText?: string;
  statusDetailText?: string;
}

export function getThemeClasses(themeNiche: string | null | undefined) {
  switch (themeNiche) {
    case "automotive":
    case "automotivo":
    case "auto":
      return {
        root: "bg-[#0f172a] text-slate-100 dark",
        card: "bg-slate-800/95 border-slate-700/80 text-slate-100 shadow-xl shadow-black/50 backdrop-blur-sm",
        textMuted: "text-slate-400",
        accentText: "text-blue-400",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        button: "bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 text-white font-extrabold shadow-lg shadow-blue-600/25",
        heroTagline: "Serviço Técnico de Precisão, Diagnóstico Avançado & Segurança",
      };
    case "restaurant":
    case "gastronomia":
    case "food":
    case "restaurante":
      return {
        root: "bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0d0d0f] text-zinc-100 dark",
        card: "bg-[#1f1f23]/80 border-zinc-700/60 text-zinc-100 backdrop-blur-sm rounded-2xl shadow-xl",
        textMuted: "text-zinc-300",
        accentText: "text-amber-400",
        badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        button: "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-lg shadow-amber-500/20",
        heroTagline: "Sabores Memoráveis, Ingredientes Nobres & Momentos Especiais",
      };
    case "estetica_saude":
    case "health_beauty":
      return {
        root: "bg-slate-50 text-slate-800",
        card: "bg-white/95 border-slate-200 text-slate-800 shadow-md",
        textMuted: "text-slate-500",
        accentText: "text-teal-700",
        badge: "bg-teal-50 text-teal-800 border-teal-200",
        button: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold",
        heroTagline: "Cuidado Especializado & Bem-Estar",
      };
    case "barbearia":
      return {
        root: "bg-stone-950 text-stone-100 dark",
        card: "bg-stone-900 border-stone-800 text-stone-100 shadow-xl",
        textMuted: "text-stone-400",
        accentText: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        button: "bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold",
        heroTagline: "Corte Tradicional, Estilo & Atendimento de Primeira",
      };
    case "petshop":
    case "pet":
      return {
        root: "bg-[#fffbf5] text-stone-900",
        card: "bg-white/95 border-amber-200/90 text-stone-900 shadow-md shadow-amber-950/5 backdrop-blur-sm",
        textMuted: "text-stone-600",
        accentText: "text-amber-800",
        badge: "bg-amber-100/90 text-amber-900 border-amber-300/60",
        button: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-extrabold shadow-md shadow-orange-500/25",
        heroTagline: "Amor, Cuidado & Carinho para o Seu Melhor Amigo",
      };
    case "confeitaria":
    case "bakery":
    case "confectionery":
    case "bolos":
    case "doceria":
      return {
        root: "bg-[#fffdf9] text-rose-950",
        card: "bg-white/95 border-rose-200/90 text-rose-950 shadow-md shadow-rose-950/5 backdrop-blur-sm",
        textMuted: "text-rose-800/80",
        accentText: "text-rose-600",
        badge: "bg-rose-100/90 text-rose-900 border-rose-300/60",
        button: "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold shadow-md shadow-rose-500/25 rounded-full",
        heroTagline: "Doces Artesanais, Bolos de Festa & Momentos Inesquecíveis",
      };
    case "servicos":
    case "retail_default":
    default:
      return {
        root: "bg-white text-gray-900",
        card: "bg-white border-gray-200 text-gray-900 shadow-sm",
        textMuted: "text-gray-500",
        accentText: "text-blue-600",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        button: "bg-blue-600 hover:bg-blue-700 text-white font-semibold",
        heroTagline: "Qualidade, Variedade e Atendimento Direto",
      };
  }
}

export function PublicTenantHub({
  tenant,
  profile,
  services,
  professionals = [],
  portfolioItems,
  reviews = [],
  posts = [],
  products = [],
  menuCategories = [],
  menuItems = [],
  isOpenNow,
  statusBadgeText,
  statusDetailText,
}: PublicTenantHubProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isVehicleQuoteOpen, setIsVehicleQuoteOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(
    null
  );

  const activeTemplate =
    (tenant.theme_settings?.template_id as
      | "conversion"
      | "minimal"
      | "modern"
      | "premium") ||
    (profile?.template_id as any) ||
    "premium";
  const brandColor =
    tenant.theme_settings?.primary_color || profile?.primary_color || "#e11d48";
  const colorStyles = getThemeColorStyles(brandColor);
  const effectiveNiche =
    tenant.niche ||
    tenant.theme_settings?.niche ||
    tenant.theme_niche ||
    profile?.template_id;
  const isRestaurant = isRestaurantNiche(
    tenant,
    profile,
    effectiveNiche,
    menuCategories,
    menuItems
  );
  const ctaButtonText = isRestaurant
    ? "Ver Cardápio"
    : getCtaButtonText(
        tenant,
        effectiveNiche,
        tenant.category || profile?.business_category
      );

  const templateClasses: Record<string, string> = {
    premium: "template-premium font-serif-headings",
    modern: "template-modern bento-layout",
    minimal: "template-minimal font-mono-accents",
    conversion: "template-conversion cta-high-contrast",
  };
  const selectedTemplateClass =
    templateClasses[activeTemplate] || templateClasses.premium;

  const visibleReviews = (reviews || []).filter((r) => r.is_visible !== false);
  const realRating = profile?.google_rating ?? profile?.rating ?? tenant.google_rating ?? 5.0;
  const realReviewCount =
    profile?.google_reviews_count ?? profile?.review_count ?? tenant.google_reviews_count ?? visibleReviews.length;

  const handleOpenBooking = (serviceId?: string, professionalId?: string) => {
    if (isRestaurant) {
      const menuEl = document.getElementById("cardapio");
      if (menuEl) {
        menuEl.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    setSelectedServiceId(
      serviceId || (services.length > 0 ? services[0].id : null)
    );
    setSelectedProfessionalId(professionalId || null);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedServiceId(null);
    setSelectedProfessionalId(null);
  };

  const isPetShop = effectiveNiche === "petshop" || effectiveNiche === "pet";
  const isConfectionery =
    effectiveNiche === "confeitaria" ||
    effectiveNiche === "bakery" ||
    effectiveNiche === "confectionery" ||
    effectiveNiche === "bolos" ||
    effectiveNiche === "doceria";
  const isAutomotive =
    effectiveNiche === "automotive" ||
    effectiveNiche === "automotivo" ||
    effectiveNiche === "auto" ||
    effectiveNiche === "mecanica" ||
    isAutomotiveNiche(tenant, profile, effectiveNiche);
  const isAuto = isAutomotive || effectiveNiche === "barbearia";
  const isFood = isRestaurant;
  const isHealth = effectiveNiche === "health_beauty" || effectiveNiche === "estetica_saude";

  const currentTheme = isRestaurant
    ? NICHE_THEMES.restaurant
    : getTenantTheme(
        effectiveNiche,
        tenant.category || profile?.business_category,
        tenant.google_types || []
      );

  const heroBg =
    tenant.cover_image_url ||
    (tenant as any).tenant_profiles?.cover_image_url ||
    (tenant as any).tenant_profiles?.hero_image_url ||
    profile?.cover_image_url ||
    profile?.hero_image_url ||
    (Array.isArray(tenant.photos) && tenant.photos.length > 0 ? tenant.photos[0] : null) ||
    tenant.google_photo_url ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80";

  const { heroImage, galleryPhotos, allPhotos } = getUnifiedEstablishmentPhotos(
    tenant,
    profile
  );
  const effectiveHero = heroBg || heroImage;

  return (
    <div
      style={{ ...colorStyles, "--brand-primary": brandColor } as React.CSSProperties}
      className={`min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-200 relative flex flex-col ${selectedTemplateClass} ${
        isRestaurant
          ? "bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0d0d0f] text-zinc-100 dark"
          : activeTemplate === "minimal"
          ? "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
          : isPetShop
          ? "bg-[#fffbf5] text-stone-900"
          : isConfectionery
          ? "bg-[#fffdf9] text-rose-950"
          : isAutomotive
          ? "bg-[#0f172a] text-slate-100 dark"
          : isAuto
          ? "bg-zinc-950 text-zinc-100"
          : isFood
          ? "bg-zinc-950 text-zinc-100 dark"
          : isHealth
          ? "bg-slate-50 text-slate-900"
          : "bg-neutral-50/50 text-neutral-900"
      } selection:bg-neutral-900 selection:text-white`}
    >
      {/* Elementos Decorativos de Fundo Exclusivos do Nicho Pet Shop */}
      {isPetShop && <PetShopBackground />}

      {/* Elementos Decorativos de Fundo Exclusivos do Nicho Confeitaria & Bolos */}
      {isConfectionery && <ConfectioneryBackground />}

      {/* Elementos Decorativos de Fundo Exclusivos do Nicho Automotivo & Mecânica */}
      {isAutomotive && <AutomotiveBackground />}

      {/* Elementos Decorativos de Fundo Exclusivos do Nicho Restaurantes & Gastronomia */}
      {isRestaurant && <RestaurantBackground />}

      {/* Tracker de Analytics (Zero PII) */}
      <PublicPageTracker tenantId={tenant.id} />

      {/* 1. Header Dinâmico (Minimalista no 'minimal' ou Completo nos demais) */}
      {activeTemplate !== "minimal" ? (
        <PublicHeader
          tenantName={tenant.name}
          tenantSlug={tenant.slug}
          logoUrl={profile?.logo_url}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          address={profile?.address}
          latitude={profile?.latitude}
          longitude={profile?.longitude}
          openingHours={tenant.opening_hours || profile?.opening_hours_json}
          isOpenNow={isOpenNow}
          statusBadgeText={statusBadgeText}
          statusDetailText={statusDetailText}
          theme={currentTheme}
          ctaText={ctaButtonText}
          onOpenBooking={() => (isAutomotive ? setIsVehicleQuoteOpen(true) : handleOpenBooking())}
        />
      ) : (
        <nav className="w-full sticky top-0 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200/50 z-40 px-4 sm:px-6 py-3.5 transition-colors">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.logo_url && (
                <img
                  src={profile.logo_url}
                  alt={tenant.name}
                  className="h-8 w-8 rounded-xl object-contain border border-zinc-200/60 dark:border-white/10 shadow-xs"
                />
              )}
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-50 font-mono uppercase">
                {tenant.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => (isAutomotive ? setIsVehicleQuoteOpen(true) : handleOpenBooking())}
              className="text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs"
              style={{ backgroundColor: brandColor, color: getContrastTextColor(brandColor) }}
            >
              {ctaButtonText}
            </button>
          </div>
        </nav>
      )}

      {/* Container Centralizado com Conteúdo Real Dinâmico por Template */}
      <main
        className={`relative z-10 mx-auto w-full overflow-x-hidden px-4 sm:px-6 lg:px-8 ${
          isRestaurant
            ? "max-w-5xl py-4 sm:py-8"
            : "max-w-7xl py-8 sm:py-14 md:py-16"
        }`}
      >
        {/* Faixa de Triagem & Orçamento Inteligente por Placa (Exclusivo Nicho Automotivo / Mecânica) */}
        {isAutomotive && (
          <div className="mb-8 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
              {/* Mini Placa Mercosul Decorativa */}
              <div className="rounded-xl border-2 border-slate-300 bg-white text-slate-950 overflow-hidden shadow-md shrink-0 min-w-[120px] text-center">
                <div className="bg-[#003399] text-white text-[8px] font-extrabold tracking-widest uppercase py-0.5 px-2 flex items-center justify-between">
                  <span>BR</span>
                  <span>MERCOSUL</span>
                </div>
                <div className="px-2.5 py-1.5 font-mono text-sm font-black tracking-widest">
                  ABC1D23
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>Triagem Técnica por Placa • Histórico Integrado</span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Precisa de revisão, diagnóstico ou reparo mecânico?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Informe a placa, modelo e o sintoma do veículo para registrar sua ficha e adiantar seu orçamento direto no WhatsApp da oficina.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVehicleQuoteOpen(true)}
              className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 h-12 sm:h-14 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 whitespace-nowrap font-medium text-sm sm:text-base transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Wrench className="h-4 w-4 shrink-0" />
              <span>Solicitar Orçamento por Placa</span>
            </button>
          </div>
        )}

        {activeTemplate === "conversion" && (
          <ConversionTemplateView
            tenant={tenant}
            profile={profile}
            services={services}
            professionals={professionals}
            portfolioItems={portfolioItems}
            reviews={visibleReviews}
            posts={posts}
            products={products}
            menuCategories={menuCategories}
            menuItems={menuItems}
            isOpenNow={isOpenNow}
            statusBadgeText={statusBadgeText}
            statusDetailText={statusDetailText}
            brandColor={brandColor}
            theme={currentTheme}
            heroImage={effectiveHero}
            galleryPhotos={galleryPhotos}
            onOpenBooking={handleOpenBooking}
            onOpenVehicleQuote={() => setIsVehicleQuoteOpen(true)}
          />
        )}

        {activeTemplate === "minimal" && (
          <MinimalTemplateView
            tenant={tenant}
            profile={profile}
            services={services}
            professionals={professionals}
            portfolioItems={portfolioItems}
            reviews={visibleReviews}
            posts={posts}
            products={products}
            menuCategories={menuCategories}
            menuItems={menuItems}
            isOpenNow={isOpenNow}
            statusBadgeText={statusBadgeText}
            statusDetailText={statusDetailText}
            brandColor={brandColor}
            theme={currentTheme}
            heroImage={effectiveHero}
            galleryPhotos={galleryPhotos}
            onOpenBooking={handleOpenBooking}
            onOpenVehicleQuote={() => setIsVehicleQuoteOpen(true)}
          />
        )}

        {activeTemplate === "modern" && (
          <ModernTemplateView
            tenant={tenant}
            profile={profile}
            services={services}
            professionals={professionals}
            portfolioItems={portfolioItems}
            reviews={visibleReviews}
            posts={posts}
            products={products}
            menuCategories={menuCategories}
            menuItems={menuItems}
            isOpenNow={isOpenNow}
            statusBadgeText={statusBadgeText}
            statusDetailText={statusDetailText}
            brandColor={brandColor}
            theme={currentTheme}
            heroImage={effectiveHero}
            galleryPhotos={galleryPhotos}
            onOpenBooking={handleOpenBooking}
            onOpenVehicleQuote={() => setIsVehicleQuoteOpen(true)}
          />
        )}

        {(activeTemplate === "premium" ||
          (activeTemplate !== "conversion" &&
            activeTemplate !== "minimal" &&
            activeTemplate !== "modern")) && (
          <PremiumTemplateView
            tenant={tenant}
            profile={profile}
            services={services}
            professionals={professionals}
            portfolioItems={portfolioItems}
            reviews={visibleReviews}
            posts={posts}
            products={products}
            menuCategories={menuCategories}
            menuItems={menuItems}
            isOpenNow={isOpenNow}
            statusBadgeText={statusBadgeText}
            statusDetailText={statusDetailText}
            brandColor={brandColor}
            theme={currentTheme}
            heroImage={effectiveHero}
            galleryPhotos={galleryPhotos}
            onOpenBooking={handleOpenBooking}
            onOpenVehicleQuote={() => setIsVehicleQuoteOpen(true)}
          />
        )}
      </main>

      {/* Footer padrão para templates ricos (minimal possui seu footer dedicado) */}
      {activeTemplate !== "minimal" && (
        <PublicFooter
          tenantName={tenant.name}
          phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
          address={profile?.address || tenant.address}
          latitude={profile?.latitude}
          longitude={profile?.longitude}
          placeId={tenant.place_id || tenant.google_place_id || profile?.place_id || profile?.google_place_id}
          openingHours={tenant.opening_hours || profile?.opening_hours_json}
          isOpenNow={isOpenNow}
          statusBadgeText={statusBadgeText}
          statusDetailText={statusDetailText}
          googleMapsUrl={profile?.google_maps_url}
          onOpenBooking={() => handleOpenBooking()}
        />
      )}

      {/* 11. Barra Fixa Mobile com inteligência por template */}
      <MobileStickyBar
        tenantId={tenant.id}
        tenantName={tenant.name}
        phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
        address={profile?.address || tenant.address}
        latitude={profile?.latitude}
        longitude={profile?.longitude}
        placeId={tenant.place_id || tenant.google_place_id || profile?.place_id || profile?.google_place_id}
        googleMapsUrl={profile?.google_maps_url}
        isOpenNow={isOpenNow}
        statusBadgeText={statusBadgeText}
        statusDetailText={statusDetailText}
        openingHours={tenant.opening_hours || profile?.opening_hours_json}
        theme={currentTheme}
        activeTemplate={activeTemplate}
        brandColor={brandColor}
        ctaText={ctaButtonText}
        onOpenBooking={() => (isAutomotive ? setIsVehicleQuoteOpen(true) : handleOpenBooking())}
      />

      {/* 12. Botão Flutuante de WhatsApp (CRO Quick Action) */}
      <WhatsAppFloatingButton
        tenantId={tenant.id}
        tenantName={tenant.name}
        phoneWhatsapp={profile?.phone_whatsapp || profile?.phone}
      />

      {/* Modal / Drawer Global de Agendamento em 4 Passos */}
      <PublicBookingFlow
        tenantId={tenant.id}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        tenantPhone={tenant.phone || profile?.phone_whatsapp || profile?.phone}
        businessPhone={profile?.phone_whatsapp || tenant.phone}
        businessAddress={profile?.address || tenant.address}
        services={services}
        professionals={professionals}
        selectedServiceId={selectedServiceId}
        selectedProfessionalId={selectedProfessionalId}
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
      />

      {/* Modal de Solicitação de Orçamento por Placa (Nicho Automotivo) */}
      {isAutomotive && (
        <VehicleQuoteModal
          isOpen={isVehicleQuoteOpen}
          onClose={() => setIsVehicleQuoteOpen(false)}
          tenantId={tenant.id}
          tenantName={tenant.name}
          professionals={professionals}
          phoneWhatsapp={
            profile?.phone_whatsapp ||
            profile?.phone ||
            (tenant as any).whatsapp ||
            tenant.phone
          }
          brandColor={brandColor}
        />
      )}
    </div>
  );
}
