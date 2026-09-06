import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";

export const dynamic = "force-dynamic";

async function handleDeleteTenant(req: Request) {
  try {
    // 1. Verificação de permissão do chamador (Super Admin)
    try {
      const serverSupabase = await createServerClient();
      const {
        data: { user: currentUser },
      } = await serverSupabase.auth.getUser();

      if (!currentUser && process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { success: false, error: "Acesso não autorizado. Faça login como Super Admin." },
          { status: 401 }
        );
      }

      if (currentUser && !checkIsSuperAdmin(currentUser) && process.env.NODE_ENV !== "development") {
        const { data: profile } = await serverSupabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profile?.role !== "super_admin") {
          return NextResponse.json(
            { success: false, error: "Apenas Super Administradores podem excluir estabelecimentos." },
            { status: 403 }
          );
        }
      }
    } catch (authErr) {
      console.warn("[SuperAdmin Delete] Aviso na validação de sessão:", authErr);
    }

    // 2. Extração do tenantId do corpo da requisição ou query params
    let tenantId = "";
    try {
      const body = await req.json();
      tenantId = body?.tenantId || "";
    } catch {
      const { searchParams } = new URL(req.url);
      tenantId = searchParams.get("tenantId") || "";
    }

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { success: false, error: "O ID do estabelecimento (tenantId) é obrigatório." },
        { status: 400 }
      );
    }

    // 3. Inicializa cliente Supabase com SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4. Deletar registros vinculados nas tabelas filhas (garante limpeza completa mesmo se foreign keys sem cascade)
    const childTables = [
      "portfolio_items",
      "services",
      "tenant_reviews",
      "tenant_products",
      "posts",
      "appointments",
      "customers",
      "analytics_events",
      "tenant_opportunities",
      "tenant_integrations",
      "tenant_profiles",
      "tenant_users",
    ];

    for (const table of childTables) {
      try {
        const { error: childError } = await supabaseAdmin
          .from(table)
          .delete()
          .eq("tenant_id", tenantId);

        if (childError) {
          console.warn(`[SuperAdmin Delete] Aviso ao limpar tabela filha "${table}":`, childError.message);
        }
      } catch (tableErr) {
        console.warn(`[SuperAdmin Delete] Exceção ao limpar tabela filha "${table}":`, tableErr);
      }
    }

    // 5. Deletar o registro principal na tabela tenants
    const { error: deleteTenantError } = await supabaseAdmin
      .from("tenants")
      .delete()
      .eq("id", tenantId);

    if (deleteTenantError) {
      console.error("[SuperAdmin Delete] Erro ao excluir registro do tenant:", deleteTenantError);
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao excluir o estabelecimento da tabela tenants: ${deleteTenantError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Estabelecimento e todos os seus registros foram excluídos permanentemente com sucesso.",
    });
  } catch (err: any) {
    console.error("[SuperAdmin Delete] Erro inesperado:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro interno do servidor ao excluir estabelecimento." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  return handleDeleteTenant(req);
}

export async function POST(req: Request) {
  return handleDeleteTenant(req);
}
