import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";
import { PublicPageTracker } from "@/components/public/PublicPageTracker";
import { PublicServicesView } from "@/components/public/PublicServicesView";
import { BeforeAfterShowcase } from "@/components/public/BeforeAfterShowcase";
import { generateWhatsAppUrl, sanitizePhoneNumber } from "@/utils/phone";
import {
  MapPin,
  Phone,
  ShieldCheck,
  CalendarCheck2,
  Clock,
  ExternalLink,
  Navigation,
  Sparkles,
  Calendar,
} from "lucide-react";
import type { Service, TenantProfile, PortfolioItem } from "@/types";

interface PublicPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

// 1. Geração Dinâmica de Metadados SEO Local Avançado
export async function generateMetadata({
  params,
}: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) {
    return {
      title: "Estabelecimento Não Encontrado | EssMendes Local",
      description: "A página solicitada não foi encontrada.",
    };
  }

  const { data: profile } = await supabase
    .from("tenant_profiles")
    .select("description, logo_url, address, phone_whatsapp")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local.essmendes.com.br";
  const canonicalUrl = `${baseUrl}/${tenant.slug}`;

  const title = `${tenant.name} | Agendamento Online & Serviços`;
  const description =
    profile?.description ||
    `Conheça os serviços, preços e faça seu agendamento de horário online no ${tenant.name}. Localizado em ${profile?.address || "Atendimento local"}. WhatsApp: ${profile?.phone_whatsapp || ""}.`;

  const ogImages = profile?.logo_url
    ? [
        {
          url: profile.logo_url,
          width: 1200,
          height: 630,
          alt: `Logotipo e presença digital de ${tenant.name}`,
        },
      ]
    : [];

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "EssMendes Local",
      locale: "pt_BR",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    keywords: [
      tenant.name,
      "agendamento online",
      "horário marcado",
      "catálogo de serviços",
      "atendimento local",
      profile?.address ? profile.address.split(",")[0].trim() : "",
    ].filter(Boolean),
  };
}

// Helper para verificar se está aberto no momento (Segunda a Sábado, 08h às 18h)
function checkIsOpenNow(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Domingo, 6 = Sábado
  const hour = now.getHours();

  if (day === 0) return false; // Domingo fechado
  return hour >= 8 && hour < 18;
}

