import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { redirect } from "next/navigation";
import { MercadoPagoSubscribeButton } from "@/components/admin/MercadoPagoSubscribeButton";
import { CopyPixButton } from "@/components/admin/CopyPixButton";
import { getPlatformPixSettingsAction } from "@/services/platform-settings.actions";
import {
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  Zap,
  Check,
  Wrench,
  MessageCircle,
  Store,
  BadgePercent,
  Star,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AssinaturaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminAssinaturaPage({ searchParams }: AssinaturaPageProps) {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    redirect("/login");
  }

  if (!tenantContext.isSuperAdmin && tenantContext.tenant?.permissions?.billing === false) {
    redirect("/admin/dashboard?error=recurso_indisponivel");
  }

  const resolvedParams = await searchParams;
  const statusParam = typeof resolvedParams.status === "string" ? resolvedParams.status : null;

  const tenant = tenantContext.tenant;
  const user = tenantContext.user;

  // Busca configurações globais de cobrança da agência (Chave Pix e Titular)
  const { data: pixSettings } = await getPlatformPixSettingsAction();
  const agencyPixKey =
    pixSettings?.pix_agency_key ||
    process.env.NEXT_PUBLIC_AGENCY_PIX_KEY ||
    "essilvanmendes@gmail.com";
  const agencyPixHolder =
    pixSettings?.pix_agency_holder ||
    process.env.NEXT_PUBLIC_AGENCY_HOLDER ||
    "EssMendes Tecnologia";

  // Status de Setup Manual e Mensalidade Customizada
  const isSetupPaid = Boolean(tenant?.setup_fee_paid ?? tenant?.setup_paid);
  const setupFeeAmount =
    tenant?.setup_fee_amount !== null && tenant?.setup_fee_amount !== undefined
      ? Number(tenant.setup_fee_amount)
      : 197;
  const monthlyFeeAmount =
    tenant?.monthly_fee_amount !== null && tenant?.monthly_fee_amount !== undefined
      ? Number(tenant.monthly_fee_amount)
      : 97;
  const setupPaidAt = tenant?.setup_paid_at;

  const subscriptionStatus = tenant?.subscription_status || "trialing";
  const subscriptionPlan = tenant?.subscription_plan;
  const expirationDateRaw = tenant?.subscription_expires_at || tenant?.current_period_end;

  const isActive = subscriptionStatus === "active";
  const isOverdue = subscriptionStatus === "overdue";
  const isTrialOrPending = !isActive && !isOverdue;

  // Formatação da data de quitação do setup
  let formattedSetupPaidAt: string | null = null;
  if (setupPaidAt) {
    try {
      const d = new Date(setupPaidAt);
      if (!isNaN(d.getTime())) {
        formattedSetupPaidAt = d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch {}
  }

  // Formatação amigável da data de expiração/validade da mensalidade
  let formattedPeriodEnd: string | null = null;
  let daysRemaining: number | null = null;
  if (expirationDateRaw) {
    try {
      const dateObj = new Date(expirationDateRaw);
      if (!isNaN(dateObj.getTime())) {
        formattedPeriodEnd = dateObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const now = new Date();
        daysRemaining = Math.ceil((dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    } catch {
      formattedPeriodEnd = expirationDateRaw;
    }
  }

  const agencyPhone =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ||
    process.env.NEXT_PUBLIC_AGENCY_WHATSAPP ||
    "5511999999999";
  const cleanPhone = agencyPhone.replace(/\D/g, "");
  const whatsappSetupProofUrl = `https://wa.me/${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}?text=${encodeURIComponent(
    `Olá! Segue o comprovante de pagamento da taxa de setup da vitrine ${tenant?.name || ""} (R$ ${setupFeeAmount.toFixed(2).replace(".", ",")}). Aguardo a liberação.`
  )}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Feedback de retorno do Mercado Pago (back_urls) */}
      {statusParam === "success" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-950">
                Pagamento aprovado com sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                Seu pagamento foi confirmado pelo Mercado Pago e a vigência da sua mensalidade foi atualizada.
                Caso o status ainda não tenha atualizado nesta tela, aguarde alguns instantes e recarregue a página.
              </p>
            </div>
          </div>
        </div>
      )}

      {statusParam === "pending" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-950">
                Pagamento em processamento
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                Identificamos seu pedido de pagamento via Pix ou Cartão. Assim que o Mercado Pago validar a liquidação, sua mensalidade será renovada automaticamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {statusParam === "failure" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-red-950">
                O pagamento não foi concluído
              </h3>
              <p className="text-xs sm:text-sm text-red-800 leading-relaxed">
                Não conseguimos confirmar a cobrança no Mercado Pago. Por favor, tente novamente ou utilize outra forma de pagamento (como Pix instantâneo ou outro cartão de crédito).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Gestão de Assinatura & Planos</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Assinatura & Faturamento
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe o status do setup, a validade da sua hospedagem e realize o pagamento da mensalidade via Pix ou Cartão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
            Loja: <strong className="text-slate-800">{tenant?.name}</strong>
          </span>
        </div>
      </div>

      {/* 1. CARD DE IMPLANTAÇÃO & SETUP */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Wrench className="h-4 w-4 text-teal-600" />
          <span>Etapa 1: Implantação Técnica & Otimização Local</span>
        </div>

        {isSetupPaid ? (
          /* Setup Quitado */
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-xs space-y-2 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-emerald-950">
                    ✅ Setup & Otimização Google Maps Concluídos
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {formattedSetupPaidAt
                      ? `Quitado em ${formattedSetupPaidAt}`
                      : "Taxa de implantação e otimização quitada"} • Valor de R$ {setupFeeAmount.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 border border-emerald-200 shrink-0">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Setup Concluído
              </span>
            </div>
          </div>
        ) : (
          /* Setup Pendente com Chave Pix e WhatsApp */
          <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/60 p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                    Aguardando Pagamento
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    Taxa de Implantação e Setup Pendente: R$ {setupFeeAmount.toFixed(2).replace(".", ",")}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Configure a vitrine oficial do seu negócio e ative o ranqueamento no Google Maps efetuando o pagamento único de setup.
                  </p>
                </div>
              </div>
            </div>

            {/* Box com Chave Pix, Titular e Copiar */}
            <div className="rounded-2xl border border-amber-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Chave Pix Comercial da Agência:
                </span>
                <CopyPixButton pixKey={agencyPixKey} />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 font-mono text-sm font-bold text-slate-800 select-all">
                {agencyPixKey}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-500">Titular da Conta:</span>
                <strong className="text-slate-800">{agencyPixHolder}</strong>
              </div>

              <p className="text-[11px] text-slate-500">
                Transfira o valor de <strong>R$ {setupFeeAmount.toFixed(2).replace(".", ",")}</strong> e clique no botão abaixo para enviar o comprovante diretamente para nossa equipe de suporte no WhatsApp.
              </p>
            </div>

            {/* Botão Enviar Comprovante WhatsApp */}
            <div>
              <a
                href={whatsappSetupProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:scale-101"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Enviar Comprovante no WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 2. CARD DE MENSALIDADE & HOSPEDAGEM */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Zap className="h-4 w-4 text-teal-600" />
          <span>Etapa 2: Mensalidade, Hospedagem & Manutenção Contínua</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Mensalidade Regular da Vitrine EssMendes
                </h2>

                {isActive && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Plano Ativo
                  </span>
                )}

                {isOverdue && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Mensalidade em Atraso
                  </span>
                )}

                {isTrialOrPending && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Aguardando Vencimento / Pagamento
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500">
                Hospedagem de alta velocidade, sincronização do Google Places, catálogo de produtos e posts de SEO Local contínuos.
              </p>
            </div>

            {/* Próxima Fatura Mensal */}
            <div className="flex flex-col sm:items-end bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Data da Próxima Fatura Mensal</span>
              {formattedPeriodEnd ? (
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">
                    {formattedPeriodEnd}
                  </span>
                  {daysRemaining !== null && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        daysRemaining > 5
                          ? "bg-emerald-100 text-emerald-800"
                          : daysRemaining >= 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {daysRemaining > 0
                        ? `${daysRemaining} dias restantes`
                        : daysRemaining === 0
                        ? "Vence hoje"
                        : "Expirado"}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-bold text-amber-700 mt-0.5">
                  Agendada para 30 dias após confirmação do setup
                </span>
              )}
            </div>
          </div>

          {/* Destaque do Valor da Mensalidade */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Valor Recorrente Acordado
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-slate-900">
                  R$ {monthlyFeeAmount.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ mês</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 max-w-sm">
              Cobrança mensal exclusiva de hospedagem, domínio, suporte e manutenção contínua da vitrine oficial.
            </div>
          </div>

          {/* Botão Mercado Pago Exclusivo para Mensalidade Recorrente */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <MercadoPagoSubscribeButton
              tenantId={tenantContext.tenantId}
              tenantName={tenant?.name || "Estabelecimento"}
              userEmail={user.email || ""}
              payerName={
                (user.user_metadata?.full_name as string) ||
                (user.user_metadata?.name as string) ||
                tenant?.name ||
                ""
              }
              payerCpf={
                (user.user_metadata?.cpf as string) ||
                (user.user_metadata?.cnpj as string) ||
                ""
              }
              offerType="monthly_renewal"
              customAmount={monthlyFeeAmount}
              pixButtonText={`⚡ Pagar Mensalidade via Pix Instantâneo (R$ ${monthlyFeeAmount.toFixed(2).replace(".", ",")})`}
              cardButtonText={`💳 Pagar Mensalidade no Cartão de Crédito (R$ ${monthlyFeeAmount.toFixed(2).replace(".", ",")})`}
            />
          </div>
        </div>
      </div>

      {/* Card Informativo de Recursos Inclusos */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Recursos Inclusos na Vitrine EssMendes Local</span>
          </h3>
          <p className="text-xs text-slate-500">
            Tudo o que sua empresa precisa para manter alta autoridade e receber clientes pelo Google Maps.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-700">
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Serviços Ilimitados</strong>
              <span>Cadastre todos os seus serviços sem limite de catálogo.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Vitrine de Produtos</strong>
              <span>Exiba fotos, preços e promoções na vitrine pública.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Google Places Sync</strong>
              <span>Avaliações reais, fotos e horários sincronizados via API oficial.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Posts de SEO Local Automatizados</strong>
              <span>Artigos otimizados com dados estruturados Schema.org.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suporte e Ajuda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-teal-700 shrink-0" />
          <span>Precisa de nota fiscal, pagamento corporativo ou suporte especializado?</span>
        </div>
        <Link
          href="/admin/faturamento"
          className="font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 shrink-0"
        >
          <span>Ver comparativo de planos</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
