import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { redirect } from "next/navigation";
import { Star, AlertCircle } from "lucide-react";
import type { TenantReview } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminAvaliacoesPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao carregar avaliações</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Estabelecimento não localizado."}
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Busca perfil e dados do negócio
  const { data: profile } = await supabase
    .from("tenant_profiles")
    .select("name, business_category, google_maps_url, google_place_id, google_rating, google_reviews_count, rating, review_count, phone_whatsapp")
    .eq("tenant_id", tenantContext.tenantId)
    .maybeSingle();

  // Busca avaliações do tenant
  const { data: rawReviews } = await supabase
    .from("tenant_reviews")
    .select("*")
    .eq("tenant_id", tenantContext.tenantId)
    .order("created_at", { ascending: false });

  const reviews = (rawReviews || []) as TenantReview[];

  const initialRating = profile?.google_rating ?? profile?.rating ?? 5.0;
  const initialReviewCount = profile?.google_reviews_count ?? profile?.review_count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/20">
          <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
          <span>Gestão de Prova Social</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Avaliações & Google Reviews
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sincronize as avaliações reais do Google Meu Negócio usando a Places API, responda com IA e impulsione seu ranqueamento local no Google.
        </p>
      </div>

      <ReviewsManager
        initialReviews={reviews}
        businessName={profile?.name || tenantContext.tenant?.name || "Meu Estabelecimento"}
        businessCategory={profile?.business_category || "Serviços Locais"}
        googleMapsUrl={profile?.google_maps_url || null}
        googlePlaceId={profile?.google_place_id || null}
        googleRating={initialRating}
        googleReviewsCount={initialReviewCount}
      />
    </div>
  );
}
