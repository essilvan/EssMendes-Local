import type { Metadata } from "next";
import Link from "next/link";
import { FreeDiagnosticForm } from "@/components/public/FreeDiagnosticForm";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Diagnóstico Gratuito de Presença Local & Google | EssMendes Local",
  description:
    "Descubra gratuitamente como sua empresa aparece no Google e receba um diagnóstico com nota de presença, gargalos e oportunidades de crescimento.",
  openGraph: {
    title: "Diagnóstico Gratuito de Presença Local | EssMendes Local",
    description:
      "Descubra gratuitamente como sua empresa aparece no Google e destrave novos clientes.",
  },
};

export default function DiagnosticoPublicPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-700 selection:text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-800 font-black text-white text-xs">
              EM
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              EssMendes <span className="text-teal-700">Local</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal-800 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao início</span>
          </Link>
        </div>
      </header>

      {/* Main Form Section */}
      <main className="flex-1 py-10 sm:py-16 px-4 sm:px-6">
        <FreeDiagnosticForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} EssMendes Tecnologia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>Diagnóstico 100% seguro em conformidade com a LGPD.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
