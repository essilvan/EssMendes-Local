"use client";

import React, { useState, useMemo } from "react";
import { createPublicTableOrderAction } from "@/services/restaurant.actions";
import type { MenuCategory, MenuItem } from "@/types";
import {
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  QrCode,
  Sparkles,
} from "lucide-react";

interface PublicRestaurantMenuSectionProps {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  categories: MenuCategory[];
  items: MenuItem[];
  tableNumber?: string | null;
  tableName?: string | null;
  waiterName?: string | null;
  restaurantPhone?: string | null;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

const DEFAULT_TABS = ["Todos", "Entradas", "Pratos", "Bebidas", "Sobremesas"];

export function PublicRestaurantMenuSection({
  tenantId,
  tenantName,
  tenantSlug,
  categories,
  items,
  tableNumber = null,
  tableName = null,
  waiterName = null,
}: PublicRestaurantMenuSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("Todos");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [manualTableNumber, setManualTableNumber] = useState(
    tableNumber || "01"
  );
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedWhatsappUrl, setSubmittedWhatsappUrl] = useState<string | null>(
    null
  );

  // Abas dinâmicas combinando as 4 categorias clássicas + categorias com itens
  const categoryTabs = useMemo(() => {
    const dynamicNames = [
      ...categories.map((c) => c.name),
      ...items.map((i) => i.category || "Pratos"),
    ].filter(Boolean);

    const merged = [...DEFAULT_TABS];
    for (const name of dynamicNames) {
      if (!merged.some((m) => m.toLowerCase() === name.toLowerCase())) {
        merged.push(name);
      }
    }
    return merged;
  }, [categories, items]);

  const filteredItems = useMemo(() => {
    if (activeTab === "Todos") return items;
    return items.filter(
      (item) => (item.category || "Pratos").toLowerCase() === activeTab.toLowerCase()
    );
  }, [items, activeTab]);

  const cartEntries = Object.values(cart);
  const totalItemsCount = cartEntries.reduce((sum, c) => sum + c.quantity, 0);
  const totalOrderAmount = cartEntries.reduce(
    (sum, c) => sum + Number(c.item.price) * c.quantity,
    0
  );

