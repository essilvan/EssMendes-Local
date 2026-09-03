import { createClient } from "@/lib/supabase/server";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";
import { SuperAdminDashboard } from "@/components/admin/SuperAdminDashboard";
import { extractNeighborhoodAndCity } from "@/utils/address";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ShieldAlert, LogOut, ArrowRight, Database } from "lucide-react";
import type { SuperAdminTenantItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const supabase = await createClient();

  // 1. Obter a sessão do usuário via Supabase Server Client
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/super-admin");
  }

  // 2. Consultar a tabela profiles filtrando por id = user.id
  let profileRole: string | null = null;
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && profile?.role) {
      profileRole = profile.role;
    }
  } catch (err) {
    console.warn("[SuperAdminPage] Aviso ao consultar tabela profiles:", err);
  }

  // 2. Verificação de permissão direta e prioritária
  const userEmail = (user.email || "").toLowerCase().trim();
  const isMasterOwnerEmail = userEmail === "essilvanmendes@gmail.com";
  const hasProfileSuperAdmin = profileRole === "super_admin";
  const hasMetadataSuperAdmin =
    user.user_metadata?.role === "super_admin" ||
    user.app_metadata?.role === "super_admin";

  // Se qualquer uma dessas condições for verdadeira (ou dev), libere imediatamente
  let isSuperAdmin =
    isMasterOwnerEmail ||
    hasProfileSuperAdmin ||
    hasMetadataSuperAdmin ||
    checkIsSuperAdmin(user) ||
    process.env.NODE_ENV === "development";

  // Fallback: Checa também tenant_users caso role esteja lá
  if (!isSuperAdmin) {
    try {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (tenantUser?.role === "super_admin") {
        isSuperAdmin = true;
      }
    } catch {}
  }

  // 3. Se o perfil não for 'super_admin', renderizar mensagem clara na tela em vez de redirecionar silenciosamente
  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 text-slate-100">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3.5 text-red-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Acesso Restrito</h1>
              <p className="text-xs text-slate-400">
                Permissão de Super Administrador não identificada
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2.5 text-sm text-slate-200">
            <p className="leading-relaxed">
              Acesso Restrito: Seu usuário (<strong>{user.email || "sem e-mail"}</strong>) não possui a role &apos;super_admin&apos; no Supabase.
            </p>
            <div className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-slate-400 border border-slate-800">
              <span>UID: {user.id}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-teal-400" />
              Comando SQL para liberar o seu acesso no Supabase:
            </p>
            <pre className="rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-emerald-400 border border-slate-800 overflow-x-auto">
{`INSERT INTO public.profiles (id, role, email) 
VALUES ('${user.id}', 'super_admin', '${user.email || ""}') 
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';`}
            </pre>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition"
            >
              <span>Acessar Painel Normal (/admin)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/super-admin"
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Recarregar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Se for 'super_admin' (ou em ambiente dev), consultar diretamente todos os registros da tabela tenants
  const { data: rawTenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (tenantsError) {
    console.error("[SuperAdminPage] Erro ao consultar tenants:", tenantsError);
  }

  const tenantList = rawTenants || [];
  const tenantIds = tenantList.map((t) => t.id);

  // Busca dados de profiles e contagem de produtos vinculados
  let profiles: any[] = [];
  let products: any[] = [];

  if (tenantIds.length > 0) {
    const [profRes, prodRes] = await Promise.all([
      supabase
        .from("tenant_profiles")
        .select("tenant_id, address, phone_whatsapp, logo_url, google_rating, google_reviews_count")
        .in("tenant_id", tenantIds),
      supabase
        .from("tenant_products")
        .select("tenant_id")
        .in("tenant_id", tenantIds),
    ]);
    profiles = profRes.data || [];
    products = prodRes.data || [];
  }

  const profileMap = new Map<string, any>();
  for (const p of profiles) {
    profileMap.set(p.tenant_id, p);
  }

  const productCountMap = new Map<string, number>();
  for (const prod of products) {
    const count = productCountMap.get(prod.tenant_id) || 0;
    productCountMap.set(prod.tenant_id, count + 1);
  }

  const initialTenants: SuperAdminTenantItem[] = tenantList.map((t) => {
    const p = profileMap.get(t.id);
    const rawAddress = p?.address || "";
    const city = (t as any).city || extractNeighborhoodAndCity(rawAddress) || "Não informada";
    const phone = (t as any).phone || p?.phone_whatsapp || null;
    const logoUrl = p?.logo_url || null;
    const googleRating = t.google_rating ?? p?.google_rating ?? null;
    const googleReviews = t.google_reviews_count ?? p?.google_reviews_count ?? null;
    const totalProducts = productCountMap.get(t.id) || 0;
    const score = t.presence_score ?? 60;

    let status = "forte";
    if (score >= 80) status = "excelente";
    else if (score < 40) status = "critica";
    else if (score < 65) status = "moderada";

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      city,
      phone,
      logo_url: logoUrl,
      google_rating: googleRating,
      google_reviews_count: googleReviews,
      total_products: totalProducts,
      presence_score: score,
      status,
      created_at: t.created_at,
    };
  });

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get("em_active_tenant_id")?.value;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Cabeçalho Super Admin - Logo Oficial */}
        <div className="flex items-center justify-between pb-1">
          <Link href="/super-admin" className="inline-flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-essmendes.png"
              alt="EssMendes Tecnologia"
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>

        <SuperAdminDashboard
          initialTenants={initialTenants}
          currentUserEmail={user.email}
          activeTenantId={activeTenantId}
        />
      </div>
    </div>
  );
}
