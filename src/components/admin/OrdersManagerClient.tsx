"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getAdminOrdersDataAction,
  updateRestaurantOrderStatusAction,
  markOrderReviewSentAction,
  deleteRestaurantOrderAction,
  clearCanceledRestaurantOrdersAction,
  closeRestaurantTabAction,
} from "@/services/restaurant.actions";
import {
  groupOpenRestaurantTabs,
  printOpenTabStatement80mm,
  printHtmlReceipt,
  formatTabCurrency,
  type OpenTableTab,
} from "@/utils/restaurant-tabs";
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
  Phone,
  Star,
  Trash2,
  Printer,
  Receipt,
  Maximize2,
  Minimize2,
  Flame,
  Beer,
  CheckSquare,
  Square,
} from "lucide-react";

interface OrdersManagerClientProps {
  initialOrders: RestaurantOrder[];
  tenantId: string;
  tenantName?: string;
  googleReviewUrl?: string | null;
  googlePlaceId?: string | null;
  tenantAddress?: string | null;
  serviceFeeEnabled?: boolean;
  serviceFeePercent?: number;
  menuItemCategories?: Record<string, string>;
}

type OrderFilter =
  | "all"
  | "open_tabs"
  | "pending"
  | "in_kitchen"
  | "delivered"
  | "canceled";

type KdsUrgencyFilter = "all" | "on_time" | "warning" | "late";
type KdsSectorFilter = "all" | "kitchen" | "bar";

const DRINK_CATEGORY_OR_NAME_REGEX =
  /\b(bebida|bebidas|cerveja|chopp|chope|refri|refrigerante|suco|[aá]gua|drink|drinks|caipirinha|vinho|dose|whisky|vodka|gin|lata|600ml|long\s*neck|heineken|skol|brahma|antarctica|amstel|stella|spaten|corona|coca|guaran[aá]|fanta|sprite|energ[eé]tico|red\s*bull|gelo|limonada|h2oh|mate)\b/i;

function classifyItemSector(
  item: RestaurantOrderItem,
  menuItemCategories: Record<string, string>
): "kitchen" | "bar" {
  const cat =
    menuItemCategories[String(item.id || "")] ||
    menuItemCategories[String(item.name || "").trim().toLowerCase()] ||
    "";
  if (cat && DRINK_CATEGORY_OR_NAME_REGEX.test(cat)) {
    return "bar";
  }
  if (DRINK_CATEGORY_OR_NAME_REGEX.test(item.name || "")) {
    return "bar";
  }
  return "kitchen";
}

function getElapsedSeconds(createdAt: string, nowMs: number): number {
  const diff = Math.floor((nowMs - new Date(createdAt).getTime()) / 1000);
  return diff > 0 ? diff : 0;
}

