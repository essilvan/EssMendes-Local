import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { getWaiterTerminalDataAction } from "@/services/restaurant.actions";
import {
  WaiterTerminalClient,
  type WaiterSummary,
} from "@/components/public/WaiterTerminalClient";

interface WaiterTerminalPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function WaiterTerminalPage({
  params,
}: WaiterTerminalPageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug || "").trim();

  const supabase = createAdminClient();

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

  const [{ data: profile }, { data: tpRows }, { data: legacyRows }, terminalData] =
    await Promise.all([
      supabase
        .from("tenant_profiles")
        .select("name, logo_url")
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
      supabase
        .from("tenant_professionals")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("professionals")
        .select("id, access_pin")
        .eq("tenant_id", tenant.id),
      getWaiterTerminalDataAction(tenant.id),
    ]);

  const pinMap = new Map<string, string | null>();
  (legacyRows || []).forEach((r: any) => {
    if (r?.id) pinMap.set(r.id, r.access_pin || null);
  });

  const waiters: WaiterSummary[] = (tpRows || []).map((p: any) => {
    const pin = p.access_pin ?? pinMap.get(p.id) ?? null;
    return {
      id: p.id,
      name: p.name,
      phone: p.phone || null,
      role_title: p.role_title || p.specialty || "Garçom",
      has_pin: Boolean(pin && String(pin).trim() !== ""),
    };
  });

  const displayName = profile?.name || tenant.name || "Restaurante";
  const logoUrl = profile?.logo_url || null;

  return (
    <WaiterTerminalClient
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      tenantName={displayName}
      logoUrl={logoUrl}
      waiters={waiters}
      initialTables={terminalData.data?.tables || []}
      initialOrders={terminalData.data?.orders || []}
      menuItems={terminalData.data?.menuItems || []}
    />
  );
}

