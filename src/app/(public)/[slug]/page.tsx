import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";
import { PublicPageTracker } from "@/components/public/PublicPageTracker";
import { generateWhatsAppUrl } from "@/utils/phone";
import {
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  Sparkles,
  Scissors,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

interface PublicPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 1. Geração Dinâmica de Metadados SEO Local
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
    .select("description, logo_url, address")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  const title = `${tenant.name} | Catálogo de Serviços & Agendamento`;
  const description =
    profile?.description ||
    `Conheça os serviços, preços e faça seu atendimento no ${tenant.name}. Localizado em ${profile?.address || "Atendimento local"}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: profile?.logo_url ? [{ url: profile.logo_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// 2. Página Pública do Estabelecimento
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
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const activeServices = services || [];
  const whatsappUrl = generateWhatsAppUrl(
    profile?.phone_whatsapp || "",
    tenant.name
  );

  // Formatador de Moeda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Schema Estruturado JSON-LD (Schema.org LocalBusiness)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: tenant.name,
    description: profile?.description || undefined,
    telephone: profile?.phone_whatsapp || undefined,
    address: profile?.address
      ? {
          "@type": "PostalAddress",
          streetAddress: profile.address,
          addressCountry: "BR",
        }
      : undefined,
    image: profile?.logo_url || undefined,
    url: `https://local.essmendes.com.br/${tenant.slug}`,
    priceRange: "$$",
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900">
      
      {/* Injeção JSON-LD para SEO do Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Tracker de Analytics (Zero PII) */}
      <PublicPageTracker tenantId={tenant.id} />

      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-teal-950 via-teal-900 to-teal-800 text-white pb-16 pt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
          
          {/* Logo / Avatar */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl border-4 border-white/20 bg-white shadow-xl overflow-hidden">
            {profile?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logo_url}
                alt={`Logotipo de ${tenant.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-teal-800 text-white font-bold text-2xl sm:text-3xl">
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Badge de Verificação */}
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-teal-800/80 px-3 py-1 text-xs font-semibold text-teal-200 ring-1 ring-white/10">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>Estabelecimento Verificado</span>
          </div>

          {/* Nome do Negócio */}
          <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight">
            {tenant.name}
          </h1>

          {/* Descrição */}
          {profile?.description && (
            <p className="mt-3 max-w-xl text-sm sm:text-base text-teal-100/90 leading-relaxed">
              {profile.description}
            </p>
          )}

          {/* Endereço & Contato */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-teal-200">
            {profile?.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-teal-400 shrink-0" />
                <span>{profile.address}</span>
              </div>
            )}
            {profile?.phone_whatsapp && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-teal-400 shrink-0" />
                <span>{profile.phone_whatsapp}</span>
              </div>
            )}
          </div>

          {/* Botão de Destaque WhatsApp */}
          {profile?.phone_whatsapp && (
            <div className="mt-6 w-full max-w-sm">
              <WhatsAppButton
                tenantId={tenant.id}
                url={whatsappUrl}
                businessName={tenant.name}
                size="large"
              />
            </div>
          )}

        </div>
      </div>

      {/* Main Services Container */}
      <main className="mx-auto max-w-3xl -mt-8 px-4 pb-16 sm:px-6">
        
        {/* Catálogo de Serviços */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scissors className="h-5 w-5 text-teal-700" />
                <span>Catálogo de Serviços</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Escolha o serviço desejado para consultar detalhes e atendimento.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {activeServices.length} {activeServices.length === 1 ? "opção" : "opções"}
            </span>
          </div>

          {activeServices.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Nenhum serviço disponível no momento. Entre em contato pelo WhatsApp para mais informações.
            </div>
          ) : (
            <div className="space-y-4">
              {activeServices.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5 hover:border-teal-200 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    <span className="text-base sm:text-lg font-extrabold text-teal-800">
                      {formatCurrency(Number(service.price))}
                    </span>
                    {profile?.phone_whatsapp && (
                      <a
                        href={generateWhatsAppUrl(
                          profile.phone_whatsapp,
                          `${tenant.name} - ${service.name}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-xs font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-4"
                      >
                        Pedir pelo WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Informações Complementares */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Localização & Atendimento
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 block">Endereço:</span>
                <span>{profile?.address || "Consulte o endereço pelo WhatsApp."}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 block">WhatsApp:</span>
                <span>{profile?.phone_whatsapp || "Não informado."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé da Plataforma */}
        <footer className="mt-10 text-center text-xs text-slate-500">
          <p>
            Página profissional gerada por{" "}
            <a
              href="/"
              className="font-bold text-teal-700 hover:underline"
            >
              EssMendes Local
            </a>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Plataforma de presença digital e geração de clientes para negócios locais.
          </p>
        </footer>

      </main>

    </div>
  );
}
