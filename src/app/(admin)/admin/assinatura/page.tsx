import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { redirect } from "next/navigation";
import { MercadoPagoSubscribeButton } from "@/components/admin/MercadoPagoSubscribeButton";
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

  const isSetupPaid = Boolean(tenant?.setup_paid);
  const subscriptionStatus = tenant?.subscription_status || "trialing";
  const subscriptionPlan = tenant?.subscription_plan;
  const expirationDateRaw = tenant?.subscription_expires_at || tenant?.current_period_end;

  const isActive = subscriptionStatus === "active";
  const isOverdue = subscriptionStatus === "overdue";
  const isTrialOrPending = !isActive && !isOverdue;

  // Formatação amigável da data de expiração/validade
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

  // Nome amigável do plano ativo
  let planDisplayName = "Plano Pro";
  if (subscriptionPlan === "semiannual") {
    planDisplayName = "Plano Semestral (6 Meses)";
  } else if (subscriptionPlan === "setup_monthly") {
    planDisplayName = "Plano Pro Mensal (Setup Inicial)";
  } else if (subscriptionPlan === "monthly_renewal") {
    planDisplayName = "Plano Pro Mensal";
  }

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
                Seu pagamento foi confirmado pelo Mercado Pago e a vigência da sua vitrine foi atualizada.
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
                Identificamos seu pedido de pagamento via Pix ou Cartão. Assim que o Mercado Pago validar a liquidação, sua vitrine será ativada automaticamente.
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
            Gerencie o plano da sua vitrine, acompanhe a validade e realize pagamentos instantâneos via Pix ou Cartão em até 12x.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
            Loja: <strong className="text-slate-800">{tenant?.name}</strong>
          </span>
        </div>
      </div>

      {/* Card de Status da Assinatura Atual */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Situação da Vitrine
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {planDisplayName}
              </h2>

              {/* Badges de Status */}
              {isActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Plano Ativo
                </span>
              )}

              {isOverdue && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Assinatura Vencida
                </span>
              )}

              {isTrialOrPending && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Aguardando Ativação / Pagamento
                </span>
              )}

              {/* Tag de Setup */}
              {isSetupPaid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 border border-teal-200">
                  <Check className="h-3.5 w-3.5 text-teal-600" />
                  Setup Quitado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                  Setup Pendente
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Domínio da vitrine: <strong className="text-teal-700">{tenant?.slug}.essmendes.com.br</strong>
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-slate-500">Validade da Assinatura</span>
            {formattedPeriodEnd ? (
              <div className="flex items-baseline gap-2">
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
              <span className="text-sm font-bold text-amber-700">
                Pendente de ativação
              </span>
            )}
          </div>
        </div>

        {/* Informações Complementares */}
        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Calendar className="h-4 w-4 text-teal-700" />
              <span>Ciclo e Renovação:</span>
            </div>
            <p className="text-slate-600">
              {isSetupPaid
                ? "Sua assinatura segue a renovação mensal padrão no valor de R$ 97,00/mês."
                : "Seu estabelecimento ainda não possui o Setup Profissional ativo. Escolha uma das ofertas de entrada abaixo para colocar sua vitrine no ar."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              <span>Segurança e Meios de Pagamento:</span>
            </div>
            <p className="text-slate-600">
              Pix Instantâneo ou Cartão de Crédito em até 12x processados em ambiente seguro criptografado pelo Mercado Pago.
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: LOJISTA SEM SETUP PAGO -> EXIBE AS 2 OPÇÕES DE ENTRADA */}
      {!isSetupPaid && (
        <div className="space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <span>Ativação da Vitrine EssMendes</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Escolha como deseja iniciar sua vitrine
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Para novos estabelecimentos, selecione entre o Setup Completo com 1º mês incluso ou aproveite a condição mais econômica com Setup 100% Grátis no Plano Semestral.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* CARD 1: SETUP COMPLETO + 1º MÊS */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition hover:shadow-md space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    Opção Mensal
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    30 dias de vigência
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Setup Completo + 1º Mês
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Ideal para quem deseja flexibilidade inicial com suporte completo de configuração técnica e o primeiro mês de vitrine já quitado.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                      R$ 297,00
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      à vista (taxa única + 1º mês)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Renovação seguinte por apenas R$ 97,00/mês a partir do 2º mês.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    O que está incluso:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span><strong>Setup e configuração técnica</strong> completa da sua vitrine.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span><strong>1º Mês de mensalidade incluso</strong> (economia de R$ 97 no 1º mês).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>Sincronização com Google Places (fotos, avaliações e horários).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>Catálogo de serviços e vitrine de produtos ilimitados.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>Sistema de agendamentos online com anti double-booking.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <MercadoPagoSubscribeButton
                  tenantId={tenantContext.tenantId}
                  tenantName={tenant?.name || "Estabelecimento"}
                  userEmail={user.email || ""}
                  payerName={(user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || tenant?.name || ""}
                  payerCpf={(user.user_metadata?.cpf as string) || (user.user_metadata?.cnpj as string) || ""}
                  offerType="setup_monthly"
                  pixButtonText="⚡ Pagar R$ 297 via Pix Instantâneo"
                  cardButtonText="💳 Pagar R$ 297 no Cartão (até 12x)"
                />
              </div>
            </div>

            {/* CARD 2 (DESTAQUE / MAIS ECONÔMICO): PLANO SEMESTRAL */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-teal-600 bg-white p-6 sm:p-8 shadow-xl ring-4 ring-teal-600/10 space-y-6">
              {/* Badge Flutuante de Destaque */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-800 px-4 py-1 text-xs font-black text-white shadow-md">
                  <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                  MAIS ECONÔMICO • SETUP 100% GRÁTIS
                </span>
              </div>

              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-extrabold text-teal-900">
                    Plano Semestral (6 Meses)
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Economia de R$ 285+
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Plano Semestral (Setup Grátis + 6 Meses)
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    A melhor escolha financeira para o seu negócio: você não paga a taxa de setup e garante 180 dias de vitrine ativa com custo mensal reduzido.
                  </p>
                </div>

                <div className="rounded-2xl bg-teal-50/70 p-4 border border-teal-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-teal-950">
                      R$ 497,00
                    </span>
                    <span className="text-xs text-teal-800 font-bold">
                      à vista ou em até 12x no cartão
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-teal-800 mt-1">
                    Equivalente a apenas <strong>R$ 82,83/mês</strong> (mais barato que o plano mensal avulso).
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Vantagens exclusivas do Semestral:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Setup Profissional 100% Grátis</strong> (economia imediata de R$ 200).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>180 dias ininterruptos</strong> com sua vitrine no ar sem se preocupar com boleto mensal.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Sincronização contínua com Google Places e avaliações 5 estrelas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Posts & Artigos de SEO Local com dados estruturados Schema.org.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Suporte técnico prioritário e parcelamento em até 12x no cartão.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-teal-100">
                <MercadoPagoSubscribeButton
                  tenantId={tenantContext.tenantId}
                  tenantName={tenant?.name || "Estabelecimento"}
                  userEmail={user.email || ""}
                  payerName={(user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || tenant?.name || ""}
                  payerCpf={(user.user_metadata?.cpf as string) || (user.user_metadata?.cnpj as string) || ""}
                  offerType="semiannual"
                  pixButtonText="⚡ Pagar R$ 497 via Pix Instantâneo"
                  cardButtonText="💳 Cartão em até 12x de R$ 49,90"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: LOJISTA JÁ PAGOU O SETUP -> EXIBE RENOVAÇÃO REGULAR DE R$ 97/MÊS */}
      {isSetupPaid && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                <Zap className="h-3.5 w-3.5 text-teal-600" />
                Renovação Regular
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Renovação Mensal da Vitrine EssMendes
              </h3>
              <p className="text-xs text-slate-500">
                Seu setup profissional já foi quitado. Mantenha sua vitrine ativa e ranqueando no topo do Google com a renovação mensal.
              </p>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="text-xs text-slate-500">Mensalidade</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">R$ 97,00</span>
                <span className="text-xs text-slate-500">/ mês</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                +30 dias de vigência garantida
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs text-slate-700">
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900">Google Places Sync</strong>
                <span>Avaliações, fotos e notas mantidas 100% atualizadas.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900">Agendamentos Ilimitados</strong>
                <span>Agenda online 24/7 sem conflitos de horários.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900">SEO Local Ativo</strong>
                <span>Dados estruturados Schema.org para o Google Search.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <MercadoPagoSubscribeButton
              tenantId={tenantContext.tenantId}
              tenantName={tenant?.name || "Estabelecimento"}
              userEmail={user.email || ""}
              payerName={(user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || tenant?.name || ""}
              payerCpf={(user.user_metadata?.cpf as string) || (user.user_metadata?.cnpj as string) || ""}
              offerType="monthly_renewal"
              pixButtonText="⚡ Renovar via Pix Instantâneo (R$ 97,00)"
              cardButtonText="💳 Renovar com Cartão de Crédito (em até 12x)"
            />
          </div>
        </div>
      )}

      {/* Card Informativo com Recursos do Plano Pro */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Recursos Inclusos na Plataforma EssMendes Local</span>
          </h3>
          <p className="text-xs text-slate-500">
            Tudo o que sua empresa precisa para dominar as buscas locais no Google e receber mais clientes.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-700">
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Serviços Ilimitados</strong>
              <span>Cadastre todos os seus serviços sem nenhuma trava de limite de catálogo.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Vitrine de Produtos</strong>
              <span>Exiba fotos, preços e promoções diretamente na sua página pública.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Sincronização com Google Places</strong>
              <span>Avaliações reais, fotos e horários sincronizados automaticamente via API oficial.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Posts & SEO Local Automatizado</strong>
              <span>Criação de artigos com dados estruturados Schema.org para ranqueamento no Maps.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Agendamentos Sem Conflitos</strong>
              <span>Motor matemático de agenda com bloqueio de double-booking e lembretes via WhatsApp.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Subdomínio Próprio & SEO Rápido</strong>
              <span>Sua vitrine pública com alta pontuação de velocidade no Google PageSpeed.</span>
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
