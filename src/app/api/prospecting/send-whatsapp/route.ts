import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import {
  detectProspectingNiche,
  buildProspectingWhatsAppMessage,
  type ProspectingNicheKey,
} from "@/utils/prospecting-niche";

function formatBrazilianWhatsAppPhone(rawPhone?: string | null): string {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  return `55${digits}`;
}

export async function POST(request: Request) {
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

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "leadId não informado." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: lead, error: leadErr } = await supabase
      .from("prospecting_leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr || !lead) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    const cleanPhone = formatBrazilianWhatsAppPhone(lead.phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { success: false, error: "Telefone inválido para envio no WhatsApp." },
        { status: 400 }
      );
    }

    const demoUrl = lead.demo_slug
      ? `https://${lead.demo_slug}.essmendes.com.br`
      : `https://app.essmendes.com.br`;

    const niche: ProspectingNicheKey =
      (lead.detected_niche as ProspectingNicheKey) ||
      detectProspectingNiche(
        lead.business_name,
        Array.isArray(lead.place_types) ? lead.place_types : [],
        lead.primary_type || null
      );

    const message = buildProspectingWhatsAppMessage({
      niche,
      businessName: lead.business_name,
      demoUrl,
    });

    const nowIso = new Date().toISOString();
    const currentHistory: any[] = Array.isArray(lead.chat_history)
      ? lead.chat_history
      : [];
    const updatedHistory = [
      ...currentHistory,
      {
        role: "assistant",
        content: message,
        timestamp: nowIso,
      },
    ];

    const evoUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, "");
    const evoKey = process.env.EVOLUTION_API_KEY?.trim();
    const evoInstance = process.env.EVOLUTION_INSTANCE_NAME?.trim();

    if (evoUrl && evoKey && evoInstance) {
      const sendRes = await fetch(
        `${evoUrl}/message/sendText/${encodeURIComponent(evoInstance)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evoKey,
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: message,
          }),
        }
      );

      if (!sendRes.ok) {
        const errText = await sendRes.text().catch(() => "");
        return NextResponse.json(
          {
            success: false,
            error: `Evolution API retornou HTTP ${sendRes.status}: ${errText}`,
          },
          { status: 502 }
        );
      }

      await supabase
        .from("prospecting_leads")
        .update({
          status: "contacted",
          last_message_at: nowIso,
          chat_history: updatedHistory,
        })
        .eq("id", lead.id);

      return NextResponse.json({
        success: true,
        mode: "evolution",
        message,
      });
    }

    await supabase
      .from("prospecting_leads")
      .update({
        status: "contacted",
        last_message_at: nowIso,
        chat_history: updatedHistory,
      })
      .eq("id", lead.id);

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({
      success: true,
      mode: "wa_link",
      waUrl,
      message,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro ao preparar abordagem via WhatsApp.",
      },
      { status: 500 }
    );
  }
}
