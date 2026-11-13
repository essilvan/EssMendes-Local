"use client";

import React, { useState } from "react";
import {
  saveRestaurantTableAction,
  deleteRestaurantTableAction,
} from "@/services/restaurant.actions";
import type { RestaurantTable, TenantProfessional } from "@/types";
import {
  QrCode,
  Plus,
  Trash2,
  Edit3,
  Printer,
  ExternalLink,
  Copy,
  Check,
  UserCheck,
  Phone,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";

interface TablesManagerClientProps {
  tenantSlug: string;
  tenantName: string;
  initialTables: RestaurantTable[];
  professionals: TenantProfessional[];
}

export function TablesManagerClient({
  tenantSlug,
  tenantName,
  initialTables,
  professionals,
}: TablesManagerClientProps) {
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [waiterId, setWaiterId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [qrPreviewTable, setQrPreviewTable] = useState<RestaurantTable | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const getTableMenuUrl = (num: string) => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://app.essmendes.com.br";
    return `${origin}/${tenantSlug}/mesa/${encodeURIComponent(num)}`;
  };

  const getQrCodeImageUrl = (num: string, size = 280) => {
    const targetUrl = getTableMenuUrl(num);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
      targetUrl
    )}`;
  };

  const openNewModal = () => {
    const nextNum = String(tables.length + 1).padStart(2, "0");
    setEditingTableId(null);
    setTableNumber(nextNum);
    setTableName(`Mesa ${nextNum}`);
    setCapacity(4);
    setWaiterId(professionals[0]?.id || "");
    setIsModalOpen(true);
  };

  const openEditModal = (table: RestaurantTable) => {
    setEditingTableId(table.id);
    setTableNumber(table.table_number);
    setTableName(table.name || `Mesa ${table.table_number}`);
    setCapacity(table.capacity || 4);
    setWaiterId(table.assigned_staff_id || table.waiter_id || "");
    setIsModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await saveRestaurantTableAction({
        id: editingTableId || undefined,
        table_number: tableNumber.trim(),
        name: tableName.trim() || `Mesa ${tableNumber.trim()}`,
        capacity: Number(capacity) || 4,
        waiter_id: waiterId || null,
        assigned_staff_id: waiterId || null,
      });

      if (res.success && res.data) {
        const saved = res.data;
        if (editingTableId) {
          setTables((prev) =>
            prev.map((t) => (t.id === editingTableId ? saved : t))
          );
          setFeedback({
            type: "success",
            text: `${saved.name} atualizada com sucesso!`,
          });
        } else {
          setTables((prev) => [...prev, saved]);
          setFeedback({
            type: "success",
            text: `${saved.name} cadastrada e QR Code gerado com sucesso!`,
          });
        }
        setIsModalOpen(false);
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Erro ao salvar a mesa.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTable = async (table: RestaurantTable) => {
    const res = await deleteRestaurantTableAction(table.id);
    if (res.success) {
      setTables((prev) => prev.filter((t) => t.id !== table.id));
      setFeedback({
        type: "success",
        text: `Mesa ${table.table_number} removida.`,
      });
    }
  };

  const handleCopyLink = async (table: RestaurantTable) => {
    const url = getTableMenuUrl(table.table_number);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(table.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleCopyTerminalLink = async () => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://app.essmendes.com.br";
    const url = `${origin}/${tenantSlug}/garcom`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTerminal(true);
      setTimeout(() => setCopiedTerminal(false), 2000);
    } catch {}
  };

  const handlePrintQrCode = (table: RestaurantTable) => {
    const qrSrc = getQrCodeImageUrl(table.table_number, 360);
    const menuUrl = getTableMenuUrl(table.table_number);
    const printWin = window.open("", "_blank", "width=520,height=680");
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>QR Code - ${table.name || `Mesa ${table.table_number}`} | ${tenantName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; padding: 24px; }
            .card { background: #fff; border: 3px solid #ea580c; border-radius: 28px; padding: 32px 28px; text-align: center; max-width: 380px; width: 100%; box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
            .badge { display: inline-block; background: #ffedd5; color: #9a3412; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
            .table-box { font-size: 32px; font-weight: 900; color: #ea580c; margin: 8px 0 18px; }
            .qr-wrap { border: 2px dashed #fdba74; border-radius: 20px; padding: 16px; display: inline-block; background: #fff; margin-bottom: 16px; }
            .qr-wrap img { width: 240px; height: 240px; display: block; }
            .instructions { font-size: 14px; color: #334155; font-weight: 600; line-height: 1.4; margin-bottom: 10px; }
            .url { font-size: 11px; color: #64748b; word-break: break-all; }
            @media print {
              body { background: #fff; padding: 0; }
              .card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Cardápio Digital na Mesa</span>
            <div class="title">${tenantName}</div>
            <div class="table-box">${table.name || `Mesa ${table.table_number}`}</div>
            <div class="qr-wrap">
              <img src="${qrSrc}" alt="QR Code da Mesa" onload="setTimeout(() => window.print(), 300)" />
            </div>
            <p class="instructions">Aponte a câmera do celular para fazer seu pedido direto para o garçom!</p>
            <p class="url">${menuUrl}</p>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-600/20">
            <QrCode className="h-3.5 w-3.5" />
            <span>Gestão Gastronomia • Mesas & Garçons</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Mesas, Garçons & QR Codes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre as mesas do salão, vincule o garçom responsável e imprima o QR Code exclusivo de atendimento para cada mesa.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center rounded-xl border border-amber-300 bg-amber-50 overflow-hidden">
            <Link
              href={`/${tenantSlug}/garcom`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
            >
              <ExternalLink className="h-4 w-4 text-amber-700" />
              <span>Abrir Terminal do Garçom</span>
            </Link>
            <button
              type="button"
              onClick={handleCopyTerminalLink}
              title="Copiar link do Terminal do Garçom para enviar no WhatsApp da equipe"
              className="border-l border-amber-300 px-3 py-3 text-amber-800 hover:bg-amber-100 transition cursor-pointer"
            >
              {copiedTerminal ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          <Link
            href="/admin/profissionais"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 transition"
          >
            <Users className="h-4 w-4 text-slate-500" />
            <span>Cadastrar Garçons</span>
          </Link>

          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Mesa</span>
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grid de Mesas */}
      {tables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <QrCode className="mx-auto h-10 w-10 text-slate-300" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              Nenhuma mesa cadastrada ainda
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cadastre suas mesas (ex: Mesa 01, Mesa 02), vincule o garçom responsável e gere o QR Code imprimível para os clientes fazerem pedidos direto da mesa.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Mesa 01</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => {
            const menuPath = `/${tenantSlug}/mesa/${table.table_number}`;
            const qrImgUrl = getQrCodeImageUrl(table.table_number, 200);
            const staffId = table.assigned_staff_id || table.waiter_id || null;
            const assignedPro = staffId
              ? professionals.find((p) => p.id === staffId)
              : undefined;
            const waiterDisplayName = assignedPro?.name || table.waiter_name;
            const waiterDisplayPhone = assignedPro?.phone || table.waiter_phone;

            return (
              <div
                key={table.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-orange-800">
                        Mesa #{table.table_number}
                      </span>
                      <h3 className="mt-1 text-lg font-black text-slate-900">
                        {table.name || `Mesa ${table.table_number}`}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Capacidade: {table.capacity || 4} lugares
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setQrPreviewTable(table)}
                      title="Ampliar QR Code"
                      className="rounded-xl border border-slate-200 bg-slate-50 p-1.5 hover:border-orange-300 transition cursor-pointer shrink-0"
                    >
                      <img
                        src={qrImgUrl}
                        alt={`QR Code ${table.name}`}
                        className="h-16 w-16 rounded-lg object-contain"
                      />
                    </button>
                  </div>

                  {/* Garçom Vinculado */}
                  <div
                    className={`rounded-xl border p-3 space-y-1 ${
                      waiterDisplayName
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Garçom / Responsável da Mesa
                    </span>
                    {waiterDisplayName ? (
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                        <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          Garçom: {waiterDisplayName}
                        </span>
                        {waiterDisplayPhone && (
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {waiterDisplayPhone}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 font-medium">
                        WhatsApp Geral do Restaurante (Sem garçom fixo)
                      </p>
                    )}
                  </div>

                  {/* Link da Mesa */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                    <span className="font-mono text-[11px] text-slate-600 truncate">
                      {menuPath}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(table)}
                        title="Copiar link da mesa"
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                      >
                        {copiedId === table.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <Link
                        href={menuPath}
                        target="_blank"
                        title="Abrir cardápio desta mesa"
                        className="rounded-lg p-1 text-orange-600 hover:bg-orange-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handlePrintQrCode(table)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Imprimir QR Code</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(table)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTable(table)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição de Mesa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTableId ? "Editar Mesa" : "Cadastrar Nova Mesa"}
                </h2>
                <p className="text-xs text-slate-500">
                  Vincule um garçom para receber os pedidos desta mesa direto no WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Número da Mesa *
                  </label>
                  <input
                    type="text"
                    required
                    value={tableNumber}
                    onChange={(e) => {
                      setTableNumber(e.target.value);
                      if (!editingTableId) {
                        setTableName(`Mesa ${e.target.value}`);
                      }
                    }}
                    placeholder="Ex: 01"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Lugares / Capacidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Identificação da Mesa
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ex: Mesa 01 - Varanda"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Garçom / Profissional Responsável (WhatsApp)
                </label>
                <select
                  value={waiterId}
                  onChange={(e) => setWaiterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">
                    Usar WhatsApp Geral do Restaurante (Fallback)
                  </option>
                  {professionals.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name} ({prof.phone || "Sem telefone"})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Os garçons são gerenciados no menu &quot;Profissionais&quot;.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 px-5 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingTableId ? "Salvar Mesa" : "Criar Mesa & QR Code"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview QR Code */}
      {qrPreviewTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-800">
                {qrPreviewTable.name || `Mesa ${qrPreviewTable.table_number}`}
              </span>
              <button
                type="button"
                onClick={() => setQrPreviewTable(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto inline-block rounded-2xl border-2 border-dashed border-orange-300 bg-white p-4">
              <img
                src={getQrCodeImageUrl(qrPreviewTable.table_number, 260)}
                alt="QR Code da Mesa"
                className="h-56 w-56 object-contain mx-auto"
              />
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Link direto:{" "}
              <strong className="font-mono text-slate-900">
                /{tenantSlug}/mesa/{qrPreviewTable.table_number}
              </strong>
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrintQrCode(qrPreviewTable)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Display</span>
              </button>
              <button
                type="button"
                onClick={() => setQrPreviewTable(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

