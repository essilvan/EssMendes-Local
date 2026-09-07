'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        console.error('[LoginPage] Erro de autenticação:', error);
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais de acesso.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Por favor, confirme seu e-mail antes de acessar.');
        } else {
          setErrorMessage(error.message || 'Falha na autenticação. Tente novamente.');
        }
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        router.push('/admin');
        router.refresh();
      } else {
        setErrorMessage('Sessão não iniciada. Verifique os dados e tente novamente.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[LoginPage] Exceção ao tentar login:', err);
      setErrorMessage(err?.message || 'Erro inesperado na conexão com o servidor.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Logo Oficial no canto superior esquerdo */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image
            src="/images/logo-essmendes.png"
            alt="EssMendes Tecnologia"
            width={140}
            height={42}
            className="h-9 w-auto object-contain"
          />
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        {/* Cabeçalho */}
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/logo-essmendes.png"
              alt="EssMendes Tecnologia"
              width={320}
              height={110}
              priority
              className="h-24 sm:h-28 w-auto object-contain drop-shadow-xl"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-600/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>EssMendes Local</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Acesse seu Painel
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Gerencie seus serviços, horários e presença digital.
          </p>
        </div>

        {/* Alerta Visual de Erro */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Falha na autenticação</p>
              <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Formulário com onSubmit e e.preventDefault() */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {/* E-mail */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              E-mail
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="seuemail@exemplo.com"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Senha
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Entrando no painel...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Link para Cadastro */}
        <div className="text-center text-xs text-slate-600">
          Ainda não possui uma conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-4"
          >
            Cadastrar meu negócio
          </Link>
        </div>
      </div>
    </div>
  );
}
