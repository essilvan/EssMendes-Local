import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("[MP-Checkout] MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente.");
      return NextResponse.json(
        { error: "Configuração do Mercado Pago ausente no servidor." },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });

    // Tenta obter dados do corpo da requisição
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    let tenantId = body.tenantId;
    let tenantName = body.tenantName;
    let email = body.email || body.payerEmail;
    let payerName = body.payerName || body.name || body.fullName;
    let payerCpf = body.payerCpf || body.cpf || body.cnpj || body.identification;

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
    payerCpf = payerCpf || process.env.DEFAULT_PAYER_CPF || "11144477735";

    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local.essmendes.com.br";
    const appUrl = rawAppUrl.replace(/\/$/, "");
    const isLocalhost = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

    const preference = new Preference(client);
    const response = await preference.create({
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
        payer: {
          name: payerName ? payerName.split(" ")[0] : "Cliente",
          surname: payerName ? payerName.split(" ").slice(1).join(" ") || "Assinante" : "EssMendes",
          email: email || "contato@essmendes.com.br",
          ...(payerCpf ? {
            identification: {
              type: payerCpf.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF",
              number: payerCpf.replace(/\D/g, ""),
            },
          } : {}),
        },
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
        },
        external_reference: tenantId,
        back_urls: {
          success: `${appUrl}/admin/assinatura?status=success`,
          pending: `${appUrl}/admin/assinatura?status=pending`,
          failure: `${appUrl}/admin/assinatura?status=failure`,
        },
        // O Mercado Pago só aceita auto_return: 'approved' quando a URL de retorno não for localhost
        ...(isLocalhost ? {} : { auto_return: "approved" as const }),
        ...(appUrl.startsWith("https://")
          ? { notification_url: `${appUrl}/api/webhooks/mercadopago` }
          : {}),
      },
    });

    return NextResponse.json({
      init_point: response.init_point,
      id: response.id,
    });
  } catch (error: any) {
    console.error("[MP-Checkout] Erro ao criar preferência no Mercado Pago:", error);
    return NextResponse.json(
      {
        error: error?.message || "Falha ao processar checkout com Mercado Pago.",
        details: error?.cause || null,
      },
      { status: 500 }
    );
  }
}
