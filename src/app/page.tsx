import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Sparkles,
  Scissors,
  CalendarCheck,
  MessageCircle,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Globe,
  ExternalLink,
  ChevronRight,
  Zap,
  HelpCircle,
  Building2,
  Users,
  Star,
} from "lucide-react";
import { PLANS } from "@/config/plans";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let loggedUser = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedUser = user;
  } catch {
    loggedUser = null;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const faqItems = [
    {
      q: "Preciso saber programar ou criar sites para usar?",
      a: "Não! O EssMendes Local gera sua página profissional automaticamente em menos de 3 minutos. Você apenas informa seu nome, WhatsApp, endereço e serviços.",
    },
    {
      q: "Como os clientes realizam os agendamentos?",
      a: "O cliente acessa sua página pelo celular ou computador, escolhe o serviço desejado, seleciona o dia e o horário livre em tempo real, e a reserva é registrada sem risco de horários duplicados.",
    },
    {
      q: "O Plano Gratuito é realmente grátis?",
      a: "Sim! O Plano Gratuito é permanente e permite cadastrar até 3 serviços ativos, receber agendamentos online e divulgar sua página sem qualquer cobrança.",
    },
    {
      q: "Posso usar meu próprio domínio (ex: meunegocio.com.br)?",
      a: "Sim! No Plano Pro você tem suporte para conectar seu próprio domínio personalizado (.com.br) e fortalecer ainda mais a sua marca local.",
    },
    {
      q: "Existe fidelidade ou multa para cancelamento?",
      a: "Não há fidelidade ou contratos de longo prazo. Você tem total liberdade para alterar ou cancelar sua assinatura a qualquer momento.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-teal-700 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 font-extrabold text-white shadow-xs">
              EM
            </div>
            <div className="leading-none">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                EssMendes <span className="text-teal-700">Local</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-500">
                Presença Digital & Agendamentos
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link href="/diagnostico" className="text-teal-700 font-bold hover:underline flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Diagnóstico Grátis</span>
            </Link>
            <a href="#recursos" className="hover:text-teal-700 transition">
              Recursos
            </a>
            <a href="#como-funciona" className="hover:text-teal-700 transition">
              Como Funciona
            </a>
            <a href="#planos" className="hover:text-teal-700 transition">
              Planos & Preços
            </a>
            <a href="#faq" className="hover:text-teal-700 transition">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {loggedUser ? (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-900 transition"
              >
                <span>Acessar Painel</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-900 transition"
                >
                  <span>Criar Conta Grátis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-950 via-teal-900 to-teal-800 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/80 px-3.5 py-1 text-xs font-semibold text-teal-200 ring-1 ring-white/15 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>A Plataforma Definitiva para Negócios Locais</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Transforme seu negócio local em uma máquina de{" "}
            <span className="text-teal-300 underline decoration-teal-500 underline-offset-8">
              agendamentos online
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-teal-100/90 leading-relaxed">
            Destaque-se nas buscas do Google, elimine conflitos de horário e feche atendimentos 24 horas por dia com catálogo interativo e confirmação rápida pelo WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-teal-950 shadow-xl hover:bg-teal-50 transition"
            >
              <span>Criar Minha Página Grátis</span>
              <ArrowRight className="h-4 w-4 text-teal-800" />
            </Link>

            <Link
              href="/diagnostico"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300/40 bg-teal-800/60 px-5 py-3.5 text-sm font-bold text-teal-100 backdrop-blur-xs hover:bg-teal-700 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Diagnóstico Grátis da Empresa</span>
            </Link>

            <Link
              href="/minha-empresa-teste"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-xs hover:bg-white/20 transition"
            >
              <Globe className="h-4 w-4 text-teal-300" />
              <span>Ver Vitrine ao Vivo</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-teal-200/90 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Sem necessidade de cartão</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Configuração em 3 minutos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Anti Double-Booking nativo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demonstração Visual dos Pilares */}
      <section id="recursos" className="mx-auto max-w-6xl -mt-10 px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Pilar 1: Vitrine & SEO */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:border-teal-300 hover:shadow-md transition space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              SEO Local & Google Rich Data
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Estruturação automática em <strong>Schema.org LocalBusiness</strong> para seu negócio aparecer nas pesquisas locais do Google ("perto de mim") com informações claras.
            </p>
          </div>

          {/* Pilar 2: Motor de Agendamento */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:border-teal-300 hover:shadow-md transition space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Agendamento Online 24/7
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seus clientes escolhem o serviço e o horário disponível em tempo real. O sistema previne matematicamente conflitos e sobreposições de agenda.
            </p>
          </div>

          {/* Pilar 3: WhatsApp Integrado */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:border-teal-300 hover:shadow-md transition space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Conversão Direta no WhatsApp
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receba reservas com mensagens pré-formatadas diretamente no seu WhatsApp, facilitando a confirmação e o relacionamento com o cliente.
            </p>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 bg-slate-50 mt-16 border-y border-slate-200/60">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Simples & Rápido
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Como funciona o EssMendes Local em 3 passos
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Sem burocracia técnica. Em poucos cliques sua empresa está pronta para receber novos clientes.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-xs font-black text-white">
                1
              </span>
              <h4 className="text-sm font-bold text-slate-900">Cadastre seus Serviços</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adicione procedimentos, valores e tempo estimado de atendimento no seu catálogo.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-xs font-black text-white">
                2
              </span>
              <h4 className="text-sm font-bold text-slate-900">Divulgue seu Link</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coloque o link da sua página profissional na bio do Instagram, WhatsApp Business e Google Meu Negócio.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-xs font-black text-white">
                3
              </span>
              <h4 className="text-sm font-bold text-slate-900">Receba Agendamentos</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Acompanhe as reservas no painel da agenda e receba confirmações prontas pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos e Preços */}
      <section id="planos" className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Transparência Total
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Planos desenhados para cada etapa do seu negócio
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Comece no plano gratuito e faça upgrade apenas quando precisar de escala e recursos avançados.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
            {/* Card: Free */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{PLANS.free.name}</h4>
                  <p className="text-xs text-slate-500">{PLANS.free.description}</p>
                </div>

                <div>
                  <span className="text-4xl font-black text-slate-900">R$ 0</span>
                  <span className="text-xs text-slate-500"> / mês (para sempre)</span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Incluso no Plano:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {PLANS.free.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {PLANS.free.notIncluded?.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-slate-400">
                        <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                href="/register"
                className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
              >
                Começar Grátis Agora
              </Link>
            </div>

            {/* Card: Pro */}
            <div className="relative rounded-2xl border-2 border-teal-700 bg-white p-8 space-y-6 flex flex-col justify-between shadow-xl ring-4 ring-teal-700/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-800 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  {PLANS.pro.badge}
                </span>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{PLANS.pro.name}</h4>
                  <p className="text-xs text-slate-500">{PLANS.pro.description}</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">
                      {formatCurrency(PLANS.pro.priceMonthly)}
                    </span>
                    <span className="text-xs text-slate-500"> / mês</span>
                  </div>
                  <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
                    ou {formatCurrency(PLANS.pro.priceYearly)} no plano anual (2 meses grátis)
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Tudo do Gratuito mais:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {PLANS.pro.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                href="/register"
                className="flex items-center justify-center gap-2 w-full text-center rounded-xl bg-teal-800 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-900 transition"
              >
                <span>Criar Conta no Plano Pro</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200/60">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Tire Suas Dúvidas
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Perguntas Frequentes
            </h3>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-2"
              >
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-teal-700 shrink-0" />
                  <span>{item.q}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="bg-gradient-to-r from-teal-950 via-teal-900 to-teal-800 text-white py-16 px-4 sm:px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold">
            Pronto para profissionalizar a presença digital do seu negócio?
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl mx-auto">
            Crie sua conta agora mesmo e comece a receber agendamentos online hoje.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-extrabold text-teal-950 shadow-xl hover:bg-teal-50 transition"
            >
              <span>Começar Grátis Agora</span>
              <ArrowRight className="h-4 w-4 text-teal-800" />
            </Link>
          </div>
        </div>
      </section>

      {/* Rodapé Institucional */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 text-xs">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-sm font-bold text-white block">
              EssMendes Local
            </span>
            <p className="text-slate-400 text-[11px]">
              Plataforma de presença digital e geração de clientes para negócios locais.
            </p>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400 space-y-1">
            <p>© {new Date().getFullYear()} EssMendes Tecnologia. Todos os direitos reservados.</p>
            <p>Desenvolvido com foco em performance, SEO e conversão.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
