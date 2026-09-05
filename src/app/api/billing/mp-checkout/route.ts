import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
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
      paymentId: result.id,
      qrCode: pointOfInteraction?.qr_code, // Código copia e cola
      qrCodeBase64: pointOfInteraction?.qr_code_base64, // Imagem do QR Code em base64
      ticketUrl: pointOfInteraction?.ticket_url,
    });
  } catch (error: any) {
    console.error("Erro ao gerar Pix MP:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao gerar Pix" },
      { status: 500 }
    );
  }
}
