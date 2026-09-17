import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export async function GET(req: Request) {
  return handleStatusCheck(req);
}

export async function POST(req: Request) {
  return handleStatusCheck(req);
}

async function handleStatusCheck(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let paymentId = searchParams.get("paymentId") || searchParams.get("id");
    let tenantId = searchParams.get("tenantId");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        paymentId = paymentId || body.paymentId || body.id;
        tenantId = tenantId || body.tenantId;
      } catch {
        // Ignora erro de parse de body
      }
    }

    if (!paymentId && !tenantId) {
      return NextResponse.json(
        { error: "paymentId ou tenantId é obrigatório." },
        { status: 400 }
      );
    }

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey
    );

    // 1. Se paymentId for fornecido, consulta o status no Mercado Pago
    if (paymentId) {
      try {
        const paymentInstance = new Payment(client);
        const payment = await paymentInstance.get({ id: String(paymentId) });

        if (payment && payment.status === "approved") {
          let offerType: string | null = null;
          let days = 30;

          if (payment.external_reference) {
            try {
              const parsed = JSON.parse(payment.external_reference);
              if (parsed && typeof parsed === "object") {
                tenantId = tenantId || parsed.tenantId;
                offerType = parsed.offerType || parsed.type || null;
                days = Number(parsed.days) || 30;
              } else {
                tenantId = tenantId || String(payment.external_reference);
              }
            } catch {
              tenantId = tenantId || String(payment.external_reference);
            }
          }

          if (tenantId) {
            const now = new Date();
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + days);

            const isSetupOffer =
              offerType === "setup" ||
              offerType === "setup_monthly" ||
              offerType === "semiannual";

            const updatePayload: Record<string, any> = {
              subscription_status: "active",
              plan_tier: "pro",
              mp_payment_id: String(paymentId),
              current_period_end: expirationDate.toISOString(),
              subscription_expires_at: expirationDate.toISOString(),
              updated_at: now.toISOString(),
            };

            if (offerType) {
              updatePayload.subscription_plan = offerType;
            }

            if (isSetupOffer) {
              updatePayload.setup_paid = true;
              updatePayload.setup_fee_paid = true;
              updatePayload.setup_paid_at = now.toISOString();
              updatePayload.subscription_starts_at = now.toISOString();
            }

            await supabase
              .from("tenants")
              .update(updatePayload)
              .eq("id", tenantId);

            return NextResponse.json({
              success: true,
              approved: true,
              status: "approved",
              offerType,
              isSetupPaid: isSetupOffer,
            });
          }

          return NextResponse.json({
            success: true,
            approved: true,
            status: "approved",
          });
        }

        // Se o pagamento no MP ainda não estiver approved, checa se no Supabase já consta como pago
        if (tenantId) {
          const { data: tenant } = await supabase
            .from("tenants")
            .select("setup_fee_paid, setup_paid, subscription_status")
            .eq("id", tenantId)
            .maybeSingle();

          const isSetupPaidInDb = Boolean(tenant?.setup_fee_paid || tenant?.setup_paid);

          if (isSetupPaidInDb) {
            return NextResponse.json({
              success: true,
              approved: true,
              status: "approved",
              isSetupPaid: true,
            });
          }
        }

        return NextResponse.json({
          success: true,
          approved: false,
          status: payment?.status || "pending",
        });
      } catch (mpErr: any) {
        console.warn("[MP-Status] Falha ao consultar Mercado Pago por paymentId:", mpErr?.message);
      }
    }

    // 2. Se falhar ou apenas tenantId for fornecido, consulta o status diretamente no banco
    if (tenantId) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("setup_fee_paid, setup_paid, subscription_status")
        .eq("id", tenantId)
        .maybeSingle();

      const isSetupPaidInDb = Boolean(tenant?.setup_fee_paid || tenant?.setup_paid);

      return NextResponse.json({
        success: true,
        approved: isSetupPaidInDb || tenant?.subscription_status === "active",
        status: isSetupPaidInDb ? "approved" : tenant?.subscription_status || "pending",
        isSetupPaid: isSetupPaidInDb,
      });
    }

    return NextResponse.json({
      success: true,
      approved: false,
      status: "pending",
    });
  } catch (err: any) {
    console.error("[MP-Status] Erro ao verificar status:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao verificar status do pagamento." },
      { status: 500 }
    );
  }
}
