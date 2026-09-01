import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { redirect } from "next/navigation";
import { Settings, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao carregar configurações</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Nenhum estabelecimento associado encontrado para esta conta."}
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Busca dados de perfil do tenant
  const { data: profile, error: profileError } = await supabase
    .from("tenant_profiles")
    .select("*")
    .eq("tenant_id", tenantContext.tenantId)
    .maybeSingle();

  if (profileError) {
    console.error("[ConfiguracoesPage] Erro ao buscar tenant_profiles:", profileError);
  }

  // Tratamento seguro de fotos do Google Places (place_photos)
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

  // Busca serviços cadastrados para o tenant
  const { data: rawServices } = await supabase
    .from("services")
    .select("id, name, description, price, duration_minutes, is_active, created_at")
    .eq("tenant_id", tenantContext.tenantId)
    .order("created_at", { ascending: false });

  const initialData = {
    companyName: tenantContext.tenant?.name || (tenantContext.user.user_metadata?.company_name as string) || "",
    description: profile?.description || "",
    editorialSummary: profile?.editorial_summary || profile?.description || "",
    phoneWhatsapp: profile?.phone_whatsapp || "",
    address: profile?.address || "",
    logoUrl: profile?.logo_url || (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : ""),
    placePhotos: cleanPlacePhotos,
    primaryColor: profile?.primary_color || "#0d9488",
    themeNiche: profile?.template_id || (tenantContext.tenant as any)?.theme_niche || "retail_default",
    googleMapsUrl: profile?.google_maps_url || "",
    rating: profile?.rating || 4.9,
    reviewCount: profile?.review_count || 128,
    slug: tenantContext.tenant?.slug || "",
    services: (rawServices || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: Number(s.price),
      duration_minutes: s.duration_minutes,
      is_active: s.is_active,
      created_at: s.created_at,
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
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold">Erro ao carregar dados do perfil:</p>
            <p className="mt-0.5">{profileError.message}</p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <ProfileForm initialData={initialData} />

    </div>
  );
}
