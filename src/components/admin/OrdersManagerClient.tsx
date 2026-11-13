"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getAdminOrdersDataAction,
  updateRestaurantOrderStatusAction,
} from "@/services/restaurant.actions";
import type {
  RestaurantOrder,
  RestaurantOrderItem,
  RestaurantOrderStatus,
} from "@/types";
import {
  ClipboardList,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Loader2,
  User,
  StickyNote,
  Volume2,
  VolumeX,
  BellRing,
  Radio,
  RefreshCw,
} from "lucide-react";

interface OrdersManagerClientProps {
  initialOrders: RestaurantOrder[];
  tenantId: string;
}

type OrderFilter = "all" | "pending" | "in_kitchen" | "delivered" | "canceled";

function normalizeOrderClient(row: any): RestaurantOrder {
  let parsedItems: RestaurantOrderItem[] = [];
  if (Array.isArray(row?.items)) {
    parsedItems = row.items;
  } else if (typeof row?.items === "string") {
    try {
      const p = JSON.parse(row.items);
      if (Array.isArray(p)) parsedItems = p;
    } catch {
      parsedItems = [];
    }
  }

  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    table_id: row.table_id || null,
    table_number: String(row.table_number ?? row.table ?? ""),
    customer_name: row.customer_name || row.client_name || "Cliente na Mesa",
    customer_phone: row.customer_phone || row.client_phone || null,
    items: parsedItems.map((it: any) => ({
      id: String(it.id || ""),
      name: String(it.name || "Item"),
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 1),
      notes: it.notes || null,
    })),
    notes: row.notes || row.observations || null,
    total_amount: Number(row.total_amount ?? row.total_price ?? row.total ?? 0),
    status: (row.status as RestaurantOrderStatus) || "pending",
    waiter_id: row.waiter_id || row.professional_id || null,
    waiter_name: row.waiter_name || null,
    waiter_phone: row.waiter_phone || null,
    created_at: row.created_at || new Date().toISOString(),
  };
}

function formatTableLabel(tableNumber?: string | null): string {
  const raw = String(tableNumber || "").trim();
  const lower = raw.toLowerCase();
  if (!raw || raw === "0" || lower === "retirada" || lower === "vitrine" || lower === "delivery") {
    return "Retirada/Vitrine";
  }
  return `Mesa ${raw}`;
}

