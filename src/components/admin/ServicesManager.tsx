"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createServiceAction,
  updateServiceAction,
  toggleServiceStatusAction,
  deleteServiceAction,
} from "@/services/service.actions";
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

interface ServicesManagerProps {
  initialServices: ServiceItem[];
}

export function ServicesManager({ initialServices }: ServicesManagerProps) {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  
  // Feedback global da página
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Erro específico dentro do modal
  const [modalError, setModalError] = useState<string | null>(null);

  // Estado de carregamento geral e por item
  const [isPending, startTransition] = useTransition();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  // Sincroniza initialServices caso o Server Component recarregue
  // (caso props mudem via router.refresh)
  if (initialServices !== services && !isPending && pendingItemId === null && !isModalOpen) {
    // Apenas se houver alteração externa
  }

  // Abre modal para novo serviço
  const handleOpenCreateModal = () => {
    setEditingService(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Abre modal para edição
  const handleOpenEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Fecha modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setModalError(null);
  };

  // Submissão do formulário (Criar ou Editar)
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      let result;
      if (editingService) {
        formData.append("id", editingService.id);
        result = await updateServiceAction({}, formData);
      } else {
        result = await createServiceAction({}, formData);
      }

      if (result.error) {
        console.error("[ServicesManager] Erro retornado pela action:", result.error);
        // Exibe erro dentro do modal sem fechar
        setModalError(result.error);
      } else {
        setFeedback({
          type: "success",
          message: result.message || "Operação realizada com sucesso!",
        });
        handleCloseModal();
        router.refresh();
      }
    });
  };

  // Alternar status Ativo/Inativo
  const handleToggleStatus = (service: ServiceItem) => {
    setPendingItemId(service.id);
    setFeedback(null);

    startTransition(async () => {
      const result = await toggleServiceStatusAction(service.id, service.is_active);
      if (result.error) {
        console.error("[ServicesManager] Erro ao alternar status:", result.error);
        setFeedback({ type: "error", message: result.error });
      } else {
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, is_active: !s.is_active } : s
          )
        );
        router.refresh();
      }
      setPendingItemId(null);
    });
  };

  // Excluir serviço
  const handleDelete = (serviceId: string, serviceName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o serviço "${serviceName}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    setPendingItemId(serviceId);
    setFeedback(null);

    startTransition(async () => {
      const result = await deleteServiceAction(serviceId);
      if (result.error) {
        console.error("[ServicesManager] Erro ao excluir serviço:", result.error);
        setFeedback({ type: "error", message: result.error });
      } else {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        setFeedback({
          type: "success",
          message: `Serviço "${serviceName}" excluído com sucesso.`,
        });
        router.refresh();
      }
      setPendingItemId(null);
    });
  };

  // Formatador de Moeda BRL
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Catálogo de Serviços ({services.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os serviços oferecidos com valores, tempo estimado e disponibilidade.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-60 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Novo Serviço</span>
        </button>
      </div>

      {/* Global Feedback Messages */}
      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}
          <div className="flex-1">
            <p className="font-semibold">
              {feedback.type === "success" ? "Sucesso" : "Erro na Operação"}
            </p>
            <p className="mt-0.5 text-xs">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Services List / Cards */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <Scissors className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900">
            Nenhum serviço cadastrado ainda
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Cadastre seu primeiro serviço para que ele fique visível no catálogo e no sistema de agendamento online.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Meu Primeiro Serviço</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const isItemPending = isPending && pendingItemId === service.id;

            return (
              <div
                key={service.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition bg-white ${
                  service.is_active
                    ? "border-slate-200 hover:border-slate-300"
                    : "border-slate-200 bg-slate-50/70 opacity-75"
                }`}
              >
                <div>
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          service.is_active
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                            : "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20"
                        }`}
                      >
                        {service.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(service)}
                      disabled={isPending}
                      title={
                        service.is_active
                          ? "Desativar serviço"
                          : "Ativar serviço"
                      }
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-50 transition"
                    >
                      {isItemPending ? (
                        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                      ) : service.is_active ? (
                        <ToggleRight className="h-6 w-6 text-teal-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Título & Descrição */}
                  <h3 className="mt-3 text-base font-bold text-slate-900 leading-snug">
                    {service.name}
                  </h3>
                  {service.description ? (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {service.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs italic text-slate-400">
                      Sem descrição detalhada.
                    </p>
                  )}
                </div>

                {/* Detalhes de Preço e Duração */}
                <div className="mt-5 border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    {service.price !== null && Number(service.price) > 0 ? (
                      <span className="flex items-center gap-1.5 font-bold text-teal-800 text-sm">
                        <DollarSign className="h-4 w-4 text-teal-600" />
                        {formatCurrency(Number(service.price))}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Sob Consulta / Orçamento
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {service.duration_minutes} min
                    </span>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-2">
                    <button
                      onClick={() => handleOpenEditModal(service)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(service.id, service.name)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                    >
                      {isItemPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Serviço */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </h3>
                <p className="text-xs text-slate-500">
                  Preencha as informações do serviço e seus parâmetros de atendimento.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isPending}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mensagem de Erro Vermelha dentro do Modal */}
            {modalError && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold">Erro ao salvar serviço:</p>
                  <p className="mt-0.5">{modalError}</p>
                </div>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              
              {/* Nome */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Nome do Serviço *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  disabled={isPending}
                  defaultValue={editingService?.name || ""}
                  placeholder="Ex: Corte Masculino Degradê"
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Preço e Duração */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="price"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Preço (R$)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">(Opcional)</span>
                  </div>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs font-bold">
                      R$
                    </div>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isPending}
                      defaultValue={editingService?.price && editingService.price > 0 ? editingService.price : ""}
                      placeholder="Deixe em branco para Sob Consulta"
                      className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Deixe em branco para exibir &quot;Sob Consulta / Orçamento Gratuito&quot;.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="durationMinutes"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Duração (minutos) *
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <input
                      id="durationMinutes"
                      name="durationMinutes"
                      type="number"
                      min="5"
                      max="720"
                      step="5"
                      required
                      disabled={isPending}
                      defaultValue={editingService?.duration_minutes || 30}
                      placeholder="30"
                      className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Descrição Detalhada (Opcional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  disabled={isPending}
                  defaultValue={editingService?.description || ""}
                  placeholder="Descreva o que está incluso no procedimento, produtos utilizados, etc."
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Status Ativo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  disabled={isPending}
                  defaultChecked={
                    editingService !== null ? editingService.is_active : true
                  }
                  className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="isActive"
                  className="text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Serviço ativo e disponível para agendamento online
                </label>
              </div>

              {/* Botões do Modal com Feedback de Loading */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isPending}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Salvando no banco...</span>
                    </>
                  ) : (
                    <span>{editingService ? "Atualizar Serviço" : "Salvar Serviço"}</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
