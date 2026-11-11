"use client";

import React, { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createMenuCategoryAction,
  deleteMenuCategoryAction,
  saveMenuItemAction,
  toggleMenuItemAvailabilityAction,
  deleteMenuItemAction,
} from "@/services/restaurant.actions";
import type { MenuCategory, MenuItem } from "@/types";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit3,
  Power,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  X,
  Search,
} from "lucide-react";

interface MenuManagerClientProps {
  tenantId: string;
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
}

const DEFAULT_CATEGORY_SUGGESTIONS = [
  "Entradas",
  "Pratos",
  "Bebidas",
  "Sobremesas",
];

/**
 * Comprime imagem no cliente via HTML5 Canvas (máx 1280px, qualidade 0.75) antes do upload
 */
async function compressMenuImageClient(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxWidth = 1280;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        0.78
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

export function MenuManagerClient({
  tenantId,
  initialCategories,
  initialItems,
}: MenuManagerClientProps) {
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado Nova Categoria
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Estado Modal / Form de Item
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Pratos");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Lista combinada de categorias (padrões + cadastradas no banco)
  const allCategoryNames = Array.from(
    new Set([
      ...DEFAULT_CATEGORY_SUGGESTIONS,
      ...categories.map((c) => c.name),
      ...items.map((i) => i.category || "Pratos"),
    ])
  ).filter(Boolean);

  const openNewItemModal = () => {
    setEditingItemId(null);
    setItemName("");
    setItemCategory(
      selectedCategoryFilter !== "all" ? selectedCategoryFilter : "Pratos"
    );
    setItemPrice("");
    setItemDescription("");
    setItemImageUrl("");
    setItemAvailable(true);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemCategory(item.category || "Pratos");
    setItemPrice(String(item.price));
    setItemDescription(item.description || "");
    setItemImageUrl(item.image_url || "");
    setItemAvailable(item.is_available !== false);
    setIsItemModalOpen(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    setFeedback(null);
    try {
      const res = await createMenuCategoryAction({
        name: newCategoryName.trim(),
        display_order: categories.length + 1,
      });
      if (res.success && res.data) {
        setCategories((prev) => [...prev, res.data!]);
        setNewCategoryName("");
        setFeedback({
          type: "success",
          text: `Categoria "${res.data.name}" adicionada ao cardápio!`,
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Não foi possível criar a categoria.",
        });
      }
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: MenuCategory) => {
    const res = await deleteMenuCategoryAction(cat.id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      if (selectedCategoryFilter === cat.name) {
        setSelectedCategoryFilter("all");
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setFeedback(null);
    try {
      const compressedBlob = await compressMenuImageClient(file);
      const supabase = createClient();
      const fileName = `menu/${tenantId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("establishment-photos")
        .upload(fileName, compressedBlob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("establishment-photos")
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        setItemImageUrl(publicUrlData.publicUrl);
        setFeedback({
          type: "success",
          text: "Foto do prato comprimida e enviada com sucesso!",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Erro ao enviar a foto do prato.",
      });
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const numericPrice = Number(String(itemPrice).replace(",", "."));
    if (isNaN(numericPrice) || numericPrice < 0) {
      setFeedback({ type: "error", text: "Informe um preço válido." });
      return;
    }

    setIsSavingItem(true);
    setFeedback(null);
    try {
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === itemCategory.toLowerCase()
      );

      const res = await saveMenuItemAction({
        id: editingItemId || undefined,
        category_id: matchedCat?.id || null,
        category: itemCategory,
        name: itemName.trim(),
        description: itemDescription.trim() || null,
        price: numericPrice,
        image_url: itemImageUrl.trim() || null,
        is_available: itemAvailable,
      });

      if (res.success && res.data) {
        const saved = res.data;
        if (editingItemId) {
          setItems((prev) =>
            prev.map((it) => (it.id === editingItemId ? saved : it))
          );
          setFeedback({
            type: "success",
            text: `Prato "${saved.name}" atualizado com sucesso!`,
          });
        } else {
          setItems((prev) => [saved, ...prev]);
          setFeedback({
            type: "success",
            text: `Prato "${saved.name}" adicionado ao cardápio!`,
          });
        }
        setIsItemModalOpen(false);
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Erro ao salvar item do cardápio.",
        });
      }
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleToggleItem = async (item: MenuItem) => {
    setTogglingId(item.id);
    const nextState = !item.is_available;
    try {
      const res = await toggleMenuItemAvailabilityAction(item.id, nextState);
      if (res.success) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, is_available: nextState, is_active: nextState }
              : it
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    const res = await deleteMenuItemAction(item.id);
    if (res.success) {
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      setFeedback({
        type: "success",
        text: `Item "${item.name}" removido do cardápio.`,
      });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategoryFilter === "all" ||
      (item.category || "Pratos").toLowerCase() ===
        selectedCategoryFilter.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-600/20">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Gestão Gastronomia • Cardápio Digital</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Cardápio Digital & Pratos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Gerencie categorias, fotos dos pratos, preços e disponibilidade em tempo real na vitrine e no QR Code das mesas.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewItemModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Prato / Bebida</span>
        </button>
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

      {/* Bloco de Categorias */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Tag className="h-4 w-4 text-orange-600" />
            <span>Categorias do Cardápio</span>
          </div>

          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nova categoria (ex: Porções, Drinks)..."
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={isCreatingCategory || !newCategoryName.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer"
            >
              {isCreatingCategory ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Adicionar</span>
            </button>
          </form>
        </div>

        {/* Abas de Filtro de Categoria */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("all")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              selectedCategoryFilter === "all"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Todas ({items.length})
          </button>

          {allCategoryNames.map((catName) => {
            const count = items.filter(
              (i) => (i.category || "Pratos").toLowerCase() === catName.toLowerCase()
            ).length;
            const customCat = categories.find(
              (c) => c.name.toLowerCase() === catName.toLowerCase()
            );
            const active =
              selectedCategoryFilter.toLowerCase() === catName.toLowerCase();

            return (
              <div
                key={catName}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter(catName)}
                  className="cursor-pointer"
                >
                  {catName} ({count})
                </button>
                {customCat && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(customCat)}
                    title="Remover categoria"
                    className={`ml-1 rounded p-0.5 transition cursor-pointer ${
                      active
                        ? "hover:bg-orange-700 text-orange-100"
                        : "hover:bg-slate-300 text-slate-400 hover:text-rose-600"
                    }`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Busca Rápida */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar prato, ingrediente ou bebida..."
          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      {/* Lista de Itens do Cardápio */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-slate-300" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              Nenhum item cadastrado nesta categoria
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Adicione entradas, pratos principais, porções, bebidas e sobremesas com foto para exibir na sua vitrine e no QR Code das mesas.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewItemModal}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Primeiro Prato</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const isAvailable = item.is_available !== false;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white overflow-hidden shadow-xs transition flex flex-col justify-between ${
                  isAvailable
                    ? "border-slate-200"
                    : "border-slate-200 bg-slate-50/70 opacity-75"
                }`}
              >
                <div>
                  {/* Imagem do Prato */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 gap-1">
                        <UtensilsCrossed className="h-8 w-8 stroke-1" />
                        <span className="text-[11px]">Sem foto</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="rounded-full bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white">
                        {item.category || "Pratos"}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          isAvailable
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {isAvailable ? "Ativo no Cardápio" : "Pausado"}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {item.name}
                      </h3>
                      <span className="text-base font-black text-orange-600 shrink-0">
                        R$ {Number(item.price).toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleItem(item)}
                    disabled={togglingId === item.id}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                      isAvailable
                        ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {togglingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Power className="h-3.5 w-3.5" />
                    )}
                    <span>{isAvailable ? "Pausar" : "Ativar"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditItemModal(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      title="Excluir item"
                      className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
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

      {/* Modal de Criação / Edição de Prato */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingItemId ? "Editar Item do Cardápio" : "Novo Item do Cardápio"}
                </h2>
                <p className="text-xs text-slate-500">
                  Preencha os detalhes e envie uma foto otimizada do prato ou bebida.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Nome do Prato / Bebida *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Ex: Picanha na Chapa"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Categoria *
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {allCategoryNames.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="Ex: 49.90"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Status Inicial
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemAvailable}
                      onChange={(e) => setItemAvailable(e.target.checked)}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Disponível para pedidos</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Descrição / Ingredientes
                </label>
                <textarea
                  rows={3}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Ex: Acompanha arroz biro-biro, farofa crocante, batata rústica e vinagrete (serve 2 pessoas)."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Tratamento e Upload de Foto com Compressão via Canvas */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="block text-xs font-bold text-slate-700">
                  Foto do Prato (Compressão Automática WebP)
                </label>

                {itemImageUrl && (
                  <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
                    <img
                      src={itemImageUrl}
                      alt="Preview do Prato"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setItemImageUrl("")}
                      className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1 text-white hover:bg-slate-900"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-orange-600" />
                    )}
                    <span>Tirar Foto (Câmera)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-teal-600" />
                    )}
                    <span>Escolher da Galeria</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  placeholder="Ou cole a URL direta de uma imagem..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem || isUploadingImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                >
                  {isSavingItem && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingItemId ? "Salvar Alterações" : "Adicionar ao Cardápio"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