export function OrdersManagerClient({
  initialOrders,
  tenantId,
}: OrdersManagerClientProps) {
  const [orders, setOrders] = useState<RestaurantOrder[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<OrderFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const getOrCreateAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Campainha limpa de dois tons via Web Audio API (sem dependência de .mp3 externo)
  const playNotificationBell = useCallback(
    (forcePlay = false) => {
      if (!forcePlay && !soundEnabledRef.current) return;
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        const playTone = (
          freq: number,
          startOffset: number,
          duration: number,
          peakGain: number
        ) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + startOffset);

          gain.gain.setValueAtTime(0.001, now + startOffset);
          gain.gain.exponentialRampToValueAtTime(
            peakGain,
            now + startOffset + 0.02
          );
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + startOffset + duration
          );

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + startOffset);
          osc.stop(now + startOffset + duration + 0.02);
        };

        // Dois tons de campainha (Dó#6 -> Mi6) bem nítidos para balcão/cozinha
        playTone(1046.5, 0, 0.22, 0.35);
        playTone(1318.5, 0.16, 0.42, 0.4);
        setAudioUnlocked(true);
      } catch {
        // Autoplay pode estar bloqueado até interação do usuário
      }
    },
    [getOrCreateAudioContext]
  );

  const handleActivateAndTestSound = () => {
    setSoundEnabled(true);
    playNotificationBell(true);
  };

  const handleRefreshOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await getAdminOrdersDataAction();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Assinatura Supabase Realtime em restaurant_orders filtrada por tenant_id
  useEffect(() => {
    if (!tenantId) return;
    const supabase = createClient();

    const channel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "restaurant_orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const incoming = normalizeOrderClient(payload.new);
          setOrders((prev) => {
            if (prev.some((o) => o.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
          setNewOrderIds((prev) => {
            const next = new Set(prev);
            next.add(incoming.id);
            return next;
          });
          playNotificationBell();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "restaurant_orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const updated = normalizeOrderClient(payload.new);
          setOrders((prev) => {
            const exists = prev.some((o) => o.id === updated.id);
            if (!exists) return [updated, ...prev];
            return prev.map((o) => (o.id === updated.id ? updated : o));
          });
          if (updated.status !== "pending") {
            setNewOrderIds((prev) => {
              if (!prev.has(updated.id)) return prev;
              const next = new Set(prev);
              next.delete(updated.id);
              return next;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, playNotificationBell]);

  const normalizeStatus = (
    raw: string
  ): "pending" | "in_kitchen" | "delivered" | "canceled" => {
    const s = String(raw || "").toLowerCase();
    if (s === "canceled" || s === "cancelled") {
      return "canceled";
    }
    if (s === "in_kitchen" || s === "preparing" || s === "kitchen") {
      return "in_kitchen";
    }
    if (s === "delivered" || s === "completed" || s === "done") {
      return "delivered";
    }
    return "pending";
  };

  const handleStatusChange = async (
    orderId: string,
    nextStatus: RestaurantOrderStatus
  ) => {
    setUpdatingId(orderId);
    try {
      const res = await updateRestaurantOrderStatusAction(orderId, nextStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
        setNewOrderIds((prev) => {
          if (!prev.has(orderId)) return prev;
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = orders.filter(
    (o) => normalizeStatus(o.status) === "pending"
  ).length;
  const kitchenCount = orders.filter(
    (o) => normalizeStatus(o.status) === "in_kitchen"
  ).length;
  const deliveredCount = orders.filter(
    (o) => normalizeStatus(o.status) === "delivered"
  ).length;
  const canceledCount = orders.filter(
    (o) => normalizeStatus(o.status) === "canceled"
  ).length;

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return normalizeStatus(order.status) === statusFilter;
  });

  const getWaiterWhatsAppUrl = (order: RestaurantOrder) => {
    const digits = String(order.waiter_phone || "").replace(/\D/g, "");
    const cleanPhone =
      digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
        ? digits.slice(2)
        : digits;

    const itemLines = (order.items || [])
      .map(
        (it) =>
          `- ${it.quantity}x ${it.name} (R$ ${(
            Number(it.price) * Number(it.quantity)
          )
            .toFixed(2)
            .replace(".", ",")})`
      )
      .join("\n");

    const text = [
      `🔔 *Pedido ${formatTableLabel(order.table_number)}*`,
      `Cliente: ${order.customer_name || "Cliente"}`,
      `Itens:`,
      itemLines,
      `Obs: ${order.notes || "Nenhuma"}`,
      `Total: R$ ${Number(order.total_amount || 0).toFixed(2).replace(".", ",")}`,
    ].join("\n");

    const encoded = encodeURIComponent(text);
    return cleanPhone
      ? `https://wa.me/55${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Cabeçalho + Controles de Tempo Real e Som */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-600/20">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Gestão Gastronomia • Monitor de Pedidos</span>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                realtimeStatus === "connected"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                  : realtimeStatus === "error"
                  ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                  : "bg-slate-100 text-slate-600 ring-slate-300"
              }`}
            >
              <Radio
                className={`h-3.5 w-3.5 ${
                  realtimeStatus === "connected" ? "animate-pulse" : ""
                }`}
              />
              <span>
                {realtimeStatus === "connected"
                  ? "Ao Vivo (Tempo Real)"
                  : realtimeStatus === "error"
                  ? "Reconectando..."
                  : "Conectando..."}
              </span>
            </div>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Monitor de Pedidos da Cozinha & Balcão
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Novos pedidos aparecem automaticamente no topo da tela com alerta sonoro, sem precisar recarregar.
          </p>
        </div>

        {/* Barra de Controle Sonoro e Atualização */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={handleRefreshOrders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition cursor-pointer disabled:opacity-60"
            title="Sincronizar pedidos manualmente"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handleActivateAndTestSound}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition cursor-pointer"
          >
            <BellRing className="h-4 w-4" />
            <span>
              {audioUnlocked ? "Testar Som da Campainha" : "Ativar/Testar Som"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playNotificationBell(true);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
              soundEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title={soundEnabled ? "Silenciar alertas" : "Ativar alertas"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-emerald-600" />
                <span>Som Ativo</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-slate-500" />
                <span>Som Mudo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Abas de Filtro por Status */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            statusFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Todos</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            statusFilter === "pending"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Pendentes</span>
          <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px]">
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("in_kitchen")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            statusFilter === "in_kitchen"
              ? "bg-orange-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-orange-50 hover:text-orange-800"
          }`}
        >
          <ChefHat className="h-3.5 w-3.5" />
          <span>Na Cozinha</span>
          <span className="rounded-full bg-orange-100 text-orange-900 px-2 py-0.5 text-[10px]">
            {kitchenCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("delivered")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            statusFilter === "delivered"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Entregues</span>
          <span className="rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px]">
            {deliveredCount}
          </span>
        </button>

        {canceledCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter("canceled")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              statusFilter === "canceled"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-rose-50 hover:text-rose-800"
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Cancelados</span>
            <span className="rounded-full bg-rose-100 text-rose-900 px-2 py-0.5 text-[10px]">
              {canceledCount}
            </span>
          </button>
        )}
      </div>

      {/* Lista de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum pedido neste filtro
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Assim que um cliente escanear o QR Code da mesa ou fizer um pedido na vitrine, ele aparecerá aqui instantaneamente com alerta sonoro.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredOrders.map((order) => {
            const normStatus = normalizeStatus(order.status);
            const isUpdating = updatingId === order.id;
            const isNewOrder = newOrderIds.has(order.id);
            const tableLabel = formatTableLabel(order.table_number);

            return (
              <div
                key={order.id}
                className={`rounded-2xl border bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  isNewOrder
                    ? "border-amber-400 ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/10"
                    : normStatus === "canceled"
                    ? "border-slate-200 opacity-75"
                    : "border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  {/* Topo com Mesa/Retirada, Status, Badge NOVO PEDIDO e Total */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-xl bg-orange-600 px-3.5 py-1.5 text-sm font-black text-white shadow-2xs">
                          {tableLabel}
                        </span>

                        {isNewOrder && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white animate-pulse shadow-sm">
                            <BellRing className="h-3 w-3" />
                            NOVO PEDIDO
                          </span>
                        )}

                        {normStatus === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                            <Clock className="h-3 w-3" />
                            Pendente
                          </span>
                        )}
                        {normStatus === "in_kitchen" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-900">
                            <ChefHat className="h-3 w-3" />
                            Na Cozinha
                          </span>
                        )}
                        {normStatus === "delivered" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                            <CheckCircle2 className="h-3 w-3" />
                            Entregue
                          </span>
                        )}
                        {normStatus === "canceled" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-900">
                            <XCircle className="h-3 w-3" />
                            Cancelado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Cliente:{" "}
                          <strong className="text-slate-900 text-sm">
                            {order.customer_name || "Cliente na Mesa"}
                          </strong>
                        </span>
                        {order.waiter_name && (
                          <span className="text-slate-400">
                            • Garçom:{" "}
                            <strong className="text-teal-700">
                              {order.waiter_name}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xl font-black text-slate-900">
                        R${" "}
                        {Number(order.total_amount || 0)
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                      <p className="text-[11px] font-medium text-slate-400">
                        {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Itens da Comanda */}
                  <div className="space-y-1.5">
                    {(order.items || []).map((it, idx) => (
                      <div
                        key={`${order.id}-item-${idx}`}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                      >
                        <span className="font-semibold text-slate-800">
                          <strong className="text-orange-600 font-black">
                            {it.quantity}x
                          </strong>{" "}
                          {it.name}
                        </span>
                        <span className="font-bold text-slate-700 shrink-0 ml-2">
                          R${" "}
                          {(Number(it.price) * Number(it.quantity))
                            .toFixed(2)
                            .replace(".", ",")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Observações em amarelo */}
                  {order.notes && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-100/80 p-3 text-xs sm:text-sm text-amber-950">
                      <StickyNote className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Observação:</strong> {order.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botões Grandes e Diretos de Status com Um Toque */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {normStatus === "pending" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusChange(order.id, "in_kitchen")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.99] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ChefHat className="h-4 w-4" />
                        )}
                        <span>Aceitar e Enviar p/ Cozinha</span>
                      </button>
                    )}

                    {normStatus === "in_kitchen" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusChange(order.id, "delivered")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <span>Marcar como Entregue</span>
                      </button>
                    )}
                  </div>

                  {/* Ações Secundárias: Cancelar + WhatsApp Garçom */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {(normStatus === "pending" ||
                      normStatus === "in_kitchen") && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order.id, "canceled")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition cursor-pointer disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}

                    <a
                      href={getWaiterWhatsAppUrl(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>WhatsApp Garçom</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
