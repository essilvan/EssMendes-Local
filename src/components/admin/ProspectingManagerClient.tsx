"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export interface ProspectingLead {
  id: string;
  place_id: string;
  business_name: string;
  phone: string | null;
  address: string | null;
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

const STATUS_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
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

export function ProspectingManagerClient({
  initialLeads,
  evolutionEnabled,
}: ProspectingManagerClientProps) {
  const [leads, setLeads] = useState<ProspectingLead[]>(initialLeads);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [busyDemoId, setBusyDemoId] = useState<string | null>(null);
  const [busySendId, setBusySendId] = useState<string | null>(null);
  const [busyStatusId, setBusyStatusId] = useState<string | null>(null);
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
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
        text: `Busca concluída! ${json.foundCount || 0} estabelecimentos com telefone encontrados (${json.importedCount || 0} novos, ${json.updatedCount || 0} atualizados).`,
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
                status:
                  !l.status || l.status === "new" ? "demo_created" : l.status,
              }
            : l
        )
      );
      setFeedback({
        type: "success",
        text: `Prévia criada para "${lead.business_name}": https://${json.demoSlug}.essmendes.com.br/mesa/01`,
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
      // Se ainda não gerou a prévia, gera automaticamente antes de abordar
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

  const handleCopyQuickReply = async (lead: ProspectingLead) => {
    const demoUrl = lead.demo_slug
      ? `https://${lead.demo_slug}.essmendes.com.br/mesa/01`
      : "https://app.essmendes.com.br";
    const quickReply = `Funciona assim: o cliente escaneia o QR Code na mesa, escolhe os itens (pode somar na conta única da mesa ou em comanda individual) e o pedido cai na hora no monitor da cozinha com alerta sonoro e no WhatsApp do garçom — sem precisar gastar com impressora! No fechamento já calcula os 10% opcionais e envia o link de avaliação 5 estrelas no Google. O Plano Piloto sai por apenas R$ 89,90/mês com o cadastro completo do cardápio do ${lead.business_name} já incluso. Dá uma olhada na prévia: ${demoUrl}`;

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

  return (
    <div className="space-y-6">
      {/* Header + Badge de Modo Ativo */}
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
            Busque estabelecimentos no Google Places, gere a prévia personalizada do cardápio digital e aborde pelo WhatsApp com 1 clique.
          </p>
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

      {/* Lista de Leads */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <Rocket className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum lead nesta etapa
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Digite um segmento e cidade na busca acima (ex: &quot;Espetinho Taguatinga DF&quot;) para importar estabelecimentos reais do Google Places com telefone.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredLeads.map((lead) => {
            const stKey = lead.status || "new";
            const stMeta = STATUS_META[stKey] || STATUS_META.new;
            const demoUrl = lead.demo_slug
              ? `https://${lead.demo_slug}.essmendes.com.br/mesa/01`
              : null;

            return (
              <div
                key={lead.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {lead.business_name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {lead.rating !== null && (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            {Number(lead.rating).toFixed(1)} (
                            {lead.total_reviews || 0})
                          </span>
                        )}
                        {lead.phone && (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
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
                  </div>

                  {lead.address && (
                    <p className="flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span>{lead.address}</span>
                    </p>
                  )}

                  {demoUrl && (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs">
                      <span className="truncate font-semibold text-indigo-800">
                        {demoUrl}
                      </span>
                      <a
                        href={demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 shrink-0"
                      >
                        <span>Visualizar</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Ações do Lead */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={busyDemoId === lead.id}
                    onClick={() => handleCreateDemo(lead)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold text-indigo-800 transition cursor-pointer disabled:opacity-60"
                  >
                    {busyDemoId === lead.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>{lead.demo_slug ? "Atualizar Prévia" : "Gerar Prévia"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={busySendId === lead.id || !lead.phone}
                    onClick={() => handleSendWhatsApp(lead)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    {busySendId === lead.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MessageCircle className="h-3.5 w-3.5" />
                    )}
                    <span>Abordar no WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyQuickReply(lead)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
                    title="Copiar resposta rápida de vendas para colar no WhatsApp"
                  >
                    {copiedLeadId === lead.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar Resposta Rápida</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
