import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";
import { migrateGooglePhotosToSupabaseStorage } from "@/services/admin-migrate-photos.actions";

/**
 * Validação de autenticação administrativa:
 * 1. Bearer Token ou x-admin-secret com SUPABASE_SERVICE_ROLE_KEY / CRON_SECRET
 * 2. Sessão de usuário logado com privilégios de Super Admin
 */
async function authorizeAdminRequest(req: NextRequest): Promise<{ authorized: boolean; reason?: string }> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;

  // 1. Verificação por Headers (para chamadas de scripts, cron jobs ou curl)
  const authHeader = req.headers.get("authorization");
  const adminSecretHeader = req.headers.get("x-admin-secret") || req.headers.get("x-admin-key");

  if (serviceRoleKey || cronSecret) {
    if (adminSecretHeader) {
      if (
        (serviceRoleKey && adminSecretHeader === serviceRoleKey) ||
        (cronSecret && adminSecretHeader === cronSecret)
      ) {
        return { authorized: true };
      }
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (
        (serviceRoleKey && token === serviceRoleKey) ||
        (cronSecret && token === cronSecret)
      ) {
        return { authorized: true };
      }
    }
  }

  // 2. Verificação por Sessão Supabase Auth (para chamadas a partir do navegador/painel)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (!userErr && user) {
      const isSuper = checkIsSuperAdmin(user);
      if (isSuper) {
        return { authorized: true };
      }
    }
  } catch (authErr) {
    console.warn("[migrate-photos/route] Falha ao verificar sessão:", authErr);
  }

  return { authorized: false, reason: "Acesso restrito a administradores." };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason || "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);

    const tenantId = body.tenantId || url.searchParams.get("tenantId") || undefined;
    const dryRun = body.dryRun === true || url.searchParams.get("dryRun") === "true";
    const delayMs = body.delayMs
      ? Number(body.delayMs)
      : url.searchParams.get("delayMs")
      ? Number(url.searchParams.get("delayMs"))
      : 150;

    console.log(
      `[POST /api/admin/migrate-photos] Iniciando rotina de migração em massa (tenantId: ${tenantId || "todos"}, dryRun: ${dryRun})...`
    );

    const result = await migrateGooglePhotosToSupabaseStorage({
      tenantId,
      dryRun,
      delayMs,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    console.error("[POST /api/admin/migrate-photos] Erro inesperado:", err);
    return NextResponse.json(
      {
        success: false,
        totalMigrados: 0,
        falhas: 0,
        error: err?.message || "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
