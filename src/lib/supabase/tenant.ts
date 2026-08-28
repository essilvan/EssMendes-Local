import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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
    "admin@essmendes.com,superadmin@essmendes.com,contato@essmendes.com.br"
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
 * Suporta modo Super Admin com atuação em nome de tenant (impersonação segura).
 */
export async function getAuthenticatedTenant(): Promise<{
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

    // 2. Obter vínculo em tenant_users
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from("tenant_users")
      .select("tenant_id, role, tenants(id, name, slug, plan_tier)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tenantUserError) {
      console.error("[getAuthenticatedTenant] Erro na consulta de tenant_users:", tenantUserError);
    }

    const isSuperAdminUser = checkIsSuperAdmin(user, tenantUser?.role);

    // 3. Suporte a Super Admin com tenant selecionado via cookie (impersonação)
    if (isSuperAdminUser) {
      const cookieStore = await cookies();
      const activeTenantId = cookieStore.get("em_active_tenant_id")?.value;

      if (activeTenantId) {
        const { data: targetTenant, error: targetError } = await supabase
          .from("tenants")
          .select("id, name, slug, plan_tier")
          .eq("id", activeTenantId)
          .maybeSingle();

        if (targetTenant && !targetError) {
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
                }
              : undefined,
          },
          error: null,
        };
      }

      // Se super admin não tem vínculo direto em tenant_users, pega o primeiro tenant do sistema
      const { data: firstTenant } = await supabase
        .from("tenants")
        .select("id, name, slug, plan_tier")
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
            },
          },
          error: null,
        };
      }
    }

    // 4. Fluxo Padrão: Lojista / Proprietário (tenant_owner)
    if (!tenantUser || !tenantUser.tenant_id) {
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
