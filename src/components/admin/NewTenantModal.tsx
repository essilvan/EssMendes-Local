"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { fetchPlacePreview, type PlacePreviewResult } from "@/services/google-preview.actions";
import { createTenantFromGoogleMapsAction } from "@/services/super-admin.actions";
import {
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  MapPin,
  Phone,
  Store,
  Tag,
} from "lucide-react";

interface NewTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tenant: any) => void;
}

export function NewTenantModal({ isOpen, onClose, onSuccess }: NewTenantModalProps) {
  const [mapsUrl, setMapsUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [previewData, setPreviewData] = useState<PlacePreviewResult | null>(null);

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isCreating, startCreateTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueriedUrlRef = useRef<string>("");

  // Limpa estados ao fechar ou abrir
  useEffect(() => {
    if (!isOpen) {
      setMapsUrl("");
      setCompanyName("");
      setWhatsapp("");
      setPreviewData(null);
      setIsLoadingPreview(false);
      setPreviewError(null);
      setFormError(null);
      setFormSuccess(null);
      lastQueriedUrlRef.current = "";
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    }
  }, [isOpen]);

  /**
   * Executa a busca da ficha na API
   */
  const triggerPreview = async (urlToFetch: string) => {
    const cleanUrl = urlToFetch.trim();
    if (!cleanUrl) {
      setPreviewData(null);
      setPreviewError(null);
      return;
    }

    // Evita chamadas duplicadas para o mesmo link
    if (cleanUrl === lastQueriedUrlRef.current && previewData) {
      return;
    }

    lastQueriedUrlRef.current = cleanUrl;
    setIsLoadingPreview(true);
    setPreviewError(null);

    const res = await fetchPlacePreview(cleanUrl);
    setIsLoadingPreview(false);

    if (res.success && res.data) {
      setPreviewData(res.data);
      // Preenchimento automático do WhatsApp e Nome da Empresa
      if (res.data.phone) {
        setWhatsapp(res.data.phone);
      }
      if (res.data.name) {
        setCompanyName(res.data.name);
      }
      setPreviewError(null);
    } else {
      setPreviewError(res.error || "Não foi possível carregar os dados automáticos desta ficha.");
    }
  };

  /**
   * onChange com Debounce (500ms)
   */
  const handleMapsUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMapsUrl(value);
    setFormError(null);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Se o usuário colou ou digitou algo relevante
    if (
      value.includes("maps") ||
      value.includes("goo.gl") ||
      value.startsWith("http") ||
      value.startsWith("ChIJ")
    ) {
      debounceTimeoutRef.current = setTimeout(() => {
        triggerPreview(value);
      }, 500);
    }
  };

  /**
   * onBlur para disparo imediato se ainda não foi consultado
   */
  const handleMapsUrlBlur = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (mapsUrl.trim() && mapsUrl.trim() !== lastQueriedUrlRef.current) {
      triggerPreview(mapsUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!mapsUrl.trim()) {
      setFormError("Por favor, cole o link do Google Maps da empresa.");
      return;
    }

    if (!whatsapp.trim()) {
      setFormError("Informe o WhatsApp comercial da empresa.");
      return;
    }

    startCreateTransition(async () => {
      const res = await createTenantFromGoogleMapsAction(mapsUrl, whatsapp);
      if (res.success && res.tenant) {
        setFormSuccess(`Empresa "${res.tenant.name}" cadastrada e sincronizada com sucesso!`);
        onSuccess?.(res.tenant);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFormError(res.error || "Falha ao cadastrar empresa a partir do link do Google Maps.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cadastrar Nova Empresa (Setup Rápido via Google Maps)
              </h3>
              <p className="text-xs text-slate-500">
                Busca instantânea de WhatsApp, nome e endereço da ficha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input: Link do Google Maps ou Place ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Link do Google Maps ou Place ID *
              </label>
              {isLoadingPreview && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando dados da ficha...
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="https://maps.app.goo.gl/... ou link completo do Maps"
                value={mapsUrl}
                onChange={handleMapsUrlChange}
                onBlur={handleMapsUrlBlur}
                disabled={isCreating}
                required
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-1 ${
                  isLoadingPreview
                    ? "border-teal-500 bg-teal-50/20 focus:ring-teal-600"
                    : previewData
                    ? "border-emerald-500 bg-emerald-50/10 focus:ring-emerald-600"
                    : "border-slate-300 bg-white focus:border-teal-600 focus:ring-teal-600"
                }`}
              />
              {isLoadingPreview && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400">
              Cole o link de compartilhamento gerado no celular ou copiado do navegador.
            </span>

            {/* Badge de Confirmação: ✅ Ficha encontrada */}
            {previewData && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>✅ Ficha encontrada: {previewData.name}</span>
                </div>
                <div className="mt-1.5 space-y-0.5 text-[11px] text-emerald-700 pl-6">
                  {previewData.address && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-emerald-600" />
                      <span>{previewData.address}</span>
                    </p>
                  )}
                  {previewData.suggestedCategory && (
                    <p className="flex items-center gap-1">
                      <Tag className="h-3 w-3 shrink-0 text-emerald-600" />
                      <span>Segmento: {previewData.suggestedCategory}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {previewError && !isLoadingPreview && (
              <p className="text-[11px] text-amber-700 font-medium">
                ⚠️ {previewError}
              </p>
            )}
          </div>

          {/* Campo: Nome da Empresa (Preenchido automaticamente, editável) */}
          {companyName && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-slate-700">
                Nome da Empresa (Identificado na Ficha)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isCreating}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
                <Store className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          )}

          {/* Input: WhatsApp Comercial (Preenchido automaticamente e editável) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                WhatsApp Comercial da Empresa *
              </label>
              {previewData?.phone && (
                <span className="text-[10px] font-semibold text-emerald-700">
                  Preenchido via Google Places
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={isCreating}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              <Phone className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-400">
              Caso o telefone da ficha seja um fixo, você pode editar e inserir diretamente o celular com WhatsApp.
            </span>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-800 disabled:opacity-50 transition cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cadastrando e Sincronizando...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Cadastrar Empresa Agora</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