  const handleAddItem = (item: MenuItem) => {
    setSubmittedWhatsappUrl(null);
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: existing ? existing.quantity + 1 : 1,
        },
      };
    });
  };

  const handleDecreaseItem = (itemId: string) => {
    setSubmittedWhatsappUrl(null);
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const handleSendOrderToWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveTable = (tableNumber || manualTableNumber || "Balcão").trim();
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMsg("Por favor, informe seu nome para identificar a comanda.");
      return;
    }

    if (cartEntries.length === 0) {
      setErrorMsg("Adicione pelo menos 1 item ao seu pedido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPublicTableOrderAction({
        tenant_id: tenantId,
        tenant_slug: tenantSlug,
        table_number: effectiveTable,
        customer_name: customerName.trim(),
        notes: orderNotes.trim() || null,
        items: cartEntries.map((entry) => ({
          id: entry.item.id,
          name: entry.item.name,
          price: Number(entry.item.price),
          quantity: entry.quantity,
        })),
      });

      if (res.success && res.data?.whatsappUrl) {
        setSubmittedWhatsappUrl(res.data.whatsappUrl);
        setCart({});
        window.open(res.data.whatsappUrl, "_blank");
      } else {
        setErrorMsg(res.error || "Não foi possível registrar seu pedido.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao enviar pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) =>
    `R$ ${Number(val || 0).toFixed(2).replace(".", ",")}`;

  const displayTableLabel = tableName
    ? tableName
    : tableNumber
    ? `Mesa ${tableNumber}`
    : null;

  return (
    <section id="cardapio" className="py-8 sm:py-12 space-y-6">
      {/* Banner Identificador da Mesa (Quando aberto via QR Code /[slug]/mesa/[tableNumber]) */}
      {displayTableLabel && (
        <div className="rounded-3xl border-2 border-orange-300 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs ring-2 ring-white/30">
              <QrCode className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-100">
                Atendimento Digital na Mesa
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                Você está na {displayTableLabel}
              </h2>
              <p className="text-xs sm:text-sm text-orange-100">
                Escolha seus pratos e bebidas abaixo e envie o pedido direto para o garçom!
              </p>
            </div>
          </div>

          {waiterName && (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-black/25 px-4 py-2.5 text-xs font-bold text-white shrink-0">
              <UserCheck className="h-4 w-4 text-emerald-300" />
              <span>Garçom da Mesa: {waiterName}</span>
            </div>
          )}
        </div>
      )}

      {/* Cabeçalho da Seção "Nosso Cardápio" */}
      <div className="rounded-3xl border border-orange-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-orange-800">
              <UtensilsCrossed className="h-3.5 w-3.5 text-orange-600" />
              <span>Gastronomia & Pedidos na Hora</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900">
              Nosso Cardápio
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Selecione seus itens favoritos, adicione observações e envie direto para nossa equipe.
            </p>
          </div>

          {totalItemsCount > 0 && (
            <button
              type="button"
              onClick={() => setIsOrderDrawerOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-500 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>
                Ver Pedido ({totalItemsCount}) • {formatCurrency(totalOrderAmount)}
              </span>
            </button>
          )}
        </div>

        {/* Abas de Categorias (Entradas, Pratos, Bebidas, Sobremesas) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categoryTabs.map((tab) => {
            const isActive = activeTab.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Grid de Pratos & Bebidas */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 p-10 text-center space-y-2">
            <UtensilsCrossed className="mx-auto h-8 w-8 text-stone-400" />
            <p className="text-sm font-bold text-stone-700">
              Nenhum item disponível nesta categoria no momento.
            </p>
            <p className="text-xs text-stone-500">
              Selecione outra categoria acima para explorar o cardápio.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const qtyInCart = cart[item.id]?.quantity || 0;

              return (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Foto do Prato */}
                    <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-stone-400 gap-1">
                          <UtensilsCrossed className="h-8 w-8 stroke-1" />
                          <span className="text-[11px] font-medium">
                            {tenantName}
                          </span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white">
                        {item.category || "Pratos"}
                      </span>
                    </div>

                    {/* Detalhes */}
                    <div className="p-4 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-extrabold text-stone-900 leading-snug">
                          {item.name}
                        </h3>
                      </div>
                      {item.description && (
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preço e Botão "+ Adicionar" */}
                  <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-3 border-t border-stone-100">
                    <span className="text-lg font-black text-orange-600">
                      {formatCurrency(item.price)}
                    </span>

                    {qtyInCart > 0 ? (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleDecreaseItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-orange-700 shadow-2xs hover:bg-orange-100 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[20px] text-center text-xs font-black text-orange-950">
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white shadow-2xs hover:bg-orange-500 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddItem(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-extrabold text-white shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Barra Flutuante Inferior com Resumo da Comanda e Botão "Ver Pedido" */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-400/40 bg-stone-950/95 p-4 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 font-black text-white shadow-inner">
                {totalItemsCount}
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-300">
                  {displayTableLabel
                    ? `Comanda da ${displayTableLabel}`
                    : "Resumo da sua Comanda"}
                </p>
                <p className="text-base sm:text-lg font-black text-amber-400">
                  Total: {formatCurrency(totalOrderAmount)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOrderDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition active:scale-95 cursor-pointer shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Ver Pedido</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal / Drawer de Finalização da Comanda e Envio para o Garçom */}
      {isOrderDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-6 text-stone-900 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-orange-800">
                  <Sparkles className="h-3 w-3 text-orange-600" />
                  {displayTableLabel || "Comanda Digital"}
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-1">
                  Conferir e Enviar Pedido
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderDrawerOpen(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submittedWhatsappUrl ? (
              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6 text-center space-y-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <div className="space-y-1">
                  <h4 className="text-base font-black text-emerald-950">
                    Pedido Registrado na Mesa!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Seu pedido já foi salvo no painel do restaurante. Clique abaixo caso o WhatsApp do garçom não tenha aberto automaticamente:
                  </p>
                </div>
                <a
                  href={submittedWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Abrir WhatsApp do Garçom com o Pedido</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedWhatsappUrl(null);
                    setIsOrderDrawerOpen(false);
                  }}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  Voltar ao cardápio
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendOrderToWaiter} className="space-y-4">
                {/* Lista de Itens Selecionados */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {cartEntries.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] font-semibold text-orange-600">
                          {formatCurrency(Number(item.price) * quantity)}
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDecreaseItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black w-5 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white hover:bg-orange-500 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Campos de Identificação e Observação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs text-stone-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  {!tableNumber && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-stone-700">
                        Número da Mesa
                      </label>
                      <input
                        type="text"
                        value={manualTableNumber}
                        onChange={(e) => setManualTableNumber(e.target.value)}
                        placeholder="Ex: 01 ou Balcão"
                        className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    Observações do Pedido (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ex: Sem cebola, ponto da carne ao ponto, gelo e limão..."
                    className="w-full rounded-xl border border-stone-300 p-3 text-xs text-stone-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Total e Botão Enviar Pedido para o Garçom */}
                <div className="rounded-2xl bg-stone-100 p-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-stone-600">
                    Total do Pedido
                  </span>
                  <span className="text-xl font-black text-stone-900">
                    {formatCurrency(totalOrderAmount)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cartEntries.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-3.5 text-sm font-black text-white shadow-lg transition active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  <span>Enviar Pedido para o Garçom</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

