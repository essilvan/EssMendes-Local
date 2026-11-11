import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { type TenantPermissions, DEFAULT_TENANT_PERMISSIONS } from "@/types";

export interface AuthenticatedTenantContext {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  };
  tenantId: string;
  role:
    | "super_admin"
    | "tenant_owner"
    | "tenant_admin"
    | "owner"
    | "admin"
    | "staff";
  isSuperAdmin: boolean;
  isImpersonating?: boolean;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    niche?: string | null;
    theme_niche?: string | null;
    theme_settings?: Record<string, any> | null;
    plan_tier: string;
    subscription_status?: string | null;
    subscription_plan?: string | null;
    subscription_expires_at?: string | null;
    setup_paid?: boolean;
    setup_fee_paid?: boolean | null;
    setup_fee_amount?: number | null;
    setup_paid_at?: string | null;
    subscription_starts_at?: string | null;
    monthly_fee_amount?: number | null;
    current_period_end?: string | null;
    mp_payment_id?: string | null;
    permissions?: TenantPermissions | null;
  };
}

const TENANT_SELECT_FIELDS =
  "id, name, slug, niche, theme_niche, theme_settings, plan_tier, subscription_status, current_period_end, mp_payment_id, permissions, setup_paid, setup_fee_paid, setup_fee_amount, setup_paid_at, subscription_starts_at, subscription_expires_at, subscription_plan, monthly_fee_amount";

/**
 * Normaliza o nicho do tenant a partir das colunas niche, theme_niche e theme_settings.
 */
export function resolveTenantNiche(rawTenant: any): string {
  const rawNiche = String(rawTenant?.niche || "")
    .trim()
    .toLowerCase();
  const themeNiche = String(rawTenant?.theme_niche || "")
    .trim()
    .toLowerCase();
  const settingsNiche = String(rawTenant?.theme_settings?.niche || "")
    .trim()
    .toLowerCase();
  const combined = `${rawNiche} ${themeNiche} ${settingsNiche}`;

  if (
    rawNiche === "automotive" ||
    rawNiche === "auto" ||
    combined.includes("auto") ||
    combined.includes("mecanic") ||
    combined.includes("mecânic") ||
    combined.includes("oficina")
  ) {
    return "automotive";
  }

  if (
    rawNiche === "restaurant" ||
    rawNiche === "restaurante" ||
    rawNiche === "gastronomia" ||
    rawNiche === "food" ||
    combined.includes("restauran") ||
    combined.includes("gastronom") ||
    combined.includes("lanchonet") ||
    combined.includes("pizzaria") ||
    combined.includes("hamburgueria")
  ) {
    return "restaurant";
  }

  if (rawNiche && rawNiche !== "general") {
    return rawNiche;
  }

  if (themeNiche && themeNiche !== "retail_default" && themeNiche !== "default") {
    return themeNiche;
  }

  if (settingsNiche && settingsNiche !== "default") {
    return settingsNiche;
  }

  return rawNiche || "general";
}

function mapTenantFields(rawT: any) {
  if (!rawT) return undefined;
  return {
    id: rawT.id,
    name: rawT.name,
    slug: rawT.slug,
    niche: resolveTenantNiche(rawT),
    theme_niche: rawT.theme_niche || null,
    theme_settings: rawT.theme_settings || null,
    plan_tier: rawT.plan_tier,
    subscription_status: rawT.subscription_status,
    subscription_plan: rawT.subscription_plan || null,
    subscription_expires_at:
      rawT.subscription_expires_at || rawT.current_period_end || null,
    setup_paid: Boolean(rawT.setup_paid),
    setup_fee_paid: Boolean(rawT.setup_fee_paid ?? rawT.setup_paid),
    setup_fee_amount:
      rawT.setup_fee_amount !== null && rawT.setup_fee_amount !== undefined
        ? Number(rawT.setup_fee_amount)
        : 197,
    setup_paid_at: rawT.setup_paid_at || null,
    subscription_starts_at: rawT.subscription_starts_at || null,
    monthly_fee_amount:
      rawT.monthly_fee_amount !== null && rawT.monthly_fee_amount !== undefined
        ? Number(rawT.monthly_fee_amount)
        : 97,
    current_period_end: rawT.current_period_end,
    mp_payment_id: rawT.mp_payment_id,
    permissions: rawT.permissions || DEFAULT_TENANT_PERMISSIONS,
  };
}

