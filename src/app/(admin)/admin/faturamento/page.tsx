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

  const supabase = await createClient();
  const tenantId = tenantContext.tenantId;
  const currentPlanTier = tenantContext.tenant?.plan_tier || "free";
  const currentPlan = getPlanConfig(currentPlanTier);

  // Busca total de serviços para conferir o limite
  const { count: servicesCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const activeServices = servicesCount || 0;
  const limitCheck = validateServiceLimit(activeServices, currentPlanTier);

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
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Plano {currentPlan.name}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Ativo
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {currentPlan.description}
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-slate-500">Mensalidade</span>
            <span className="text-2xl font-black text-slate-900">
              {currentPlan.priceMonthly === 0
                ? "Grátis"
                : `${formatCurrency(currentPlan.priceMonthly)}/mês`}
            </span>
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
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white text-center shadow-sm cursor-default"
                >
                  ✓ Seu Plano Pro está Ativo
                </button>
              ) : (
                <a
                  href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20fazer%20upgrade%20para%20o%20Plano%20Pro%20do%20EssMendes%20Local."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-teal-800 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-900 transition"
                >
                  <span>Fazer Upgrade para o Pro</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
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
