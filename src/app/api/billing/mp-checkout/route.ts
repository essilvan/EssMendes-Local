import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("[MP-Checkout] MERCADO_PAGO_ACCESS_TOKEN não configurado no servidor.");
      return NextResponse.json(
        { error: "Configuração do Mercado Pago ausente no servidor." },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    let tenantId = body.tenantId;
    let tenantName = body.tenantName;
    let email = body.email || body.payerEmail;
    let payerCpf = body.payerCpf || body.cpf || body.cnpj || body.identification;
    let payerName = body.payerName || body.name || body.fullName;
    const method = body.method || "pix";

    // Se estiver autenticado, garante ou complementa com os dados reais da sessão do tenant
    const { data: authContext } = await getAuthenticatedTenant();
    if (authContext?.tenant) {
      tenantId = authContext.tenantId || tenantId;
      tenantName = tenantName || authContext.tenant.name;
      email = email || authContext.user.email;
      payerName =
        payerName ||
        (authContext.user.user_metadata?.full_name as string) ||
        (authContext.user.user_metadata?.name as string) ||
        authContext.tenant.name;
      payerCpf =
        payerCpf ||
        (authContext.user.user_metadata?.cpf as string) ||
        (authContext.user.user_metadata?.cnpj as string) ||
        (authContext.tenant as any)?.document;
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Identificador do estabelecimento (tenantId) não fornecido." },
        { status: 400 }
      );
    }

    tenantName = tenantName || "Estabelecimento";

    // 1. Meio de pagamento: Cartão de Crédito via Preference (excluindo boleto e pix)
    if (method === "card") {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://local.essmendes.com.br").replace(/\/$/, "");
      const isLocalhost = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

      const preference = new Preference(client);
      const prefResult = await preference.create({
        body: {
          items: [
            {
              id: "plano-pro-mensal",
              title: `Mensalidade Vitrine EssMendes - ${tenantName}`,
              quantity: 1,
              unit_price: 97.00,
              currency_id: "BRL",
            },
          ],
          payment_methods: {
            // Exclui boleto e pix nesta preferência para abrir direto o formulário de cartão
            excluded_payment_types: [
              { id: "ticket" }, // exclui boleto
              { id: "bank_transfer" }, // exclui pix
            ],
            installments: 12,
          },
          payer: {
            email: email || "financeiro@essmendes.com.br",
          },
          external_reference: tenantId,
          back_urls: {
            success: `${appUrl}/admin/assinatura?status=success`,
            pending: `${appUrl}/admin/assinatura?status=pending`,
            failure: `${appUrl}/admin/assinatura?status=failure`,
          },
          ...(isLocalhost ? {} : { auto_return: "approved" as const }),
          ...(appUrl.startsWith("https://")
            ? { notification_url: `${appUrl}/api/webhooks/mercadopago` }
            : {}),
        },
      });

      return NextResponse.json({
        success: true,
        method: "card",
        checkoutUrl: prefResult.init_point,
      });
    }

    // 2. Meio de pagamento: Pix Instantâneo Transparente via Payment
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: 97.00,
        description: `Mensalidade Vitrine EssMendes - ${tenantName}`,
        payment_method_id: "pix",
        payer: {
          email: email || "cliente@essmendes.com.br",
          first_name: payerName ? payerName.split(" ")[0] : "Cliente",
          last_name: payerName ? payerName.split(" ").slice(1).join(" ") || "Local" : "EssMendes",
          identification: {
            type: payerCpf && payerCpf.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF",
            number: payerCpf ? payerCpf.replace(/\D/g, "") : "00000000000",
          },
        },
        external_reference: tenantId,
      },
    });

    const pointOfInteraction = result.point_of_interaction?.transaction_data;

    return NextResponse.json({
      success: true,
      method: "pix",
      paymentId: result.id,
      qrCode: pointOfInteraction?.qr_code, // Código copia e cola
      qrCodeBase64: pointOfInteraction?.qr_code_base64, // Imagem do QR Code em base64
      ticketUrl: pointOfInteraction?.ticket_url,
    });
  } catch (error: any) {
    console.error("Erro ao processar pagamento MP:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao processar pagamento" },
      { status: 500 }
    );
  }
}
