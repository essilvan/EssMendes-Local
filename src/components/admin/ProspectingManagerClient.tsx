"use client";

import React, { useState } from "react";
import {
  detectProspectingNiche,
  type ProspectingNicheKey,
} from "@/utils/prospecting-niche";
import {
  Search,
  Star,
  MapPin,
  Phone,
  Sparkles,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Rocket,
  Bot,
  Zap,
  Globe,
  Download,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export interface ProspectingLead {
  id: string;
  place_id: string;
  business_name: string;
  phone: string | null;
  address: string | null;
  website?: string | null;
  region?: string | null;
  photo_url?: string | null;
  place_types?: string[] | null;
  primary_type?: string | null;
  detected_niche?: string | null;
  rating: number | null;
  total_reviews: number | null;
  demo_slug: string | null;
  status: string | null;
  last_message_at: string | null;
  chat_history: any[] | null;
  created_at: string;
}

interface ProspectingManagerClientProps {
  initialLeads: ProspectingLead[];
  evolutionEnabled: boolean;
}

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  new: {
    label: "Novo",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  demo_created: {
    label: "Prévia Criada",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  contacted: {
    label: "Contatado",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  replied: {
    label: "Respondeu",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
  },
  closed: {
    label: "Fechado",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
};

const NICHE_LABELS: Record<ProspectingNicheKey, { label: string; cls: string }> = {
  towing: {
    label: "Guincho 24h",
    cls: "bg-red-50 text-red-700 border-red-200",
  },
  car_dealership: {
    label: "Revenda & Multimarcas",
    cls: "bg-slate-100 text-slate-800 border-slate-300",
  },
  mechanic: {
    label: "Oficina Mecânica",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  car_wash: {
    label: "Estética Automotiva",
    cls: "bg-sky-50 text-sky-700 border-sky-200",
  },
  petshop: {
    label: "Pet Shop & Vet",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  beauty: {
    label: "Beleza & Barbearia",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
  },
  restaurant: {
    label: "Bar & Restaurante",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
  },
  bakery: {
    label: "Confeitaria & Padaria",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
  },
  services: {
    label: "Negócio Local",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

function inferRegionFromAddress(address?: string | null): string {
  if (!address) return "—";
  const knownMatch = address.match(
    /\b(Taguatinga|Ceil[aâ]ndia|[AÁ]guas Claras|Samambaia|Vicente Pires|Guar[aá]|Gama|Sobradinho|Planaltina|Recanto das Emas|Riacho Fundo|Santa Maria|Asa Sul|Asa Norte|Sudoeste|Noroeste|Lago Sul|Lago Norte|Bras[ií]lia)\b/i
  );
  if (knownMatch?.[1]) return knownMatch[1];
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2]
      .replace(/\s*-\s*[A-Z]{2}.*$/, "")
      .trim();
    if (candidate && candidate.length <= 35) return candidate;
  }
  return "DF";
}

function formatSiteLabel(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) {
      const handle = parsed.pathname.replace(/^\/|\/$/g, "").split("/")[0];
      return handle ? `@${handle}` : "Instagram";
    }
    return host;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 28);
  }
}

export function ProspectingManagerClient({
  initialLeads,
  evolutionEnabled,
}: ProspectingManagerClientProps) {
  const [leads, setLeads] = useState<ProspectingLead[]>(initialLeads);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "created_at" | "business_name" | "rating" | "phone" | "website" | "region" | "status"
  >("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isSearching, setIsSearching] = useState(false);
  const [isClearingNew, setIsClearingNew] = useState(false);
  const [busyDemoId, setBusyDemoId] = useState<string | null>(null);
  const [busySendId, setBusySendId] = useState<string | null>(null);
  const [busyStatusId, setBusyStatusId] = useState<string | null>(null);
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSearchLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/prospecting/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedback({
          type: "error",
          text: json.error || "Não foi possível buscar leads no Google Places.",
        });
        return;
      }
      if (Array.isArray(json.leads)) {
        setLeads(json.leads);
      }
      setFeedback({
        type: "success",
        text: `Busca "${json.queryUsed || query.trim()}" concluída! ${
          json.foundCount || 0
        } estabelecimentos com telefone encontrados (${
          json.importedCount || 0
        } novos, ${json.updatedCount || 0} atualizados).`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Erro de conexão ao buscar leads.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateDemo = async (lead: ProspectingLead) => {
    setBusyDemoId(lead.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/prospecting/create-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedback({
          type: "error",
          text: json.error || "Erro ao gerar vitrine demonstrativa.",
        });
        return;
      }
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? {
                ...l,
                demo_slug: json.demoSlug,
                detected_niche: json.niche || l.detected_niche,
                status:
                  !l.status || l.status === "new" ? "demo_created" : l.status,
              }
            : l
        )
      );
      setFeedback({
        type: "success",
        text: `Prévia (${json.nicheLabel || "Personalizada"}) criada para "${lead.business_name}": https://${json.demoSlug}.essmendes.com.br`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Erro ao gerar prévia.",
      });
    } finally {
      setBusyDemoId(null);
    }
  };

  const handleSendWhatsApp = async (lead: ProspectingLead) => {
    setBusySendId(lead.id);
    setFeedback(null);
    try {
      let activeLead = lead;
      if (!activeLead.demo_slug) {
        const demoRes = await fetch("/api/prospecting/create-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: lead.id }),
        });
        const demoJson = await demoRes.json();
        if (demoRes.ok && demoJson.success && demoJson.demoSlug) {
          activeLead = {
            ...lead,
            demo_slug: demoJson.demoSlug,
            status: "demo_created",
          };
          setLeads((prev) =>
            prev.map((l) => (l.id === lead.id ? activeLead : l))
          );
        }
      }

      const res = await fetch("/api/prospecting/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: activeLead.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedback({
          type: "error",
          text: json.error || "Não foi possível iniciar abordagem no WhatsApp.",
        });
        return;
      }

      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeLead.id
            ? {
                ...l,
                status: "contacted",
                last_message_at: new Date().toISOString(),
              }
            : l
        )
      );

      if (json.mode === "wa_link" && json.waUrl) {
        window.open(json.waUrl, "_blank", "noopener,noreferrer");
        setFeedback({
          type: "success",
          text: `WhatsApp aberto em 1 clique para "${activeLead.business_name}" e status atualizado para Contatado.`,
        });
      } else {
        setFeedback({
          type: "success",
          text: `Mensagem enviada automaticamente via Evolution API para "${activeLead.business_name}"!`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Erro ao enviar mensagem.",
      });
    } finally {
      setBusySendId(null);
    }
  };

  const handleStatusChange = async (leadId: string, nextStatus: string) => {
    setBusyStatusId(leadId);
    try {
      const res = await fetch("/api/prospecting/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status: nextStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
        );
      }
    } finally {
      setBusyStatusId(null);
    }
  };

  const handleCopyPhone = async (lead: ProspectingLead) => {
    if (!lead.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopiedPhoneId(lead.id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    } catch {
      // ignora erro de clipboard
    }
  };

  const handleCopyQuickReply = async (lead: ProspectingLead) => {
    const demoUrl = lead.demo_slug
      ? `https://${lead.demo_slug}.essmendes.com.br`
      : "https://app.essmendes.com.br";
    const nicheKey: ProspectingNicheKey =
      (lead.detected_niche as ProspectingNicheKey) ||
      detectProspectingNiche(
        lead.business_name,
        lead.place_types,
        lead.primary_type
      );

    const quickReply =
      nicheKey === "restaurant"
        ? `Funciona assim: o cliente escaneia o QR Code na mesa, escolhe os itens (conta única da mesa ou comanda individual) e o pedido cai na hora no monitor da cozinha com alerta sonoro e no WhatsApp do garçom — sem precisar gastar com impressora! No fechamento já calcula os 10% opcionais e envia o link de avaliação 5 estrelas no Google. O Plano Piloto sai por apenas R$ 89,90/mês com o cadastro completo do cardápio do ${lead.business_name} já incluso. Dá uma olhada na prévia: ${demoUrl}`
        : `Funciona assim: nós criamos a vitrine profissional do ${lead.business_name} otimizada para o Google com fotos reais, catálogo de serviços/produtos, avaliações 5 estrelas e botão direto de agendamento/orçamento no seu WhatsApp — tudo pronto sem precisar de site caro! O Plano Piloto sai por apenas R$ 89,90/mês com a montagem completa inclusa. Dá uma olhada na prévia que fizemos para vocês: ${demoUrl}`;

    try {
      await navigator.clipboard.writeText(quickReply);
      setCopiedLeadId(lead.id);
      setTimeout(() => setCopiedLeadId(null), 2500);
    } catch {
      alert("Copie a resposta:\n\n" + quickReply);
    }
  };

  const filteredLeads =
    statusFilter === "all"
      ? leads
      : leads.filter((l) => (l.status || "new") === statusFilter);

  const countByStatus = (st: string) =>
    leads.filter((l) => (l.status || "new") === st).length;

  const newLeadsCount = countByStatus("new");

  const STATUS_ORDER: Record<string, number> = {
    new: 1,
    demo_created: 2,
    contacted: 3,
    replied: 4,
    closed: 5,
  };

  const handleSort = (
    col: "business_name" | "rating" | "phone" | "website" | "region" | "status"
  ) => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "rating" ? "desc" : "asc");
    }
  };

  const renderSortIcon = (
    col: "business_name" | "rating" | "phone" | "website" | "region" | "status"
  ) => {
    if (sortBy !== col) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-teal-700" />
    ) : (
      <ArrowDown className="h-3 w-3 text-teal-700" />
    );
  };

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "business_name":
        return (
          a.business_name.localeCompare(b.business_name, "pt-BR", {
            sensitivity: "base",
          }) * mult
        );
      case "rating": {
        const ra = Number(a.rating ?? -1);
        const rb = Number(b.rating ?? -1);
        if (ra !== rb) return (ra - rb) * mult;
        return (Number(a.total_reviews ?? 0) - Number(b.total_reviews ?? 0)) * mult;
      }
      case "phone":
        return (
          String(a.phone || "").localeCompare(String(b.phone || ""), "pt-BR") *
          mult
        );
      case "website": {
        // asc: agrupa primeiro quem está "Sem Site — Oportunidade" (0) antes de quem tem site (1)
        const wa = a.website ? 1 : 0;
        const wb = b.website ? 1 : 0;
        if (wa !== wb) return (wa - wb) * mult;
        return (
          String(a.website || "").localeCompare(
            String(b.website || ""),
            "pt-BR"
          ) * mult
        );
      }
      case "region": {
        const regA = a.region || inferRegionFromAddress(a.address);
        const regB = b.region || inferRegionFromAddress(b.address);
        return regA.localeCompare(regB, "pt-BR", { sensitivity: "base" }) * mult;
      }
      case "status": {
        const sa = STATUS_ORDER[a.status || "new"] ?? 99;
        const sb = STATUS_ORDER[b.status || "new"] ?? 99;
        if (sa !== sb) return (sa - sb) * mult;
        return (
          (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) *
          mult
        );
      }
      default:
        return (
          (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) *
          mult
        );
    }
  });

  const handleClearNewLeads = async () => {
    if (newLeadsCount === 0) return;
    const confirmed = window.confirm(
      `Deseja realmente excluir ${newLeadsCount} lead(s) com status "Novo"?\n\nLeads em Prévia Criada, Contatado, Respondeu e Fechado serão preservados.`
    );
    if (!confirmed) return;

    setIsClearingNew(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/prospecting/clear-new", {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFeedback({
          type: "error",
          text: json.error || "Não foi possível limpar os leads novos.",
        });
        return;
      }
      setLeads((prev) => prev.filter((l) => (l.status || "new") !== "new"));
      setFeedback({
        type: "success",
        text: `${json.deletedCount ?? newLeadsCount} lead(s) com status "Novo" removidos com segurança. Leads em andamento foram preservados.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Erro ao limpar leads novos.",
      });
    } finally {
      setIsClearingNew(false);
    }
  };

  const handleExportCsv = () => {
    if (filteredLeads.length === 0) return;

    const escapeCsv = (val: string | number | null | undefined) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "Estabelecimento",
      "Nota Google",
      "Avaliacoes",
      "Telefone / WhatsApp",
      "Site / Instagram",
      "Regiao",
      "Endereco",
      "Status",
      "Link Previa",
    ];

    const rows = filteredLeads.map((lead) => {
      const stKey = lead.status || "new";
      const region = lead.region || inferRegionFromAddress(lead.address);
      const demoUrl = lead.demo_slug
        ? `https://${lead.demo_slug}.essmendes.com.br`
        : "";
      return [
        escapeCsv(lead.business_name),
        escapeCsv(lead.rating !== null ? Number(lead.rating).toFixed(1) : ""),
        escapeCsv(lead.total_reviews ?? 0),
        escapeCsv(lead.phone || ""),
        escapeCsv(lead.website || "Sem Site"),
        escapeCsv(region),
        escapeCsv(lead.address || ""),
        escapeCsv(STATUS_META[stKey]?.label || stKey),
        escapeCsv(demoUrl),
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `leads-prospeccao-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header + Badge de Modo Ativo + Exportação CSV */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-600/20">
              <Rocket className="h-3.5 w-3.5" />
              <span>Prospecção IA • EssMendes Local</span>
            </div>

            {evolutionEnabled ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/25">
                <Bot className="h-3.5 w-3.5" />
                <span>Piloto Automático Evolution API Ativo</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-600/25">
                <Zap className="h-3.5 w-3.5" />
                <span>Modo 1-Clique WhatsApp Business Ativo</span>
              </div>
            )}
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Prospecção Híbrida de Bares & Restaurantes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Busque estabelecimentos no Google Places com telefone, site/Instagram e região, gere a prévia personalizada e aborde com 1 clique.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={newLeadsCount === 0 || isClearingNew}
            onClick={handleClearNewLeads}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-700 shadow-xs transition cursor-pointer"
            title="Excluir apenas leads com status Novo (mantém leads com prévia, contatados, respondidos e fechados)"
          >
            {isClearingNew ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>Limpar Novos ({newLeadsCount})</span>
          </button>

          <button
            type="button"
            disabled={sortedLeads.length === 0}
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 shadow-xs transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-teal-700" />
            <span>Exportar Tabela (CSV)</span>
          </button>
        </div>
      </div>

      {/* Formulário de Busca Google Places */}
      <form
        onSubmit={handleSearchLeads}
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ex: "Espetinho Taguatinga DF" ou "Bar e Petiscaria Ceilândia DF"'
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 px-6 py-3 text-sm font-bold text-white shadow-sm transition cursor-pointer shrink-0"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>{isSearching ? "Buscando..." : "Buscar Leads"}</span>
        </button>
      </form>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs sm:text-sm font-semibold ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filtros do Funil */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
            statusFilter === "all"
              ? "bg-slate-900 text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Todos ({leads.length})
        </button>
        {(["new", "demo_created", "contacted", "replied", "closed"] as const).map(
          (st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-teal-700 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {STATUS_META[st].label} ({countByStatus(st)})
            </button>
          )
        )}
      </div>

      {/* Tabela Completa de Prospecção */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <Rocket className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum lead nesta etapa
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Digite um segmento e cidade na busca acima (ex: &quot;Espetinho Taguatinga DF&quot;) para importar estabelecimentos reais do Google Places.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSort("business_name")}
                        className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                      >
                        <span>Estabelecimento</span>
                        {renderSortIcon("business_name")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSort("rating")}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-200/70 hover:bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 cursor-pointer"
                        title="Ordenar por maior nota Google"
                      >
                        <span>Nota ★</span>
                        {renderSortIcon("rating")}
                      </button>
                    </div>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("phone")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>Telefone / WhatsApp</span>
                      {renderSortIcon("phone")}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("website")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                      title="Agrupar quem está Sem Site primeiro"
                    >
                      <span>Site / Instagram</span>
                      {renderSortIcon("website")}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort("region")}
                      className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>Endereço & Região</span>
                      {renderSortIcon("region")}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="ml-auto inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                    >
                      <span>Status & Ações</span>
                      {renderSortIcon("status")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sortedLeads.map((lead) => {
                  const stKey = lead.status || "new";
                  const stMeta = STATUS_META[stKey] || STATUS_META.new;
                  const demoUrl = lead.demo_slug
                    ? `https://${lead.demo_slug}.essmendes.com.br`
                    : null;
                  const nicheKey: ProspectingNicheKey =
                    (lead.detected_niche as ProspectingNicheKey) ||
                    detectProspectingNiche(
                      lead.business_name,
                      lead.place_types,
                      lead.primary_type
                    );
                  const nicheMeta = NICHE_LABELS[nicheKey] || NICHE_LABELS.services;
                  const regionLabel =
                    lead.region || inferRegionFromAddress(lead.address);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/70 transition-colors align-top"
                    >
                      {/* 1. Estabelecimento */}
                      <td className="py-4 px-4 max-w-[240px]">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${lead.business_name} ${lead.address || ""}`.trim()
                          )}${
                            lead.place_id
                              ? `&query_place_id=${encodeURIComponent(lead.place_id)}`
                              : ""
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir estabelecimento no Google Maps"
                          className="group inline-flex items-start gap-1.5 text-sm font-extrabold text-slate-900 hover:text-teal-700 leading-snug transition-colors"
                        >
                          <span>{lead.business_name}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400 group-hover:text-teal-600" />
                        </a>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${nicheMeta.cls}`}
                          >
                            {nicheMeta.label}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0" />
                          <span>
                            {lead.rating !== null
                              ? Number(lead.rating).toFixed(1)
                              : "—"}
                          </span>
                          <span className="font-medium text-slate-500">
                            ({lead.total_reviews || 0} avaliações)
                          </span>
                        </div>
                        {demoUrl && (
                          <a
                            href={demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            <span>Ver Prévia</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>

                      {/* 2. Telefone / WhatsApp */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {lead.phone ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800">
                              {lead.phone}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(lead)}
                              title="Copiar telefone"
                              className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            >
                              {copiedPhoneId === lead.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sem telefone</span>
                        )}
                      </td>

                      {/* 3. Site / Instagram */}
                      <td className="py-4 px-4 max-w-[190px]">
                        {lead.website ? (
                          <a
                            href={
                              lead.website.startsWith("http")
                                ? lead.website
                                : `https://${lead.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-teal-700 max-w-full"
                            title={lead.website}
                          >
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {formatSiteLabel(lead.website)}
                            </span>
                            <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                            Sem Site — Oportunidade
                          </span>
                        )}
                      </td>

                      {/* 4. Endereço & Região */}
                      <td className="py-4 px-4 max-w-[240px]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          <MapPin className="h-3 w-3 text-teal-600" />
                          {regionLabel}
                        </span>
                        {lead.address && (
                          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                            {lead.address}
                          </p>
                        )}
                      </td>

                      {/* 5. Status & Ações */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${stMeta.badgeClass}`}
                            >
                              {stMeta.label}
                            </span>
                            <select
                              value={stKey}
                              disabled={busyStatusId === lead.id}
                              onChange={(e) =>
                                handleStatusChange(lead.id, e.target.value)
                              }
                              aria-label="Atualizar status do lead"
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 focus:border-teal-600 focus:outline-none cursor-pointer"
                            >
                              <option value="new">Novo</option>
                              <option value="demo_created">Prévia Criada</option>
                              <option value="contacted">Contatado</option>
                              <option value="replied">Respondeu</option>
                              <option value="closed">Fechado</option>
                            </select>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={busyDemoId === lead.id}
                              onClick={() => handleCreateDemo(lead)}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 text-[11px] font-bold text-indigo-800 transition cursor-pointer disabled:opacity-60"
                            >
                              {busyDemoId === lead.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                              <span>1. Gerar Prévia</span>
                            </button>

                            <button
                              type="button"
                              disabled={busySendId === lead.id || !lead.phone}
                              onClick={() => handleSendWhatsApp(lead)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-extrabold text-white shadow-2xs transition cursor-pointer disabled:opacity-60"
                            >
                              {busySendId === lead.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <MessageCircle className="h-3 w-3" />
                              )}
                              <span>2. Abordar WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyQuickReply(lead)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1.5 text-[11px] font-bold text-slate-700 transition cursor-pointer"
                              title="Copiar resposta rápida de vendas"
                            >
                              {copiedLeadId === lead.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-700">
                                    Copiado
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Resposta</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
