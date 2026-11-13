"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getWaiterTerminalDataAction,
  verifyWaiterPinAction,
  confirmWaiterOrderAction,
  updateWaiterOrderItemsAction,
  toggleWaiterOrderItemDeliveredAction,
  completeWaiterOrderDeliveryAction,
} from "@/services/restaurant.actions";
import type {
  RestaurantTable,
  RestaurantOrder,
  RestaurantOrderItem,
  MenuItem,
} from "@/types";
import {
  UtensilsCrossed,
  KeyRound,
  LogOut,
  BellRing,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  ChefHat,
  CheckCircle2,
  Edit3,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  StickyNote,
  User,
  Check,
  Loader2,
  AlertCircle,
  Radio,
} from "lucide-react";

export interface WaiterSummary {
  id: string;
  name: string;
  phone?: string | null;
  role_title?: string | null;
  has_pin: boolean;
}

interface WaiterTerminalClientProps {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  logoUrl?: string | null;
  waiters: WaiterSummary[];
  initialTables: RestaurantTable[];
  initialOrders: RestaurantOrder[];
  menuItems: MenuItem[];
}

function normalizeTableMatch(a?: string | null, b?: string | null): boolean {
  const s1 = String(a || "").trim().toLowerCase().replace(/^0+/, "");
  const s2 = String(b || "").trim().toLowerCase().replace(/^0+/, "");
  if (!s1 || !s2) return false;
  return s1 === s2;
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
    table_number: String(row.table_number ?? row.table ?? "01"),
    customer_name: row.customer_name || row.client_name || "Cliente na Mesa",
    customer_phone: row.customer_phone || row.client_phone || null,
    items: parsedItems.map((it: any) => ({
      id: String(it.id || ""),
      name: String(it.name || "Item"),
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 1),
      notes: it.notes || null,
      delivered: Boolean(it.delivered),
    })),
    notes: row.notes || row.observations || null,
    total_amount: Number(row.total_amount ?? row.total_price ?? row.total ?? 0),
    status: row.status || "pending",
    waiter_id: row.waiter_id || row.professional_id || null,
    waiter_name: row.waiter_name || null,
    waiter_phone: row.waiter_phone || null,
    confirmed_at: row.confirmed_at || null,
    delivered_at: row.delivered_at || null,
    created_at: row.created_at || new Date().toISOString(),
  };
}

