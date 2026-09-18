import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  PublicInvoiceClient,
  type PublicInvoicePixData,
} from "@/components/public/PublicInvoiceClient";

export const dynamic = "force-dynamic";

interface FaturaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: FaturaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey
  );

  let { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant && /^[0-9a-fA-F-]{36}$/.test(slug)) {
    const { data: byId } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", slug)
      .maybeSingle();
    tenant = byId;
  }

  if (!tenant) {
    return {
      title: "Fatura de Ativação | EssMendes Tecnologia",
    };
  }

  return {
    title: `Ativação de Vitrine — ${tenant.name} | EssMendes Tecnologia`,
    description: `Fatura de ativação e implantação oficial no Google para ${tenant.name}. Pagamento seguro via Pix com ativação imediata.`,
    openGraph: {
      title: `Ativação de Vitrine — ${tenant.name}`,
      description: `Fatura de ativação e implantação oficial no Google para ${tenant.name}. Pagamento seguro via Pix com ativação imediata.`,
    },
  };
}

export default async function FaturaPage({ params }: FaturaPageProps) {
  const { slug } = await params;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey
  );

  // 1. Busca os dados do tenant pelo slug (ou id como fallback)
  let { data: tenant, error } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, phone, contact_email, setup_fee_amount, setup_fee_paid, setup_paid, subscription_status, mp_payment_id"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant && /^[0-9a-fA-F-]{36}$/.test(slug)) {
    const { data: byId } = await supabase
      .from("tenants")
      .select(
        "id, name, slug, phone, contact_email, setup_fee_amount, setup_fee_paid, setup_paid, subscription_status, mp_payment_id"
      )
      .eq("id", slug)
      .maybeSingle();
    tenant = byId;
  }

  if (error || !tenant) {
    notFound();
  }

  let isAlreadyPaid = Boolean(tenant.setup_paid || tenant.setup_fee_paid);
  let initialPix: PublicInvoicePixData | null = null;

  // 2. Se não estiver pago, tenta reaproveitar cobrança pendente ou gerar novo Pix
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!isAlreadyPaid && accessToken) {
    try {
      const mpClient = new MercadoPagoConfig({ accessToken });
      const paymentInstance = new Payment(mpClient);

      // 2.1 Reaproveitar cobrança ativa pendente salva no banco
      if (tenant.mp_payment_id) {
        try {
          const existingPayment = await paymentInstance.get({
            id: String(tenant.mp_payment_id),
          });

          if (existingPayment.status === "approved") {
            isAlreadyPaid = true;
            await supabase
              .from("tenants")
              .update({
                setup_paid: true,
                setup_fee_paid: true,
                setup_paid_at: new Date().toISOString(),
              })
              .eq("id", tenant.id);
          } else if (
            existingPayment.status === "pending" &&
            existingPayment.point_of_interaction?.transaction_data?.qr_code
          ) {
            initialPix = {
              paymentId: String(existingPayment.id),
              qrCode: existingPayment.point_of_interaction.transaction_data.qr_code,
              qrCodeBase64:
                existingPayment.point_of_interaction.transaction_data.qr_code_base64,
              amount:
                Number(existingPayment.transaction_amount) ||
                Number(tenant.setup_fee_amount) ||
                197.0,
            };
          }
        } catch (getErr) {
          console.warn("[FaturaPage] Cobrança anterior no MP não pôde ser reaproveitada:", getErr);
        }
      }

      // 2.2 Se não encontrou cobrança ativa reaproveitável, cria uma nova
      if (!isAlreadyPaid && !initialPix) {
        const setupAmount =
          tenant.setup_fee_amount !== null && tenant.setup_fee_amount !== undefined
            ? Number(tenant.setup_fee_amount)
            : 197.0;

        const externalReference = JSON.stringify({
          tenantId: tenant.id,
          offerType: "setup",
          type: "setup",
          amount: setupAmount,
        });

        const appUrl = (
          process.env.NEXT_PUBLIC_APP_URL || "https://local.essmendes.com.br"
        ).replace(/\/$/, "");

        const newPayment = await paymentInstance.create({
          body: {
            transaction_amount: setupAmount,
            description: `Taxa de Implantação e Otimização - ${tenant.name}`,
            payment_method_id: "pix",
            payer: {
              email: tenant.contact_email || "financeiro@essmendes.com.br",
              first_name: tenant.name ? tenant.name.split(" ")[0] : "Cliente",
              last_name:
                tenant.name && tenant.name.split(" ").length > 1
                  ? tenant.name.split(" ").slice(1).join(" ")
                  : "Local",
            },
            external_reference: externalReference,
            ...(appUrl.startsWith("https://")
              ? { notification_url: `${appUrl}/api/billing/webhook` }
              : {}),
          },
        });

        const poi = newPayment.point_of_interaction?.transaction_data;
        if (poi?.qr_code) {
          initialPix = {
            paymentId: String(newPayment.id),
            qrCode: poi.qr_code,
            qrCodeBase64: poi.qr_code_base64,
            amount: setupAmount,
          };

          // Salva mp_payment_id no tenant para reaproveitamento consistente
          await supabase
            .from("tenants")
            .update({ mp_payment_id: String(newPayment.id) })
            .eq("id", tenant.id);
        }
      }
    } catch (mpErr) {
      console.error("[FaturaPage] Erro ao comunicar com Mercado Pago:", mpErr);
    }
  }

  return (
    <PublicInvoiceClient
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        phone: tenant.phone,
        setup_fee_amount: tenant.setup_fee_amount,
      }}
      initialPix={initialPix}
      isAlreadyPaid={isAlreadyPaid}
    />
  );
}
