"use client";

import React, { useState, useMemo } from "react";
import type {
  TenantProfile,
  TenantProduct,
  TenantReview,
  TenantPost,
} from "@/types";
import type { NicheThemeConfig } from "@/config/tenant-themes";
import { sanitizePhoneNumber } from "@/utils/phone";
import { extractNeighborhoodAndCity } from "@/utils/address";
import { GoogleReviewsCard } from "./GoogleReviewsCard";
import { MapLocationCard } from "./MapLocationCard";
import { PublicPostsSection } from "./PublicPostsSection";
import {
  CarFront,
  Search,
  MessageCircle,
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  Calendar,
  Gauge,
  Settings2,
  Fuel,
  Repeat,
  Calculator,
  Award,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface AutomotiveDealershipStorefrontProps {
  tenant: any;
  profile: TenantProfile | null;
  products: TenantProduct[];
  reviews: TenantReview[];
  posts?: TenantPost[];
  heroImage: string;
  brandColor: string;
  theme: NicheThemeConfig;
  isOpenNow: boolean;
  statusBadgeText?: string;
  statusDetailText?: string;
}

interface ParsedVehicleSpecs {
  brandModel: string;
  version: string;
  year: string;
  km: string;
  transmission: "Automático" | "Manual";
  fuel: string;
  categoryNorm: "SUVs" | "Sedans" | "Hatches" | "Picapes" | "Outros";
}

function parseVehicleCardData(product: TenantProduct): ParsedVehicleSpecs {
  const rawName = (product.name || "Veículo Seminovo").trim();
  const rawDesc = (product.description || "").trim();
  const combined = `${rawName} ${rawDesc} ${product.category || ""}`.toLowerCase();

  let brandModel = rawName;
  let version = "";

  if (rawName.includes("|")) {
    const [left, ...rest] = rawName.split("|");
    brandModel = left.trim();
    version = rest.join("|").trim();
  } else if (rawName.includes("•")) {
    const [left, ...rest] = rawName.split("•");
    brandModel = left.trim();
    version = rest.join(" • ").trim();
  } else {
    const words = rawName.split(/\s+/);
    if (words.length > 2) {
      brandModel = words.slice(0, 2).join(" ");
      version = words.slice(2).join(" ");
    }
  }

  // Ano (ex: 2022/2023 ou 2023)
  const yearMatch = rawDesc.match(/\b(20\d{2}\s*\/\s*20\d{2}|20\d{2})\b/);
  const year = yearMatch ? yearMatch[1].replace(/\s+/g, "") : "2023/2024";

  // KM (ex: 34.500 km ou 18.900 km)
  const kmMatch = rawDesc.match(/\b(\d{1,3}(?:\.\d{3})*\s*km)\b/i);
  const km = kmMatch ? kmMatch[1].replace(/\s+/g, " ") : "Baixa KM";

  // Câmbio
  const isManual =
    /\bmanual\b/i.test(combined) &&
    !/autom[aá]tic|cvt|at\d|dsg|tiptronic/i.test(combined);
  const transmission: "Automático" | "Manual" = isManual
    ? "Manual"
    : "Automático";

  // Combustível
  let fuel = "Flex";
  if (/\bdiesel\b/i.test(combined)) fuel = "Diesel";
  else if (/\bh[ií]brid/i.test(combined)) fuel = "Híbrido";
  else if (/\bel[eé]tric/i.test(combined)) fuel = "Elétrico";
  else if (/\bgasolina\b/i.test(combined) && !/\bflex\b/i.test(combined))
    fuel = "Gasolina";

  // Categoria normalizada para filtro
  let categoryNorm: ParsedVehicleSpecs["categoryNorm"] = "Outros";
  if (/\bsuv|nivus|compass|t-cross|creta|tracker|hr-v|kicks|renegade\b/i.test(combined)) {
    categoryNorm = "SUVs";
  } else if (/\bsedan|corolla|civic|virtus|cronos|sentra|jetta|onix plus\b/i.test(combined)) {
    categoryNorm = "Sedans";
  } else if (/\bhatch|onix|hb20|polo|argo|mobi|kwid|gol|yaris\b/i.test(combined)) {
    categoryNorm = "Hatches";
  } else if (/\bpicape|pickup|toro|hilux|s10|ranger|strada|saveiro|amarok|4x4\b/i.test(combined)) {
    categoryNorm = "Picapes";
  }

  return {
    brandModel: brandModel.toUpperCase(),
    version: version || rawDesc.split("•").slice(-1)[0]?.trim() || "Completo • Revisado",
    year,
    km,
    transmission,
    fuel,
    categoryNorm,
  };
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AutomotiveDealershipStorefront({
  tenant,
  profile,
  products,
  reviews,
  posts = [],
  heroImage,
  brandColor,
  theme,
  isOpenNow,
  statusBadgeText,
  statusDetailText,
}: AutomotiveDealershipStorefrontProps) {
  // Filtros do Estoque
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");
  const [transmissionFilter, setTransmissionFilter] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<"featured" | "name" | "price_asc" | "price_desc">("featured");

  // Modal Rápido de Simulação por Veículo
  const [simulatingVehicle, setSimulatingVehicle] = useState<{
    product: TenantProduct;
    specs: ParsedVehicleSpecs;
  } | null>(null);
  const [modalEntryValue, setModalEntryValue] = useState("");
  const [modalInstallments, setModalInstallments] = useState("48x");
  const [modalHasTradeIn, setModalHasTradeIn] = useState(false);

  // Formulário Card 1 — Simule seu Financiamento
  const [finVehicle, setFinVehicle] = useState("");
  const [finEntry, setFinEntry] = useState("");
  const [finWhatsApp, setFinWhatsApp] = useState("");

  // Formulário Card 2 — Avaliamos seu Usado na Troca
  const [tradeModelYear, setTradeModelYear] = useState("");
  const [tradeKm, setTradeKm] = useState("");
  const [tradeNotes, setTradeNotes] = useState("");

  const isDemo = Boolean(
    tenant?.is_demo || String(tenant?.slug || "").startsWith("demo-")
  );
  const tenantName = profile?.name || tenant?.name || "Revenda Multimarcas";
  const rawAddress = profile?.address || tenant?.address || "";
  const cleanCity = extractNeighborhoodAndCity(rawAddress) || "Brasília - DF";
  const rawPhone =
    profile?.phone_whatsapp ||
    profile?.phone ||
    tenant?.whatsapp ||
    tenant?.phone ||
    "";
  const cleanPhone = rawPhone ? sanitizePhoneNumber(rawPhone) : "";
  const logoUrl = profile?.logo_url || tenant?.logo_url || null;

  const visibleReviews = (reviews || []).filter((r) => r.is_visible !== false);
  const realRating =
    profile?.google_rating ?? profile?.rating ?? tenant?.google_rating ?? 4.9;
  const realReviewCount =
    profile?.google_reviews_count ??
    profile?.review_count ??
    tenant?.google_reviews_count ??
    visibleReviews.length;

  const buildWaUrl = (message: string) => {
    const encoded = encodeURIComponent(message);
    return cleanPhone
      ? `https://wa.me/${
          cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`
        }?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  };

  const activeVehicles = useMemo(() => {
    return (products || [])
      .filter((p) => p.is_available !== false)
      .map((product) => ({
        product,
        specs: parseVehicleCardData(product),
      }));
  }, [products]);

  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = activeVehicles.filter(({ product, specs }) => {
      if (categoryFilter !== "Todos" && specs.categoryNorm !== categoryFilter) {
        return false;
      }
      if (
        transmissionFilter !== "Todos" &&
        specs.transmission !== transmissionFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${product.name} ${product.description || ""} ${
          product.category || ""
        } ${specs.year} ${specs.fuel}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });

    if (sortBy === "name") {
      return [...list].sort((a, b) =>
        a.specs.brandModel.localeCompare(b.specs.brandModel)
      );
    }
    if (sortBy === "price_asc") {
      return [...list].sort(
        (a, b) => Number(a.product.price || 0) - Number(b.product.price || 0)
      );
    }
    if (sortBy === "price_desc") {
      return [...list].sort(
        (a, b) => Number(b.product.price || 0) - Number(a.product.price || 0)
      );
    }
    return list;
  }, [activeVehicles, searchQuery, categoryFilter, transmissionFilter, sortBy]);

  const handleSendVehicleSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatingVehicle) return;
    const { specs } = simulatingVehicle;
    const lines = [
      `🚘 Olá, equipe da *${tenantName}*!`,
      `Tenho interesse no veículo: *${specs.brandModel} — ${specs.version}* (${specs.year}).`,
      modalEntryValue.trim()
        ? `💰 Entrada aproximada: *${modalEntryValue.trim()}*`
        : null,
      `📆 Prazo desejado: *${modalInstallments}*`,
      modalHasTradeIn ? `🔄 *Tenho carro usado para colocar na troca.*` : null,
      `Pode simular as parcelas para mim?`,
    ].filter(Boolean);
    window.open(buildWaUrl(lines.join("\n")), "_blank", "noopener,noreferrer");
    setSimulatingVehicle(null);
  };

  const handleFinancingFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `💳 *Simulação de Financiamento — ${tenantName}*`,
      finVehicle.trim()
        ? `🚘 Carro procurado: *${finVehicle.trim()}*`
        : `🚘 Carro procurado: *Ver opções do estoque*`,
      finEntry.trim()
        ? `💰 Entrada aproximada: *${finEntry.trim()}*`
        : `💰 Entrada: *A combinar / Sem entrada*`,
      finWhatsApp.trim() ? `📱 Meu WhatsApp: ${finWhatsApp.trim()}` : null,
      `Gostaria de simular as melhores condições de financiamento!`,
    ].filter(Boolean);
    window.open(buildWaUrl(lines.join("\n")), "_blank", "noopener,noreferrer");
  };

  const handleTradeInFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `🔄 *Avaliação de Usado na Troca — ${tenantName}*`,
      tradeModelYear.trim()
        ? `🚗 Meu carro atual: *${tradeModelYear.trim()}*`
        : `🚗 Quero avaliar meu veículo atual na troca.`,
      tradeKm.trim() ? `🛣️ KM aproximada: *${tradeKm.trim()}*` : null,
      tradeNotes.trim() ? `📝 Observações: ${tradeNotes.trim()}` : null,
      `Gostaria de solicitar uma avaliação gratuita para troca!`,
    ].filter(Boolean);
    window.open(buildWaUrl(lines.join("\n")), "_blank", "noopener,noreferrer");
  };

  const primaryAccent = brandColor && brandColor !== "#e11d48" ? brandColor : "#1E293B";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* =================================================================== */}
      {/* 1. CABEÇALHO ESTILO AGÊNCIA DE VEÍCULOS                             */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo + Nome + Endereço + Nota Google */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-slate-900 text-white overflow-hidden flex items-center justify-center shadow-xs">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={tenantName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <CarFront className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate text-sm sm:text-base font-black tracking-tight text-slate-900">
                  {tenantName}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{Number(realRating).toFixed(1)} Google</span>
                </span>
              </div>
              <p className="truncate text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{cleanCity}</span>
              </p>
            </div>
          </div>

          {/* Menu Rápido Desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-extrabold uppercase tracking-wider text-slate-700">
            <a href="#estoque" className="hover:text-blue-700 transition">
              Estoque
            </a>
            <a href="#financiamento" className="hover:text-blue-700 transition">
              Financiamento
            </a>
            <a href="#venda-seu-carro" className="hover:text-blue-700 transition">
              Venda seu Carro
            </a>
            <a href="#localizacao" className="hover:text-blue-700 transition">
              Localização
            </a>
          </nav>

          {/* Contato Direto */}
          <div className="flex items-center gap-2 shrink-0">
            {cleanPhone && (
              <a
                href={`tel:+55${cleanPhone}`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 transition"
              >
                <Phone className="h-3.5 w-3.5 text-slate-600" />
                <span>Ligar</span>
              </a>
            )}
            <a
              href={buildWaUrl(
                `Olá, equipe da ${tenantName}! Estou no site e gostaria de falar com um consultor sobre o estoque.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition"
            >
              <MessageCircle className="h-4 w-4 fill-white text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">Consultor</span>
            </a>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. BANNER HERO DE SHOWROOM + BARRA DE BUSCA DE ESTOQUE              */}
      {/* =================================================================== */}
      <section className="relative bg-slate-900">
        <div className="relative min-h-[340px] sm:min-h-[410px] flex items-center overflow-hidden">
          <img
            src={
              heroImage ||
              "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80"
            }
            alt={tenantName}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-900/75 to-slate-900/35" />

          <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 pb-20 sm:pb-24">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs font-bold text-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Estoque Periciado • Garantia e Procedência em {cleanCity}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
                Seu próximo seminovo com procedência e garantia está aqui
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
                Na <strong className="text-white">{tenantName}</strong> você
                encontra seminovos selecionados com laudo cautelar aprovado,
                financiamento em até 60x e a melhor avaliação do seu usado na
                troca.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <a
                  href="#estoque"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition active:scale-[0.98]"
                >
                  <CarFront className="h-4 w-4" />
                  <span>Ver Estoque Completo</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href={buildWaUrl(
                    `Olá! Estou na vitrine da ${tenantName} e gostaria de falar com um consultor sobre veículos seminovos.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25 transition active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4 fill-white text-emerald-600" />
                  <span>Falar com Consultor</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtro Interativa Flutuante */}
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xl shadow-slate-900/10 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-700" />
              <span>Buscar no Estoque ({activeVehicles.length} veículos disponíveis)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Busca por Modelo / Marca */}
              <div className="lg:col-span-5 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar marca ou modelo (Ex: Civic, Corolla, Onix, Hilux...)"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Categoria */}
              <div className="lg:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Todos">Categoria: Todas</option>
                  <option value="SUVs">SUVs</option>
                  <option value="Sedans">Sedans</option>
                  <option value="Hatches">Hatches</option>
                  <option value="Picapes">Picapes</option>
                </select>
              </div>

              {/* Câmbio */}
              <div className="lg:col-span-2">
                <select
                  value={transmissionFilter}
                  onChange={(e) => setTransmissionFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Todos">Câmbio: Todos</option>
                  <option value="Automático">Automático</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              {/* Ordenação */}
              <div className="lg:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="featured">Destaques</option>
                  <option value="name">Modelo (A-Z)</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* CONTEÚDO PRINCIPAL DO PORTAL AUTOMOTIVO                             */}
      {/* =================================================================== */}
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14 sm:space-y-16 pb-28 sm:pb-16">
        {/* 3. GRADE DE ESTOQUE COM CARDS PADRÃO DE REVENDA (3 COLUNAS) */}
        <section id="estoque" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-700">
                <CarFront className="h-4 w-4" />
                <span>Seminovos em Estoque</span>
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Veículos em Destaque
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                Exibindo {filteredVehicles.length} de {activeVehicles.length}{" "}
                {activeVehicles.length === 1 ? "veículo" : "veículos"}
              </span>
              {(searchQuery ||
                categoryFilter !== "Todos" ||
                transmissionFilter !== "Todos") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("Todos");
                    setTransmissionFilter("Todos");
                  }}
                  className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
              <CarFront className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="text-base font-extrabold text-slate-800">
                Nenhum veículo encontrado com este filtro
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Limpe os filtros acima ou chame nosso consultor no WhatsApp — temos
                novas entradas toda semana.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("Todos");
                  setTransmissionFilter("Todos");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
              >
                Mostrar todo o estoque
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map(({ product, specs }) => {
                const hasPrice =
                  !isDemo &&
                  product.price !== null &&
                  product.price !== undefined &&
                  Number(product.price) > 0;

                return (
                  <article
                    key={product.id}
                    className="group rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Imagem 16:10 em destaque no topo do card */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={`${specs.brandModel} ${specs.version}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <CarFront className="h-12 w-12" />
                          </div>
                        )}

                        {/* Badges discretos no canto */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" />
                            Laudo Aprovado
                          </span>
                          <span className="inline-flex items-center rounded-lg bg-emerald-600/90 backdrop-blur-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                            Garantia
                          </span>
                        </div>
                      </div>

                      {/* Corpo do Card */}
                      <div className="p-5 space-y-4">
                        {/* Título em 2 linhas: Marca/Modelo + Versão */}
                        <div>
                          <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                            {specs.brandModel}
                          </h3>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500 line-clamp-1">
                            {specs.version}
                          </p>
                        </div>

                        {/* Grade de 4 Especificações com ícones limpos */}
                        <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-xs">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[10px] font-semibold text-slate-400 leading-none">
                                Ano
                              </span>
                              <span className="font-bold text-slate-900">
                                {specs.year}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-slate-700">
                            <Gauge className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[10px] font-semibold text-slate-400 leading-none">
                                KM
                              </span>
                              <span className="font-bold text-slate-900 truncate block">
                                {specs.km}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-slate-700">
                            <Settings2 className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[10px] font-semibold text-slate-400 leading-none">
                                Câmbio
                              </span>
                              <span className="font-bold text-slate-900">
                                {specs.transmission}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-slate-700">
                            <Fuel className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[10px] font-semibold text-slate-400 leading-none">
                                Combustível
                              </span>
                              <span className="font-bold text-slate-900">
                                {specs.fuel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé do Card: Preço/Sob Consulta + Botão de Simulação */}
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3">
                      <div className="flex items-baseline justify-between">
                        {hasPrice ? (
                          <span className="text-2xl font-black tracking-tight text-slate-900">
                            {formatBRL(Number(product.price))}
                          </span>
                        ) : (
                          <div>
                            <span className="text-lg font-black tracking-tight text-slate-900">
                              Sob Consulta
                            </span>
                            <span className="block text-[11px] font-semibold text-emerald-700">
                              Financiamento em até 60x • Aceitamos troca
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setModalEntryValue("");
                          setModalInstallments("48x");
                          setModalHasTradeIn(false);
                          setSimulatingVehicle({ product, specs });
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4 fill-white text-emerald-600 shrink-0" />
                        <span>Simular / Tenho Interesse</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. FAIXA DE DIFERENCIAIS DA LOJA */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Troca com Troco",
              desc: "Seu usado vale entrada e você ainda pode sair com troco na mão.",
              Icon: Repeat,
              bg: "bg-blue-50",
              color: "text-blue-700",
            },
            {
              title: "Financiamento em até 60x",
              desc: "Aprovação ágil junto aos principais bancos com taxas competitivas.",
              Icon: Calculator,
              bg: "bg-emerald-50",
              color: "text-emerald-700",
            },
            {
              title: "Veículos Periciados e Revisados",
              desc: "Laudo cautelar aprovado e garantia de motor e câmbio.",
              Icon: ShieldCheck,
              bg: "bg-amber-50",
              color: "text-amber-700",
            },
            {
              title: "Melhor Avaliação do DF",
              desc: "Avaliação justa e transparente no seu veículo seminovo ou usado.",
              Icon: Award,
              bg: "bg-slate-100",
              color: "text-slate-800",
            },
          ].map((diff, idx) => {
            const Icon = diff.Icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-start gap-3.5"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${diff.bg} ${diff.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {diff.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {diff.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* 5. SEÇÃO DUPLA DE CONVERSÃO AUTOMOTIVA */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Simule seu Financiamento */}
          <form
            id="financiamento"
            onSubmit={handleFinancingFormSubmit}
            className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-md space-y-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ backgroundColor: primaryAccent }}
              >
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Simule seu Financiamento
                </h2>
                <p className="text-xs text-slate-500">
                  Receba sua simulação personalizada direto com nosso consultor.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qual carro procura?
                </label>
                <input
                  type="text"
                  value={finVehicle}
                  onChange={(e) => setFinVehicle(e.target.value)}
                  placeholder="Ex: Corolla XEi, VW Nivus, SUV até 100 mil..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor de entrada aproximado
                  </label>
                  <input
                    type="text"
                    value={finEntry}
                    onChange={(e) => setFinEntry(e.target.value)}
                    placeholder="Ex: R$ 20.000 ou meu usado"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seu WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={finWhatsApp}
                    onChange={(e) => setFinWhatsApp(e.target.value)}
                    placeholder="(61) 99999-9999"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 fill-white text-emerald-600" />
              <span>Simular Agora no WhatsApp</span>
            </button>
          </form>

          {/* Card 2: Avaliamos seu Usado na Troca */}
          <form
            id="venda-seu-carro"
            onSubmit={handleTradeInFormSubmit}
            className="scroll-mt-24 rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 sm:p-7 shadow-md space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Avaliamos seu Usado na Troca
                </h2>
                <p className="text-xs text-slate-300">
                  Melhor avaliação da região com pagamento ou troca na hora.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Modelo / Ano do seu carro atual
                  </label>
                  <input
                    type="text"
                    value={tradeModelYear}
                    onChange={(e) => setTradeModelYear(e.target.value)}
                    placeholder="Ex: Onix LT 2020"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    KM aproximada
                  </label>
                  <input
                    type="text"
                    value={tradeKm}
                    onChange={(e) => setTradeKm(e.target.value)}
                    placeholder="Ex: 55.000 km"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Detalhes adicionais (opcional)
                </label>
                <input
                  type="text"
                  value={tradeNotes}
                  onChange={(e) => setTradeNotes(e.target.value)}
                  placeholder="Ex: Único dono, IPVA pago, revisões em dia..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Solicitar Avaliação Gratuita</span>
            </button>
          </form>
        </section>

        {/* 6. AVALIAÇÕES REAIS DO GOOGLE */}
        <GoogleReviewsCard
          tenantName={tenantName}
          rating={realRating}
          reviewCount={realReviewCount}
          reviews={visibleReviews}
          googleMapsUrl={profile?.google_maps_url}
          theme={theme}
        />

        {/* Posts / Dicas SEO da Loja (se houver) */}
        {posts.length > 0 && (
          <PublicPostsSection
            posts={posts}
            tenantName={tenantName}
            phoneWhatsapp={rawPhone}
            theme={theme}
            brandColor={primaryAccent}
            onOpenBooking={() => {
              const el = document.getElementById("estoque");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {/* 7. LOCALIZAÇÃO & HORÁRIOS DE FUNCIONAMENTO */}
        <div id="localizacao" className="scroll-mt-24">
          <MapLocationCard
            tenantName={tenantName}
            address={rawAddress}
            placeId={
              tenant?.place_id ||
              tenant?.google_place_id ||
              profile?.place_id ||
              profile?.google_place_id
            }
            latitude={profile?.latitude}
            longitude={profile?.longitude}
            openingHours={tenant?.opening_hours || profile?.opening_hours_json}
            googleMapsUrl={profile?.google_maps_url}
            isOpenNow={isOpenNow}
            statusDetailText={statusDetailText}
            statusBadgeText={statusBadgeText}
            theme={theme}
          />
        </div>
      </main>

      {/* Rodapé Limpo da Agência */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-bold text-slate-800">
            {tenantName} • Seminovos Selecionados em {cleanCity}
          </p>
          <p>
            © {new Date().getFullYear()} {tenantName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Barra Fixa Mobile Focada em Estoque & Consultor */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md p-3 flex items-center gap-2 shadow-2xl">
        <a
          href="#estoque"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white"
        >
          <CarFront className="h-4 w-4" />
          <span>Ver Estoque</span>
        </a>
        <a
          href={buildWaUrl(
            `Olá! Estou na vitrine da ${tenantName} e gostaria de simular um financiamento.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white"
        >
          <MessageCircle className="h-4 w-4 fill-white text-emerald-600" />
          <span>Simular WhatsApp</span>
        </a>
      </div>

      {/* Modal Rápido de Simulação por Veículo */}
      {simulatingVehicle && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSimulatingVehicle(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Simulação Rápida no WhatsApp
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {simulatingVehicle.specs.brandModel}
                </h3>
                <p className="text-xs text-slate-500">
                  {simulatingVehicle.specs.version} •{" "}
                  {simulatingVehicle.specs.year}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSimulatingVehicle(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendVehicleSimulation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor de entrada aproximado (opcional)
                </label>
                <input
                  type="text"
                  value={modalEntryValue}
                  onChange={(e) => setModalEntryValue(e.target.value)}
                  placeholder="Ex: R$ 20.000 ou meu usado na troca"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Parcelamento desejado
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["24x", "36x", "48x", "60x"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setModalInstallments(opt)}
                      className={`rounded-xl py-2 text-xs font-extrabold border transition cursor-pointer ${
                        modalInstallments === opt
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalHasTradeIn}
                  onChange={(e) => setModalHasTradeIn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Tenho um carro usado para dar na troca</span>
              </label>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-sm font-extrabold text-white shadow-lg transition cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 fill-white text-emerald-600" />
                <span>Enviar Simulação no WhatsApp</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
