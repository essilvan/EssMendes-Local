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
  role: "super_admin" | "tenant_owner" | "owner" | "admin" | "staff";
  isSuperAdmin: boolean;
  isImpersonating?: boolean;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    plan_tier: string;
    subscription_status?: string | null;
    subscription_plan?: string | null;
    subscription_expires_at?: string | null;
    setup_paid?: boolean;
    setup_fee_paid?: boolean | null;
    setup_fee_amount?: number | null;
    setup_paid_at?: string | null;
    subscription_starts_at?: string | null;
    current_period_end?: string | null;
    mp_payment_id?: string | null;
    permissions?: TenantPermissions | null;
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

    // 2. Checa se o usuário possui papel super_admin na tabela profiles
    let isSuperAdminUser = false;
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileRow?.role === "super_admin") {
        isSuperAdminUser = true;
      }
    } catch (profErr) {
      console.warn("[getAuthenticatedTenant] Aviso ao checar tabela profiles:", profErr);
    }

    // 3. Obter vínculo em tenant_users
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from("tenant_users")
      .select("tenant_id, role, tenants(id, name, slug, plan_tier, subscription_status, current_period_end, mp_payment_id, permissions, setup_paid, setup_fee_paid, setup_fee_amount, setup_paid_at, subscription_starts_at, subscription_expires_at, subscription_plan)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tenantUserError) {
      console.error("[getAuthenticatedTenant] Erro na consulta de tenant_users:", tenantUserError);
    }

    if (!isSuperAdminUser) {
      isSuperAdminUser = checkIsSuperAdmin(user, tenantUser?.role);
    }

    // 4. Suporte a Super Admin com tenant selecionado via overrideTenantId ou cookie (impersonação)
    if (isSuperAdminUser) {
      const cookieStore = await cookies();
      const cookieTenantId = cookieStore.get("em_active_tenant_id")?.value;
      const targetTenantId = overrideTenantId || cookieTenantId;

      if (targetTenantId) {
        const { data: targetTenant, error: targetError } = await supabase
          .from("tenants")
          .select("id, name, slug, plan_tier, subscription_status, current_period_end, mp_payment_id, permissions, setup_paid, setup_fee_paid, setup_fee_amount, setup_paid_at, subscription_starts_at, subscription_expires_at, subscription_plan")
          .eq("id", targetTenantId)
          .maybeSingle();

        if (targetTenant && !targetError) {
          // Se veio via query param, sincroniza o cookie para as próximas requisições
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
              tenant: {
                id: targetTenant.id,
                name: targetTenant.name,
                slug: targetTenant.slug,
                plan_tier: targetTenant.plan_tier,
                subscription_status: (targetTenant as any).subscription_status,
                subscription_plan: (targetTenant as any).subscription_plan || null,
                subscription_expires_at: (targetTenant as any).subscription_expires_at || (targetTenant as any).current_period_end || null,
                setup_paid: Boolean((targetTenant as any).setup_paid),
                setup_fee_paid: Boolean((targetTenant as any).setup_fee_paid ?? (targetTenant as any).setup_paid),
                setup_fee_amount: (targetTenant as any).setup_fee_amount !== null && (targetTenant as any).setup_fee_amount !== undefined ? Number((targetTenant as any).setup_fee_amount) : 197,
                setup_paid_at: (targetTenant as any).setup_paid_at || null,
                subscription_starts_at: (targetTenant as any).subscription_starts_at || null,
                current_period_end: (targetTenant as any).current_period_end,
                mp_payment_id: (targetTenant as any).mp_payment_id,
                permissions: (targetTenant as any).permissions || DEFAULT_TENANT_PERMISSIONS,
              },
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
            tenant: currentT
              ? {
                  id: currentT.id,
                  name: currentT.name,
                  slug: currentT.slug,
                  plan_tier: currentT.plan_tier,
                  subscription_status: (currentT as any).subscription_status,
                  subscription_plan: (currentT as any).subscription_plan || null,
                  subscription_expires_at: (currentT as any).subscription_expires_at || (currentT as any).current_period_end || null,
                  setup_paid: Boolean((currentT as any).setup_paid),
                  setup_fee_paid: Boolean((currentT as any).setup_fee_paid ?? (currentT as any).setup_paid),
                  setup_fee_amount: (currentT as any).setup_fee_amount !== null && (currentT as any).setup_fee_amount !== undefined ? Number((currentT as any).setup_fee_amount) : 197,
                  setup_paid_at: (currentT as any).setup_paid_at || null,
                  subscription_starts_at: (currentT as any).subscription_starts_at || null,
                  current_period_end: (currentT as any).current_period_end,
                  mp_payment_id: (currentT as any).mp_payment_id,
                  permissions: (currentT as any).permissions || DEFAULT_TENANT_PERMISSIONS,
                }
              : undefined,
          },
          error: null,
        };
      }

      // Se super admin não tem vínculo direto em tenant_users, pega o primeiro tenant do sistema
      const { data: firstTenant } = await supabase
        .from("tenants")
        .select("id, name, slug, plan_tier, subscription_status, current_period_end, mp_payment_id, permissions, setup_paid, setup_fee_paid, setup_fee_amount, setup_paid_at, subscription_starts_at, subscription_expires_at, subscription_plan")
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
            tenant: {
              id: firstTenant.id,
              name: firstTenant.name,
              slug: firstTenant.slug,
              plan_tier: firstTenant.plan_tier,
              subscription_status: (firstTenant as any).subscription_status,
              subscription_plan: (firstTenant as any).subscription_plan || null,
              subscription_expires_at: (firstTenant as any).subscription_expires_at || (firstTenant as any).current_period_end || null,
              setup_paid: Boolean((firstTenant as any).setup_paid),
              setup_fee_paid: Boolean((firstTenant as any).setup_fee_paid ?? (firstTenant as any).setup_paid),
              setup_fee_amount: (firstTenant as any).setup_fee_amount !== null && (firstTenant as any).setup_fee_amount !== undefined ? Number((firstTenant as any).setup_fee_amount) : 197,
              setup_paid_at: (firstTenant as any).setup_paid_at || null,
              subscription_starts_at: (firstTenant as any).subscription_starts_at || null,
              current_period_end: (firstTenant as any).current_period_end,
              mp_payment_id: (firstTenant as any).mp_payment_id,
              permissions: (firstTenant as any).permissions || DEFAULT_TENANT_PERMISSIONS,
            },
          },
          error: null,
        };
      }
    }

    // 5. Fluxo Padrão: Lojista / Proprietário (tenant_owner)
    if (!tenantUser || !tenantUser.tenant_id) {
      // 5.a Tenta recuperar pelo tenant_id presente em user_metadata
      const metadataTenantId =
        (user.user_metadata?.tenant_id as string) ||
        (user.app_metadata?.tenant_id as string);

      if (metadataTenantId) {
        const { data: recoveredTenant } = await supabase
          .from("tenants")
          .select("id, name, slug, plan_tier, subscription_status, current_period_end, mp_payment_id, permissions, setup_paid, setup_fee_paid, setup_fee_amount, setup_paid_at, subscription_starts_at, subscription_expires_at, subscription_plan")
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
              role: "owner",
              isSuperAdmin: false,
              isImpersonating: false,
              tenant: {
                id: recoveredTenant.id,
                name: recoveredTenant.name,
                slug: recoveredTenant.slug,
                plan_tier: recoveredTenant.plan_tier,
                subscription_status: (recoveredTenant as any).subscription_status,
                subscription_plan: (recoveredTenant as any).subscription_plan || null,
                subscription_expires_at: (recoveredTenant as any).subscription_expires_at || (recoveredTenant as any).current_period_end || null,
                setup_paid: Boolean((recoveredTenant as any).setup_paid),
                setup_fee_paid: Boolean((recoveredTenant as any).setup_fee_paid ?? (recoveredTenant as any).setup_paid),
                setup_fee_amount: (recoveredTenant as any).setup_fee_amount !== null && (recoveredTenant as any).setup_fee_amount !== undefined ? Number((recoveredTenant as any).setup_fee_amount) : 197,
                setup_paid_at: (recoveredTenant as any).setup_paid_at || null,
                subscription_starts_at: (recoveredTenant as any).subscription_starts_at || null,
                current_period_end: (recoveredTenant as any).current_period_end,
                mp_payment_id: (recoveredTenant as any).mp_payment_id,
                permissions: (recoveredTenant as any).permissions || DEFAULT_TENANT_PERMISSIONS,
              },
            },
            error: null,
          };
        }
      }

      // 5.b Tenta recuperar pelo contact_email registrado na tabela tenants
      if (user.email) {
        const { data: tenantByEmail } = await supabase
          .from("tenants")
          .select("id, name, slug, plan_tier, subscription_status, current_period_end, mp_payment_id, permissions, setup_paid, setup_fee_paid, setup_fee_amount, setup_paid_at, subscription_starts_at, subscription_expires_at, subscription_plan")
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
              role: "owner",
              isSuperAdmin: false,
              isImpersonating: false,
              tenant: {
                id: tenantByEmail.id,
                name: tenantByEmail.name,
                slug: tenantByEmail.slug,
                plan_tier: tenantByEmail.plan_tier,
                subscription_status: (tenantByEmail as any).subscription_status,
                subscription_plan: (tenantByEmail as any).subscription_plan || null,
                subscription_expires_at: (tenantByEmail as any).subscription_expires_at || (tenantByEmail as any).current_period_end || null,
                setup_paid: Boolean((tenantByEmail as any).setup_paid),
                setup_fee_paid: Boolean((tenantByEmail as any).setup_fee_paid ?? (tenantByEmail as any).setup_paid),
                setup_fee_amount: (tenantByEmail as any).setup_fee_amount !== null && (tenantByEmail as any).setup_fee_amount !== undefined ? Number((tenantByEmail as any).setup_fee_amount) : 197,
                setup_paid_at: (tenantByEmail as any).setup_paid_at || null,
                subscription_starts_at: (tenantByEmail as any).subscription_starts_at || null,
                current_period_end: (tenantByEmail as any).current_period_end,
                mp_payment_id: (tenantByEmail as any).mp_payment_id,
                permissions: (tenantByEmail as any).permissions || DEFAULT_TENANT_PERMISSIONS,
              },
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
        role: (tenantUser.role as any) || "owner",
        isSuperAdmin: false,
        isImpersonating: false,
        tenant: tenant
          ? {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              plan_tier: tenant.plan_tier,
              subscription_status: (tenant as any).subscription_status,
              subscription_plan: (tenant as any).subscription_plan || null,
              subscription_expires_at: (tenant as any).subscription_expires_at || (tenant as any).current_period_end || null,
              setup_paid: Boolean((tenant as any).setup_paid),
              setup_fee_paid: Boolean((tenant as any).setup_fee_paid ?? (tenant as any).setup_paid),
              setup_fee_amount: (tenant as any).setup_fee_amount !== null && (tenant as any).setup_fee_amount !== undefined ? Number((tenant as any).setup_fee_amount) : 197,
              setup_paid_at: (tenant as any).setup_paid_at || null,
              subscription_starts_at: (tenant as any).subscription_starts_at || null,
              current_period_end: (tenant as any).current_period_end,
              mp_payment_id: (tenant as any).mp_payment_id,
              permissions: (tenant as any).permissions || DEFAULT_TENANT_PERMISSIONS,
            }
          : undefined,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[getAuthenticatedTenant] Exceção capturada:", err);
    return { data: null, error: `Erro no servidor: ${message}` };
  }
}
