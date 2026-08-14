import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedTenantContext {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  tenantId: string;
  role: "owner" | "admin" | "staff";
  tenant?: {
    id: string;
    name: string;
    slug: string;
    plan_tier: string;
  };
}

/**
 * Obtém o usuário autenticado e seu respectivo tenant_id da tabela tenant_users.
 * Realiza validação de erros e logs no console.
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
      return {
        data: null,
        error: `Erro ao consultar dados da empresa: ${tenantUserError.message}`,
      };
    }

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
        },
        tenantId: tenantUser.tenant_id,
        role: tenantUser.role as "owner" | "admin" | "staff",
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
