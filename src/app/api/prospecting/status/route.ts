import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

const ALLOWED_STATUSES = new Set([
  "new",
  "demo_created",
  "contacted",
  "replied",
  "closed",
]);

export async function PATCH(request: Request) {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (
      authError ||
      !authContext ||
      (!authContext.isSuperAdmin && authContext.role !== "super_admin")
    ) {
      return NextResponse.json(
        { success: false, error: "Acesso restrito ao Super Admin." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === "string" ? body.leadId.trim() : "";
    const status = typeof body?.status === "string" ? body.status.trim() : "";

    if (!leadId || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos para atualizar status." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("prospecting_leads")
      .update({ status })
      .eq("id", leadId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, leadId, status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao atualizar status." },
      { status: 500 }
    );
  }
}
