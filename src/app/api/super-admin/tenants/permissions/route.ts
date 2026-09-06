import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";
import type { TenantPermissions } from "@/types";

export const dynamic = "force-dynamic";

async function handlePermissionsUpdate(req: Request) {
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
            { success: false, error: "Apenas Super Administradores podem alterar permissões de estabelecimentos." },
            { status: 403 }
          );
        }
      }
    } catch (authErr) {
      console.warn("[SuperAdmin Permissions] Aviso na validação de sessão:", authErr);
    }

    // 2. Leitura e validação do payload
    const body = await req.json();
    const { tenantId, permissions } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { success: false, error: "O ID do estabelecimento (tenantId) é obrigatório." },
        { status: 400 }
      );
    }

    if (!permissions || typeof permissions !== "object") {
      return NextResponse.json(
        { success: false, error: "O objeto de permissões é obrigatório." },
        { status: 400 }
      );
    }

    // 3. Sanitização do objeto de permissões estrito
    const cleanPermissions: TenantPermissions = {
      showcase: permissions.showcase !== false,
      services: permissions.services !== false,
      before_after: permissions.before_after !== false,
      reviews: permissions.reviews !== false,
      settings: permissions.settings !== false,
      billing: permissions.billing !== false,
    };

    // 4. Conexão administrativa com Supabase via Service Role Key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 5. Atualização da coluna permissions no registro do tenant
    const { error: updateError } = await supabaseAdmin
      .from("tenants")
      .update({
        permissions: cleanPermissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (updateError) {
      console.error("[SuperAdmin Permissions] Erro ao atualizar permissões:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao persistir permissões no banco de dados: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Permissões do estabelecimento atualizadas com sucesso!",
      data: {
        tenantId,
        permissions: cleanPermissions,
      },
    });
  } catch (err: any) {
    console.error("[SuperAdmin Permissions] Erro inesperado:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro interno do servidor ao atualizar permissões." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return handlePermissionsUpdate(req);
}

export async function PATCH(req: Request) {
  return handlePermissionsUpdate(req);
}

export async function PUT(req: Request) {
  return handlePermissionsUpdate(req);
}