function formatTimerMMSS(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getUrgencyTier(elapsedSeconds: number): "on_time" | "warning" | "late" {
  const mins = elapsedSeconds / 60;
  if (mins >= 20) return "late";
  if (mins >= 10) return "warning";
  return "on_time";
}

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
    review_sent: Boolean(row.review_sent),
    is_paid: Boolean(row.is_paid),
    paid_at: row.paid_at || null,
    is_individual_tab: Boolean(row.is_individual_tab),
    service_fee_included: Boolean(row.service_fee_included),
    service_fee_amount: Number(row.service_fee_amount || 0),
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
  tenantName = "nosso restaurante",
  googleReviewUrl = null,
  googlePlaceId = null,
  tenantAddress = null,
  serviceFeeEnabled = false,
  serviceFeePercent = 10,
  menuItemCategories = {},
}: OrdersManagerClientProps) {
  const [orders, setOrders] = useState<RestaurantOrder[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<OrderFilter>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<KdsUrgencyFilter>("all");
  const [sectorFilter, setSectorFilter] = useState<KdsSectorFilter>("all");
  const [checkedItemsMap, setCheckedItemsMap] = useState<Record<string, boolean>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isClearingCanceled, setIsClearingCanceled] = useState(false);
  const [closingTabKey, setClosingTabKey] = useState<string | null>(null);
  const [tabFeeMap, setTabFeeMap] = useState<Record<string, boolean>>({});
  const [recentlyClosedTab, setRecentlyClosedTab] = useState<{
    title: string;
    customerName: string;
    customerPhone: string | null;
    subtotal: number;
    feeAmount: number;
    finalTotal: number;
    includeFee: boolean;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const knownOrderIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id))
  );

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Cronômetro KDS ao vivo (atualiza a cada segundo)
  useEffect(() => {
    const tick = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  // Sincroniza estado de Tela Cheia (Fullscreen API)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignora se navegador bloquear fullscreen
    }
  };

  const toggleCheckedItem = (orderId: string, itemIdx: number) => {
    const key = `${orderId}:${itemIdx}`;
    setCheckedItemsMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    return audioCtxRef.current;
  }, []);

  // Desbloqueio automático do AudioContext no primeiro clique/toque do usuário na página
  useEffect(() => {
    const unlockAudio = async () => {
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;
      try {
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        if (ctx.state === "running") {
          setAudioUnlocked(true);
        }
      } catch {
        // Ignora caso o navegador ainda bloqueie
      }
    };

    document.addEventListener("click", unlockAudio, { passive: true });
    document.addEventListener("touchstart", unlockAudio, { passive: true });

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, [getOrCreateAudioContext]);

  // Campainha dupla bem audível via Web Audio API (880Hz -> 1174Hz)
  const playNotificationSound = useCallback(
    async (forcePlay = false) => {
      if (!forcePlay && !soundEnabledRef.current) return;
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;

      try {
        if (ctx.state === "suspended") {
          await ctx.resume();
        }

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
            now + startOffset + 0.015
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

        // Sequência dupla bem audível: 880Hz por 0.15s seguido de 1174Hz por 0.25s
        playTone(880, 0, 0.15, 0.45);
        playTone(1174, 0.16, 0.25, 0.5);
        setAudioUnlocked(true);
      } catch {
        // Autoplay pode estar bloqueado até interação do usuário
      }
    },
    [getOrCreateAudioContext]
  );

  const handleActivateAndTestSound = () => {
    setSoundEnabled(true);
    void playNotificationSound(true);
  };

  const syncOrdersFromServer = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await getAdminOrdersDataAction();
      if (res.success && res.data) {
        const freshOrders = res.data;
        const newlyDetectedIds: string[] = [];

        for (const ord of freshOrders) {
          if (!knownOrderIdsRef.current.has(ord.id)) {
            knownOrderIdsRef.current.add(ord.id);
            newlyDetectedIds.push(ord.id);
          }
        }

        setOrders(freshOrders);

        if (newlyDetectedIds.length > 0) {
          setNewOrderIds((prev) => {
            const next = new Set(prev);
            newlyDetectedIds.forEach((id) => next.add(id));
            return next;
          });
          void playNotificationSound();
        }
      }
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [playNotificationSound]);

  const handleRefreshOrders = () => {
    void syncOrdersFromServer(true);
  };

  // Entrega híbrida: Supabase Realtime (sem filtro de coluna) + Polling de segurança (8s)
  useEffect(() => {
    if (!tenantId) return;
    const supabase = createClient();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "restaurant_orders",
        },
        (payload) => {
          if (payload.new && payload.new.tenant_id === tenantId) {
            const incoming = normalizeOrderClient(payload.new);
            const isBrandNew = !knownOrderIdsRef.current.has(incoming.id);
            knownOrderIdsRef.current.add(incoming.id);

            setOrders((prev) => {
              if (prev.some((o) => o.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });

            if (isBrandNew) {
              setNewOrderIds((prev) => {
                const next = new Set(prev);
                next.add(incoming.id);
                return next;
              });
              void playNotificationSound();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "restaurant_orders",
        },
        (payload) => {
          if (payload.new && payload.new.tenant_id === tenantId) {
            const updated = normalizeOrderClient(payload.new);
            knownOrderIdsRef.current.add(updated.id);

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
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("error");
        }
      });

    // Polling de segurança a cada 8 segundos
    const pollingInterval = setInterval(() => {
      void syncOrdersFromServer(false);
    }, 8000);

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
  }, [tenantId, playNotificationSound, syncOrdersFromServer]);

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

  const formatPhoneDisplay = (phone?: string | null): string => {
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone || "";
  };

  const resolveGoogleReviewLink = (): string => {
    if (googleReviewUrl && googleReviewUrl.trim()) {
      return googleReviewUrl.trim();
    }
    if (googlePlaceId && googlePlaceId.trim()) {
      return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(googlePlaceId.trim())}`;
    }
    const q = [tenantName, tenantAddress].filter(Boolean).join(" ").trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "restaurante")}`;
  };

  const handleSendReviewWhatsApp = async (order: RestaurantOrder) => {
    const rawDigits = String(order.customer_phone || "").replace(/\D/g, "");
    if (!rawDigits) return;
    const cleanPhone =
      rawDigits.startsWith("55") && rawDigits.length > 11
        ? rawDigits.slice(2)
        : rawDigits;

    const googleReviewLink = resolveGoogleReviewLink();
    const customerName = order.customer_name || "Cliente";
    const msg = `Olá ${customerName}! Muito obrigado pela preferência hoje no *${tenantName}* 🙏🍻 Esperamos que tenha gostado! Se puder nos dar uma força avaliando nosso atendimento com 5 estrelas no Google, leva só 10 segundos: ${googleReviewLink}`;
    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, review_sent: true } : o))
    );
    await markOrderReviewSentAction(order.id);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Deseja realmente excluir este pedido permanentemente?")) {
      return;
    }

    setUpdatingId(orderId);
    try {
      const res = await deleteRestaurantOrderAction(orderId);
      if (!res.success) {
        alert(res.error || "Não foi possível excluir o pedido.");
        return;
      }

      knownOrderIdsRef.current.delete(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setNewOrderIds((prev) => {
        if (!prev.has(orderId)) return prev;
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCanceledOrders = async () => {
    if (
      !window.confirm(
        "Deseja realmente excluir TODOS os pedidos cancelados permanentemente?"
      )
    ) {
      return;
    }

    setIsClearingCanceled(true);
    try {
      const res = await clearCanceledRestaurantOrdersAction();
      if (!res.success) {
        alert(res.error || "Não foi possível limpar os pedidos cancelados.");
        return;
      }

      setOrders((prev) => {
        const canceledIds = prev
          .filter((o) => String(o.status).toLowerCase() === "canceled")
          .map((o) => o.id);
        canceledIds.forEach((id) => knownOrderIdsRef.current.delete(id));
        return prev.filter((o) => String(o.status).toLowerCase() !== "canceled");
      });
    } finally {
      setIsClearingCanceled(false);
    }
  };

  const handlePrintOrder = (order: RestaurantOrder) => {
    const escapeHtml = (val: string) =>
      String(val || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const rawTable = String(order.table_number || "").trim();
    const lowerTable = rawTable.toLowerCase();
    const tableTitle =
      !rawTable ||
      rawTable === "0" ||
      lowerTable === "balcão" ||
      lowerTable === "balcao" ||
      lowerTable === "retirada" ||
      lowerTable === "vitrine" ||
      lowerTable === "delivery"
        ? "BALCÃO / DELIVERY"
        : `MESA ${rawTable}`;

    const formattedDate = new Date(order.created_at).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const itemsHtml = (order.items || [])
      .map((it) => {
        const subtotal = (Number(it.price || 0) * Number(it.quantity || 1))
          .toFixed(2)
          .replace(".", ",");
        const itemNotesHtml = it.notes
          ? `<div class="item-note">  * ${escapeHtml(it.notes)}</div>`
          : "";
        return `
          <div class="item-row">
            <span class="item-name">${it.quantity}x ${escapeHtml(it.name)}</span>
            <span class="item-price">R$ ${subtotal}</span>
          </div>
          ${itemNotesHtml}
        `;
      })
      .join("");

    const totalFormatted = Number(order.total_amount || 0)
      .toFixed(2)
      .replace(".", ",");

    const phoneHtml = order.customer_phone
      ? `<div>Tel: ${escapeHtml(formatPhoneDisplay(order.customer_phone))}</div>`
      : "";

    const notesHtml = order.notes
      ? `<div class="obs-box"><strong>OBS:</strong> ${escapeHtml(order.notes)}</div>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comanda - ${escapeHtml(tableTitle)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      width: 72mm;
      margin: 0 auto;
      padding: 4px 0;
      color: #000;
      background: #fff;
      font-size: 12px;
      line-height: 1.35;
    }
    .center { text-align: center; }
    .restaurant-name { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
    .date-line { font-size: 11px; margin-bottom: 8px; }
    .table-box {
      border: 1px solid #000;
      padding: 6px;
      margin: 6px 0;
      text-align: center;
    }
    .table-title { font-size: 16px; font-weight: bold; letter-spacing: 0.5px; }
    .customer-info { margin-top: 4px; font-size: 12px; text-align: left; }
    .divider { margin: 8px 0; text-align: center; font-size: 11px; letter-spacing: -0.5px; }
    .item-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 4px; }
    .item-name { flex: 1; font-weight: bold; word-break: break-word; }
    .item-price { white-space: nowrap; font-weight: bold; }
    .item-note { font-size: 11px; margin: -2px 0 4px 6px; }
    .obs-box {
      border: 1px dashed #000;
      padding: 5px;
      margin: 8px 0;
      font-size: 12px;
      word-break: break-word;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: bold;
      margin: 6px 0;
    }
    .footer {
      margin-top: 12px;
      text-align: center;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="restaurant-name">${escapeHtml(tenantName)}</div>
    <div class="date-line">${escapeHtml(formattedDate)}</div>
  </div>

  <div class="table-box">
    <div class="table-title">${escapeHtml(tableTitle)}</div>
    <div class="customer-info">
      <div><strong>Cliente:</strong> ${escapeHtml(order.customer_name || "Cliente na Mesa")}</div>
      ${phoneHtml}
    </div>
  </div>

  <div class="divider">--------------------------------</div>

  <div>
    ${itemsHtml}
  </div>

  ${notesHtml}

  <div class="divider">--------------------------------</div>

  <div class="total-row">
    <span>TOTAL:</span>
    <span>R$ ${totalFormatted}</span>
  </div>

  <div class="footer">EssMendes Local</div>
</body>
</html>`;

    printHtmlReceipt(html);
  };

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

  const openTabs = groupOpenRestaurantTabs(orders);

  // Pedidos ativos na fila KDS (pending + in_kitchen)
  const activeQueueOrders = orders.filter((o) => {
    const st = normalizeStatus(o.status);
    return st === "pending" || st === "in_kitchen";
  });

  const kdsOnTimeCount = activeQueueOrders.filter(
    (o) => getUrgencyTier(getElapsedSeconds(o.created_at, nowMs)) === "on_time"
  ).length;
  const kdsWarningCount = activeQueueOrders.filter(
    (o) => getUrgencyTier(getElapsedSeconds(o.created_at, nowMs)) === "warning"
  ).length;
  const kdsLateCount = activeQueueOrders.filter(
    (o) => getUrgencyTier(getElapsedSeconds(o.created_at, nowMs)) === "late"
  ).length;

  // Fila de Produção Consolidada (soma itens iguais entre todos os pedidos abertos no setor selecionado)
  const batchProductionItems = (() => {
    const map = new Map<
      string,
      { name: string; quantity: number; sector: "kitchen" | "bar" }
    >();
    for (const ord of activeQueueOrders) {
      for (const it of ord.items || []) {
        const sector = classifyItemSector(it, menuItemCategories);
        if (sectorFilter !== "all" && sector !== sectorFilter) continue;
        const key = String(it.name || "Item").trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.quantity += Number(it.quantity || 1);
        } else {
          map.set(key, {
            name: String(it.name || "Item").trim(),
            quantity: Number(it.quantity || 1),
            sector,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  })();

  // Aplica filtro de setor, urgência e ordenação FIFO (mais antigos/urgentes primeiro) nos pedidos ativos
  const displayedKdsOrders = (() => {
    const base = filteredOrders.filter((order) => {
      const st = normalizeStatus(order.status);
      const isActive = st === "pending" || st === "in_kitchen";

      if (urgencyFilter !== "all") {
        if (!isActive) return false;
        const tier = getUrgencyTier(getElapsedSeconds(order.created_at, nowMs));
        if (tier !== urgencyFilter) return false;
      }

      if (sectorFilter !== "all") {
        const hasSectorItem = (order.items || []).some(
          (it) => classifyItemSector(it, menuItemCategories) === sectorFilter
        );
        if (!hasSectorItem) return false;
      }

      return true;
    });

    // FIFO: mais antigos (mais urgentes) primeiro na fila ativa; mais recentes primeiro no histórico (entregues/cancelados)
    const isHistoryTab =
      statusFilter === "delivered" || statusFilter === "canceled";
    return [...base].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return isHistoryTab ? tb - ta : ta - tb;
    });
  })();

  const isTabFeeIncluded = (tabKey: string) =>
    tabFeeMap[tabKey] !== undefined
      ? tabFeeMap[tabKey]
      : Boolean(serviceFeeEnabled);

  const handleCloseTab = async (tab: OpenTableTab) => {
    const includeFee = isTabFeeIncluded(tab.tabKey);
    const feeAmount = includeFee
      ? Number((tab.subtotal * (serviceFeePercent / 100)).toFixed(2))
      : 0;
    const finalTotal = Number((tab.subtotal + feeAmount).toFixed(2));

    const confirmMsg = `Confirmar fechamento de "${tab.title}"?\nSubtotal: ${formatTabCurrency(
      tab.subtotal
    )}\nTaxa (${serviceFeePercent}%): ${
      includeFee ? formatTabCurrency(feeAmount) : "Não cobrada"
    }\nTotal a Receber: ${formatTabCurrency(finalTotal)}`;

    if (!window.confirm(confirmMsg)) return;

    setClosingTabKey(tab.tabKey);
    try {
      const res = await closeRestaurantTabAction({
        orderIds: tab.orderIds,
        serviceFeeIncluded: includeFee,
        serviceFeePercent,
      });

      if (!res.success) {
        alert(res.error || "Não foi possível fechar a conta.");
        return;
      }

      const paidAt = new Date().toISOString();
      const closedSet = new Set(tab.orderIds);
      setOrders((prev) =>
        prev.map((o) =>
          closedSet.has(o.id)
            ? {
                ...o,
                is_paid: true,
                paid_at: paidAt,
                service_fee_included: includeFee,
                service_fee_amount: includeFee
                  ? Number(
                      (
                        Number(o.total_amount || 0) *
                        (serviceFeePercent / 100)
                      ).toFixed(2)
                    )
                  : 0,
              }
            : o
        )
      );

      setRecentlyClosedTab({
        title: tab.title,
        customerName: tab.customerName,
        customerPhone: tab.customerPhone,
        subtotal: tab.subtotal,
        feeAmount,
        finalTotal,
        includeFee,
      });
    } finally {
      setClosingTabKey(null);
    }
  };

  const getClosedTabReceiptWhatsAppUrl = (closed: {
    title: string;
    customerName: string;
    customerPhone: string | null;
    subtotal: number;
    feeAmount: number;
    finalTotal: number;
    includeFee: boolean;
  }) => {
    const rawDigits = String(closed.customerPhone || "").replace(/\D/g, "");
    const cleanPhone =
      rawDigits.startsWith("55") && rawDigits.length > 11
        ? rawDigits.slice(2)
        : rawDigits;
    const googleReviewLink = resolveGoogleReviewLink();
    const msg = [
      `Olá ${closed.customerName}! Muito obrigado pela preferência hoje no *${tenantName}* 🙏🍻`,
      `🧾 *Recibo - ${closed.title}*`,
      `Subtotal: ${formatTabCurrency(closed.subtotal)}`,
      closed.includeFee
        ? `Taxa de Serviço (${serviceFeePercent}%): ${formatTabCurrency(closed.feeAmount)}`
        : `Taxa de Serviço: Não cobrada`,
      `*Total Pago: ${formatTabCurrency(closed.finalTotal)}*`,
      ``,
      `Esperamos que tenha gostado! Se puder nos dar uma força avaliando nosso atendimento com 5 estrelas no Google, leva só 10 segundos: ${googleReviewLink}`,
    ].join("\n");

    return cleanPhone
      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
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
            Painel KDS • Cozinha, Copa & Balcão
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Semáforo de urgência em tempo real, produção consolidada em lote e checklist por item — sem precisar de impressora.
          </p>
        </div>

        {/* Barra de Controle Sonoro, Tela Cheia e Atualização */}
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
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) void playNotificationSound(true);
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
                <span>🔊 Som: Ligado</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-slate-500" />
                <span>Som: Desligado</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleActivateAndTestSound}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
          >
            <BellRing className="h-3.5 w-3.5" />
            <span>{audioUnlocked ? "Testar Bip" : "Liberar Som"}</span>
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-900 hover:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            title="Alternar Modo Tela Cheia (ideal para tablet/monitor na cozinha)"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Sair Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Modo Tela Cheia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barra de Resumo KDS (Semáforo de Urgência Clicável) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            setUrgencyFilter("all");
            if (statusFilter === "open_tabs") setStatusFilter("all");
          }}
          className={`rounded-2xl border p-3.5 text-left transition cursor-pointer ${
            urgencyFilter === "all" && statusFilter !== "open_tabs"
              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-75">
            Total na Fila
          </p>
          <p className="mt-1 text-2xl font-black">{activeQueueOrders.length}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setUrgencyFilter((prev) => (prev === "on_time" ? "all" : "on_time"));
            if (statusFilter === "open_tabs" || statusFilter === "delivered" || statusFilter === "canceled") {
              setStatusFilter("all");
            }
          }}
          className={`rounded-2xl border-2 p-3.5 text-left transition cursor-pointer ${
            urgencyFilter === "on_time"
              ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
              : "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:border-emerald-400"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider">
            🟢 No Prazo (&lt;10m)
          </p>
          <p className="mt-1 text-2xl font-black">{kdsOnTimeCount}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setUrgencyFilter((prev) => (prev === "warning" ? "all" : "warning"));
            if (statusFilter === "open_tabs" || statusFilter === "delivered" || statusFilter === "canceled") {
              setStatusFilter("all");
            }
          }}
          className={`rounded-2xl border-2 p-3.5 text-left transition cursor-pointer ${
            urgencyFilter === "warning"
              ? "border-amber-500 bg-amber-500 text-white shadow-sm"
              : "border-amber-200 bg-amber-50/70 text-amber-900 hover:border-amber-400"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider">
            🟡 Atenção (10-20m)
          </p>
          <p className="mt-1 text-2xl font-black">{kdsWarningCount}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setUrgencyFilter((prev) => (prev === "late" ? "all" : "late"));
            if (statusFilter === "open_tabs" || statusFilter === "delivered" || statusFilter === "canceled") {
              setStatusFilter("all");
            }
          }}
          className={`rounded-2xl border-2 p-3.5 text-left transition cursor-pointer ${
            urgencyFilter === "late"
              ? "border-red-500 bg-red-600 text-white shadow-sm"
              : "border-red-200 bg-red-50/80 text-red-900 hover:border-red-400"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider">
            🔴 Atrasados (&gt;20m)
          </p>
          <p className="mt-1 text-2xl font-black">{kdsLateCount}</p>
        </button>
      </div>

      {/* Filtro por Setor + Faixa de Fila de Produção Consolidada */}
      {statusFilter !== "open_tabs" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-600" />
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                Fila de Produção Consolidada
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSectorFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  sectorFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos os Itens
              </button>
              <button
                type="button"
                onClick={() => setSectorFilter("kitchen")}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  sectorFilter === "kitchen"
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-800 hover:bg-orange-100"
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Cozinha / Chapa</span>
              </button>
              <button
                type="button"
                onClick={() => setSectorFilter("bar")}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  sectorFilter === "bar"
                    ? "bg-sky-600 text-white"
                    : "bg-sky-50 text-sky-800 hover:bg-sky-100"
                }`}
              >
                <Beer className="h-3.5 w-3.5" />
                <span>Copa / Bebidas</span>
              </button>
            </div>
          </div>

          {batchProductionItems.length === 0 ? (
            <p className="text-xs text-slate-500">
              Nenhum item em preparo aberto neste setor no momento.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {batchProductionItems.map((batch) => (
                <div
                  key={`${batch.sector}-${batch.name}`}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                    batch.sector === "bar"
                      ? "border-sky-200 bg-sky-50 text-sky-900"
                      : "border-orange-200 bg-orange-50 text-orange-950"
                  }`}
                >
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-black text-white ${
                      batch.sector === "bar" ? "bg-sky-600" : "bg-orange-600"
                    }`}
                  >
                    {batch.quantity}x
                  </span>
                  <span>{batch.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
          onClick={() => setStatusFilter("open_tabs")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
            statusFilter === "open_tabs"
              ? "bg-teal-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Mesas & Contas Abertas</span>
          <span className="rounded-full bg-teal-100 text-teal-900 px-2 py-0.5 text-[10px]">
            {openTabs.length}
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

      {/* Banner pós-fechamento de conta com Recibo & Avaliação Google */}
      {recentlyClosedTab && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <p className="text-sm font-black text-emerald-900">
              ✅ Conta fechada: {recentlyClosedTab.title} (
              {formatTabCurrency(recentlyClosedTab.finalTotal)})
            </p>
            <p className="text-xs text-emerald-800">
              Envie o recibo consolidado e peça a avaliação 5 estrelas no Google em 1 clique.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={getClosedTabReceiptWhatsAppUrl(recentlyClosedTab)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition"
            >
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              <span>Enviar Recibo & Pedir Avaliação Google ⭐</span>
            </a>
            <button
              type="button"
              onClick={() => setRecentlyClosedTab(null)}
              className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Ação de Limpeza em Massa na Aba Cancelados */}
      {statusFilter === "canceled" && canceledCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3">
          <p className="text-xs font-semibold text-red-700">
            Exibindo {canceledCount}{" "}
            {canceledCount === 1 ? "pedido cancelado" : "pedidos cancelados"}.
          </p>
          <button
            type="button"
            disabled={isClearingCanceled}
            onClick={handleClearCanceledOrders}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3.5 py-2 text-xs font-bold transition cursor-pointer disabled:opacity-60"
          >
            {isClearingCanceled ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Limpar Todos os Cancelados</span>
          </button>
        </div>
      )}

      {/* Visão: Mesas & Contas Abertas */}
      {statusFilter === "open_tabs" ? (
        openTabs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
            <Receipt className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">
              Nenhuma mesa ou comanda em aberto
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Todos os pedidos ativos já foram pagos ou não há consumo aberto no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {openTabs.map((tab) => {
              const includeFee = isTabFeeIncluded(tab.tabKey);
              const feeAmount = includeFee
                ? Number((tab.subtotal * (serviceFeePercent / 100)).toFixed(2))
                : 0;
              const finalTotal = Number((tab.subtotal + feeAmount).toFixed(2));
              const isClosing = closingTabKey === tab.tabKey;

              return (
                <div
                  key={tab.tabKey}
                  className="rounded-2xl border border-teal-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-xl px-3 py-1 text-xs font-black text-white ${
                              tab.isIndividualTab
                                ? "bg-indigo-600"
                                : "bg-teal-700"
                            }`}
                          >
                            {tab.title}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                            {tab.roundsCount}{" "}
                            {tab.roundsCount === 1 ? "rodada" : "rodadas"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            Responsável:{" "}
                            <strong className="text-slate-900">
                              {tab.customerName}
                            </strong>
                          </span>
                          {tab.customerPhone && (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                              • <Phone className="h-3 w-3 text-emerald-600" />
                              {formatPhoneDisplay(tab.customerPhone)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Itens consolidados de todas as rodadas */}
                    <div className="space-y-1.5">
                      {tab.consolidatedItems.map((it) => (
                        <div
                          key={`${tab.tabKey}-${it.key}`}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs sm:text-sm"
                        >
                          <span className="font-semibold text-slate-800">
                            <strong className="text-teal-700 font-black">
                              {it.quantity}x
                            </strong>{" "}
                            {it.name}
                          </span>
                          <span className="font-bold text-slate-700 shrink-0 ml-2">
                            {formatTabCurrency(it.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal + Checkbox Taxa de Serviço + Total Final */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Subtotal dos Itens</span>
                        <span className="font-bold text-slate-900">
                          {formatTabCurrency(tab.subtotal)}
                        </span>
                      </div>

                      <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer select-none">
                        <span className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeFee}
                            onChange={(e) =>
                              setTabFeeMap((prev) => ({
                                ...prev,
                                [tab.tabKey]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="font-semibold">
                            Incluir Taxa de Serviço ({serviceFeePercent}%)
                          </span>
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatTabCurrency(feeAmount)}
                        </span>
                      </label>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                        <span className="text-xs font-extrabold uppercase text-slate-700">
                          Total Final a Receber
                        </span>
                        <span className="text-lg font-black text-emerald-700">
                          {formatTabCurrency(finalTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações: Imprimir Extrato 80mm + Fechar Conta & Receber */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        printOpenTabStatement80mm({
                          tenantName,
                          tab,
                          includeServiceFee: includeFee,
                          serviceFeePercent,
                        })
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 px-3.5 py-2.5 text-xs font-bold text-zinc-700 transition cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Imprimir Extrato da Conta (80mm)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isClosing}
                      onClick={() => handleCloseTab(tab)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                    >
                      {isClosing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>Fechar Conta & Receber</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>
      {/* Lista de Pedidos KDS (Ordenação FIFO: mais antigos/urgentes primeiro) */}
      {displayedKdsOrders.length === 0 ? (
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
          {displayedKdsOrders.map((order) => {
            const normStatus = normalizeStatus(order.status);
            const isActiveKds =
              normStatus === "pending" || normStatus === "in_kitchen";
            const isUpdating = updatingId === order.id;
            const isNewOrder = newOrderIds.has(order.id);
            const tableLabel = formatTableLabel(order.table_number);
            const elapsedSec = getElapsedSeconds(order.created_at, nowMs);
            const urgencyTier = getUrgencyTier(elapsedSec);

            const cardBorderClass = !isActiveKds
              ? normStatus === "canceled"
                ? "border-slate-200 opacity-75"
                : "border-slate-200"
              : urgencyTier === "late"
              ? "border-2 border-red-500 ring-2 ring-red-500/20 shadow-md"
              : urgencyTier === "warning"
              ? "border-2 border-amber-500 shadow-sm"
              : "border-2 border-emerald-500 shadow-xs";

            const headerTintClass = !isActiveKds
              ? "border-slate-100"
              : urgencyTier === "late"
              ? "border-red-200 bg-red-50/70 -mx-5 -mt-5 px-5 pt-4 pb-3 rounded-t-2xl"
              : urgencyTier === "warning"
              ? "border-amber-200 bg-amber-50/70 -mx-5 -mt-5 px-5 pt-4 pb-3 rounded-t-2xl"
              : "border-emerald-200 bg-emerald-50/60 -mx-5 -mt-5 px-5 pt-4 pb-3 rounded-t-2xl";

            const timerBadgeClass =
              urgencyTier === "late"
                ? "bg-red-600 text-white animate-pulse"
                : urgencyTier === "warning"
                ? "bg-amber-500 text-white"
                : "bg-emerald-600 text-white";

            const visibleItems = (order.items || []).filter(
              (it) =>
                sectorFilter === "all" ||
                classifyItemSector(it, menuItemCategories) === sectorFilter
            );

            return (
              <div
                key={order.id}
                className={`rounded-2xl border bg-white p-5 flex flex-col justify-between space-y-4 transition-all ${cardBorderClass}`}
              >
                <div className="space-y-3">
                  {/* Topo com Mesa/Retirada, Cronômetro KDS MM:SS, Status e Total */}
                  <div
                    className={`flex items-start justify-between gap-2 border-b pb-3 ${headerTintClass}`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-sm font-black text-white shadow-2xs">
                          {tableLabel}
                        </span>

                        {isActiveKds && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black font-mono shadow-2xs ${timerBadgeClass}`}
                            title={
                              urgencyTier === "late"
                                ? "Atrasado (>20 min) — Prioridade Máxima"
                                : urgencyTier === "warning"
                                ? "Atenção (10-20 min)"
                                : "No Prazo (<10 min)"
                            }
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatTimerMMSS(elapsedSec)}</span>
                          </span>
                        )}

                        {isNewOrder && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white animate-pulse shadow-sm">
                            <BellRing className="h-3 w-3" />
                            NOVO
                          </span>
                        )}

                        {order.is_individual_tab && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                            Comanda Individual: {order.customer_name || "Cliente"}
                          </span>
                        )}

                        {normStatus === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                            <Clock className="h-3 w-3" />
                            Novo
                          </span>
                        )}
                        {normStatus === "in_kitchen" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-900">
                            <ChefHat className="h-3 w-3" />
                            Em Preparo
                          </span>
                        )}
                        {normStatus === "delivered" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                            <CheckCircle2 className="h-3 w-3" />
                            Pronto / Entregue
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
                        {order.customer_phone && (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                            • <Phone className="h-3 w-3 text-emerald-600" />
                            {formatPhoneDisplay(order.customer_phone)}
                          </span>
                        )}
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
                      <span className="text-lg font-black text-slate-900">
                        R${" "}
                        {Number(order.total_amount || 0)
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                      <p className="text-[11px] font-medium text-slate-500">
                        {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Checklist Interativo de Itens da Comanda (toque para riscar) */}
                  <div className="space-y-1.5">
                    {visibleItems.map((it, idx) => {
                      const checkKey = `${order.id}:${idx}`;
                      const isChecked = Boolean(checkedItemsMap[checkKey]);
                      const itemSector = classifyItemSector(
                        it,
                        menuItemCategories
                      );

                      return (
                        <button
                          key={`${order.id}-item-${idx}`}
                          type="button"
                          onClick={() => toggleCheckedItem(order.id, idx)}
                          className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm transition cursor-pointer border ${
                            isChecked
                              ? "bg-emerald-50/70 border-emerald-200 text-slate-400 line-through"
                              : "bg-slate-50 border-slate-200/70 hover:bg-slate-100 text-slate-900"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0 font-semibold">
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <strong
                              className={`font-black shrink-0 ${
                                isChecked
                                  ? "text-emerald-600"
                                  : itemSector === "bar"
                                  ? "text-sky-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {it.quantity}x
                            </strong>
                            <span className="truncate">{it.name}</span>
                          </span>

                          <span className="font-bold text-slate-600 shrink-0 text-xs">
                            R${" "}
                            {(Number(it.price) * Number(it.quantity))
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Observações em destaque */}
                  {order.notes && (
                    <div className="flex items-start gap-2 rounded-xl border-2 border-amber-400 bg-amber-100 p-3 text-xs sm:text-sm font-semibold text-amber-950 shadow-2xs">
                      <StickyNote className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>OBS:</strong> {order.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botões Grandes (mín. 48px) de Ação Rápida KDS */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {normStatus === "pending" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusChange(order.id, "in_kitchen")
                        }
                        className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.99] px-4 py-3 text-sm font-black text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Flame className="h-4 w-4" />
                        )}
                        <span>🔥 Iniciar Preparo</span>
                      </button>
                    )}

                    {normStatus === "in_kitchen" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusChange(order.id, "delivered")
                        }
                        className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] px-4 py-3 text-sm font-black text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <span>✅ Pronto para Entrega</span>
                      </button>
                    )}
                  </div>

                  {/* Pós-venda: Agradecer & Pedir Avaliação Google */}
                  {order.customer_phone && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendReviewWhatsApp(order)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-sm transition cursor-pointer"
                      >
                        <Star className="h-4 w-4 fill-amber-300 text-amber-300 shrink-0" />
                        <span>Agradecer & Pedir Avaliação Google ⭐</span>
                      </button>
                      {order.review_sent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                          Avaliação Solicitada ✓
                        </span>
                      )}
                    </div>
                  )}

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

                    <div className="ml-auto flex items-center gap-1.5">
                      <a
                        href={getWaiterWhatsAppUrl(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>WhatsApp Garçom</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handlePrintOrder(order)}
                        title="Imprimir Comanda (80mm)"
                        aria-label="Imprimir Comanda (80mm)"
                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer"
                      >
                        <Printer className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Excluir Pedido"
                        aria-label="Excluir Pedido"
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
