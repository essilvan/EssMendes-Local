import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { AlertCircle, ArrowLeft } from "lucide-react";
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
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || "";
  const slug = typeof rawSlug === "string" ? decodeURIComponent(rawSlug).trim() : "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  let { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant && slug) {
    const { data: lowerTenant } = await supabase
      .from("tenants")
      .select("name")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();
    tenant = lowerTenant;
  }

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
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || "";
  const slug = typeof rawSlug === "string" ? decodeURIComponent(rawSlug).trim() : "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // 1. Busca os dados completos do tenant pelo slug utilizando .select('*')
  let { data: tenant, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // Fallback 1: Caso o slug esteja com case diferente no banco
  if (!tenant && slug) {
    const { data: lowerTenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();
    tenant = lowerTenant;
  }

  // Fallback 2: Se for um UUID (ID do tenant)
  if (!tenant && /^[0-9a-fA-F-]{36}$/.test(slug)) {
    const { data: byId } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", slug)
      .maybeSingle();
    tenant = byId;
  }

  // Se o tenant não existir, retorna mensagem amigável e segura
  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 antialiased selection:bg-emerald-500 selection:text-white">
        <div className="w-full max-w-md mx-auto rounded-3xl bg-white text-slate-900 p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 border border-amber-300">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900">
              Fatura Não Encontrada
            </h1>
            <p className="text-xs text-slate-500">
              Não encontramos nenhuma empresa vinculada a{" "}
              <strong className="font-mono text-slate-800">/fatura/{slug || "desconhecida"}</strong>.
            </p>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1">
            <p className="font-bold text-slate-800">O que você pode fazer:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
              <li>Verifique se o link foi copiado por completo do WhatsApp.</li>
              <li>Entre em contato com o suporte caso o link tenha expirado.</li>
            </ul>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-3 text-xs font-bold text-white transition shadow-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar para a Página Inicial</span>
            </a>
          </div>
        </div>
      </div>
    );
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
