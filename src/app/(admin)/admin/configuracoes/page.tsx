import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { redirect } from "next/navigation";
import { Settings, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  try {
    // 1. Obtenção segura e defensiva do tenant autenticado
    let tenantContext = null;
    let tenantError: string | null = null;

    try {
      const tenantRes = await getAuthenticatedTenant();
      tenantContext = tenantRes.data;
      tenantError = tenantRes.error;
    } catch (authErr: any) {
      console.error("[ConfiguracoesPage] Erro ao autenticar tenant:", authErr);
      tenantError = authErr?.message || "Erro ao validar credenciais da sessão.";
    }

    if (tenantError || !tenantContext) {
      if (!tenantContext && !tenantError) {
        redirect("/login");
      }
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-900">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Erro ao carregar configurações</span>
          </div>
          <p className="text-xs text-red-700">
            {tenantError || "Nenhum estabelecimento associado encontrado para esta conta."}
          </p>
        </div>
      );
    }

    if (!tenantContext.isSuperAdmin && tenantContext.tenant?.permissions?.settings === false) {
      redirect("/admin/dashboard?error=recurso_indisponivel");
    }

    const currentTenantId = tenantContext.tenantId;

    // 2. Blindagem de consultas no Server Component com try/catch e maybeSingle()
    let profile: any = null;
    let profileError: any = null;
    let rawServices: any[] = [];
    let tenantData: any = null;
    let settingsData: any[] = [];

    try {
      const supabase = await createClient();

      // 2.1 Consulta à tabela 'tenants' com select('*') para tolerar colunas dinâmicas
      try {
        const { data: tenant, error: tErr } = await supabase
          .from("tenants")
          .select("*")
          .eq("id", currentTenantId)
          .maybeSingle();

        if (!tErr && tenant) {
          tenantData = tenant;
        } else if (tErr) {
          console.warn("[ConfiguracoesPage] Aviso defensivo ao buscar tenants:", tErr);
        }
      } catch (err) {
        console.warn("[ConfiguracoesPage] Exceção ao consultar tenants:", err);
      }

      // 2.2 Consulta à tabela 'tenant_profiles' usando maybeSingle()
      try {
        const { data: prof, error: pErr } = await supabase
          .from("tenant_profiles")
          .select("*")
          .eq("tenant_id", currentTenantId)
          .maybeSingle();

        if (!pErr && prof) {
          profile = prof;
        } else if (pErr) {
          profileError = pErr;
          console.warn("[ConfiguracoesPage] Aviso defensivo ao buscar tenant_profiles:", pErr);
        }
      } catch (err) {
        console.warn("[ConfiguracoesPage] Exceção ao consultar tenant_profiles:", err);
      }

      // 2.3 Consulta à tabela 'services'
      try {
        const { data: servs, error: sErr } = await supabase
          .from("services")
          .select("id, name, description, price, duration_minutes, is_active, created_at")
          .eq("tenant_id", currentTenantId)
          .order("created_at", { ascending: false });

        if (!sErr && servs) {
          rawServices = servs;
        } else if (sErr) {
          console.warn("[ConfiguracoesPage] Aviso defensivo ao buscar services:", sErr);
        }
      } catch (err) {
        console.warn("[ConfiguracoesPage] Exceção ao consultar services:", err);
      }

      // 2.4 Consulta à tabela 'platform_settings' (blindagem contra falta de tabela)
      try {
        const { data: settings, error: setErr } = await supabase
          .from("platform_settings")
          .select("*");

        if (!setErr && settings) {
          settingsData = settings;
        }
      } catch (err) {
        console.warn("[ConfiguracoesPage] Aviso defensivo ao buscar platform_settings:", err);
      }
    } catch (dbErr) {
      console.error("[ConfiguracoesPage] Erro defensivo ao executar consultas ao Supabase:", dbErr);
    }

    // 3. Tratamento seguro de fotos do Google Places (place_photos)
    let cleanPlacePhotos: string[] = [];
    if (profile?.place_photos) {
      if (Array.isArray(profile.place_photos)) {
        cleanPlacePhotos = profile.place_photos.filter(
          (p: any) => typeof p === "string" && p.trim().length > 0
        );
      } else if (typeof profile.place_photos === "string") {
        try {
          const parsed = JSON.parse(profile.place_photos);
          if (Array.isArray(parsed)) {
            cleanPlacePhotos = parsed.filter(
              (p: any) => typeof p === "string" && p.trim().length > 0
            );
          }
        } catch {
          if (profile.place_photos.startsWith("http")) {
            cleanPlacePhotos = [profile.place_photos];
          }
        }
      }
    }

    // 4. Montagem segura do initialData com sanitização e fallbacks resilientes
    const initialData = {
      tenantId: currentTenantId,
      companyName:
        tenantData?.name ||
        tenantContext.tenant?.name ||
        (tenantContext.user?.user_metadata?.company_name as string) ||
        "",
      description: profile?.description || "",
      editorialSummary: profile?.editorial_summary || profile?.description || "",
      phoneWhatsapp: profile?.phone_whatsapp || tenantData?.phone || "",
      address: profile?.address || tenantData?.address || "",
      logoUrl: profile?.logo_url || (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : ""),
      coverImageUrl:
        tenantData?.cover_image_url ||
        profile?.cover_image_url ||
        profile?.hero_image_url ||
        "",
      placePhotos: cleanPlacePhotos,
      primaryColor:
        tenantData?.theme_settings?.primary_color ||
        profile?.primary_color ||
        "#0d9488",
      themeNiche:
        tenantData?.theme_settings?.niche ||
        profile?.template_id ||
        tenantData?.theme_niche ||
        (tenantContext.tenant as any)?.theme_niche ||
        "servicos",
      themeSettings: tenantData?.theme_settings || null,
      googleMapsUrl: profile?.google_maps_url || "",
      rating: profile?.rating ? Number(profile.rating) : 4.9,
      reviewCount: profile?.review_count ? Number(profile.review_count) : 128,
      slug: tenantData?.slug || tenantContext.tenant?.slug || "",
      businessAttributes:
        tenantData?.business_attributes ||
        profile?.business_attributes ||
        null,
      services: (rawServices || []).map((s: any) => ({
        id: s.id,
        name: s.name || "Serviço",
        description: s.description || null,
        price: s.price !== null && s.price !== undefined ? Number(s.price) : null,
        duration_minutes: Number(s.duration_minutes) || 30,
        is_active: Boolean(s.is_active),
        created_at: s.created_at || new Date().toISOString(),
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

        {profileError && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Aviso ao sincronizar dados do perfil:</p>
              <p className="mt-0.5">{profileError.message || "Algumas informações podem estar temporariamente indisponíveis."}</p>
            </div>
          </div>
        )}

        {/* Formulário Isolado com 'use client' */}
        <ProfileForm initialData={initialData} />
      </div>
    );
  } catch (fatalError: any) {
    console.error("[ConfiguracoesPage] Erro fatal no Server Component:", fatalError);
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao carregar configurações</span>
        </div>
        <p className="text-xs text-red-700">
          Ocorreu um problema ao carregar as configurações. Por favor, atualize a página ou contate o suporte caso persista.
        </p>
      </div>
    );
  }
}
