import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { Settings, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  let tenant: any = null;
  let profile: any = null;
  let settings: any[] = [];
  let rawServices: any[] = [];
  let user: any = null;
  let tenantError: string | null = null;

  try {
    const supabase = await createClient(); // cliente server com cookies

    // 1. Buscar usuário logado
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    user = authUser || null;

    if (authError) {
      console.warn("[ConfiguracoesPage] Aviso ao obter auth user:", authError.message);
    }

    // 2. Tentar obter o contexto do tenant autenticado via getAuthenticatedTenant
    let authenticatedTenantId: string | null = null;
    try {
      const tenantRes = await getAuthenticatedTenant();
      if (tenantRes?.data?.tenantId) {
        authenticatedTenantId = tenantRes.data.tenantId;
      }
      if (tenantRes?.error) {
        tenantError = tenantRes.error;
      }
    } catch (authErr: any) {
      console.warn("[ConfiguracoesPage] Aviso defensivo ao autenticar tenant:", authErr);
      tenantError = authErr?.message || null;
    }

    // 3. Buscar tenant no banco usando maybeSingle()
    if (authenticatedTenantId) {
      const { data: tenantData, error: tErr } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", authenticatedTenantId)
        .maybeSingle();

      if (!tErr && tenantData) {
        tenant = tenantData;
      } else if (tErr) {
        console.warn("[ConfiguracoesPage] Aviso ao buscar tenant por ID:", tErr.message);
      }
    }

    // Fallback: se não encontrou pelo authenticatedTenantId e temos usuário logado
    if (!tenant && user) {
      const { data: tenantData, error: fallbackErr } = await supabase
        .from("tenants")
        .select("*")
        .maybeSingle();

      if (!fallbackErr && tenantData) {
        tenant = tenantData;
      }
    }

    // 4. Buscar profile no banco usando maybeSingle()
    if (tenant?.id) {
      const { data: profileData, error: pErr } = await supabase
        .from("tenant_profiles")
        .select("*")
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (!pErr && profileData) {
        profile = profileData;
      } else if (pErr) {
        console.warn("[ConfiguracoesPage] Aviso ao buscar profile:", pErr.message);
      }

      // 5. Buscar serviços cadastrados usando select
      try {
        const { data: servs, error: sErr } = await supabase
          .from("services")
          .select("id, name, description, price, duration_minutes, is_active, created_at")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false });

        if (!sErr && servs) {
          rawServices = servs;
        }
      } catch (sEx) {
        console.warn("[ConfiguracoesPage] Aviso ao buscar services:", sEx);
      }
    }

    // 6. Buscar platform_settings com tolerância a ausência da tabela
    try {
      const { data: settingsData, error: setErr } = await supabase
        .from("platform_settings")
        .select("*");

      if (!setErr && settingsData) {
        settings = settingsData;
      }
    } catch (setEx) {
      console.warn("[ConfiguracoesPage] Aviso platform_settings:", setEx);
    }
  } catch (err) {
    console.error("Erro defensivo ao carregar dados de configuracoes:", err);
  }

  // 2. TRATAMENTO DE VALORES NULOS NO RETORNO:
  // Garantir que tenant e profile passem com objetos padrão vazios `{}` caso venham nulos
  const safeTenant = tenant || {};
  const safeProfile = profile || {};

  let cleanPlacePhotos: string[] = [];
  if (safeProfile.place_photos) {
    if (Array.isArray(safeProfile.place_photos)) {
      cleanPlacePhotos = safeProfile.place_photos.filter(
        (p: any) => typeof p === "string" && p.trim().length > 0
      );
    } else if (typeof safeProfile.place_photos === "string") {
      try {
        const parsed = JSON.parse(safeProfile.place_photos);
        if (Array.isArray(parsed)) {
          cleanPlacePhotos = parsed.filter(
            (p: any) => typeof p === "string" && p.trim().length > 0
          );
        }
      } catch {
        if (safeProfile.place_photos.startsWith("http")) {
          cleanPlacePhotos = [safeProfile.place_photos];
        }
      }
    }
  }

  const initialData = {
    tenantId: safeTenant.id || "",
    companyName:
      safeTenant.name ||
      (user?.user_metadata?.company_name as string) ||
      "",
    description: safeProfile.description || "",
    editorialSummary: safeProfile.editorial_summary || safeProfile.description || "",
    phoneWhatsapp: safeProfile.phone_whatsapp || safeTenant.phone || "",
    address: safeProfile.address || safeTenant.address || "",
    logoUrl: safeProfile.logo_url || (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : ""),
    coverImageUrl:
      safeTenant.cover_image_url ||
      safeProfile.cover_image_url ||
      safeProfile.hero_image_url ||
      "",
    placePhotos: cleanPlacePhotos,
    primaryColor:
      safeTenant.theme_settings?.primary_color ||
      safeProfile.primary_color ||
      "#0d9488",
    themeNiche:
      safeTenant.theme_settings?.niche ||
      safeProfile.template_id ||
      safeTenant.theme_niche ||
      "servicos",
    themeSettings: safeTenant.theme_settings || null,
    googleMapsUrl: safeProfile.google_maps_url || "",
    rating: safeProfile.rating ? Number(safeProfile.rating) : 4.9,
    reviewCount: safeProfile.review_count ? Number(safeProfile.review_count) : 128,
    slug: safeTenant.slug || "",
    businessAttributes:
      safeTenant.business_attributes ||
      safeProfile.business_attributes ||
      null,
    services: (rawServices || []).map((s: any) => ({
      id: s?.id || "",
      name: s?.name || "Serviço",
      description: s?.description || null,
      price: s?.price !== null && s?.price !== undefined ? Number(s.price) : null,
      duration_minutes: Number(s?.duration_minutes) || 30,
      is_active: Boolean(s?.is_active),
      created_at: s?.created_at || new Date().toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
          <Settings className="h-3.5 w-3.5" />
          <span>Configurações do Estabelecimento</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Perfil & Informações Públicas
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Personalize as informações do seu negócio que aparecem para seus clientes.
        </p>
      </div>

      {tenantError && !tenant && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Aviso de sincronização:</p>
            <p className="mt-0.5">{tenantError}</p>
          </div>
        </div>
      )}

      {/* Formulário Isolado com 'use client' */}
      <ProfileForm initialData={initialData} />
    </div>
  );
}
