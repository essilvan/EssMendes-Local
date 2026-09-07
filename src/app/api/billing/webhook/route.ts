import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Billing Webhook Endpoint Active" }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let topic = searchParams.get("topic") || searchParams.get("type");
    let id = searchParams.get("id") || searchParams.get("data.id");

    // Mercado Pago pode enviar notificação via Webhooks v2 no corpo JSON
    if (!id || !topic) {
      try {
        const body = await req.json();
        topic = topic || body?.type || body?.topic || (body?.action?.startsWith("payment") ? "payment" : null);
        id = id || body?.data?.id || body?.id;
      } catch {
        // Corpo não é JSON ou vazio
      }
    }

    if (topic === "payment" && id) {
      const paymentInstance = new Payment(client);
      const payment = await paymentInstance.get({ id: String(id) });

      if (payment.status === "approved" && payment.external_reference) {
        let tenantId = "";
        let offerType: string | null = null;
        let days = 30;

        try {
          const parsed = JSON.parse(payment.external_reference);
          if (parsed && typeof parsed === "object" && parsed.tenantId) {
            tenantId = parsed.tenantId;
            offerType = parsed.offerType || null;
            days = Number(parsed.days) || 30;
          } else {
            tenantId = String(payment.external_reference);
          }
        } catch {
          // Se for string simples, usa tenantId direto e 30 dias de vigência
          tenantId = String(payment.external_reference);
        }

        if (tenantId) {
          const supabaseKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            supabaseKey
          );

          // Calcula a nova data de expiração: now() + days
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + days);

          const updatePayload: Record<string, any> = {
            subscription_status: "active",
            plan_tier: "pro",
            mp_payment_id: String(id),
            current_period_end: expirationDate.toISOString(),
            subscription_expires_at: expirationDate.toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (offerType) {
            updatePayload.subscription_plan = offerType;
            if (offerType === "setup_monthly" || offerType === "semiannual") {
              updatePayload.setup_paid = true;
            }
          }

          const { error: updateError } = await supabase
            .from("tenants")
            .update(updatePayload)
            .eq("id", tenantId);

          if (updateError) {
            console.error("[Webhook Billing] Erro ao atualizar tenant:", updateError);
          } else {
            console.log(
              `[Webhook Billing] Assinatura (${offerType || "mensal"}) ativada para tenant ${tenantId} até ${expirationDate.toISOString()}`
            );
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook Billing] Erro no processamento:", error);
    // Sempre retornar 200 para o Mercado Pago não reenviar em loop caso ocorra falha transitória
    return NextResponse.json({ status: "ok", error: error?.message }, { status: 200 });
  }
}
