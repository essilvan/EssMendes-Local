import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Mercado Pago Webhook Endpoint Active" }, { status: 200 });
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
        const tenantId = payment.external_reference;
        const supabaseKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          supabaseKey
        );

        // Ativa o plano por 30 dias a partir de hoje
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        const { error: updateError } = await supabase
          .from("tenants")
          .update({
            subscription_status: "active",
            plan_tier: "pro",
            mp_payment_id: String(id),
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", tenantId);

        if (updateError) {
          console.error("[Webhook MercadoPago] Erro ao atualizar tenant:", updateError);
        } else {
          console.log(`[Webhook MercadoPago] Assinatura Pro ativada com sucesso para tenant ${tenantId} até ${periodEnd.toISOString()}`);
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook MercadoPago] Erro no processamento:", error);
    // Sempre retornar 200 para o Mercado Pago não reenviar em loop caso seja requisição de teste
    return NextResponse.json({ status: "ok", error: error?.message }, { status: 200 });
  }
}
