"use client";

import React, { useState, useMemo } from "react";
import { createPublicTableOrderAction } from "@/services/restaurant.actions";
import type { MenuCategory, MenuItem } from "@/types";
import {
  UtensilsCrossed,
  Utensils,
  LayoutGrid,
  Flame,
  Beer,
  Wine,
  Sparkles,
  IceCream,
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

function renderCategoryIcon(tabName: string, isActive: boolean) {
  const normalized = tabName.toLowerCase();
  if (normalized === "todos" || normalized.includes("todo")) {
    return (
      <LayoutGrid
        className={`w-4 h-4 mr-2 shrink-0 ${
          isActive ? "text-zinc-950" : "text-amber-400"
        }`}
      />
    );
  }
  if (
    normalized.includes("entrada") ||
    normalized.includes("petisc") ||
    normalized.includes("porc") ||
    normalized.includes("porç") ||
    normalized.includes("tira-gosto")
  ) {
    return (
      <Flame
        className={`w-4 h-4 mr-2 shrink-0 ${
          isActive ? "text-zinc-950" : "text-amber-500"
        }`}
      />
    );
  }
  if (
    normalized.includes("bebida") ||
    normalized.includes("cervej") ||
    normalized.includes("chopp") ||
    normalized.includes("drink") ||
    normalized.includes("coquet") ||
    normalized.includes("suco") ||
    normalized.includes("refrig")
  ) {
    return (
      <Beer
        className={`w-4 h-4 mr-2 shrink-0 ${
          isActive ? "text-zinc-950" : "text-amber-400"
        }`}
      />
    );
  }
  if (normalized.includes("vinho") || normalized.includes("adega")) {
    return (
      <Wine
        className={`w-4 h-4 mr-2 shrink-0 ${
          isActive ? "text-zinc-950" : "text-amber-400"
        }`}
      />
    );
  }
  if (
    normalized.includes("sobremes") ||
    normalized.includes("doce") ||
    normalized.includes("sorvet") ||
    normalized.includes("acai") ||
    normalized.includes("açaí")
  ) {
    return (
      <Sparkles
        className={`w-4 h-4 mr-2 shrink-0 ${
          isActive ? "text-zinc-950" : "text-pink-400"
        }`}
      />
    );
  }
  if (normalized.includes("gelato") || normalized.includes("milkshake")) {
    return (
      <IceCream
        className={`w-4 h-4 mr-2 shrink-0 ${
          isActive ? "text-zinc-950" : "text-pink-400"
        }`}
      />
    );
  }
  if (
    normalized.includes("prato") ||
    normalized.includes("principal") ||
    normalized.includes("refeic") ||
    normalized.includes("lanche") ||
    normalized.includes("burger") ||
    normalized.includes("carne") ||
    normalized.includes("executivo")
  ) {
    return (
      <Utensils
        className={`w-4 h-4 mr-2 shrink-0 ${
          isActive ? "text-zinc-950" : "text-orange-500"
        }`}
      />
    );
  }
  return (
    <UtensilsCrossed
      className={`w-4 h-4 mr-2 shrink-0 ${
        isActive ? "text-zinc-950" : "text-amber-400"
      }`}
    />
  );
}

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
    <section id="cardapio" className="py-6 sm:py-10 space-y-6 scroll-mt-20">
      {/* Banner Identificador da Mesa (Quando aberto via QR Code /[slug]/mesa/[tableNumber]) */}
      {displayTableLabel && (
        <div className="bg-zinc-900/90 border border-amber-500/40 backdrop-blur-md rounded-2xl shadow-xl p-5 sm:p-6 text-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <QrCode className="h-7 w-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Atendimento Digital na Mesa
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100 mt-1">
                Você está na {displayTableLabel}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Escolha seus pratos e bebidas abaixo e envie o pedido direto para o garçom!
              </p>
            </div>
          </div>

          {waiterName && (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950/80 border border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-200 shrink-0">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <span>Garçom da Mesa: {waiterName}</span>
            </div>
          )}
        </div>
      )}

      {/* Container Principal da Seção "Nosso Cardápio" */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
              <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />
              <span>Cardápio Digital Interativo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100">
              Nosso Cardápio
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Faça seu pedido diretamente para a nossa equipe
            </p>
          </div>

          {totalItemsCount > 0 && (
            <button
              type="button"
              onClick={() => setIsOrderDrawerOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-5 py-3 text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>
                Ver Pedido ({totalItemsCount}) • {formatCurrency(totalOrderAmount)}
              </span>
            </button>
          )}
        </div>

        {/* Abas de Categorias com Ícones Lucide Modernos e Estilo Pill */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {categoryTabs.map((tab) => {
            const isActive = activeTab.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-md shadow-amber-500/20"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:bg-zinc-800"
                }`}
              >
                {renderCategoryIcon(tab, isActive)}
                <span>{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Grid de Pratos, Porções e Bebidas */}
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 p-10 text-center space-y-2">
            <UtensilsCrossed className="mx-auto h-8 w-8 text-zinc-500" />
            <p className="text-sm font-bold text-zinc-300">
              Nenhum item disponível nesta categoria no momento.
            </p>
            <p className="text-xs text-zinc-500">
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
                  className="group bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Foto do Prato / Porção / Bebida */}
                    <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-zinc-600 gap-1.5 bg-gradient-to-br from-zinc-900 to-zinc-950">
                          <UtensilsCrossed className="h-8 w-8 text-amber-500/40 stroke-1" />
                          <span className="text-[11px] font-medium text-zinc-500">
                            {tenantName}
                          </span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 rounded-full bg-zinc-950/85 border border-zinc-700/80 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                        {item.category || "Pratos"}
                      </span>
                    </div>

                    {/* Detalhes do Item */}
                    <div className="p-4 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-extrabold text-zinc-100 leading-snug">
                          {item.name}
                        </h3>
                      </div>
                      {item.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preço e Botão "+ Adicionar" */}
                  <div className="px-4 pb-4 pt-3 flex items-center justify-between gap-3 border-t border-zinc-800/80">
                    <span className="text-lg font-black text-amber-400">
                      {formatCurrency(item.price)}
                    </span>

                    {qtyInCart > 0 ? (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-zinc-950 px-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleDecreaseItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[20px] text-center text-xs font-black text-amber-400">
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddItem(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-xs shadow-md shadow-amber-500/15 transition active:scale-95 cursor-pointer"
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
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-zinc-950/95 p-4 text-zinc-100 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 font-black text-zinc-950 shadow-inner">
                {totalItemsCount}
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">
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
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-5 py-3 text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Ver Pedido</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal / Drawer de Finalização da Comanda e Envio para o Garçom */}
      {isOrderDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  {displayTableLabel || "Comanda Digital"}
                </span>
                <h3 className="text-lg font-black text-zinc-100 mt-1">
                  Conferir e Enviar Pedido
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderDrawerOpen(false)}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submittedWhatsappUrl ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-6 text-center space-y-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <div className="space-y-1">
                  <h4 className="text-base font-black text-emerald-300">
                    Pedido Registrado na Mesa!
                  </h4>
                  <p className="text-xs text-zinc-300">
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
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
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
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] font-semibold text-amber-400">
                          {formatCurrency(Number(item.price) * quantity)}
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDecreaseItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black w-5 text-center text-zinc-100">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(item)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold cursor-pointer"
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
                    <label className="block text-xs font-bold text-zinc-300">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {!tableNumber && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-zinc-300">
                        Número da Mesa
                      </label>
                      <input
                        type="text"
                        value={manualTableNumber}
                        onChange={(e) => setManualTableNumber(e.target.value)}
                        placeholder="Ex: 01 ou Balcão"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs font-bold text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-300">
                    Observações do Pedido (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ex: Sem cebola, ponto da carne ao ponto, gelo e limão..."
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/50 p-3 text-xs font-semibold text-rose-300">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Total e Botão Enviar Pedido para o Garçom */}
                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-zinc-400">
                    Total do Pedido
                  </span>
                  <span className="text-xl font-black text-amber-400">
                    {formatCurrency(totalOrderAmount)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cartEntries.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
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

