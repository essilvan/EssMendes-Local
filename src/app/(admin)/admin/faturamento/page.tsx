import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { PLANS, getPlanConfig, validateServiceLimit } from "@/config/plans";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminFaturamentoPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro de autorização</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Estabelecimento não localizado."}
        </p>
      </div>
    );
  }

  if (!tenantContext.isSuperAdmin && tenantContext.tenant?.permissions?.billing === false) {
    redirect("/admin/dashboard?error=recurso_indisponivel");
  }

  const supabase = await createClient();
  const tenantId = tenantContext.tenantId;
  const currentPlanTier = tenantContext.tenant?.plan_tier || "free";
  const currentPlan = getPlanConfig(currentPlanTier);

  const [{ count: servicesCount }, { data: rawTenantRow }, { data: tenantProfileRow }] = await Promise.all([
    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
    supabase.from("tenant_profiles").select("*").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  const activeServices = servicesCount || 0;
  const limitCheck = validateServiceLimit(activeServices, currentPlanTier);

  const monthlyFeeAmount =
    tenantContext.tenant?.monthly_fee_amount !== null &&
    tenantContext.tenant?.monthly_fee_amount !== undefined
      ? Number(tenantContext.tenant.monthly_fee_amount)
      : 97;

  const expirationDateRaw =
    tenantContext.tenant?.subscription_expires_at ||
    tenantContext.tenant?.current_period_end ||
    (rawTenantRow as any)?.subscription_expires_at ||
    (rawTenantRow as any)?.current_period_end;

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
        daysRemaining = Math.ceil((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      }
    } catch {}
  }

  const isExpired =
    (daysRemaining !== null && daysRemaining < 0) ||
    tenantContext.tenant?.subscription_status === "overdue" ||
    tenantContext.tenant?.subscription_status === "expired";

  const ownerPhone =
    (rawTenantRow as any)?.whatsapp ||
    (rawTenantRow as any)?.phone ||
    (tenantProfileRow as any)?.phone_whatsapp ||
    (tenantProfileRow as any)?.whatsapp ||
    (tenantProfileRow as any)?.phone ||
    "";

  const rawDigits = String(ownerPhone || "").replace(/\D/g, "");
  const cleanPhone =
    rawDigits.startsWith("55") && (rawDigits.length === 12 || rawDigits.length === 13)
      ? rawDigits.slice(2)
      : rawDigits;

  const recipientName =
    (rawTenantRow as any)?.owner_name ||
    (rawTenantRow as any)?.responsible_name ||
    tenantContext.tenant?.name ||
    "Parceiro";
  const dueDateStr = formattedPeriodEnd || new Date().toLocaleDateString("pt-BR");
  const referenceMonthYear =
    formattedPeriodEnd && formattedPeriodEnd.length >= 10
      ? formattedPeriodEnd.slice(3)
      : `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`;
  const formattedValue = monthlyFeeAmount.toFixed(2).replace(".", ",");
  const billingMessage = `Olá, ${recipientName}! Tudo bem? Passando para lembrar que a mensalidade da sua Vitrine Digital (EssMendes Local) referente a ${referenceMonthYear} venceu em ${dueDateStr} no valor de R$ ${formattedValue}. Para manter sua vitrine, sincronização do Google e módulo de orçamentos ativos sem interrupções, você pode efetuar o pagamento via Pix instantâneo acessando seu painel ou através da nossa chave Pix. Qualquer dúvida estamos à disposição!`;
  const encodedMessage = encodeURIComponent(billingMessage);
  const whatsappBillingUrl = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
          <CreditCard className="h-3.5 w-3.5" />
          <span>Faturamento & Assinatura</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Planos e Recursos da Conta
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Gerencie sua assinatura, limites de catálogo e desbloqueie recursos avançados para crescer seu negócio.
        </p>
      </div>

      {/* Card de Status Atual do Plano */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Plano Ativo
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Plano {currentPlan.name}
              </h2>
              {isExpired ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  Expirado {formattedPeriodEnd ? `(${formattedPeriodEnd})` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {currentPlan.description}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex flex-col sm:items-end">
              <span className="text-xs text-slate-500">Mensalidade Acordada</span>
              <span className="text-2xl font-black text-slate-900">
                R$ {formattedValue}/mês
              </span>
            </div>

            {isExpired && (
              <a
                href={whatsappBillingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>Cobrar Proprietário via WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Uso de Recursos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Serviços Cadastrados:</span>
              <span className="font-bold text-slate-900">
                {activeServices} / {currentPlan.maxServices === Infinity ? "Ilimitado" : currentPlan.maxServices}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  limitCheck.remaining === 0 ? "bg-amber-500" : "bg-teal-600"
                }`}
                style={{
                  width: `${
                    currentPlan.maxServices === Infinity
                      ? 100
                      : Math.min(100, (activeServices / currentPlan.maxServices) * 100)
                  }%`,
                }}
              />
            </div>
            {currentPlanTier === "free" && limitCheck.remaining === 0 && (
              <p className="text-[11px] text-amber-700 font-medium">
                Você atingiu o limite de 3 serviços do plano Gratuito.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Agendamentos Online:</span>
              <span className="font-bold text-emerald-700">
                {currentPlan.maxMonthlyAppointments === Infinity
                  ? "Ilimitados"
                  : `Até ${currentPlan.maxMonthlyAppointments}/mês`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Prevenção matemática de conflitos e anti double-booking habilitados.
            </p>
          </div>
        </div>
      </div>

      {/* Comparativo de Planos */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-teal-700" />
            <span>Planos Disponíveis</span>
          </h2>
          <p className="text-xs text-slate-500">
            Escolha o melhor plano para o momento do seu negócio.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card: Plano Free */}
          <div
            className={`rounded-2xl border p-6 sm:p-8 space-y-6 flex flex-col justify-between ${
              currentPlanTier === "free"
                ? "border-slate-300 bg-white ring-1 ring-slate-200"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{PLANS.free.name}</h3>
                  <p className="text-xs text-slate-500">{PLANS.free.description}</p>
                </div>
                {currentPlanTier === "free" && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    Seu Plano Atual
                  </span>
                )}
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900">R$ 0</span>
                <span className="text-xs text-slate-500"> / mês (para sempre)</span>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Incluso no plano:
                </p>
                <ul className="space-y-2 text-xs text-slate-600">
                  {PLANS.free.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {PLANS.free.notIncluded?.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-slate-400">
                      <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                disabled={currentPlanTier === "free"}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500 cursor-not-allowed text-center"
              >
                {currentPlanTier === "free" ? "Plano em Uso" : "Migrar para Gratuito"}
              </button>
            </div>
          </div>

          {/* Card: Plano Pro (Destaque) */}
          <div className="relative rounded-2xl border-2 border-teal-600 bg-white p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-lg ring-4 ring-teal-600/10">
            {/* Badge de Destaque */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-800 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                <Sparkles className="h-3 w-3 text-amber-300" />
                {PLANS.pro.badge}
              </span>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{PLANS.pro.name}</h3>
                <p className="text-xs text-slate-500">{PLANS.pro.description}</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">
                    {formatCurrency(PLANS.pro.priceMonthly)}
                  </span>
                  <span className="text-xs text-slate-500"> / mês</span>
                </div>
                <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
                  ou {formatCurrency(PLANS.pro.priceYearly)} no plano anual (2 meses grátis)
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tudo do Gratuito mais:
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  {PLANS.pro.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

              <div className="pt-4">
                {currentPlanTier === "pro" ? (
                  <Link
                    href="/admin/assinatura"
                    className="block w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 transition px-4 py-3 text-xs font-bold text-white text-center shadow-sm"
                  >
                    ✓ Gerenciar Assinatura Pro
                  </Link>
                ) : (
                  <Link
                    href="/admin/assinatura"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-teal-800 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-900 transition"
                  >
                    <span>Fazer Upgrade para o Pro (R$ 97/mês)</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* FAQ Rápido sobre Cobrança */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-teal-700" />
          <span>Dúvidas Frequentes sobre Planos</span>
        </h3>

        <div className="grid gap-4 sm:grid-cols-3 text-xs text-slate-600">
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Existe fidelidade ou multa?</p>
            <p className="text-slate-500">
              Não. Você pode cancelar ou alterar seu plano a qualquer momento sem custos adicionais.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-800">Como funciona o pagamento?</p>
            <p className="text-slate-500">
              Aceitamos Pix e cartões de crédito com renovação automática simples e transparente.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-800">O que acontece se eu atingir o limite?</p>
            <p className="text-slate-500">
              Sua página pública continuará no ar recebendo clientes. Para cadastrar novos serviços, basta migrar para o Pro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
