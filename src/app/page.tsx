import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Sparkles,
  CalendarCheck,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Globe,
  ExternalLink,
  HelpCircle,
  CreditCard,
  QrCode,
  Palette,
  Layers,
  MapPin,
  Check,
  Zap,
  Store,
} from "lucide-react";

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
      q: "Como funciona o Teste Grátis de 7 Dias?",
      a: "Você cria sua conta em menos de 3 minutos e tem acesso ilimitado a todos os recursos da plataforma: sincronização com Google Maps, agendamentos sem conflito, gerador de Antes & Depois e vitrine completa. Você testa sem compromisso.",
    },
    {
      q: "Preciso cadastrar cartão de crédito para iniciar o teste?",
      a: "Não! Você pode iniciar seu teste grátis de 7 dias imediatamente sem precisar fornecer nenhum cartão de crédito ou dado financeiro.",
    },
    {
      q: "Quais são as formas de pagamento aceitas?",
      a: "Após os 7 dias de teste, você pode assinar via Pix Instantâneo (com liberação imediata por QR Code / Copia e Cola) ou Cartão de Crédito em até 12x, tudo processado com a segurança de nível bancário do Mercado Pago.",
    },
    {
      q: "Como funciona a sincronização com o Google Maps em tempo real?",
      a: "Basta colar o link da sua empresa no Google Maps no painel. O sistema importa automaticamente suas avaliações 5 estrelas reais, notas, fotos oficiais de clientes e horário de Brasília, atualizando sua vitrine em tempo real sem dados falsos.",
    },
    {
      q: "Qual a vantagem do Plano Anual de R$ 970,00?",
      a: "No plano anual você ganha 2 meses inteiramente grátis (economia direta de R$ 194,00 no ano), além de onboarding com setup assistido pela nossa equipe para configurar seu perfil, catálogo de serviços e integração do Google.",
    },
    {
      q: "O sistema funciona para o meu tipo de negócio?",
      a: "Sim! O EssMendes Local possui temas especializados pré-configurados para diversos nichos locais: Oficinas mecânicas e estética automotiva, Gastronomia e restaurantes, Clínicas e profissionais de Saúde, Barbearias, Salões de Beleza e Comércio Varejista.",
    },
    {
      q: "Posso conectar meu próprio domínio personalizado (.com.br)?",
      a: "Com certeza! Você pode utilizar o link rápido do EssMendes Local ou conectar seu próprio domínio (ex: www.suaempresa.com.br) para fortalecer ainda mais sua marca na sua cidade.",
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
                SEO Local & Vitrines Inteligentes
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link href="/diagnostico" className="text-teal-700 font-bold hover:underline flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
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
              Dúvidas Frequentes
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
                  <span>Testar 7 Dias Grátis</span>
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
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/80 px-4 py-1.5 text-xs font-semibold text-teal-200 ring-1 ring-white/15 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Sincronização com Google Maps em Tempo Real • Cálculo Preciso de Horários</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Domine as buscas locais no Google e receba agendamentos no{" "}
            <span className="text-teal-300 underline decoration-teal-500 underline-offset-8">
              piloto automático
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-teal-100/90 leading-relaxed">
            Conecte sua ficha do Google Maps em tempo real, tenha cálculo preciso de horários com fuso de Brasília sem sobreposição de agenda e gere comparativos profissionais de Antes & Depois para bombar suas redes sociais.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-extrabold text-teal-950 shadow-xl hover:bg-teal-50 active:scale-[0.99] transition cursor-pointer"
            >
              <span>Começar Teste Grátis de 7 Dias</span>
              <ArrowRight className="h-4 w-4 text-teal-800" />
            </Link>

            <Link
              href="/diagnostico"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300/40 bg-teal-800/60 px-5 py-4 text-sm font-bold text-teal-100 backdrop-blur-xs hover:bg-teal-700 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Diagnóstico Grátis da Empresa</span>
            </Link>

            <Link
              href="/minha-empresa-teste"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-bold text-white backdrop-blur-xs hover:bg-white/20 transition"
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
              <span>Teste Grátis de 7 Dias sem compromisso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Sincronização Google Maps em Tempo Real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Cálculo Preciso com Horário de Brasília</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Gerador de Antes e Depois para Redes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Recursos - 4 Cards */}
      <section id="recursos" className="mx-auto max-w-6xl -mt-10 px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Sincronização Google Maps & Horário de Brasília real */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-400 hover:shadow-md transition space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                Sincronização Google Maps & Horário Real
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Importe avaliações reais 5 estrelas, fotos oficiais e status de abertura calculados no <strong>fuso horário de Brasília</strong> em tempo real, sem dados fictícios.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-teal-700 flex items-center gap-1">
              <span>Google Places API (New)</span>
              <Check className="h-3 w-3" />
            </div>
          </div>

          {/* Card 2: Ferramenta Canvas de Antes e Depois para Redes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-400 hover:shadow-md transition space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                Gerador Canvas de Antes e Depois
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Crie artes comparativas impressionantes prontas para <strong>Instagram Stories, Feed e WhatsApp</strong> em segundos, gerando autoridade visual inquestionável.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
              <span>Exportação Instantânea HD</span>
              <Check className="h-3 w-3" />
            </div>
          </div>

          {/* Card 3: Temas Especializados por Nicho */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-400 hover:shadow-md transition space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                Temas Especializados por Nicho
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Modelos desenhados sob medida para <strong>Oficinas, Gastronomia, Saúde, Estética e Varejo</strong>, com design responsivo e foco obsessivo em conversão.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-blue-700 flex items-center gap-1">
              <span>Customização Completa de Cores</span>
              <Check className="h-3 w-3" />
            </div>
          </div>

          {/* Card 4: Agendamento Direto no WhatsApp */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-400 hover:shadow-md transition space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                Agendamento Direto no WhatsApp
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Motor inteligente com <strong>prevenção matemática de conflitos</strong> (anti double-booking) e disparo de mensagens pré-formatadas para o seu WhatsApp.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <span>Confirmação em 1 Toque</span>
              <Check className="h-3 w-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 bg-slate-50 mt-16 border-y border-slate-200/60">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Passo a Passo Descomplicado
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Sua vitrine no ar e vendendo em 3 etapas simples
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Sem necessidade de contratar programador ou agência. Você mesmo ativa tudo em minutos.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-xs font-black text-white">
                1
              </span>
              <h4 className="text-sm font-bold text-slate-900">Conecte o Google Maps</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cole o link da sua empresa. O sistema importa fotos, avaliações 5 estrelas e localização instantaneamente.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-xs font-black text-white">
                2
              </span>
              <h4 className="text-sm font-bold text-slate-900">Cadastre Serviços e Fotos</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Defina valores, tempo de atendimento e crie artes de Antes & Depois com nosso gerador Canvas integrado.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-xs font-black text-white">
                3
              </span>
              <h4 className="text-sm font-bold text-slate-900">Receba Clientes 24h por Dia</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Divulgue seu link na bio do Instagram, WhatsApp e Google. Os agendamentos chegam prontos e confirmados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos e Preços */}
      <section id="planos" className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200/60">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Comece com 7 Dias Grátis sem Cartão</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 pt-1">
              Planos Transparentes para o seu Negócio Local
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Experimente todas as ferramentas por 7 dias inteiramente grátis. Escolha o plano que melhor se adapta à sua empresa.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto items-stretch">
            {/* Card: Plano Pro Mensal */}
            <div className="relative rounded-2xl border-2 border-teal-700 bg-white p-8 space-y-6 flex flex-col justify-between shadow-xl ring-4 ring-teal-700/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-800 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  Mais Popular • Teste Grátis 7 Dias
                </span>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Plano Pro Mensal</h3>
                  <p className="text-xs text-slate-500">
                    Acesso completo com pagamento mensal sem fidelidade ou multa.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">R$ 97,00</span>
                    <span className="text-xs text-slate-500"> / mês</span>
                  </div>
                  <p className="text-[11px] text-teal-700 font-semibold mt-1 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Pix Instantâneo ou Cartão de Crédito em até 12x via Mercado Pago</span>
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recursos Inclusos:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="font-semibold text-slate-900">7 Dias de Teste Grátis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>Sincronização em tempo real com Google Maps & Reviews</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>Cálculo preciso de horários (Fuso de Brasília)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>Gerador Canvas de Antes & Depois para redes sociais</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>Temas especializados por nicho (Oficina, Saúde, Gastronomia, etc.)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>Agendamentos e clientes ilimitados com anti double-booking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>Confirmação e conversão direta no WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>SEO Local Avançado com Schema.org LocalBusiness</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>Suporte prioritário via WhatsApp</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full text-center rounded-xl bg-teal-800 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-900 active:scale-[0.99] transition cursor-pointer"
                >
                  <span>Começar Teste Grátis de 7 Dias</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Sem cartão necessário para iniciar o teste.
                </p>
              </div>
            </div>

            {/* Card: Plano Pro Anual */}
            <div className="relative rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50/40 via-white to-white p-8 space-y-6 flex flex-col justify-between shadow-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                  <Sparkles className="h-3 w-3 text-amber-200" />
                  Melhor Custo-Benefício • 2 Meses Grátis
                </span>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Plano Pro Anual</h3>
                  <p className="text-xs text-slate-500">
                    Máxima economia com 2 meses gratuitos e setup assistido pela equipe.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">R$ 970,00</span>
                    <span className="text-xs text-slate-500"> / ano</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-bold mt-1">
                    Equivalente a R$ 80,83/mês • Economia real de R$ 194,00 no ano
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Parcelamento em até 12x no cartão ou Pix via Mercado Pago
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Tudo do Plano Pro mais:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-semibold text-slate-900">2 Meses Inteiramente Grátis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-semibold text-slate-900">Setup Assistido & Configuração Inicial Guiada</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Sincronização em tempo real com Google Maps & Reviews</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Cálculo preciso de horários com Horário de Brasília</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Gerador Canvas de Antes & Depois para redes sociais</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Temas especializados por nicho (Oficina, Saúde, Gastronomia, etc.)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Suporte VIP e consultoria de SEO Local via WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Suporte para conexão de domínio próprio (.com.br)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full text-center rounded-xl bg-amber-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 active:scale-[0.99] transition cursor-pointer"
                >
                  <span>Assinar Plano Anual com Desconto</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Ativação imediata com 2 meses grátis.
                </p>
              </div>
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
            <p className="text-xs sm:text-sm text-slate-500">
              Tudo o que você precisa saber sobre o teste grátis, planos e integrações.
            </p>
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
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-teal-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Sem burocracia • Ativação em 3 minutos</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold">
            Pronto para colocar seu negócio local no topo do Google?
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl mx-auto">
            Comece seu teste grátis de 7 dias agora mesmo e transforme sua presença digital em uma máquina de agendamentos.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-extrabold text-teal-950 shadow-xl hover:bg-teal-50 active:scale-[0.99] transition cursor-pointer"
            >
              <span>Começar Teste Grátis de 7 Dias</span>
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
              Plataforma de presença digital, SEO local e agendamentos inteligentes para negócios locais.
            </p>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400 space-y-1">
            <p>© {new Date().getFullYear()} EssMendes Tecnologia. Todos os direitos reservados.</p>
            <p>Desenvolvido com foco em alta performance, SEO Schema.org e conversão.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
