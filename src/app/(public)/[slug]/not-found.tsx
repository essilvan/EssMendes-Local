import Link from "next/link";
import { Building2, ArrowLeft, Home, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Building2 className="h-7 w-7" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700">
            <Sparkles className="h-3 w-3" />
            EssMendes Local
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Estabelecimento Não Encontrado
          </h1>
          <p className="text-xs text-slate-500">
            O link que você tentou acessar não corresponde a nenhuma página ativa na plataforma. Verifique o endereço digitado.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 transition"
          >
            <Home className="h-4 w-4" />
            <span>Ir para a Página Inicial</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
