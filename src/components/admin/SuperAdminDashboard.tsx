"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  selectManagedTenantAction,
  createTenantFromGoogleMapsAction,
  clearManagedTenantAction,
  syncTenantGoogleHoursAction,
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
  Phone,
  ArrowRight,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { getTenantPublicUrl, getTenantDisplayDomain } from "@/utils/tenant-url";

interface SuperAdminDashboardProps {
  initialTenants: SuperAdminTenantItem[];
  currentUserEmail?: string;
  activeTenantId?: string;
}

export function SuperAdminDashboard({
  initialTenants,
  currentUserEmail,
  activeTenantId,
}: SuperAdminDashboardProps) {
  const router = useRouter();
  const [tenants, setTenants] = useState<SuperAdminTenantItem[]>(initialTenants);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transitions
  const [isSelecting, startSelectTransition] = useTransition();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [copiedSlugId, setCopiedSlugId] = useState<string | null>(null);
  const [syncingTenantId, setSyncingTenantId] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ id: string; text: string; isError?: boolean } | null>(null);

  const handleSyncGoogleHours = async (tenantId: string, googlePlaceId?: string | null, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSyncingTenantId(tenantId);
    setSyncStatusMsg(null);
    try {
      const res = await syncTenantGoogleHoursAction(tenantId, googlePlaceId || undefined);
      if (res.success) {
        setSyncStatusMsg({
          id: tenantId,
          text: `✅ ${res.opening_hours?.length || 0} dias de horários sincronizados com sucesso!`,
        });
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenantId
              ? { ...t, opening_hours: res.opening_hours || t.opening_hours }
              : t
          )
        );
        router.refresh();
      } else {
        setSyncStatusMsg({
          id: tenantId,
          text: `❌ ${res.error || "Erro ao sincronizar"}`,
          isError: true,
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        id: tenantId,
        text: `❌ ${err?.message || "Falha na requisição"}`,
        isError: true,
      });
    } finally {
      setSyncingTenantId(null);
      setTimeout(() => {
        setSyncStatusMsg((curr) => (curr?.id === tenantId ? null : curr));
      }, 5000);
    }
  };

  const handleCopyLink = async (slug: string, id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getTenantPublicUrl(slug);
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedSlugId(id);
      setTimeout(() => {
        setCopiedSlugId((current) => (current === id ? null : current));
      }, 2000);
    } catch (err) {
      console.error("Falha ao copiar link:", err);
    }
  };

  // Métricas do Topo
  const totalEmpresas = tenants.length;
  const tenantsComGoogle = tenants.filter(
    (t) => t.google_rating !== null && t.google_rating !== undefined && t.google_rating > 0
  );
  const mediaAvaliacoesGoogle =
    tenantsComGoogle.length > 0
      ? (
          tenantsComGoogle.reduce((acc, t) => acc + (Number(t.google_rating) || 0), 0) /
          tenantsComGoogle.length
        ).toFixed(1)
      : "0.0";
  const totalProdutosCatalogo = tenants.reduce(
    (acc, t) => acc + (t.total_products || 0),
    0
  );

  const filteredTenants = tenants.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.slug.toLowerCase().includes(term) ||
      (t.city && t.city.toLowerCase().includes(term))
    );
  });

  const handleGerenciarEmpresa = (
    tenantId: string,
    targetUrl: string = `/admin?tenantId=${tenantId}`
  ) => {
    setSelectedTenantId(tenantId);
    startSelectTransition(async () => {
      const res = await selectManagedTenantAction(tenantId, targetUrl);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
      } else {
        router.push(targetUrl);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Topo: Título "Painel de Controle EssMendes (Super Admin)" com resumo */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 ring-1 ring-teal-500/30">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>Gestão Central da Plataforma</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
              Painel de Controle EssMendes (Super Admin)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Gerencie centralmente todos os estabelecimentos cadastrados, acesse qualquer painel administrativo e configure novas empresas instantaneamente via Google Maps.
            </p>
          </div>

          {/* 2. Botão de Ação Rápida: Cadastrar Nova Empresa & Logoff */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                await supabase.auth.signOut();
                document.cookie = 'active_tenant_id=; path=/; max-age=0';
                document.cookie = 'sb-access-token=; path=/; max-age=0';
                document.cookie = 'em_active_tenant_id=; path=/; max-age=0';
                window.location.href = '/login';
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              🚪 Sair da Conta (Logoff)
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-teal-500 transition hover:scale-102 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>➕ Cadastrar Nova Empresa (Setup Rápido via Link do Google Maps)</span>
            </button>
          </div>
        </div>

        {/* Resumo no Topo */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-4 rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Empresas</span>
              <p className="text-2xl font-black text-white">{totalEmpresas}</p>
              <span className="text-[11px] text-teal-400 font-medium">{tenantsComGoogle.length} com Google Places</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Star className="h-6 w-6 fill-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Média de Avaliações Google</span>
              <p className="text-2xl font-black text-amber-300">
                ⭐ {mediaAvaliacoesGoogle}
              </p>
              <span className="text-[11px] text-slate-400">Baseado em notas oficiais</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Produtos no Catálogo</span>
              <p className="text-2xl font-black text-blue-400">{totalProdutosCatalogo}</p>
              <span className="text-[11px] text-slate-400">Distribuídos nas vitrines locais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta se houver tenant ativo sendo gerenciado */}
      {activeTenantId && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              Você possui uma empresa em gerenciamento ativo. Para atuar de forma neutra ou limpar a seleção:
            </span>
          </div>
          <form action={clearManagedTenantAction}>
            <button
              type="submit"
              className="rounded-lg bg-amber-200/80 px-3 py-1 font-bold text-amber-950 hover:bg-amber-300 transition cursor-pointer"
            >
              Desconectar Empresa Ativa
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
            placeholder="Buscar por nome da empresa, slug ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-xs"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Exibindo {filteredTenants.length} de {tenants.length} estabelecimentos
        </span>
      </div>

      {/* 3. Tabela / Grid de Estabelecimentos */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">Logo / Nome da Empresa e Cidade</th>
                <th scope="col" className="px-5 py-3.5">Slug Público</th>
                <th scope="col" className="px-5 py-3.5">Nota do Google</th>
                <th scope="col" className="px-5 py-3.5">Total de Produtos</th>
                <th scope="col" className="px-5 py-3.5 text-right">Ação Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <Store className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum estabelecimento localizado.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Utilize o botão acima para cadastrar via link do Google Maps.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isCurrent = activeTenantId === t.id;
                  const isRowSelecting = isSelecting && selectedTenantId === t.id;
                  const adminUrl = `/admin?tenantId=${t.id}`;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCurrent ? "bg-teal-50/40" : ""
                      }`}
                    >
                      {/* Logo / Nome da Empresa e Cidade */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {t.logo_url ? (
                            <img
                              src={t.logo_url}
                              alt={t.name}
                              className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200 shadow-xs"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 font-bold text-white shadow-xs text-xs">
                              {t.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                              {isCurrent && (
                                <span className="rounded bg-teal-100 px-1.5 py-0.2 text-[10px] font-bold text-teal-800">
                                  Gerenciando
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{t.city || "Cidade não informada"}</span>
                              </span>
                              {t.phone && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                  • <Phone className="h-2.5 w-2.5 text-slate-400" />
                                  {t.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Slug público com link direto para vitrine oficial no subdomínio */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={getTenantPublicUrl(t.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/60 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 hover:border-teal-300 transition shadow-2xs max-w-[210px]"
                            title={`Abrir https://${t.slug}.essmendes.com.br`}
                          >
                            <Globe className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span className="font-mono text-[11px] truncate">
                              {getTenantDisplayDomain(t.slug)}
                            </span>
                            <ExternalLink className="h-3 w-3 text-teal-600 shrink-0" />
                          </a>

                          <button
                            type="button"
                            onClick={(e) => handleCopyLink(t.slug, t.id, e)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
                            title={copiedSlugId === t.id ? "Link copiado!" : "Copiar link do subdomínio"}
                          >
                            {copiedSlugId === t.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Badge com Nota do Google (ex: ⭐ 5.0 (12 reviews)) */}
                      <td className="px-5 py-4">
                        {t.google_rating !== null && t.google_rating !== undefined ? (
                          <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
                            <span>⭐ {Number(t.google_rating).toFixed(1)}</span>
                            <span className="font-normal text-amber-700 text-[11px]">
                              ({t.google_reviews_count || 0} reviews)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                            Sem avaliações
                          </span>
                        )}
                      </td>

                      {/* Total de Produtos cadastrados */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-semibold">
                          <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            {t.total_products} {t.total_products === 1 ? "produto" : "produtos"}
                          </span>
                        </div>
                      </td>

                      {/* Botão de Destaque: "🏢 Gerenciar" & Ações */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Botão Ressincronizar Horários Google Places */}
                            <button
                              type="button"
                              onClick={(e) => handleSyncGoogleHours(t.id, t.google_place_id, e)}
                              disabled={syncingTenantId === t.id}
                              title="🔄 Sincronizar Horários Oficiais do Google Places"
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs disabled:opacity-50"
                            >
                              {syncingTenantId === t.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5 text-amber-700" />
                              )}
                              <span>🔄 Atualizar Google</span>
                            </button>

                            <Link
                              href={adminUrl}
                              onClick={(e) => {
                                e.preventDefault();
                                handleGerenciarEmpresa(t.id, adminUrl);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 transition hover:scale-102"
                            >
                              {isRowSelecting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Building2 className="h-3.5 w-3.5" />
                              )}
                              <span>🏢 Gerenciar</span>
                            </Link>

                            {/* Acesso rápido específico solicitado */}
                            <Link
                              href={`/admin/produtos?tenantId=${t.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleGerenciarEmpresa(t.id, `/admin/produtos?tenantId=${t.id}`);
                              }}
                              title="Editar Produtos da Empresa"
                              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              href={`/admin/avaliacoes?tenantId=${t.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleGerenciarEmpresa(t.id, `/admin/avaliacoes?tenantId=${t.id}`);
                              }}
                              title="Gerenciar Reviews Google & IA"
                              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              href={`/admin/posts?tenantId=${t.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleGerenciarEmpresa(t.id, `/admin/posts?tenantId=${t.id}`);
                              }}
                              title="Gerar Posts de IA & SEO"
                              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Link>
                          </div>

                          {syncStatusMsg?.id === t.id && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                syncStatusMsg.isError
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {syncStatusMsg.text}
                            </span>
                          )}
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

      {/* Modal / Formulário: ➕ Setup Rápido com Busca Instantânea */}
      <NewTenantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
