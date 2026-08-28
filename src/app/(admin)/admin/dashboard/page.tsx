import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { getTenantAnalyticsSummary } from "@/services/analytics.actions";
import { getTenantLocalScore } from "@/services/presence-score.service";
import {
  getTenantOpportunitiesAction,
  getTenantRadarAlertsAction,
} from "@/services/opportunity.actions";
import { PresenceScoreCard } from "@/components/admin/PresenceScoreCard";
import { RadarAlertsCard } from "@/components/admin/RadarAlertsCard";
import { OpportunitiesCard } from "@/components/admin/OpportunitiesCard";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  Scissors,
  Settings,
  Globe,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  Eye,
  MessageCircle,
  CalendarCheck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  User,
  ShoppingBag,
  Star,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Appointment } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tenantId?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const overrideTenantId = resolvedParams?.tenantId;
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant(overrideTenantId);

  if (tenantError || !tenantContext) {
    if (!tenantContext && !tenantError) {
      redirect("/login");
    }
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao acessar painel</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {tenantError || "Nenhum estabelecimento associado a esta conta."}
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const tenantId = tenantContext.tenantId;

  // 1. Busca dados em paralelo (Analytics, Score Modular, Radar e Oportunidades)
  const [
    analytics,
    scoreResult,
    oppsRes,
    radarRes,
    recentAppointmentsRaw,
  ] = await Promise.all([
    getTenantAnalyticsSummary(tenantId),
    getTenantLocalScore(tenantId),
    getTenantOpportunitiesAction(),
    getTenantRadarAlertsAction(),
    supabase
      .from("appointments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const opportunities = oppsRes.data || [];
  const radarAlerts = radarRes.data || [];
  const recentAppointments = (recentAppointmentsRaw.data || []) as Appointment[];

  const user = tenantContext.user;
  const fullName =
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Proprietário(a)";

  const companyName =
    tenantContext.tenant?.name ||
    (user.user_metadata?.company_name as string) ||
    "Meu Estabelecimento";

  const companySlug = tenantContext.tenant?.slug || "meu-negocio";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-950 via-teal-900 to-teal-800 p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-800/80 px-3 py-0.5 text-xs font-medium text-teal-200 ring-1 ring-white/10">
              <Sparkles className="h-3 w-3" />
              <span>Painel do Estabelecimento</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Olá, {fullName}!
            </h1>
            <p className="text-sm text-teal-100/90">
              Acompanhe suas conversões, produtos e avaliações de <strong>{companyName}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {tenantContext.isSuperAdmin && (
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-400/20 px-3.5 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-400/30 transition"
              >
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <span>Super Admin</span>
              </Link>
            )}
            <Link
              href={`/${companySlug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-teal-900 shadow-sm hover:bg-teal-50 transition"
            >
              <Globe className="h-4 w-4 text-teal-700" />
              <span>Ver Vitrine Pública</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* 🚀 DESTAQUE 1: MÉTRICAS DE CONVERSÃO NO TOPO (Cliques WhatsApp, Visitas na Vitrine e Agendamentos) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-700" />
              <span>Métricas de Conversão do Negócio</span>
            </h2>
            <p className="text-xs text-slate-500">
              Indicadores diretos de engajamento, contatos iniciados e reservas na sua vitrine.
            </p>
          </div>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
            Taxa de Conversão: {analytics.conversionRate}%
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Cliques no WhatsApp (Lead Direto) */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Cliques no WhatsApp</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
                <MessageCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-950">{analytics.whatsappClicks}</p>
            <p className="text-[11px] text-emerald-700 font-medium">Contatos diretos iniciados</p>
          </div>

          {/* Card 2: Visitas na Vitrine (Alcance Local) */}
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-teal-800">
              <span className="text-xs font-bold uppercase tracking-wider">Visitas na Vitrine</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 shadow-xs">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{analytics.pageViews}</p>
            <p className="text-[11px] text-slate-500 font-medium">Visualizações da página pública</p>
          </div>

          {/* Card 3: Agendamentos */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-blue-800">
              <span className="text-xs font-bold uppercase tracking-wider">Agendamentos</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-blue-950">{analytics.totalAppointments}</p>
            <p className="text-[11px] text-blue-700 font-medium">
              {analytics.confirmedAppointments} confirmados
            </p>
          </div>

          {/* Card 4: Faturamento Estimado */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Receita Potencial</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {formatCurrency(analytics.estimatedRevenue)}
            </p>
            <p className="text-[11px] text-slate-500">Valor de atendimentos gerados</p>
          </div>
        </div>
      </div>

      {/* 🛍️ DESTAQUE 2: ACESSO RÁPIDO À VITRINE DE PRODUTOS E AVALIAÇÕES */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card Acesso Rápido: Vitrine de Produtos */}
        <Link
          href="/admin/produtos"
          className="group relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/30 p-6 shadow-xs hover:border-teal-400 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                <ShoppingBag className="h-3.5 w-3.5" />
                Vendas & Catálogo
              </span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-800 transition">
                Vitrine de Produtos
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                Cadastre seus produtos com fotos, preços promocionais e botões de compra direta no WhatsApp.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform">
                  <span>Acessar Vitrine de Produtos</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </Link>

        {/* Card Acesso Rápido: Avaliações Google & IA */}
        <Link
          href="/admin/avaliacoes"
          className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/30 p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                Reputação & Google
              </span>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-800 transition">
                Avaliações Google & IA
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                Acompanhe as notas reais dos seus clientes e utilize Inteligência Artificial para gerar respostas automáticas de alto impacto.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                  <span>Acessar Avaliações</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm group-hover:scale-105 transition-transform">
              <Star className="h-6 w-6 fill-white text-white" />
            </div>
          </div>
        </Link>
      </div>

      {/* 1. Score Modular de Presença Digital Local (0 a 100) */}
      <PresenceScoreCard scoreData={scoreResult} />

      {/* 2. Radar de Saúde Digital (Monitoramento & Alertas Ativos) */}
      <RadarAlertsCard alerts={radarAlerts} />

      {/* 3. Painel de Oportunidades de Crescimento & Conversão */}
      <OpportunitiesCard opportunities={opportunities} />

      {/* Agendamentos Recentes & Ações Rápidas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agendamentos Recentes (2 colunas) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Agendamentos Recentes
              </h3>
              <p className="text-xs text-slate-500">Últimas reservas recebidas pelo site.</p>
            </div>
            <Link
              href="/admin/agendamentos"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <CalendarCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs">Nenhum agendamento registrado recentemente.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAppointments.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{app.customer_name}</p>
                    <p className="text-slate-500">{app.service_name}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="font-bold text-slate-800">{formatDate(app.start_time)}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        app.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : app.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ações Rápidas de Navegação */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ações Rápidas</h3>
            <p className="text-xs text-slate-500">Acesso direto às ferramentas principais.</p>
          </div>

          <div className="space-y-2">
            <Link
              href="/admin/servicos"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-2.5">
                <Scissors className="h-4 w-4 text-teal-700" />
                <span>Gerenciar Serviços</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/admin/portfolio"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-teal-700" />
                <span>Portfólio Antes & Depois</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/admin/posts"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-teal-700" />
                <span>Publicações & SEO Local</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href="/admin/perfil"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-teal-700" />
                <span>Dados & Perfil da Empresa</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
