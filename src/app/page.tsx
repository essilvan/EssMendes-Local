import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  CheckCircle2,
  Database,
  Layers,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let supabaseStatus = "Conectando...";
  let isSupabaseOk = false;
  let loggedUser = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error) {
      supabaseStatus = "Instância do Supabase Conectada com Sucesso";
      isSupabaseOk = true;
      loggedUser = user;
    } else {
      supabaseStatus = `Status de Sessão: Conectado (${error.message})`;
      isSupabaseOk = true;
    }
  } catch (err) {
    supabaseStatus = `Erro ao inicializar cliente: ${
      err instanceof Error ? err.message : "Desconhecido"
    }`;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-3xl space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>FASE 1.3: Autenticação & Vínculo de Tenant</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            EssMendes Local
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Plataforma SaaS de presença digital e geração de clientes para negócios locais.
          </p>
        </div>

        {/* Links Rápidos de Autenticação */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {loggedUser ? (
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Acessar Painel Administrativo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition"
              >
                <UserPlus className="h-4 w-4" />
                <span>Criar Conta Profissional</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <LogIn className="h-4 w-4" />
                <span>Fazer Login</span>
              </Link>
            </>
          )}
        </div>

        {/* Status da Instalação */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <Layers className="mt-0.5 h-5 w-5 text-teal-600 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Rotas Protegidas & Middleware
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Middleware com resolução de sessão e proteção das rotas <code>/admin/*</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <Database className="mt-0.5 h-5 w-5 text-teal-600 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Multi-tenant Desacoplado
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vínculo atômico <code>auth.users</code> ➔ <code>tenant_users</code> (Owner) ➔ <code>tenants</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Teste de Conexão Supabase */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                isSupabaseOk
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isSupabaseOk ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Status da Conexão Supabase
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {supabaseStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6 text-xs text-slate-500">
          <span>FASE 1.3: Autenticação & Vínculo de Tenant</span>
          <span>Pronto para Migrations SQL no Supabase</span>
        </div>
      </div>
    </main>
  );
}
