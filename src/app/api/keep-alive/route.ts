import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("tenants").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", error: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        error: err?.message || "Erro no keep-alive",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

