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

  const resolvedParams = await searchParams;
  const statusParam = typeof resolvedParams.status === "string" ? resolvedParams.status : null;

  const tenant = tenantContext.tenant;
  const user = tenantContext.user;

  const subscriptionStatus = tenant?.subscription_status || "trialing";
  const currentPeriodEnd = tenant?.current_period_end;
  const isActive = subscriptionStatus === "active";
  const isOverdue = subscriptionStatus === "overdue";
  const isTrialOrPending = !isActive && !isOverdue;

  // Formatação de data de vencimento
  let formattedPeriodEnd: string | null = null;
  let daysRemaining: number | null = null;
  if (currentPeriodEnd) {
    try {
      const dateObj = new Date(currentPeriodEnd);
      formattedPeriodEnd = dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const now = new Date();
      daysRemaining = Math.ceil((dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      formattedPeriodEnd = currentPeriodEnd;
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
                Seu pagamento foi confirmado pelo Mercado Pago e sua assinatura do Plano Pro está sendo ativada.
                Caso o status ainda não tenha atualizado na tela, aguarde alguns instantes e atualize a página.
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
                Identificamos seu pedido de pagamento via Pix ou Boleto. Assim que o Mercado Pago validar a quitação bancária, sua vitrine será ativada automaticamente.
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
                Não conseguimos confirmar a cobrança no Mercado Pago. Por favor, tente novamente ou utilize outra forma de pagamento (como Pix ou outro cartão de crédito).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
          <CreditCard className="h-3.5 w-3.5" />
          <span>Gestão de Assinatura</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Assinatura & Pagamentos
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Controle o status do seu plano, veja o período de vigência e efetue renovações instantâneas via Mercado Pago.
        </p>
      </div>

      {/* Card de Status da Assinatura */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status da Assinatura
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Plano Pro Mensal
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
                  Assinatura Vencida / Inadimplente
                </span>
              )}

              {isTrialOrPending && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Pagamento Pendente ou Em Período de Avaliação
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Estabelecimento: <strong>{tenant?.name}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-slate-500">Valor da Assinatura</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">R$ 97,00</span>
              <span className="text-xs text-slate-500">/ mês</span>
            </div>
          </div>
        </div>

        {/* Detalhes de Vencimento e Vigência */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="h-4 w-4 text-teal-700" />
              <span>Data de Vencimento / Renovação:</span>
            </div>
            {formattedPeriodEnd ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">
                  {formattedPeriodEnd}
                </span>
                {daysRemaining !== null && (
                  <span
                    className={`text-xs font-semibold ${
                      daysRemaining > 5
                        ? "text-emerald-700"
                        : daysRemaining >= 0
                        ? "text-amber-700"
                        : "text-red-700"
                    }`}
                  >
                    {daysRemaining > 0
                      ? `(Restam ${daysRemaining} dias)`
                      : daysRemaining === 0
                      ? "(Vence hoje)"
                      : "(Vencido)"}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Nenhum pagamento registrado ainda. Assine abaixo para ativar por 30 dias.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              <span>Formas de Pagamento Aceitas:</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Pix Instantâneo (liberação imediata) ou Cartão de Crédito
            </p>
            <p className="text-[11px] text-slate-400">
              Processado em ambiente de segurança nível bancário Mercado Pago.
            </p>
          </div>
        </div>

        {/* Botão de Ação Direto para Checkout Pro do Mercado Pago */}
        <div className="pt-2 border-t border-slate-100">
          <MercadoPagoSubscribeButton
            tenantId={tenantContext.tenantId}
            tenantName={tenant?.name || "Meu Estabelecimento"}
            userEmail={user.email || ""}
            payerName={(user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || tenant?.name || ""}
            payerCpf={(user.user_metadata?.cpf as string) || (user.user_metadata?.cnpj as string) || ""}
            label="Renovar / Assinar Plano Mensal (R$ 97,00) via Pix ou Cartão"
          />
        </div>
      </div>

      {/* Card Informativo com Recursos do Plano Pro */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Benefícios Inclusos no seu Plano Pro</span>
          </h3>
          <p className="text-xs text-slate-500">
            Tudo o que sua empresa precisa para dominar as buscas locais no Google.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-700">
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Serviços Ilimitados</strong>
              <span>Cadastre todos os seus serviços sem nenhuma trava de limite de catálogo.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Vitrine de Produtos</strong>
              <span>Exiba fotos, preços e promoções diretamente na sua página pública.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Sincronização com Google Places</strong>
              <span>Avaliações reais, fotos e horários atualizados automaticamente via Google API.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Posts & SEO Local Automatizado</strong>
              <span>Criação de artigos com dados estruturados Schema.org para ranqueamento local.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Agendamentos Sem Conflitos</strong>
              <span>Motor matemático de agenda com bloqueio de double-booking e lembretes via WhatsApp.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">Subdomínio Próprio & SEO Rápido</strong>
              <span>Sua vitrine pública com alta pontuação de velocidade no Google PageSpeed.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suporte e Ajuda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-teal-700 shrink-0" />
          <span>Precisa de nota fiscal ou suporte com pagamentos? Fale diretamente com nossa equipe.</span>
        </div>
        <Link
          href="/admin/faturamento"
          className="font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 shrink-0"
        >
          <span>Ver comparativo completo de planos</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
