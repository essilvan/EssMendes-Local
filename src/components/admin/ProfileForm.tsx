"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  updateTenantProfileAction,
  type ProfileActionState,
} from "@/services/profile.actions";
import { syncGooglePlacesAction } from "@/lib/actions/google-places.actions";
import {
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Palette,
  Sparkles,
  Calendar,
  Star,
  RefreshCw,
  Search,
  ArrowRight,
  Image as ImageIcon,
  Trash2,
  Plus,
  Crown,
  Scissors,
  DollarSign,
  Clock,
  FileText,
  HelpCircle,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { COLOR_PRESETS } from "@/utils/color";

interface ServiceSummary {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  duration_minutes: number;
  is_active: boolean;
}

interface ProfileFormProps {
  initialData: {
    companyName: string;
    description: string;
    editorialSummary?: string;
    phoneWhatsapp: string;
    address: string;
    logoUrl: string;
    placePhotos?: string[];
    primaryColor?: string;
    googleMapsUrl?: string;
    rating?: number;
    reviewCount?: number;
    slug: string;
    services?: ServiceSummary[];
  };
}

const initialState: ProfileActionState = {};

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateTenantProfileAction,
    initialState
  );

  // Controlled form states
  const [companyName, setCompanyName] = useState(initialData.companyName || "");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState(initialData.phoneWhatsapp || "");
  const [address, setAddress] = useState(initialData.address || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [editorialSummary, setEditorialSummary] = useState(
    initialData.editorialSummary || initialData.description || ""
  );
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || "");
  const [placePhotos, setPlacePhotos] = useState<string[]>(
    initialData.placePhotos || []
  );
  const [services, setServices] = useState<ServiceSummary[]>(
    initialData.services || []
  );
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [showAddPhotoInput, setShowAddPhotoInput] = useState(false);

  const [primaryColor, setPrimaryColor] = useState<string>(
    initialData.primaryColor || "#0d9488"
  );
  const [rating, setRating] = useState<number>(initialData.rating || 4.9);
  const [reviewCount, setReviewCount] = useState<number>(initialData.reviewCount || 128);

  // Google Maps Sync State
  const [googleInput, setGoogleInput] = useState(initialData.googleMapsUrl || "");
  const [isSyncingGoogle, startGoogleSync] = useTransition();
  const [googleSyncFeedback, setGoogleSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
    badges?: string[];
  } | null>(null);

  useEffect(() => {
    if (state?.error) {
      console.error("[ProfileForm] Erro ao salvar dados do perfil:", state.error);
    }
  }, [state]);

  const handleColorChange = (newColor: string) => {
    setPrimaryColor(newColor);
  };

  // Sincronização automática com o Google Meu Negócio
  const handleSyncGoogle = () => {
    if (!googleInput.trim()) {
      setGoogleSyncFeedback({
        type: "error",
        message: "Digite o link do Google Maps ou o nome do seu estabelecimento.",
      });
      return;
    }

    setGoogleSyncFeedback(null);

    startGoogleSync(async () => {
      const res = await syncGooglePlacesAction(googleInput);
      if (res.error) {
        setGoogleSyncFeedback({
          type: "error",
          message: res.error,
        });
      } else if (res.data) {
        if (res.data.companyName) setCompanyName(res.data.companyName);
        if (res.data.phoneWhatsapp) setPhoneWhatsapp(res.data.phoneWhatsapp);
        if (res.data.address) setAddress(res.data.address);
        if (res.data.rating) setRating(res.data.rating);
        if (res.data.reviewCount) setReviewCount(res.data.reviewCount);
        if (res.data.googleMapsUrl) setGoogleInput(res.data.googleMapsUrl);
        if (res.data.description) setDescription(res.data.description);
        if (res.data.editorialSummary) setEditorialSummary(res.data.editorialSummary);

        // Atualização dos serviços sugeridos gerados automaticamente
        if (res.data.services && res.data.services.length > 0) {
          setServices(res.data.services);
        }

        // Preenchimento de fotos e auto-definição de logotipo
        if (res.data.placePhotos && res.data.placePhotos.length > 0) {
          setPlacePhotos(res.data.placePhotos);
          if (!logoUrl || logoUrl.trim() === "") {
            setLogoUrl(res.data.logoUrl || res.data.placePhotos[0]);
          }
        }

        const badges: string[] = [];
        badges.push("✓ Headline & Sobre a Empresa gerados");
        if (res.data.servicesCountImported) {
          badges.push(`✓ ${res.data.servicesCountImported} Serviços essenciais sugeridos`);
        }
        if (res.data.photosCountImported) {
          badges.push(`✓ ${res.data.photosCountImported} Fotos importadas`);
        }
        if (res.data.reviewsCountImported) {
          badges.push(`✓ ${res.data.reviewsCountImported} Avaliações vinculadas`);
        }
        if (res.data.weeklyHours && res.data.weeklyHours.length > 0) {
          badges.push("✓ Horários atualizados");
        }
        if (res.data.businessCategory) {
          badges.push(`✓ Categoria: ${res.data.businessCategory}`);
        }
        if (res.data.latitude && res.data.longitude) {
          badges.push("✓ Coordenadas GPS sincronizadas");
        }

        setGoogleSyncFeedback({
          type: "success",
          message: `Sincronização com o Google concluída com sucesso! Informações da empresa, headline inteligente, catálogo de serviços sugeridos e nota ${res.data.rating}★ vinculadas.`,
          badges,
        });
      }
    });
  };

  // Ações da galeria de fotos
  const handleSetAsLogo = (photoUrl: string) => {
    setLogoUrl(photoUrl);
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const photoToRemove = placePhotos[indexToRemove];
    setPlacePhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (logoUrl === photoToRemove) {
      const remaining = placePhotos.filter((_, idx) => idx !== indexToRemove);
      setLogoUrl(remaining.length > 0 ? remaining[0] : "");
    }
  };

  const handleAddCustomPhoto = () => {
    const trimmed = newPhotoUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http")) {
      alert("Por favor, insira uma URL de imagem válida (iniciando com http:// ou https://).");
      return;
    }
    setPlacePhotos((prev) => [...prev, trimmed]);
    if (!logoUrl) {
      setLogoUrl(trimmed);
    }
    setNewPhotoUrl("");
    setShowAddPhotoInput(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Bloco 0: Sincronizador Google Meu Negócio */}
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-extrabold text-emerald-900">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              <span>Sincronizador Google Meu Negócio</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Sincronização Total com o Google Places
            </h3>
            <p className="text-xs text-slate-600">
              Cole o link do seu estabelecimento no Google Maps ou digite o nome da empresa para preencher nome, endereço, telefone, fotos oficiais e avaliações automaticamente.
            </p>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            {/* Google Logo */}
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={googleInput}
              onChange={(e) => setGoogleInput(e.target.value)}
              placeholder="Ex: https://maps.app.goo.gl/... ou Nome do Estabelecimento + Bairro"
              className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
            />
          </div>

          <button
            type="button"
            disabled={isSyncingGoogle}
            onClick={handleSyncGoogle}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {isSyncingGoogle ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sincronizando dados e fotos...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Sincronizar Google Meu Negócio</span>
              </>
            )}
          </button>
        </div>

        {/* Feedback da sincronização com badges visuais */}
        {googleSyncFeedback && (
          <div
            className={`flex flex-col gap-2.5 rounded-xl p-3.5 text-xs border ${
              googleSyncFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {googleSyncFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-semibold">{googleSyncFeedback.message}</span>
            </div>

            {googleSyncFeedback.badges && googleSyncFeedback.badges.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-6">
                {googleSyncFeedback.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulário Principal de Edição */}
      <form action={formAction} className="space-y-6">
        
        {/* Campo oculto com array de fotos atualizado */}
        <input
          type="hidden"
          name="placePhotos"
          value={JSON.stringify(placePhotos)}
        />

        {/* Mensagem de Erro Vermelha com detalhes */}
        {state?.error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-xs">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-bold text-red-900">Falha ao salvar configurações:</p>
              <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{state.error}</p>
            </div>
          </div>
        )}

        {/* Mensagem de Sucesso Verde */}
        {state?.message && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-xs">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="font-bold text-emerald-900">Atualização concluída com sucesso!</p>
              <p className="mt-0.5 text-xs text-emerald-700">{state.message}</p>
            </div>
          </div>
        )}

        {/* Bloco 1: Dados Principais & Logotipo & Galeria Visual */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h3 className="text-base font-bold text-slate-900">
              Dados Principais do Estabelecimento
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Estas informações serão exibidas na sua página pública e no catálogo online.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Nome da Empresa */}
            <div>
              <label
                htmlFor="companyName"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Nome do Estabelecimento *
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  disabled={isPending}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Studio Beauty & Auto Care"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label
                htmlFor="phoneWhatsapp"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                WhatsApp / Telefone de Contato
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phoneWhatsapp"
                  name="phoneWhatsapp"
                  type="text"
                  disabled={isPending}
                  value={phoneWhatsapp}
                  onChange={(e) => setPhoneWhatsapp(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Endereço Completo
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  disabled={isPending}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Paulista, 1000 - Sala 42, Bela Vista - São Paulo / SP"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Logotipo / Imagem de Perfil */}
            <div className="sm:col-span-2 space-y-4">
              <ImageUpload
                name="logoUrl"
                value={logoUrl}
                label="Logotipo / Imagem de Perfil do Negócio"
                description="Esta imagem aparecerá em destaque no topo da sua página pública e nos links de compartilhamento."
                folder="logos"
                aspectRatio="square"
                disabled={isPending}
              />

              {/* Galeria Visual de Fotos Importadas do Google (place_photos) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Galeria de Fotos do Local ({placePhotos.length} fotos)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Clique em qualquer imagem para defini-la como logotipo principal da sua página.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddPhotoInput(!showAddPhotoInput)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Foto por URL</span>
                  </button>
                </div>

                {/* Input para adicionar nova foto por URL */}
                {showAddPhotoInput && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs animate-in fade-in duration-150">
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="Cole o link da foto (https://...)"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPhoto}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                    >
                      Inserir
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPhotoInput(false)}
                      className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* Grid Visual de Miniaturas */}
                {placePhotos.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 italic">
                    Nenhuma foto importada ainda. Sincronize com o Google Meu Negócio acima para carregar as fotos oficiais.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {placePhotos.map((photo, idx) => {
                      const isCurrentLogo = logoUrl === photo;
                      return (
                        <div
                          key={idx}
                          className={`group relative overflow-hidden rounded-xl border-2 transition ${
                            isCurrentLogo
                              ? "border-teal-600 ring-2 ring-teal-600/30 shadow-sm"
                              : "border-slate-200 hover:border-slate-300"
                          } bg-white aspect-square`}
                        >
                          {/* Imagem */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt={`Foto ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />

                          {/* Badge de Logo Atual */}
                          {isCurrentLogo && (
                            <div className="absolute top-1.5 left-1.5 rounded-md bg-teal-700 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-xs flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              <span>Logo</span>
                            </div>
                          )}

                          {/* Overlay com Ações */}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-2 backdrop-blur-2xs">
                            {!isCurrentLogo && (
                              <button
                                type="button"
                                onClick={() => handleSetAsLogo(photo)}
                                className="w-full rounded-lg bg-white/95 py-1 text-[10px] font-bold text-slate-900 shadow-2xs hover:bg-white transition"
                              >
                                Usar como Logo
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="w-full rounded-lg bg-red-600/90 py-1 text-[10px] font-bold text-white shadow-2xs hover:bg-red-700 transition flex items-center justify-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Remover</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 1. Descrição Curta / Headline do Topo */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Headline / Chamada do Topo (Hero)
                </label>
                <span className="text-[11px] text-slate-400">
                  {description.length}/500 caracteres
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Frase de destaque exibida logo abaixo do título principal no topo da sua vitrine pública.
              </p>
              <div className="relative mt-1.5">
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  maxLength={500}
                  disabled={isPending}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Especialistas em Câmbio, Direção Hidráulica e Embreagens com garantia e qualidade comprovada."
                  className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* 2. Sobre a Empresa / Apresentação Completa */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="editorialSummary"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-teal-700" />
                  <span>Sobre a Empresa & Apresentação Detalhada</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {editorialSummary.length}/3000 caracteres
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Texto institucional completo exibido na seção &ldquo;Sobre o Estabelecimento&rdquo;. Pré-preenchido pelo resumo editorial do Google Maps.
              </p>
              <div className="relative mt-1.5">
                <textarea
                  id="editorialSummary"
                  name="editorialSummary"
                  rows={4}
                  maxLength={3000}
                  disabled={isPending}
                  value={editorialSummary}
                  onChange={(e) => setEditorialSummary(e.target.value)}
                  placeholder="Conte a história do estabelecimento, diferenciais, tradição na região, equipamentos e atendimento..."
                  className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Catálogo de Serviços do Estabelecimento */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-600/20">
                <Scissors className="h-3 w-3 text-teal-700" />
                <span>Catálogo de Serviços</span>
              </div>
              <h3 className="mt-1.5 text-base font-bold text-slate-900">
                Serviços Cadastrados no Estabelecimento
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Os serviços abaixo aparecem no catálogo e no formulário de agendamento online da sua vitrine pública.
              </p>
            </div>

            <Link
              href="/admin/servicos"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow-sm transition"
            >
              <span>Gerenciar / Criar Serviços</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Listagem Rápida de Serviços */}
          {services && services.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className={`rounded-xl border p-4 transition ${
                    srv.is_active
                      ? "border-slate-200 bg-slate-50/70"
                      : "border-slate-200 bg-slate-100/60 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {srv.name}
                    </h4>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        srv.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {srv.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {srv.description && (
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                      {srv.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-xs">
                    {srv.price !== null && srv.price !== undefined && Number(srv.price) > 0 ? (
                      <span className="font-extrabold text-teal-800 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                        {formatCurrency(Number(srv.price))}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Sob Consulta
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {srv.duration_minutes} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center space-y-2">
              <Scissors className="mx-auto h-8 w-8 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">
                Nenhum serviço cadastrado no momento
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Adicione serviços com valores e duração para que os clientes possam agendar diretamente pela vitrine pública.
              </p>
              <Link
                href="/admin/servicos"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-2xs mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Cadastrar Primeiro Serviço</span>
              </Link>
            </div>
          )}
        </div>

        {/* Bloco 3: Google Reviews & Prova Social */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/20">
                <Star className="h-3 w-3 fill-current text-amber-500" />
                <span>Google Business Profile & Avaliações</span>
              </div>
              <h3 className="mt-1.5 text-base font-bold text-slate-900">
                Configurações da Nota & Prova Social
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajuste a nota e quantidade de avaliações exibidas no card oficial do Google Maps.
              </p>
            </div>

            <Link
              href="/admin/avaliacoes"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <span>Gerenciar Comentários</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Link Google Maps */}
            <div className="sm:col-span-3">
              <label
                htmlFor="googleMapsUrl"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                URL Completa do Google Maps (Opcional)
              </label>
              <input
                id="googleMapsUrl"
                name="googleMapsUrl"
                type="text"
                value={googleInput}
                onChange={(e) => setGoogleInput(e.target.value)}
                placeholder="Ex: https://maps.app.goo.gl/..."
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            {/* Nota do Google */}
            <div>
              <label
                htmlFor="rating"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Nota Média no Google (1.0 a 5.0)
              </label>
              <input
                id="rating"
                name="rating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            {/* Quantidade de Avaliações */}
            <div>
              <label
                htmlFor="reviewCount"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Total de Avaliações Recebidas
              </label>
              <input
                id="reviewCount"
                name="reviewCount"
                type="number"
                min="0"
                value={reviewCount}
                onChange={(e) => setReviewCount(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            {/* Badge Preview */}
            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700">
                <span className="font-black text-slate-900 text-sm">{rating}★</span>
                <span className="text-[11px] text-slate-500 font-medium">({reviewCount} avaliações no site)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 4: Identidade Visual & Cor Primária do Tema */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-600/20">
              <Palette className="h-3 w-3" />
              <span>Personalização Visual</span>
            </div>
            <h3 className="mt-1.5 text-base font-bold text-slate-900">
              Cor Primária do Tema (`primary_color`)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha a cor de destaque da sua marca para personalizar botões, badges, estrelas e detalhes da sua vitrine pública.
            </p>
          </div>

          {/* Presets Rápidos */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Paleta de Cores Recomendadas
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5">
              {COLOR_PRESETS.map((preset) => {
                const isSelected =
                  primaryColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handleColorChange(preset.hex)}
                    className={`group relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition text-center ${
                      isSelected
                        ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div
                      className="h-7 w-7 rounded-full shadow-inner ring-1 ring-black/10 flex items-center justify-center text-white"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && <CheckCircle2 className="h-4 w-4 drop-shadow-sm" />}
                    </div>
                    <span className="mt-1.5 text-[10px] font-medium text-slate-600 group-hover:text-slate-900 truncate w-full">
                      {preset.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Manual HEX e Color Picker Nativo */}
          <div className="grid gap-6 sm:grid-cols-2 pt-2 border-t border-slate-100">
            <div>
              <label
                htmlFor="primaryColor"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Código HEX Customizado
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="relative flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-300 overflow-hidden shadow-xs">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    title="Clique para abrir o seletor de cores"
                  />
                  <div
                    className="h-full w-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>

                <input
                  id="primaryColor"
                  name="primaryColor"
                  type="text"
                  value={primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  maxLength={7}
                  placeholder="#0d9488"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm uppercase text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Pré-visualização dos Elementos com a cor */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Pré-visualização do Tema
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="h-3 w-3" />
                  Destaque
                </span>

                <div
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Agendar Horário
                </div>

                <div className="flex items-center gap-0.5" style={{ color: primaryColor }}>
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Ação com Feedback de Loading */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando configurações...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar Todas as Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
