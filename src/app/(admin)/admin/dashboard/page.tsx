import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { getTenantAnalyticsSummary } from "@/services/analytics.actions";
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
} from "lucide-react";
import type { Appointment } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

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

  // 1. Busca perfil do tenant para o Diagnóstico de Presença
  const { data: profile } = await supabase
    .from("tenant_profiles")
    .select("logo_url, description, phone_whatsapp, address")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  // 2. Busca quantidade de serviços cadastrados
  let servicesCount = 0;
  const { count: srvCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  servicesCount = srvCount || 0;

  // 3. Busca métricas de analytics dos últimos 30 dias
  const analytics = await getTenantAnalyticsSummary(tenantId);

  // 4. Busca os 3 agendamentos mais recentes
  const { data: recentAppointmentsRaw } = await supabase
    .from("appointments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(3);

  const recentAppointments = (recentAppointmentsRaw || []) as Appointment[];

  // 5. Cálculo do Diagnóstico de Presença Local (0% a 100%)
  const hasLogo = Boolean(profile?.logo_url);
  const hasDescription = Boolean(profile?.description && profile.description.trim().length >= 20);
  const hasPhone = Boolean(profile?.phone_whatsapp && profile.phone_whatsapp.trim().length >= 10);
  const hasAddress = Boolean(profile?.address && profile.address.trim().length >= 5);
  const hasServices = servicesCount >= 2;

  let presenceScore = 0;
  if (hasLogo) presenceScore += 20;
  if (hasDescription) presenceScore += 20;
  if (hasPhone) presenceScore += 20;
  if (hasAddress) presenceScore += 20;
  if (hasServices) presenceScore += 20;

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
              <span>Painel de Presença & Conversão</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Olá, {fullName}!
            </h1>
            <p className="text-sm text-teal-100/90">
              Gerencie a presença digital e acompanhe os atendimentos de <strong>{companyName}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/${companySlug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-teal-900 shadow-sm hover:bg-teal-50 transition"
            >
              <Globe className="h-4 w-4 text-teal-700" />
              <span>Ver Página Pública</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Diagnóstico de Presença Local (0% a 100%) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Diagnóstico de Presença Local
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  presenceScore === 100
                    ? "bg-emerald-100 text-emerald-800"
                    : presenceScore >= 60
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {presenceScore}% Concluído
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Avaliação técnica baseada na clareza de informações e atratividade para novos clientes locais.
            </p>
          </div>

          {presenceScore < 100 && (
            <Link
              href="/admin/configuracoes"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
            >
              <span>Completar perfil</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                presenceScore === 100
                  ? "bg-emerald-500"
                  : presenceScore >= 60
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${presenceScore}%` }}
            />
          </div>
        </div>

        {/* Checklist de Presença */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
          {/* Item 1: Logotipo */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
            {hasLogo ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold text-slate-900">Logotipo / Foto do Negócio</p>
              <p className="text-[11px] text-slate-500">
                {hasLogo ? "Foto cadastrada com sucesso." : "Adicione seu logotipo em Ajustes."}
              </p>
            </div>
          </div>

          {/* Item 2: Descrição */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
            {hasDescription ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold text-slate-900">Descrição Detalhada</p>
              <p className="text-[11px] text-slate-500">
                {hasDescription ? "Apresentação clara configurada." : "Explique seus diferenciais."}
              </p>
            </div>
          </div>

          {/* Item 3: WhatsApp */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
            {hasPhone ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold text-slate-900">WhatsApp de Atendimento</p>
              <p className="text-[11px] text-slate-500">
                {hasPhone ? "Contato direto habilitado." : "Adicione seu número com DDD."}
              </p>
            </div>
          </div>

          {/* Item 4: Endereço */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
            {hasAddress ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold text-slate-900">Endereço & Localização</p>
              <p className="text-[11px] text-slate-500">
                {hasAddress ? "Localização visível para clientes." : "Informe rua, número e bairro."}
              </p>
            </div>
          </div>

          {/* Item 5: Serviços */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs sm:col-span-2 lg:col-span-2">
            {hasServices ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold text-slate-900">Catálogo de Serviços (Mínimo 2)</p>
              <p className="text-[11px] text-slate-500">
                {hasServices
                  ? `${servicesCount} serviços cadastrados e disponíveis para reserva.`
                  : `Apenas ${servicesCount} serviço cadastrado. Recomendamos pelo menos 2.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas & Conversão (Últimos 30 dias) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-700" />
              <span>Métricas de Conversão (Últimos 30 Dias)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Indicadores de visualizações, engajamento e reservas geradas.
            </p>
          </div>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
            Taxa de Conversão: {analytics.conversionRate}%
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Visualizações */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Visualizações</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{analytics.pageViews}</p>
            <p className="text-[11px] text-slate-500">Acessos à sua página pública</p>
          </div>

          {/* Card 2: Cliques WhatsApp */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Cliques WhatsApp</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <MessageCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-900">{analytics.whatsappClicks}</p>
            <p className="text-[11px] text-slate-500">Contatos iniciados diretamente</p>
          </div>

          {/* Card 3: Agendamentos */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Agendamentos</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-900">{analytics.totalAppointments}</p>
            <p className="text-[11px] text-slate-500">
              {analytics.confirmedAppointments} confirmados
            </p>
          </div>

          {/* Card 4: Receita Estimada */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Receita Estimada</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-teal-900">
              {formatCurrency(analytics.estimatedRevenue)}
            </p>
            <p className="text-[11px] text-slate-500">Valor de atendimentos gerados</p>
          </div>
        </div>
      </div>

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
              className="text-xs font-bold text-teal-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Ver agenda completa</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Nenhum agendamento registrado ainda.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAppointments.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {app.customer_name}
                      </span>
                      <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {app.service_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-teal-600" />
                        {formatDate(app.start_time)}
                      </span>
                      <span>{app.customer_phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(Number(app.price))}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        app.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : app.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {app.status === "confirmed" && "Confirmado"}
                      {app.status === "pending" && "Pendente"}
                      {app.status === "completed" && "Concluído"}
                      {app.status === "canceled" && "Cancelado"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Atalhos Rápidos (1 coluna) */}
        <div className="space-y-4">
          <Link
            href="/admin/agendamentos"
            className="group flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                Gerenciar Agendamentos
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Confirme, conclua e visualize horários marcados.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/servicos"
            className="group flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                Catálogo de Serviços
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cadastre procedimentos, preços e durações.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/configuracoes"
            className="group flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                Configurações da Empresa
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Atualize logotipo, WhatsApp e endereço.
              </p>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}
