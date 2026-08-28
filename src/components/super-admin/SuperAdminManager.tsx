"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  selectManagedTenantAction,
  createTenantFromGoogleMapsAction,
  clearManagedTenantAction,
} from "@/services/super-admin.actions";
import type { SuperAdminTenantItem } from "@/types";
import { NewTenantModal } from "@/components/admin/NewTenantModal";
import {
  Building2,
  Plus,
  Search,
  Star,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Globe,
  Loader2,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

interface SuperAdminManagerProps {
  initialTenants: SuperAdminTenantItem[];
  currentUserEmail?: string;
  activeImpersonatedTenantId?: string;
}

export function SuperAdminManager({
  initialTenants,
  currentUserEmail,
  activeImpersonatedTenantId,
}: SuperAdminManagerProps) {
  const router = useRouter();
  const [tenants, setTenants] = useState<SuperAdminTenantItem[]>(initialTenants);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transitions
  const [isSelecting, startSelectTransition] = useTransition();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.city && t.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectTenant = (tenantId: string, targetPath: string = "/admin/dashboard") => {
    setSelectedTenantId(tenantId);
    startSelectTransition(async () => {
      const res = await selectManagedTenantAction(tenantId, targetPath);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
      } else {
        alert(res.error || "Erro ao selecionar empresa.");
        setSelectedTenantId(null);
      }
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          {score}/100 • Excelente
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 ring-1 ring-teal-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
          {score}/100 • Forte
        </span>
      );
    }
    if (score >= 40) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          {score}/100 • Moderada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
        {score}/100 • Crítica
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Master */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 ring-1 ring-teal-500/30">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>Painel Master • Super Administrador</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Gestão Híbrida de Estabelecimentos
            </h1>
            <p className="text-sm text-slate-300">
              Gerencie centralmente todos os lojistas, atue em nome de qualquer empresa ou cadastre novas com link do Google Maps.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-500 transition"
            >
              <Plus className="h-4 w-4" />
              <span>➕ Novo Estabelecimento</span>
            </button>
          </div>
        </div>

        {/* Métricas Rápidas do Master */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-800 pt-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total de Lojistas</span>
            <p className="text-2xl font-black text-white">{tenants.length}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Com Google Sync</span>
            <p className="text-2xl font-black text-teal-400">
              {tenants.filter((t) => t.google_rating !== null).length}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total de Produtos</span>
            <p className="text-2xl font-black text-blue-400">
              {tenants.reduce((acc, curr) => acc + (curr.total_products || 0), 0)}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Média Score Local</span>
            <p className="text-2xl font-black text-emerald-400">
              {tenants.length > 0
                ? Math.round(
                    tenants.reduce((acc, curr) => acc + curr.presence_score, 0) /
                      tenants.length
                  )
                : 0}
              /100
            </p>
          </div>
        </div>
      </div>

      {/* Alerta se houver tenant ativo em impersonação */}
      {activeImpersonatedTenantId && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              Você possui uma empresa selecionada em sessão ativa. Deseja retornar ao modo padrão?
            </span>
          </div>
          <form action={clearManagedTenantAction}>
            <button
              type="submit"
              className="rounded-lg bg-amber-200/80 px-3 py-1 font-bold text-amber-900 hover:bg-amber-300 transition"
            >
              Desconectar Seleção
            </button>
          </form>
        </div>
      )}

      {/* Barra de Busca e Filtro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, slug ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-sm"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Exibindo {filteredTenants.length} de {tenants.length} estabelecimentos
        </span>
      </div>

      {/* Tabela de Estabelecimentos Cadastrados */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">Empresa</th>
                <th scope="col" className="px-5 py-3.5">Cidade</th>
                <th scope="col" className="px-5 py-3.5">Google Rating</th>
                <th scope="col" className="px-5 py-3.5">Vitrine Produtos</th>
                <th scope="col" className="px-5 py-3.5">Presence Score</th>
                <th scope="col" className="px-5 py-3.5 text-right">Ação Central</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum estabelecimento encontrado.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Utilize o botão "Novo Estabelecimento" para cadastrar empresas via Google Maps.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isCurrent = activeImpersonatedTenantId === t.id;
                  const isRowSelecting = isSelecting && selectedTenantId === t.id;

                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition",
                        isCurrent ? "bg-teal-50/40" : ""
                      )}
                    >
                      {/* Nome e Slug */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 font-bold text-white shadow-sm text-xs">
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                              {isCurrent && (
                                <span className="rounded bg-teal-100 px-1.5 py-0.2 text-[10px] font-bold text-teal-800">
                                  Ativo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-mono text-slate-500">/{t.slug}</span>
                              <Link
                                href={`/${t.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline"
                              >
                                <span>Ver Vitrine</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cidade */}
                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{t.city}</span>
                        </div>
                      </td>

                      {/* Google Rating */}
                      <td className="px-5 py-4">
                        {t.google_rating !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                              {Number(t.google_rating).toFixed(1)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({t.google_reviews_count || 0} reviews)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            Não sincronizado
                          </span>
                        )}
                      </td>

                      {/* Total de Produtos */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-semibold">
                          <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
                          <span>{t.total_products} {t.total_products === 1 ? "produto" : "produtos"}</span>
                        </div>
                      </td>

                      {/* Score de Presença */}
                      <td className="px-5 py-4">{getScoreBadge(t.presence_score)}</td>

                      {/* Ação Central: Gerenciar Empresa */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleSelectTenant(t.id, "/admin/dashboard")}
                            disabled={isRowSelecting}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 transition"
                          >
                            {isRowSelecting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Building2 className="h-3.5 w-3.5" />
                            )}
                            <span>🏢 Gerenciar</span>
                          </button>

                          {/* Quick shortcuts para o Super Admin */}
                          <button
                            onClick={() => handleSelectTenant(t.id, "/admin/produtos")}
                            disabled={isRowSelecting}
                            title="Acessar Vitrine de Produtos"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleSelectTenant(t.id, "/admin/avaliacoes")}
                            disabled={isRowSelecting}
                            title="Acessar Avaliações & IA"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleSelectTenant(t.id, "/admin/posts")}
                            disabled={isRowSelecting}
                            title="Acessar Posts & SEO"
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Formulário: ➕ Novo Estabelecimento com Busca Instantânea */}
      <NewTenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
