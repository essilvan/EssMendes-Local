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
} from "lucide-react";

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

  // Estados do formulário de Setup Rápido
  const [mapsUrl, setMapsUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Transitions
  const [isSelecting, startSelectTransition] = useTransition();
  const [isCreating, startCreateTransition] = useTransition();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

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

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!mapsUrl.trim()) {
      setFormError("Por favor, cole o link do Google Maps da empresa.");
      return;
    }

    if (!whatsapp.trim()) {
      setFormError("Informe o WhatsApp comercial da empresa.");
      return;
    }

    startCreateTransition(async () => {
      const res = await createTenantFromGoogleMapsAction(mapsUrl, whatsapp);
      if (res.success && res.tenant) {
        setFormSuccess(`Empresa "${res.tenant.name}" cadastrada e sincronizada com sucesso!`);
        setMapsUrl("");
        setWhatsapp("");
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess(null);
          router.refresh();
        }, 1500);
      } else {
        setFormError(res.error || "Falha ao cadastrar empresa a partir do link do Google Maps.");
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

          {/* 2. Botão de Ação Rápida: Cadastrar Nova Empresa */}
          <div>
            <button
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

                      {/* Slug público com link direto para vitrine pública (/{slug}) */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/${t.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/60 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
                        >
                          <Globe className="h-3.5 w-3.5 text-teal-600" />
                          <span className="font-mono">/{t.slug}</span>
                          <ExternalLink className="h-3 w-3 text-teal-600" />
                        </Link>
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

                      {/* Botão de Destaque: "🏢 Gerenciar" */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Formulário: ➕ Setup Rápido via Link do Google Maps */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cadastrar Nova Empresa (Setup Rápido via Google Maps)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Importação automática de perfil, notas, fotos e avaliações
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Explicação */}
            <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3.5 text-xs text-teal-900">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-teal-700 shrink-0" />
                Setup Instantâneo em Menos de 1 Minuto
              </p>
              <p className="mt-1 text-teal-800 text-[11px] leading-relaxed">
                Ao colar o link do estabelecimento no Google Maps, nosso motor inteligente identifica nome, endereço, categoria, fotos oficiais em alta definição e avaliações reais.
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Link do Google Maps *
                </label>
                <input
                  type="text"
                  placeholder="https://maps.app.goo.gl/... ou link completo do Maps"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  disabled={isCreating}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-xs"
                />
                <span className="text-[10px] text-slate-400">
                  Pode ser o link de compartilhamento gerado no celular ou copiado do navegador.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  WhatsApp Comercial da Empresa *
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  disabled={isCreating}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-xs"
                />
                <span className="text-[10px] text-slate-400">
                  Número principal que receberá os pedidos da vitrine e orçamentos.
                </span>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-800 disabled:opacity-50 transition cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sincronizando com Google Places...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Cadastrar Empresa Agora</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
