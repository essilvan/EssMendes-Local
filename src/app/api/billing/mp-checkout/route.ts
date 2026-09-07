import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import type { OfferType } from "@/types";

export const dynamic = "force-dynamic";

interface OfferConfig {
  unitPrice: number;
  getTitle: (name: string) => string;
  days: number;
  itemId: string;
}

const OFFERS_MAP: Record<OfferType, OfferConfig> = {
  setup_monthly: {
    unitPrice: 297.00,
    getTitle: (name) => `Setup Profissional + 1º Mês Vitrine EssMendes - ${name}`,
    days: 30,
    itemId: "setup-profissional-1mes",
  },
  semiannual: {
    unitPrice: 497.00,
    getTitle: (name) => `Plano Semestral (Setup Grátis + 6 Meses) - ${name}`,
    days: 180,
    itemId: "plano-semestral-setup-gratis",
  },
  monthly_renewal: {
    unitPrice: 97.00,
    getTitle: (name) => `Mensalidade Vitrine EssMendes - ${name}`,
    days: 30,
    itemId: "mensalidade-vitrine-essmendes",
  },
};

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

    // Se estiver autenticado, complementa com os dados da sessão do tenant
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

    // Resolução da oferta selecionada
    const rawOfferType: OfferType = body.offerType;
    const offerType: OfferType = OFFERS_MAP[rawOfferType] ? rawOfferType : "monthly_renewal";
    const selectedOffer = OFFERS_MAP[offerType];

    const itemTitle = selectedOffer.getTitle(tenantName);
    const itemPrice = selectedOffer.unitPrice;
    const diasVigencia = selectedOffer.days;

    // Embutir na external_reference o tenantId, offerType e dias
    const externalReference = JSON.stringify({
      tenantId,
      offerType,
      days: diasVigencia,
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://local.essmendes.com.br").replace(/\/$/, "");
    const isLocalhost = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

    // 1. Meio de pagamento: Cartão de Crédito via Preference (com parcelamento em até 12x)
    if (method === "card") {
      const preference = new Preference(client);
      const prefResult = await preference.create({
        body: {
          items: [
            {
              id: selectedOffer.itemId,
              title: itemTitle,
              quantity: 1,
              unit_price: itemPrice,
              currency_id: "BRL",
            },
          ],
          payment_methods: {
            // Exclui boleto e pix nesta preferência para abrir diretamente o checkout de cartão
            excluded_payment_types: [
              { id: "ticket" }, // exclui boleto
              { id: "bank_transfer" }, // exclui pix
            ],
            installments: 12,
          },
          payer: {
            email: email || "financeiro@essmendes.com.br",
          },
          external_reference: externalReference,
          back_urls: {
            success: `${appUrl}/admin/assinatura?status=success`,
            pending: `${appUrl}/admin/assinatura?status=pending`,
            failure: `${appUrl}/admin/assinatura?status=failure`,
          },
          ...(isLocalhost ? {} : { auto_return: "approved" as const }),
          ...(appUrl.startsWith("https://")
            ? { notification_url: `${appUrl}/api/billing/webhook` }
            : {}),
        },
      });

      return NextResponse.json({
        success: true,
        method: "card",
        checkoutUrl: prefResult.init_point,
        offerType,
        amount: itemPrice,
      });
    }

    // 2. Meio de pagamento: Pix Instantâneo Transparente via Payment
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: itemPrice,
        description: itemTitle,
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
        external_reference: externalReference,
        ...(appUrl.startsWith("https://")
          ? { notification_url: `${appUrl}/api/billing/webhook` }
          : {}),
      },
    });

    const pointOfInteraction = result.point_of_interaction?.transaction_data;

    return NextResponse.json({
      success: true,
      method: "pix",
      paymentId: result.id,
      offerType,
      amount: itemPrice,
      qrCode: pointOfInteraction?.qr_code, // Código copia e cola
      qrCodeBase64: pointOfInteraction?.qr_code_base64, // Imagem do QR Code em base64
      ticketUrl: pointOfInteraction?.ticket_url,
    });
  } catch (error: any) {
    console.error("[MP-Checkout] Erro ao processar pagamento:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao processar pagamento no Mercado Pago." },
      { status: 500 }
    );
  }
}