/**
 * Checa se um usuário possui privilégios de Super Admin através de metadados,
 * papel atribuído ou e-mail configurado em variáveis de ambiente.
 */
export function checkIsSuperAdmin(
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
  } | null,
  role?: string | null
): boolean {
  if (!user) return false;
  if (role === "super_admin") return true;
  if (
    user.user_metadata?.role === "super_admin" ||
    user.app_metadata?.role === "super_admin"
  ) {
    return true;
  }

  const envAdmins = (
    process.env.SUPER_ADMIN_EMAILS ||
    process.env.SUPER_ADMIN_EMAIL ||
    "essilvanmendes@gmail.com,admin@essmendes.com,superadmin@essmendes.com,contato@essmendes.com.br"
  )
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (user.email && envAdmins.includes(user.email.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Obtém o usuário autenticado e seu respectivo tenant_id.
 * Suporta modo Super Admin com atuação em nome de tenant (impersonação segura via cookie ou customTenantId).
 */
export async function getAuthenticatedTenant(overrideTenantId?: string): Promise<{
  data: AuthenticatedTenantContext | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // 1. Obter usuário logado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (authError) {
        console.error("[getAuthenticatedTenant] Erro ao obter usuário auth:", authError);
      }
      return {
        data: null,
        error: "Sessão expirada ou usuário não autenticado. Faça login novamente.",
      };
    }

    // 2. Checa se o usuário possui papel na tabela profiles (ex: super_admin, tenant_owner, tenant_admin, staff)
    let isSuperAdminUser = false;
    let profileRoleFromDb: string | null = null;
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileRow?.role) {
        profileRoleFromDb = profileRow.role;
      }
      if (profileRow?.role === "super_admin") {
        isSuperAdminUser = true;
      }
    } catch (profErr) {
      console.warn("[getAuthenticatedTenant] Aviso ao checar tabela profiles:", profErr);
    }

    // 3. Obter vínculo em tenant_users
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from("tenant_users")
      .select(`tenant_id, role, tenants(${TENANT_SELECT_FIELDS})`)
      .eq("user_id", user.id)
      .maybeSingle();

    if (tenantUserError) {
      console.error("[getAuthenticatedTenant] Erro na consulta de tenant_users:", tenantUserError);
    }

    if (!isSuperAdminUser) {
      isSuperAdminUser = checkIsSuperAdmin(user, tenantUser?.role || profileRoleFromDb);
    }

    // 4. Suporte a Super Admin com tenant selecionado via overrideTenantId ou cookie (impersonação)
    if (isSuperAdminUser) {
      const cookieStore = await cookies();
      const cookieTenantId = cookieStore.get("em_active_tenant_id")?.value;
      const targetTenantId = overrideTenantId || cookieTenantId;

      if (targetTenantId) {
        const { data: targetTenant, error: targetError } = await supabase
          .from("tenants")
          .select(TENANT_SELECT_FIELDS)
          .eq("id", targetTenantId)
          .maybeSingle();

        if (targetTenant && !targetError) {
          if (overrideTenantId && overrideTenantId !== cookieTenantId) {
            cookieStore.set("em_active_tenant_id", overrideTenantId, {
              path: "/",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 7,
            });
          }

          return {
            data: {
              user: {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata,
                app_metadata: user.app_metadata,
              },
              tenantId: targetTenant.id,
              role: "super_admin",
              isSuperAdmin: true,
              isImpersonating: true,
              tenant: mapTenantFields(targetTenant),
            },
            error: null,
          };
        }
      }

      // Se super admin não tem cookie de impersonação mas tem tenant_user próprio
      if (tenantUser?.tenant_id && tenantUser.tenants) {
        const rawT = tenantUser.tenants;
        const currentT = Array.isArray(rawT) ? rawT[0] : rawT;
        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              user_metadata: user.user_metadata,
              app_metadata: user.app_metadata,
            },
            tenantId: tenantUser.tenant_id,
            role: "super_admin",
            isSuperAdmin: true,
            isImpersonating: false,
            tenant: mapTenantFields(currentT),
          },
          error: null,
        };
      }

      // Se super admin não tem vínculo direto em tenant_users, pega o primeiro tenant do sistema
      const { data: firstTenant } = await supabase
        .from("tenants")
        .select(TENANT_SELECT_FIELDS)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstTenant) {
        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              user_metadata: user.user_metadata,
              app_metadata: user.app_metadata,
            },
            tenantId: firstTenant.id,
            role: "super_admin",
            isSuperAdmin: true,
            isImpersonating: false,
            tenant: mapTenantFields(firstTenant),
          },
          error: null,
        };
      }
    }

    // 5. Fluxo Padrão: Lojista / Proprietário (tenant_owner / tenant_admin / staff)
    const effectiveRole = (profileRoleFromDb || tenantUser?.role || "owner") as AuthenticatedTenantContext["role"];

    if (!tenantUser || !tenantUser.tenant_id) {
      // 5.a Tenta recuperar pelo tenant_id presente em user_metadata
      const metadataTenantId =
        (user.user_metadata?.tenant_id as string) ||
        (user.app_metadata?.tenant_id as string);

      if (metadataTenantId) {
        const { data: recoveredTenant } = await supabase
          .from("tenants")
          .select(TENANT_SELECT_FIELDS)
          .eq("id", metadataTenantId)
          .maybeSingle();

        if (recoveredTenant) {
          try {
            await supabase.from("tenant_users").upsert(
              {
                tenant_id: recoveredTenant.id,
                user_id: user.id,
                role: "owner",
              },
              { onConflict: "tenant_id,user_id" }
            );
          } catch (upsertErr) {
            console.warn("[getAuthenticatedTenant] Aviso ao vincular auto-recuperação:", upsertErr);
          }

          return {
            data: {
              user: {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata,
                app_metadata: user.app_metadata,
              },
              tenantId: recoveredTenant.id,
              role: effectiveRole,
              isSuperAdmin: false,
              isImpersonating: false,
              tenant: mapTenantFields(recoveredTenant),
            },
            error: null,
          };
        }
      }

      // 5.b Tenta recuperar pelo contact_email registrado na tabela tenants
      if (user.email) {
        const { data: tenantByEmail } = await supabase
          .from("tenants")
          .select(TENANT_SELECT_FIELDS)
          .ilike("contact_email", user.email.trim())
          .maybeSingle();

        if (tenantByEmail) {
          try {
            await supabase.from("tenant_users").upsert(
              {
                tenant_id: tenantByEmail.id,
                user_id: user.id,
                role: "owner",
              },
              { onConflict: "tenant_id,user_id" }
            );
          } catch (upsertErr) {
            console.warn("[getAuthenticatedTenant] Aviso ao vincular auto-recuperação por email:", upsertErr);
          }

          return {
            data: {
              user: {
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata,
                app_metadata: user.app_metadata,
              },
              tenantId: tenantByEmail.id,
              role: effectiveRole,
              isSuperAdmin: false,
              isImpersonating: false,
              tenant: mapTenantFields(tenantByEmail),
            },
            error: null,
          };
        }
      }

      console.error("[getAuthenticatedTenant] Usuário sem registro na tabela tenant_users:", user.id);
      return {
        data: null,
        error: "Nenhum estabelecimento associado a esta conta.",
      };
    }

    const rawTenant = tenantUser.tenants;
    const tenant = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant;

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata,
        },
        tenantId: tenantUser.tenant_id,
        role: effectiveRole,
        isSuperAdmin: false,
        isImpersonating: false,
        tenant: mapTenantFields(tenant),
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[getAuthenticatedTenant] Exceção capturada:", err);
    return { data: null, error: `Erro no servidor: ${message}` };
  }
}