function OrderTimer({
  createdAt,
  status,
}: {
  createdAt: string;
  status: string;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (status === "delivered" || status === "canceled") return;

    const updateTimer = () => {
      const diff = Math.floor(
        (Date.now() - new Date(createdAt).getTime()) / 1000
      );
      setElapsedSeconds(Math.max(0, diff));
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [createdAt, status]);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;

  let badgeClass =
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (mins >= 20) {
    badgeClass =
      "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse";
  } else if (mins >= 10) {
    badgeClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-extrabold ${badgeClass}`}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{formatted}</span>
    </span>
  );
}

export function WaiterTerminalClient({
  tenantId,
  tenantName,
  logoUrl,
  waiters,
  initialTables,
  initialOrders,
  menuItems,
}: WaiterTerminalClientProps) {
  const storageKey = `essmendes_waiter_session_${tenantId}`;

  // Sessão do Garçom
  const [loggedWaiter, setLoggedWaiter] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Login Form
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>(
    waiters[0]?.id || ""
  );
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dados Operacionais
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [orders, setOrders] = useState<RestaurantOrder[]>(initialOrders);
  const [availableMenuItems, setAvailableMenuItems] =
    useState<MenuItem[]>(menuItems);

  // Filtros e UI
  const [tableScope, setTableScope] = useState<"mine" | "all">("mine");
  const [selectedTableFilter, setSelectedTableFilter] = useState<string | null>(
    null
  );
  const [statusTab, setStatusTab] = useState<"active" | "delivered">("active");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  // Áudio & Realtime
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const knownOrderIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id))
  );

  // Modal de Edição de Itens do Pedido
  const [editingOrder, setEditingOrder] = useState<RestaurantOrder | null>(
    null
  );
  const [editItems, setEditItems] = useState<RestaurantOrderItem[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Restaurar sessão do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id && parsed?.name) {
          const stillExists = waiters.some((w) => w.id === parsed.id);
          if (stillExists) {
            setLoggedWaiter({ id: parsed.id, name: parsed.name });
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch {
      // Ignora erro de localStorage
    } finally {
      setSessionChecked(true);
    }
  }, [storageKey, waiters]);

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

  // Desbloqueio automático do AudioContext no primeiro toque/clique
  useEffect(() => {
    const unlock = async () => {
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;
      try {
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        if (ctx.state === "running") {
          setAudioUnlocked(true);
        }
      } catch {}
    };

    document.addEventListener("click", unlock, { passive: true });
    document.addEventListener("touchstart", unlock, { passive: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, [getOrCreateAudioContext]);

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
          offset: number,
          duration: number,
          peak: number
        ) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.001, now + offset);
          gain.gain.exponentialRampToValueAtTime(peak, now + offset + 0.015);
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + offset + duration
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + duration + 0.02);
        };

        playTone(880, 0, 0.15, 0.45);
        playTone(1174, 0.16, 0.25, 0.5);
        setAudioUnlocked(true);
      } catch {}
    },
    [getOrCreateAudioContext]
  );

  // Mesas vinculadas ao garçom logado
  const myTables = useMemo(() => {
    if (!loggedWaiter) return [];
    return tables.filter(
      (t) => (t.assigned_staff_id || t.waiter_id) === loggedWaiter.id
    );
  }, [tables, loggedWaiter]);

  const myTableNumbersSet = useMemo(() => {
    return new Set(
      myTables.map((t) =>
        String(t.table_number || "").trim().toLowerCase().replace(/^0+/, "")
      )
    );
  }, [myTables]);

  const isOrderRelevantToWaiter = useCallback(
    (order: RestaurantOrder) => {
      if (!loggedWaiter) return false;
      if (tableScope === "all") return true;
      if (order.waiter_id === loggedWaiter.id) return true;
      const normNum = String(order.table_number || "")
        .trim()
        .toLowerCase()
        .replace(/^0+/, "");
      return myTableNumbersSet.has(normNum);
    },
    [loggedWaiter, tableScope, myTableNumbersSet]
  );

  const syncFromServer = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const res = await getWaiterTerminalDataAction(tenantId);
        if (res.success && res.data) {
          setTables(res.data.tables);
          setAvailableMenuItems(res.data.menuItems);

          const freshOrders = res.data.orders;
          const newlyDetected: RestaurantOrder[] = [];
          for (const ord of freshOrders) {
            if (!knownOrderIdsRef.current.has(ord.id)) {
              knownOrderIdsRef.current.add(ord.id);
              newlyDetected.push(ord);
            }
          }

          setOrders(freshOrders);

          if (newlyDetected.length > 0) {
            setNewOrderIds((prev) => {
              const next = new Set(prev);
              newlyDetected.forEach((o) => next.add(o.id));
              return next;
            });
            const hasRelevant = newlyDetected.some((o) =>
              isOrderRelevantToWaiter(o)
            );
            if (hasRelevant || tableScope === "all" || myTables.length === 0) {
              void playNotificationSound();
            }
          }
        }
      } finally {
        if (isManual) setIsRefreshing(false);
      }
    },
    [
      tenantId,
      isOrderRelevantToWaiter,
      tableScope,
      myTables.length,
      playNotificationSound,
    ]
  );

  // Entrega híbrida: Supabase Realtime sem filtro + Polling 8s
  useEffect(() => {
    if (!loggedWaiter) return;
    const supabase = createClient();

    const channel = supabase
      .channel("waiter-orders-realtime")
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
              if (
                isOrderRelevantToWaiter(incoming) ||
                myTables.length === 0
              ) {
                void playNotificationSound();
              }
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
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    const interval = setInterval(() => {
      void syncFromServer(false);
    }, 8000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [
    loggedWaiter,
    tenantId,
    isOrderRelevantToWaiter,
    myTables.length,
    playNotificationSound,
    syncFromServer,
  ]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!selectedWaiterId) {
      setLoginError("Selecione seu nome para entrar.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await verifyWaiterPinAction(
        tenantId,
        selectedWaiterId,
        pinInput
      );
      if (res.success && res.waiter) {
        const sessionObj = {
          id: res.waiter.id,
          name: res.waiter.name,
        };
        localStorage.setItem(storageKey, JSON.stringify(sessionObj));
        setLoggedWaiter(sessionObj);
        setPinInput("");
        void playNotificationSound(true);
      } else {
        setLoginError(res.error || "Falha ao autenticar.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    setLoggedWaiter(null);
    setSelectedTableFilter(null);
  };

  // Ações sobre os pedidos
  const handleConfirmOrder = async (order: RestaurantOrder) => {
    if (!loggedWaiter) return;
    setBusyOrderId(order.id);
    try {
      const res = await confirmWaiterOrderAction(
        tenantId,
        order.id,
        loggedWaiter.id,
        loggedWaiter.name
      );
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? res.data! : o))
        );
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(order.id);
          return next;
        });
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleToggleItemDelivered = async (
    order: RestaurantOrder,
    itemIndex: number
  ) => {
    setBusyOrderId(order.id);
    try {
      const res = await toggleWaiterOrderItemDeliveredAction(
        tenantId,
        order.id,
        itemIndex
      );
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? res.data! : o))
        );
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCompleteDelivery = async (order: RestaurantOrder) => {
    if (!loggedWaiter) return;
    setBusyOrderId(order.id);
    try {
      const res = await completeWaiterOrderDeliveryAction(
        tenantId,
        order.id,
        loggedWaiter.id
      );
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? res.data! : o))
        );
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  const openEditModal = (order: RestaurantOrder) => {
    setEditingOrder(order);
    setEditItems(order.items.map((it) => ({ ...it })));
    setEditNotes(order.notes || "");
    setMenuSearch("");
    setEditError(null);
  };

  const handleSaveOrderEdits = async () => {
    if (!editingOrder) return;
    if (editItems.length === 0) {
      setEditError("O pedido precisa ter pelo menos 1 item.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      const res = await updateWaiterOrderItemsAction(
        tenantId,
        editingOrder.id,
        editItems,
        editNotes
      );
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === editingOrder.id ? res.data! : o))
        );
        setEditingOrder(null);
      } else {
        setEditError(res.error || "Erro ao salvar alterações.");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const displayedTables = useMemo(() => {
    if (tableScope === "all" || myTables.length === 0) return tables;
    return myTables;
  }, [tableScope, tables, myTables]);

  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== "delivered" && o.status !== "canceled"
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusTab === "active") {
        if (order.status === "delivered" || order.status === "canceled")
          return false;
      } else {
        if (order.status !== "delivered") return false;
      }

      if (selectedTableFilter) {
        return normalizeTableMatch(order.table_number, selectedTableFilter);
      }

      if (tableScope === "mine" && myTables.length > 0) {
        return isOrderRelevantToWaiter(order);
      }

      return true;
    });
  }, [
    orders,
    statusTab,
    selectedTableFilter,
    tableScope,
    myTables.length,
    isOrderRelevantToWaiter,
  ]);

  const filteredMenuSearch = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    if (!q) return availableMenuItems.slice(0, 12);
    return availableMenuItems
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.category || "").toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [availableMenuItems, menuSearch]);

  const selectedWaiterObj = waiters.find((w) => w.id === selectedWaiterId);

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
      </div>
    );
  }

  // ============================================================================
  // TELA DE LOGIN RÁPIDO (MOBILE-FIRST)
  // ============================================================================
  if (!loggedWaiter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0d0d0f] text-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
          <div className="text-center space-y-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={tenantName}
                className="mx-auto h-16 w-16 rounded-2xl object-cover border border-zinc-700 shadow-md"
              />
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-zinc-950 shadow-lg">
                <UtensilsCrossed className="h-8 w-8" />
              </div>
            )}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Terminal Mobile do Garçom
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
                {tenantName}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Selecione seu nome e informe seu PIN para iniciar o turno.
              </p>
            </div>
          </div>

          {waiters.length === 0 ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-xs text-amber-200 space-y-1">
              <p className="font-bold">Nenhum garçom ativo cadastrado.</p>
              <p className="text-amber-300/80">
                Peça ao gerente para cadastrar os atendentes no menu Equipe / Profissionais do painel.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs font-semibold text-red-300">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300">
                  Seu Nome (Atendente / Garçom)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
                  <select
                    value={selectedWaiterId}
                    onChange={(e) => {
                      setSelectedWaiterId(e.target.value);
                      setLoginError(null);
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-4 text-sm font-bold text-white focus:border-amber-500 focus:outline-none"
                  >
                    {waiters.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                        {w.role_title ? ` (${w.role_title})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedWaiterObj?.has_pin && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300">
                    PIN de Acesso (4 dígitos)
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-amber-400" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={pinInput}
                      onChange={(e) =>
                        setPinInput(
                          e.target.value.replace(/\D/g, "").slice(0, 4)
                        )
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-4 font-mono text-lg font-black tracking-[0.4em] text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] py-3.5 text-sm font-black text-zinc-950 shadow-lg transition cursor-pointer disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                <span>Entrar no Turno</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // PAINEL OPERACIONAL DO GARÇOM (MOBILE-FIRST)
  // ============================================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0d0d0f] text-zinc-100 pb-24">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={tenantName}
                className="h-9 w-9 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-zinc-950 shrink-0">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-black text-white">
                  {loggedWaiter.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    realtimeConnected
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Radio
                    className={`h-2.5 w-2.5 ${
                      realtimeConnected ? "animate-pulse" : ""
                    }`}
                  />
                  Ao Vivo
                </span>
              </div>
              <p className="truncate text-[11px] text-zinc-400">{tenantName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => void syncFromServer(true)}
              disabled={isRefreshing}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              title="Atualizar agora"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) void playNotificationSound(true);
              }}
              className={`rounded-xl border p-2.5 cursor-pointer transition ${
                soundEnabled
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500"
              }`}
              title={soundEnabled ? "Som Ativo" : "Som Mudo"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 cursor-pointer"
              title="Trocar Garçom / Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Banner para liberar som se ainda não interagiu */}
        {!audioUnlocked && soundEnabled && (
          <div className="bg-amber-500/15 border-t border-amber-500/30 px-4 py-2 text-center">
            <button
              type="button"
              onClick={() => void playNotificationSound(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 cursor-pointer"
            >
              <BellRing className="h-3.5 w-3.5 animate-bounce" />
              <span>Toque aqui para ativar o alerta sonoro de novos pedidos</span>
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5 space-y-6">
        {/* Seletor de Escopo: Minhas Mesas vs Todas as Mesas */}
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1.5">
          <button
            type="button"
            onClick={() => {
              setTableScope("mine");
              setSelectedTableFilter(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition cursor-pointer ${
              tableScope === "mine"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Minhas Mesas ({myTables.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTableScope("all");
              setSelectedTableFilter(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition cursor-pointer ${
              tableScope === "all"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Todas as Mesas ({tables.length})
          </button>
        </div>

        {/* Painel Compacto das Mesas */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
              Mapa Rápido de Mesas
            </h2>
            {selectedTableFilter && (
              <button
                type="button"
                onClick={() => setSelectedTableFilter(null)}
                className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
              >
                Mostrar todas
              </button>
            )}
          </div>

          {displayedTables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-4 text-center text-xs text-zinc-400">
              Nenhuma mesa vinculada exclusivamente a você no momento. Alterne para{" "}
              <strong className="text-amber-400">Todas as Mesas</strong> acima se precisar cobrir um colega.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {displayedTables.map((table) => {
                const tableActiveOrders = activeOrders.filter((o) =>
                  normalizeTableMatch(o.table_number, table.table_number)
                );
                const hasPending = tableActiveOrders.some(
                  (o) => o.status === "pending"
                );
                const hasActive = tableActiveOrders.length > 0;
                const isSelected = normalizeTableMatch(
                  selectedTableFilter,
                  table.table_number
                );

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() =>
                      setSelectedTableFilter(
                        isSelected ? null : table.table_number
                      )
                    }
                    className={`rounded-2xl border p-3 text-left transition active:scale-95 cursor-pointer ${
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-400/50 bg-zinc-800"
                        : hasPending
                        ? "border-red-500/50 bg-red-950/30"
                        : hasActive
                        ? "border-amber-500/40 bg-amber-950/25"
                        : "border-zinc-800 bg-zinc-900/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">
                        #{table.table_number}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          hasPending
                            ? "bg-red-500 animate-ping"
                            : hasActive
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                        }`}
                      />
                    </div>
                    <p className="mt-1 truncate text-[11px] font-semibold text-zinc-300">
                      {hasActive
                        ? `${tableActiveOrders.length} pedido(s)`
                        : "Livre"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Abas de Pedidos: Em Atendimento vs Entregues */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusTab("active")}
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
                  statusTab === "active"
                    ? "bg-zinc-100 text-zinc-950"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                Ativos ({activeOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab("delivered")}
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
                  statusTab === "delivered"
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                Entregues
              </button>
            </div>
          </div>

          {/* Lista de Cards de Pedidos */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center space-y-2">
              <ChefHat className="mx-auto h-9 w-9 text-zinc-600" />
              <p className="text-sm font-bold text-zinc-300">
                Nenhum pedido {statusTab === "active" ? "ativo" : "entregue"}{" "}
                no momento
              </p>
              <p className="text-xs text-zinc-500">
                Novos pedidos das mesas tocarão automaticamente aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isBusy = busyOrderId === order.id;
                const isNew = newOrderIds.has(order.id);
                const isPending = order.status === "pending";
                const isInKitchen = order.status === "in_kitchen";
                const deliveredCount = order.items.filter(
                  (it) => it.delivered
                ).length;

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border bg-[#1f1f23]/90 p-4 sm:p-5 shadow-xl space-y-4 transition ${
                      isNew
                        ? "border-amber-400 ring-2 ring-amber-400/50"
                        : isPending
                        ? "border-amber-500/40"
                        : "border-zinc-800"
                    }`}
                  >
                    {/* Topo do Card: Mesa, Cronômetro, Status e Total */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl bg-amber-500 px-3 py-1 text-sm font-black text-zinc-950">
                            Mesa {order.table_number}
                          </span>

                          <OrderTimer
                            createdAt={order.created_at}
                            status={order.status}
                          />

                          {isNew && (
                            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white animate-pulse">
                              NOVO
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-300 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-zinc-500" />
                          <strong className="text-white">
                            {order.customer_name || "Cliente na Mesa"}
                          </strong>
                          <span className="text-zinc-500">
                            •{" "}
                            {isPending
                              ? "Aguardando confirmação"
                              : isInKitchen
                              ? "Na Cozinha"
                              : "Entregue"}
                          </span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-amber-400">
                          R${" "}
                          {Number(order.total_amount || 0)
                            .toFixed(2)
                            .replace(".", ",")}
                        </span>
                        <p className="text-[11px] text-zinc-500">
                          {deliveredCount}/{order.items.length} entregues
                        </p>
                      </div>
                    </div>

                    {/* Lista de Itens com Baixa Individual */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Toque no item para marcar entregue na mesa:
                      </p>
                      {order.items.map((item, idx) => {
                        const isItemDelivered = Boolean(item.delivered);
                        return (
                          <button
                            key={`${order.id}-it-${idx}`}
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleToggleItemDelivered(order, idx)
                            }
                            className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition cursor-pointer ${
                              isItemDelivered
                                ? "border-emerald-500/30 bg-emerald-950/30 opacity-75"
                                : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                                  isItemDelivered
                                    ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                                    : "border-zinc-700 bg-zinc-900 text-transparent"
                                }`}
                              >
                                <Check className="h-4 w-4 stroke-[3]" />
                              </span>
                              <span
                                className={`text-sm font-semibold truncate ${
                                  isItemDelivered
                                    ? "line-through text-zinc-400"
                                    : "text-zinc-100"
                                }`}
                              >
                                <strong className="text-amber-400 font-black">
                                  {item.quantity}x
                                </strong>{" "}
                                {item.name}
                              </span>
                            </div>

                            <span className="text-xs font-bold text-zinc-400 shrink-0">
                              R${" "}
                              {(Number(item.price) * Number(item.quantity))
                                .toFixed(2)
                                .replace(".", ",")}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Observações */}
                    {order.notes && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                        <StickyNote className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Obs:</strong> {order.notes}
                        </span>
                      </div>
                    )}

                    {/* Botões de Ação do Garçom */}
                    {order.status !== "delivered" &&
                      order.status !== "canceled" && (
                        <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                          {isPending && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleConfirmOrder(order)}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] py-3.5 text-sm font-black text-zinc-950 shadow-md transition cursor-pointer disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ChefHat className="h-4 w-4" />
                              )}
                              <span>Confirmar & Enviar p/ Cozinha</span>
                            </button>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => openEditModal(order)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-bold text-zinc-200 transition cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                              <span>Editar Itens</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleCompleteDelivery(order)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-extrabold text-white transition cursor-pointer disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              <span>Concluir Entrega da Mesa</span>
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ===================================================================== */}
      {/* MODAL / DRAWER DE EDIÇÃO DE ITENS DO PEDIDO */}
      {/* ===================================================================== */}
      {editingOrder && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h3 className="text-base font-black text-white">
                  Editar Pedido • Mesa {editingOrder.table_number}
                </h3>
                <p className="text-xs text-zinc-400">
                  Adicione, remova ou ajuste quantidades e observações.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo Scrollável */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {editError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs font-semibold text-red-300">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Itens Atuais */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Itens da Comanda
                </span>
                {editItems.map((it, idx) => (
                  <div
                    key={`edit-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {it.name}
                      </p>
                      <p className="text-xs text-amber-400 font-semibold">
                        R$ {Number(it.price).toFixed(2).replace(".", ",")} un.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditItems((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    quantity: Math.max(1, item.quantity - 1),
                                  }
                                : item
                            )
                          );
                        }}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span className="w-7 text-center text-sm font-black text-white">
                        {it.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setEditItems((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                            )
                          );
                        }}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditItems((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="ml-1 rounded-lg border border-red-500/30 bg-red-950/40 p-1.5 text-red-400 hover:bg-red-900/50 cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar Novo Item do Cardápio */}
              <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Adicionar Item do Cardápio
                </span>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar prato ou bebida..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {filteredMenuSearch.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setEditItems((prev) => {
                          const existingIdx = prev.findIndex(
                            (p) => p.id === m.id
                          );
                          if (existingIdx >= 0) {
                            return prev.map((p, i) =>
                              i === existingIdx
                                ? { ...p, quantity: p.quantity + 1 }
                                : p
                            );
                          }
                          return [
                            ...prev,
                            {
                              id: m.id,
                              name: m.name,
                              price: Number(m.price),
                              quantity: 1,
                              delivered: false,
                            },
                          ];
                        });
                      }}
                      className="w-full flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-amber-500/50 px-3 py-2 text-left text-xs transition cursor-pointer"
                    >
                      <span className="font-semibold text-zinc-200 truncate">
                        {m.name}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-amber-400 shrink-0 ml-2">
                        <span>
                          R$ {Number(m.price).toFixed(2).replace(".", ",")}
                        </span>
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Observações do Pedido
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, bebida com gelo e limão..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="border-t border-zinc-800 bg-zinc-950 px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <span className="block text-[10px] font-bold uppercase text-zinc-400">
                  Novo Total
                </span>
                <span className="text-lg font-black text-amber-400">
                  R${" "}
                  {editItems
                    .reduce(
                      (sum, it) => sum + Number(it.price) * Number(it.quantity),
                      0
                    )
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => void handleSaveOrderEdits()}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-black text-zinc-950 transition cursor-pointer disabled:opacity-60"
                >
                  {isSavingEdit && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>Salvar Pedido</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