// 2. Página Pública do Estabelecimento (Redesign Moderno)
export default async function PublicTenantPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Busca o tenant pelo slug
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) {
    notFound();
  }

  // Busca dados de perfil do tenant
  const { data: profile } = await supabase
    .from("tenant_profiles")
    .select("*")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  // Busca catálogo de serviços ativos
  const { data: rawServices } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const activeServices: Service[] = (rawServices || []).map((s) => ({
    id: s.id,
    tenant_id: s.tenant_id,
    name: s.name,
    description: s.description,
    price: Number(s.price),
    duration_minutes: s.duration_minutes,
    is_active: s.is_active,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }));

  // Busca transformações de antes e depois
  const { data: rawPortfolio } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const portfolioItems = (rawPortfolio || []) as PortfolioItem[];

  const typedProfile: TenantProfile | null = profile
    ? {
        id: profile.id,
        tenant_id: profile.tenant_id,
        description: profile.description,
        phone_whatsapp: profile.phone_whatsapp,
        address: profile.address,
        logo_url: profile.logo_url,
        template_id: profile.template_id || "default",
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }
    : null;

  const whatsappUrl = generateWhatsAppUrl(
    profile?.phone_whatsapp || "",
    tenant.name
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local.essmendes.com.br";
  const canonicalUrl = `${baseUrl}/${tenant.slug}`;
  const cleanPhone = profile?.phone_whatsapp ? sanitizePhoneNumber(profile.phone_whatsapp) : null;
  const internationalPhone = cleanPhone ? `+55${cleanPhone}` : undefined;
  const isOpenNow = checkIsOpenNow();

  // Schema Estruturado Rich Data (Schema.org LocalBusiness + OfferCatalog)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": canonicalUrl,
    name: tenant.name,
    description: profile?.description || `Presença profissional e catálogo de serviços de ${tenant.name}.`,
    url: canonicalUrl,
    telephone: internationalPhone,
    image: profile?.logo_url || undefined,
    priceRange: "R$",
    address: profile?.address
      ? {
          "@type": "PostalAddress",
          streetAddress: profile.address,
          addressCountry: "BR",
        }
      : undefined,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    hasOfferCatalog: activeServices.length > 0
      ? {
          "@type": "OfferCatalog",
          name: "Catálogo de Serviços Disponíveis",
          itemListElement: activeServices.map((srv, idx) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: srv.name,
              description: srv.description || undefined,
            },
            price: Number(srv.price).toFixed(2),
            priceCurrency: "BRL",
            position: idx + 1,
          })),
        }
      : undefined,
  };

  const googleMapsUrl = profile?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`
    : null;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 selection:bg-teal-700 selection:text-white">
      {/* Injeção JSON-LD para SEO Local */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Tracker de Analytics (Zero PII) */}
      <PublicPageTracker tenantId={tenant.id} />

      {/* Hero Header Moderno com Gradiente e Texturas */}
      <header className="relative bg-gradient-to-b from-teal-950 via-teal-900 to-teal-850 text-white pb-20 pt-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
          
          {/* Logo / Avatar com Borda e Sombra Suave */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl border-4 border-white/20 bg-white shadow-2xl overflow-hidden ring-4 ring-white/10">
            {profile?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logo_url}
                alt={`Logotipo de ${tenant.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-teal-850 text-white font-black text-2xl sm:text-3xl">
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Badges de Status (Aberto Agora + Verificado) */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ring-1 ${
                isOpenNow
                  ? "bg-emerald-500/20 text-emerald-300 ring-emerald-400/30"
                  : "bg-amber-500/20 text-amber-300 ring-amber-400/30"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOpenNow ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span>{isOpenNow ? "Aberto Agora" : "Fechado no Momento"}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-800/80 px-3 py-0.5 text-xs font-semibold text-teal-200 ring-1 ring-white/15">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              <span>Estabelecimento Verificado</span>
            </div>
          </div>

          {/* Nome do Negócio */}
          <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white">
            {tenant.name}
          </h1>

          {/* Descrição */}
          {profile?.description && (
            <p className="mt-2.5 max-w-xl text-xs sm:text-sm text-teal-100/90 leading-relaxed font-normal">
              {profile.description}
            </p>
          )}

          {/* Informações Rápidas de Localização */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-teal-200">
            {profile?.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>{profile.address}</span>
              </div>
            )}
            {profile?.phone_whatsapp && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>{profile.phone_whatsapp}</span>
              </div>
            )}
          </div>

          {/* Botões de Ação Rápida no Hero */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
            {profile?.phone_whatsapp && (
              <div className="flex-1 min-w-[180px]">
                <WhatsAppButton
                  tenantId={tenant.id}
                  url={whatsappUrl}
                  businessName={tenant.name}
                  size="large"
                />
              </div>
            )}

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-xs font-bold text-white backdrop-blur-xs hover:bg-white/20 transition shadow-xs"
                title="Abrir no Google Maps"
              >
                <Navigation className="h-4 w-4 text-teal-300" />
                <span>Ver Mapa</span>
              </a>
            )}
          </div>

        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-3xl -mt-8 px-4 pb-20 sm:px-6 space-y-8">
        
        {/* Catálogo Interativo com Agendamento Online */}
        <section>
          <PublicServicesView
            tenant={tenant}
            profile={typedProfile}
            services={activeServices}
          />
        </section>

        {/* Seção de Antes & Depois (Se houver transformações cadastradas) */}
        {portfolioItems.length > 0 && (
          <section>
            <BeforeAfterShowcase items={portfolioItems} />
          </section>
        )}

        {/* Informações de Atendimento & Horários */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Horários de Atendimento & Localização
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Venha nos visitar ou agende seu horário com antecedência.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 text-xs">
            {/* Horários da Semana */}
            <div className="space-y-3">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-teal-700" />
                <span>Expediente de Trabalho:</span>
              </span>

              <ul className="space-y-2 border border-slate-100 rounded-xl bg-slate-50/60 p-3 text-slate-700">
                <li className="flex justify-between pb-1 border-b border-slate-200/60">
                  <span>Segunda a Sexta:</span>
                  <strong className="text-teal-900">08:00 às 18:00</strong>
                </li>
                <li className="flex justify-between pb-1 border-b border-slate-200/60">
                  <span>Sábado:</span>
                  <strong className="text-teal-900">08:00 às 18:00</strong>
                </li>
                <li className="flex justify-between text-slate-400">
                  <span>Domingo:</span>
                  <span>Fechado</span>
                </li>
              </ul>
            </div>

            {/* Endereço e Contato */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-teal-700" />
                  <span>Endereço:</span>
                </span>
                <p className="text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {profile?.address || "Consulte o endereço detalhado via WhatsApp."}
                </p>
              </div>

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-bold text-teal-800 hover:bg-slate-50 transition shadow-2xs"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Traçar Rota no Google Maps</span>
                  <ExternalLink className="h-3 w-3 text-slate-400 ml-1" />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Rodapé da Plataforma */}
        <footer className="pt-6 text-center text-xs text-slate-500 space-y-1">
          <p>
            Página profissional gerada por{" "}
            <a href="/" className="font-bold text-teal-700 hover:underline">
              EssMendes Local
            </a>
          </p>
          <p className="text-[11px] text-slate-400">
            Plataforma de presença digital e geração de clientes para negócios locais.
          </p>
        </footer>

      </main>
    </div>
  );
}
