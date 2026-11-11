"use client";

import React, { useState } from "react";
import { updateRestaurantOrderStatusAction } from "@/services/restaurant.actions";
import type { RestaurantOrder, RestaurantOrderStatus } from "@/types";
import {
  ClipboardList,
  Clock,
  ChefHat,
  CheckCircle2,
  MessageCircle,
  Loader2,
  User,
  StickyNote,
} from "lucide-react";

interface OrdersManagerClientProps {
  initialOrders: RestaurantOrder[];
}

type OrderFilter = "all" | "pending" | "in_kitchen" | "delivered";

export function OrdersManagerClient({
  initialOrders,
}: OrdersManagerClientProps) {
  const [orders, setOrders] = useState<RestaurantOrder[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<OrderFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const normalizeStatus = (raw: string): "pending" | "in_kitchen" | "delivered" => {
    const s = String(raw || "").toLowerCase();
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
      `🔔 *Pedido Mesa ${order.table_number}*`,
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
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-600/20">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Gestão Gastronomia • Pedidos da Mesa</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Pedidos Recebidos das Mesas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe as comandas enviadas via QR Code e atualize o andamento entre Pendentes, Na Cozinha e Entregues.
          </p>
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
      </div>

      {/* Lista de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum pedido neste filtro
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Assim que um cliente escanear o QR Code da mesa e enviar um pedido, ele aparecerá aqui instantaneamente.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredOrders.map((order) => {
            const normStatus = normalizeStatus(order.status);
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Topo */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-xl bg-orange-600 px-3 py-1 text-xs font-black text-white">
                          Mesa {order.table_number}
                        </span>
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
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Cliente: <strong className="text-slate-900">{order.customer_name || "Cliente na Mesa"}</strong>
                        </span>
                        {order.waiter_name && (
                          <span className="text-slate-400">
                            • Garçom: <strong className="text-teal-700">{order.waiter_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">
                        R$ {Number(order.total_amount || 0).toFixed(2).replace(".", ",")}
                      </span>
                      <p className="text-[10px] text-slate-400">
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
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-slate-800">
                          <strong className="text-orange-600">{it.quantity}x</strong> {it.name}
                        </span>
                        <span className="font-bold text-slate-700">
                          R${" "}
                          {(Number(it.price) * Number(it.quantity))
                            .toFixed(2)
                            .replace(".", ",")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Observações */}
                  {order.notes && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
                      <StickyNote className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Observação:</strong> {order.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botões de Ação de Status + WhatsApp */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {normStatus !== "in_kitchen" && normStatus !== "delivered" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order.id, "in_kitchen")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 px-3 py-2 text-xs font-bold text-white transition cursor-pointer"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ChefHat className="h-3.5 w-3.5" />
                        )}
                        <span>Enviar p/ Cozinha</span>
                      </button>
                    )}

                    {normStatus !== "delivered" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(order.id, "delivered")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition cursor-pointer"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>Marcar Entregue</span>
                      </button>
                    )}
                  </div>

                  <a
                    href={getWaiterWhatsAppUrl(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp Garçom</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

