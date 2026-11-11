import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicRestaurantMenuAction } from "@/services/restaurant.actions";
import { PublicRestaurantMenuSection } from "@/components/public/PublicRestaurantMenuSection";
import { UtensilsCrossed, MapPin, ArrowLeft } from "lucide-react";

interface TableMenuPageProps {
  params: Promise<{
    slug: string;
    tableNumber: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function PublicTableMenuPage({
  params,
}: TableMenuPageProps) {
  const { slug, tableNumber } = await params;
  const cleanSlug = decodeURIComponent(slug || "").trim();
  const cleanTableNumber = decodeURIComponent(tableNumber || "").trim();

  const supabase = await createClient();

  let { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .or(`slug.eq.${cleanSlug},custom_domain.eq.${cleanSlug}`)
    .maybeSingle();

  if (!tenant) {
    const directRes = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", cleanSlug)
      .maybeSingle();
    tenant = directRes.data;
  }

  if (!tenant) {
    notFound();
  }

  const [{ data: profile }, { data: tableRows }, restaurantMenu] =
    await Promise.all([
      supabase
        .from("tenant_profiles")
        .select("*")
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
      supabase
        .from("restaurant_tables")
        .select("*")
        .eq("tenant_id", tenant.id),
      getPublicRestaurantMenuAction(tenant.id),
    ]);

  const matchedTable = (tableRows || []).find((r: any) => {
    const rNum = String(r.table_number ?? r.number ?? "").trim().toLowerCase();
    const target = cleanTableNumber.toLowerCase();
    return (
      rNum === target ||
      rNum.replace(/^0+/, "") === target.replace(/^0+/, "") ||
      `mesa ${rNum}` === target
    );
  });

  let waiterName: string | null = matchedTable?.waiter_name || null;
  const waiterId = matchedTable?.waiter_id || matchedTable?.professional_id || null;

  if (waiterId && !waiterName) {
    const { data: waiterProf } = await supabase
      .from("tenant_professionals")
      .select("name")
      .eq("id", waiterId)
      .maybeSingle();
    if (waiterProf?.name) {
      waiterName = waiterProf.name;
    }
  }

  const displayName = profile?.name || tenant.name || "Restaurante";
  const logoUrl = profile?.logo_url || null;
  const address = profile?.address || (tenant as any)?.address || null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 pb-28">
      {/* Topo da Vitrine / Cardápio da Mesa */}
      <header className="sticky top-0 z-40 border-b border-orange-200/70 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={displayName}
                className="h-10 w-10 shrink-0 rounded-xl object-cover border border-orange-200"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-base sm:text-lg font-black text-stone-900 leading-tight">
                {displayName}
              </h1>
              {address && (
                <p className="truncate text-[11px] text-stone-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-orange-600 shrink-0" />
                  <span className="truncate">{address}</span>
                </p>
              )}
            </div>
          </div>

          <Link
            href={`/${tenant.slug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 px-3 py-2 text-xs font-bold text-stone-700 transition shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ver Site</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal do Cardápio Exclusivo da Mesa */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <PublicRestaurantMenuSection
          tenantId={tenant.id}
          tenantName={displayName}
          tenantSlug={tenant.slug}
          categories={restaurantMenu.categories}
          items={restaurantMenu.items}
          tableNumber={cleanTableNumber}
          tableName={matchedTable?.name || `Mesa ${cleanTableNumber}`}
          waiterName={waiterName}
          restaurantPhone={
            profile?.phone_whatsapp ||
            profile?.phone ||
            (tenant as any)?.whatsapp ||
            tenant.phone
          }
        />
      </main>
    </div>
  );
}

