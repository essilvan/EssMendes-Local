"use client";

import React, { useState, useTransition } from "react";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductAvailabilityAction,
  updateProductStockAction,
} from "@/services/product.actions";
import type { TenantProduct } from "@/types";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Tag,
  Star,
  ExternalLink,
  X,
  MessageCircle,
  Package,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { getTenantPublicUrl } from "@/utils/tenant-url";

interface ProductsManagerProps {
  initialProducts: TenantProduct[];
  slug: string;
  phoneWhatsapp?: string | null;
}

export function ProductsManager({
  initialProducts,
  slug,
  phoneWhatsapp,
}: ProductsManagerProps) {
  const [products, setProducts] = useState<TenantProduct[]>(initialProducts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<TenantProduct | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [promotionalPrice, setPromotionalPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isUnlimitedStock, setIsUnlimitedStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState<number>(10);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setCategory("");
    setPrice("");
    setPromotionalPrice("");
    setImageUrl("");
    setIsFeatured(false);
    setIsUnlimitedStock(true);
    setStockQuantity(10);
    setIsAdding(true);
    setFeedback(null);
  };

  const handleOpenEdit = (p: TenantProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || "");
    setCategory(p.category || "");
    setPrice(String(p.price));
    setPromotionalPrice(p.promotional_price ? String(p.promotional_price) : "");
    setImageUrl(p.image_url || "");
    setIsFeatured(p.is_featured);
    setIsUnlimitedStock(p.stock_quantity === null || p.stock_quantity === undefined);
    setStockQuantity(typeof p.stock_quantity === "number" ? p.stock_quantity : 10);
    setIsAdding(true);
    setFeedback(null);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingProduct(null);
  };

  const handleQuickStockChange = (productId: string, newStock: number | null) => {
    setStockUpdatingId(productId);
    const previousProducts = [...products];
    setProducts((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, stock_quantity: newStock } : item))
    );

    startTransition(async () => {
      const res = await updateProductStockAction(productId, newStock);
      if (!res.success) {
        setProducts(previousProducts);
        setFeedback({
          type: "error",
          message: res.error || "Falha ao atualizar estoque do produto.",
        });
      } else {
        const prod = products.find((p) => p.id === productId);
        setFeedback({
          type: "success",
          message:
            newStock === null
              ? `Estoque de "${prod?.name || "Produto"}" definido como ilimitado / sob encomenda.`
              : `Estoque de "${prod?.name || "Produto"}" atualizado para ${newStock} unidade(s).`,
        });
      }
      setStockUpdatingId(null);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const numPrice = parseFloat(price.replace(",", "."));
    if (isNaN(numPrice) || numPrice < 0) {
      setFeedback({ type: "error", message: "Informe um preço válido para o produto." });
      return;
    }

    const numPromo = promotionalPrice.trim()
      ? parseFloat(promotionalPrice.replace(",", "."))
      : null;

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      price: numPrice,
      promotional_price: numPromo,
      image_url: imageUrl.trim() || undefined,
      stock_quantity: isUnlimitedStock ? null : Math.max(0, Math.floor(stockQuantity)),
      is_available: editingProduct ? editingProduct.is_available : true,
      is_featured: isFeatured,
      display_order: editingProduct ? editingProduct.display_order : 0,
    };

    startTransition(async () => {
      if (editingProduct) {
        const res = await updateProductAction(editingProduct.id, payload);
        if (res.success && res.data) {
          setProducts((prev) =>
            prev.map((item) => (item.id === editingProduct.id ? res.data! : item))
          );
          setFeedback({
            type: "success",
            message: `Produto "${res.data.name}" atualizado com sucesso!`,
          });
          setIsAdding(false);
          setEditingProduct(null);
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Erro ao atualizar produto.",
          });
        }
      } else {
        const res = await createProductAction(payload);
        if (res.success && res.data) {
          setProducts((prev) => [res.data!, ...prev]);
          setFeedback({
            type: "success",
            message: `Produto "${res.data.name}" cadastrado e visível na vitrine!`,
          });
          setIsAdding(false);
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Erro ao cadastrar produto.",
          });
        }
      }
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    setTogglingId(id);
    startTransition(async () => {
      const res = await toggleProductAvailabilityAction(id, current);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_available: !current } : p))
        );
      } else {
        setFeedback({ type: "error", message: res.error || "Falha ao alterar status." });
      }
      setTogglingId(null);
    });
  };

  const handleDelete = (id: string, prodName: string) => {
    if (!confirm(`Deseja realmente remover o produto "${prodName}"?`)) return;
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteProductAction(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setFeedback({
          type: "success",
          message: `Produto "${prodName}" removido do catálogo.`,
        });
      } else {
        setFeedback({ type: "error", message: res.error || "Erro ao excluir produto." });
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Bar */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-4 text-xs border ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-teal-700" />
            <span>Itens Cadastrados ({products.length})</span>
          </h2>
          <p className="text-xs text-slate-500">
            Produtos físicos, peças e acessórios disponíveis para pedido via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getTenantPublicUrl(slug, "#produtos")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Ver Vitrine Pública</span>
          </a>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Formulário de Adicionar / Editar Produto */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm space-y-5 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nome do Produto / Peça *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Kit Troca de Óleo Sintético 5W30 + Filtro"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Categoria
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Lubrificantes, Peças, Acessórios"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Preço Original (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150,00"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Preço Promo (Opcional)
                </label>
                <input
                  type="text"
                  value={promotionalPrice}
                  onChange={(e) => setPromotionalPrice(e.target.value)}
                  placeholder="120,00"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Descrição & Detalhes com Palavras-chave Locais
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a aplicação do item, especificações e diferenciais para indexação no Google..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            {/* Controle de Estoque Manipulável */}
            <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shadow-2xs">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Controle de Estoque & Disponibilidade
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Defina a quantidade de unidades físicas prontas para entrega
                    </p>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={isUnlimitedStock}
                    onChange={(e) => {
                      setIsUnlimitedStock(e.target.checked);
                      if (!e.target.checked && stockQuantity <= 0) {
                        setStockQuantity(10);
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Disponibilidade Ilimitada / Sob Encomenda
                  </span>
                </label>
              </div>

              {!isUnlimitedStock && (
                <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Quantidade em Estoque (Unidades)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStockQuantity(Math.max(0, stockQuantity - 1))}
                        className="h-9 w-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-black text-sm text-slate-700 shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Diminuir 1 unidade"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={stockQuantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setStockQuantity(isNaN(val) || val < 0 ? 0 : val);
                        }}
                        className="w-24 text-center rounded-xl border border-slate-300 p-2 text-sm font-bold text-slate-900 focus:border-teal-600 focus:outline-none bg-white shadow-2xs"
                      />

                      <button
                        type="button"
                        onClick={() => setStockQuantity(stockQuantity + 1)}
                        className="h-9 w-9 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-black text-sm text-slate-700 shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Aumentar 1 unidade"
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          type="button"
                          onClick={() => setStockQuantity(stockQuantity + 5)}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                          title="Adicionar 5 unidades"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockQuantity(stockQuantity + 10)}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                          title="Adicionar 10 unidades"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="self-start sm:self-center">
                    {stockQuantity > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 px-3.5 py-1 text-xs font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Em Estoque: {stockQuantity} {stockQuantity === 1 ? "unidade" : "unidades"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/60 px-3.5 py-1 text-xs font-bold">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        <span>Esgotado (Sob Encomenda)</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Foto do Produto
              </label>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                folder="products"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isFeatured" className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                Destacar este produto no topo da vitrine
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancelForm}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-5 py-2 text-xs font-bold text-white hover:bg-teal-900 disabled:opacity-60 transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{editingProduct ? "Salvar Alterações" : "Publicar Produto"}</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Grid de Produtos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 space-y-3">
            <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">Nenhum produto cadastrado na vitrine ainda.</p>
            <p className="max-w-md mx-auto">
              Cadastre peças, produtos físicos ou kits para que clientes possam encontrar seu estabelecimento em buscas orgânicas e comprar diretamente pelo WhatsApp.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Cadastrar Primeiro Produto</span>
            </button>
          </div>
        ) : (
          products.map((p) => {
            const hasPromo = p.promotional_price && p.promotional_price > 0 && p.promotional_price < p.price;
            const currentPrice = hasPromo ? p.promotional_price! : p.price;

            return (
              <div
                key={p.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-2xs transition hover:shadow-xs ${
                  p.is_available ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
                }`}
              >
                <div className="space-y-3">
                  {/* Foto do Produto */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-100 flex items-center justify-center">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-slate-300" />
                    )}

                    {p.is_featured && (
                      <div className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Destaque
                      </div>
                    )}

                    {hasPromo && (
                      <div className="absolute top-2 right-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        Oferta
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="space-y-1">
                    {p.category && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                        <Tag className="h-2.5 w-2.5" />
                        {p.category}
                      </span>
                    )}

                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {p.name}
                    </h4>

                    {p.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Preços */}
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(currentPrice)}
                    </span>

                    {hasPromo && (
                      <span className="text-xs font-semibold text-slate-400 line-through">
                        {formatCurrency(p.price)}
                      </span>
                    )}
                  </div>

                  {/* Controle Rápido de Estoque Diretamente no Card */}
                  <div className="pt-2 pb-1 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Package className="h-3 w-3 text-slate-400" />
                        <span>Estoque:</span>
                      </span>

                      {p.stock_quantity === null || p.stock_quantity === undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Ilimitado
                          </span>
                          <button
                            type="button"
                            disabled={stockUpdatingId === p.id}
                            onClick={() => handleQuickStockChange(p.id, 10)}
                            className="text-[10px] font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                            title="Ativar controle de unidades"
                          >
                            Ativar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={stockUpdatingId === p.id || (p.stock_quantity || 0) <= 0}
                            onClick={() =>
                              handleQuickStockChange(
                                p.id,
                                Math.max(0, (p.stock_quantity || 0) - 1)
                              )
                            }
                            className="h-6 w-6 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-black text-xs text-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
                            title="Diminuir 1 unidade"
                          >
                            <Minus className="h-3 w-3" />
                          </button>

                          <span
                            className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md min-w-[50px] text-center ${
                              p.stock_quantity > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-red-50 text-red-700 border border-red-200/60"
                            }`}
                          >
                            {p.stock_quantity > 0 ? `${p.stock_quantity} un.` : "Esgotado"}
                          </span>

                          <button
                            type="button"
                            disabled={stockUpdatingId === p.id}
                            onClick={() =>
                              handleQuickStockChange(p.id, (p.stock_quantity || 0) + 1)
                            }
                            className="h-6 w-6 rounded-md border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center font-black text-xs text-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
                            title="Adicionar 1 unidade"
                          >
                            <Plus className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            disabled={stockUpdatingId === p.id}
                            onClick={() => handleQuickStockChange(p.id, null)}
                            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-1 py-0.5 rounded hover:bg-slate-100 cursor-pointer ml-0.5"
                            title="Tornar ilimitado / sob encomenda"
                          >
                            ∞
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 gap-2">
                  <button
                    type="button"
                    disabled={togglingId === p.id}
                    onClick={() => handleToggle(p.id, p.is_available)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition ${
                      p.is_available
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {p.is_available ? (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Disponível</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Oculto</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition"
                      title="Editar produto"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Excluir produto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
