"use client";

import { useActionState, useEffect } from "react";
import {
  updateTenantProfileAction,
  type ProfileActionState,
} from "@/services/profile.actions";
import {
  Building2,
  Phone,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";

interface ProfileFormProps {
  initialData: {
    companyName: string;
    description: string;
    phoneWhatsapp: string;
    address: string;
    logoUrl: string;
    slug: string;
  };
}

const initialState: ProfileActionState = {};

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateTenantProfileAction,
    initialState
  );

  useEffect(() => {
    if (state?.error) {
      console.error("[ProfileForm] Erro ao salvar dados do perfil:", state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      
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

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Identificação Geral */}
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
                defaultValue={initialData.companyName}
                placeholder="Ex: Studio Beauty & Barber"
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
                defaultValue={initialData.phoneWhatsapp}
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
                defaultValue={initialData.address}
                placeholder="Ex: Av. Paulista, 1000 - Sala 42, Bela Vista - São Paulo / SP"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* URL do Logotipo */}
          <div className="sm:col-span-2">
            <label
              htmlFor="logoUrl"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              URL do Logotipo / Imagem de Perfil
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                disabled={isPending}
                defaultValue={initialData.logoUrl}
                placeholder="https://exemplo.com/imagens/logo.png"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Descrição / Apresentação */}
          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Descrição & Apresentação do Negócio
            </label>
            <div className="relative mt-1.5">
              <textarea
                id="description"
                name="description"
                rows={4}
                disabled={isPending}
                defaultValue={initialData.description}
                placeholder="Conte um pouco sobre sua história, especialidades e diferenciais..."
                className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

        </div>

        {/* Botão de Ação com Feedback de Loading */}
        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando configurações...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>

      </div>
    </form>
  );
}
