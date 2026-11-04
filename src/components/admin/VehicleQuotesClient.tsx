"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CarFront,
  Wrench,
  Search,
  Plus,
  History,
  MessageCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  User,
  Phone,
  Pencil,
  Trash2,
  X,
  Loader2,
  Filter,
  Gauge,
  Play,
  Send,
  XCircle,
  Check,
  ClipboardCheck,
  Camera,
  Fuel,
  Copy,
  ExternalLink,
  BellRing,
  Calculator,
} from "lucide-react";
import {
  createAdminVehicleQuoteAction,
  updateVehicleQuoteAction,
  updateVehicleQuoteStatusAction,
  deleteVehicleQuoteAction,
  createMaintenanceScheduleAction,
  saveVehicleInspectionAction,
  completeQuoteWithMaintenanceCalculatorAction,
  markPostSaleContactedAction,
} from "@/services/vehicle-quote.actions";
import {
  formatLicensePlateDisplay,
  normalizeLicensePlate,
} from "@/lib/validations/vehicle-quote.schema";
import { compressAndUploadAutomotivePhoto } from "@/utils/image-compression";
import { sanitizePhoneNumber } from "@/utils/phone";
import type {
  VehicleQuote,
  VehicleQuoteStatus,
  VehicleMaintenanceSchedule,
  VehicleInspection,
} from "@/types";

interface VehicleQuotesClientProps {
  initialQuotes: VehicleQuote[];
  initialSchedules: VehicleMaintenanceSchedule[];
  initialInspections?: VehicleInspection[];
  tenantName: string;
  initialPlateFilter?: string;
  initialStatusFilter?: string;
}

const VALID_STATUS_FILTERS = new Set([
  "all",
  "pending",
  "quoted",
  "approved",
  "in_progress",
  "completed",
]);

const FUEL_LEVEL_OPTIONS = ["1/4", "1/2", "3/4", "Cheio"] as const;

const INSPECTION_PHOTO_SLOTS = [
  { index: 0, label: "Frente" },
  { index: 1, label: "Traseira" },
  { index: 2, label: "Lateral Esquerda" },
  { index: 3, label: "Lateral Direita" },
] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: "Aguardando Avaliação",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    dotClass: "bg-amber-500",
  },
  quoted: {
    label: "Orçamento Enviado",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
    dotClass: "bg-blue-500",
  },
  approved: {
    label: "Aprovado pelo Cliente",
    badgeClass: "bg-indigo-100 text-indigo-900 border-indigo-300",
    dotClass: "bg-indigo-500",
  },
  in_progress: {
    label: "Em Execução na Oficina",
    badgeClass: "bg-purple-100 text-purple-900 border-purple-300",
    dotClass: "bg-purple-500",
  },
  completed: {
    label: "Serviço Concluído",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
    dotClass: "bg-emerald-500",
  },
  canceled: {
    label: "Recusado / Cancelado",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
    dotClass: "bg-slate-400",
  },
  rejected: {
    label: "Recusado / Cancelado",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
    dotClass: "bg-slate-400",
  },
};

function addMonthsToDateStr(monthsToAdd: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsToAdd);
  return d.toISOString().split("T")[0];
}

export function VehicleQuotesClient({
  initialQuotes,
  initialSchedules,
  initialInspections = [],
  tenantName,
  initialPlateFilter = "",
  initialStatusFilter = "all",
}: VehicleQuotesClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [quotes, setQuotes] = useState<VehicleQuote[]>(initialQuotes);
  const [schedules, setSchedules] =
    useState<VehicleMaintenanceSchedule[]>(initialSchedules);
  const [inspections, setInspections] =
    useState<VehicleInspection[]>(initialInspections);

  const [statusFilter, setStatusFilter] = useState<string>(
    VALID_STATUS_FILTERS.has(initialStatusFilter) ? initialStatusFilter : "all"
  );
  const [plateSearch, setPlateSearch] = useState<string>(initialPlateFilter);
  const [inspectedPlate, setInspectedPlate] = useState<string | null>(
    initialPlateFilter ? normalizeLicensePlate(initialPlateFilter) : null
  );
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Modal Novo Orçamento Manual
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newComplaint, setNewComplaint] = useState("");
  const [newPartsCost, setNewPartsCost] = useState("");
  const [newLaborCost, setNewLaborCost] = useState("");
  const [newMechanicNotes, setNewMechanicNotes] = useState("");
  const [newStatus, setNewStatus] = useState<VehicleQuoteStatus>("pending");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Editar / Avaliar Orçamento (+ 3 Fotos de Peças Danificadas)
  const [editingQuote, setEditingQuote] = useState<VehicleQuote | null>(null);
  const [editStatus, setEditStatus] = useState<VehicleQuoteStatus>("pending");
  const [editPartsCost, setEditPartsCost] = useState<string>("0");
  const [editLaborCost, setEditLaborCost] = useState<string>("0");
  const [editMechanicNotes, setEditMechanicNotes] = useState<string>("");
  const [editVehicleModel, setEditVehicleModel] = useState<string>("");
  const [editComplaint, setEditComplaint] = useState<string>("");
  const [editDamagedPhotos, setEditDamagedPhotos] = useState<string[]>([]);
  const [uploadingDamagedSlot, setUploadingDamagedSlot] = useState<
    number | null
  >(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal Checklist Digital de Entrada (Vistoria Rápida no Celular)
  const [inspectingQuote, setInspectingQuote] = useState<VehicleQuote | null>(
    null
  );
  const [inspEntryKm, setInspEntryKm] = useState<string>("");
  const [inspFuelLevel, setInspFuelLevel] =
    useState<(typeof FUEL_LEVEL_OPTIONS)[number]>("1/2");
  const [inspSpareTire, setInspSpareTire] = useState<boolean>(true);
  const [inspJackTool, setInspJackTool] = useState<boolean>(true);
  const [inspPhotos, setInspPhotos] = useState<string[]>(["", "", "", ""]);
  const [uploadingInspSlot, setUploadingInspSlot] = useState<number | null>(
    null
  );
  const [inspScratchNotes, setInspScratchNotes] = useState<string>("");
  const [isSavingInspection, setIsSavingInspection] = useState<boolean>(false);

  // Modal Calculadora de Próxima Revisão por KM (Ao Concluir Serviço)
  const [completingQuote, setCompletingQuote] = useState<VehicleQuote | null>(
    null
  );
  const [calcCurrentKm, setCalcCurrentKm] = useState<string>("");
  const [calcOilSelected, setCalcOilSelected] = useState<boolean>(true);
  const [calcBeltSelected, setCalcBeltSelected] = useState<boolean>(true);
  const [calcBrakesSelected, setCalcBrakesSelected] = useState<boolean>(true);
  const [isCompletingWithCalc, setIsCompletingWithCalc] =
    useState<boolean>(false);

  // Modal Programar Revisão Preventiva Avulsa
  const [schedulingFromQuote, setSchedulingFromQuote] =
    useState<VehicleQuote | null>(null);
  const [revServiceType, setRevServiceType] = useState(
    "Troca de Óleo e Filtros + Revisão Preventiva"
  );
  const [revDueDate, setRevDueDate] = useState(() => addMonthsToDateStr(6));
  const [revDueKm, setRevDueKm] = useState("");
  const [revNotes, setRevNotes] = useState("");
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(
    null
  );

  // Exclusão
  const [deletingQuote, setDeletingQuote] = useState<VehicleQuote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  useEffect(() => {
    setInspections(initialInspections);
  }, [initialInspections]);

  // Mapa rápido de vistoria por quote_id
  const inspectionByQuoteId = useMemo(() => {
    const map = new Map<string, VehicleInspection>();
    for (const insp of inspections) {
      if (insp.quote_id && !map.has(insp.quote_id)) {
        map.set(insp.quote_id, insp);
      }
    }
    return map;
  }, [inspections]);

  const formatCurrency = (val: number | null | undefined) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(val) || 0);
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Verifica se um serviço concluído atingiu 7 dias ou mais sem contato pós-venda
  const isPostSalePending7Days = (q: VehicleQuote): boolean => {
    if (q.status !== "completed") return false;
    if (q.post_sale_contacted) return false;
    const refIso = q.approved_at || q.created_at;
    if (!refIso) return true;
    const refDate = new Date(refIso);
    if (isNaN(refDate.getTime())) return true;
    const diffMs = Date.now() - refDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  };

  // Placas únicas cadastradas para atalho de histórico
  const uniquePlates = useMemo(() => {
    const map = new Map<
      string,
      { plate: string; display: string; model: string; count: number }
    >();
    for (const q of quotes) {
      const clean = normalizeLicensePlate(q.license_plate);
      if (!clean) continue;
      const existing = map.get(clean);
      if (existing) {
        existing.count += 1;
        if (!existing.model && q.vehicle_model) existing.model = q.vehicle_model;
      } else {
        map.set(clean, {
          plate: clean,
          display: q.plate_display || formatLicensePlateDisplay(clean),
          model: q.vehicle_model || "Veículo",
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [quotes]);

  // Dados do Dossiê / Histórico Completo da Placa inspecionada
  const plateHistoryData = useMemo(() => {
    const activePlate = inspectedPlate
      ? normalizeLicensePlate(inspectedPlate)
      : plateSearch.trim().length >= 3
      ? normalizeLicensePlate(plateSearch)
      : null;

    if (!activePlate || activePlate.length < 3) return null;

    const matchingQuotes = quotes.filter((q) =>
      normalizeLicensePlate(q.license_plate).includes(activePlate)
    );
    const matchingSchedules = schedules.filter((s) =>
      normalizeLicensePlate(s.license_plate).includes(activePlate)
    );

    if (matchingQuotes.length === 0 && matchingSchedules.length === 0) {
      return {
        plate: formatLicensePlateDisplay(activePlate),
        vehicleModel: null,
        clientName: null,
        clientPhone: null,
        quotes: [],
        schedules: [],
        totalSpent: 0,
      };
    }

    const latestQuote = matchingQuotes[0];
    const latestSchedule = matchingSchedules[0];
    const totalSpent = matchingQuotes
      .filter((q) => q.status === "completed" || q.status === "approved")
      .reduce((acc, q) => acc + (Number(q.total_cost) || 0), 0);

    return {
      plate:
        latestQuote?.plate_display ||
        formatLicensePlateDisplay(
          latestQuote?.license_plate ||
            latestSchedule?.license_plate ||
            activePlate
        ),
      vehicleModel:
        latestQuote?.vehicle_model || latestSchedule?.vehicle_model || "Veículo",
      clientName:
        latestQuote?.client_name || latestSchedule?.client_name || "Cliente",
      clientPhone:
        latestQuote?.client_phone || latestSchedule?.client_phone || "",
      quotes: matchingQuotes,
      schedules: matchingSchedules,
      totalSpent,
    };
  }, [inspectedPlate, plateSearch, quotes, schedules]);

  // Filtro da lista principal de orçamentos
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (statusFilter !== "all" && q.status !== statusFilter) {
        return false;
      }
      if (plateSearch.trim()) {
        const term = plateSearch.trim().toLowerCase();
        const cleanTerm = normalizeLicensePlate(plateSearch).toLowerCase();
        const plateMatch =
          q.license_plate?.toLowerCase().includes(cleanTerm || term) ||
          q.plate_display?.toLowerCase().includes(term);
        const modelMatch = q.vehicle_model?.toLowerCase().includes(term);
        const clientMatch =
          q.client_name?.toLowerCase().includes(term) ||
          q.client_phone?.toLowerCase().includes(term);
        const complaintMatch = q.complaint?.toLowerCase().includes(term);
        return Boolean(plateMatch || modelMatch || clientMatch || complaintMatch);
      }
      return true;
    });
  }, [quotes, statusFilter, plateSearch]);

  // Contadores KPIs
  const pendingCount = quotes.filter((q) => q.status === "pending").length;
  const activeCount = quotes.filter(
    (q) =>
      q.status === "quoted" ||
      q.status === "approved" ||
      q.status === "in_progress"
  ).length;
  const completedCount = quotes.filter((q) => q.status === "completed").length;
  const postSalePendingCount = quotes.filter((q) =>
    isPostSalePending7Days(q)
  ).length;
  const totalVolume = quotes.reduce(
    (sum, q) => sum + (Number(q.total_cost) || 0),
    0
  );

  // Revisões com vencimento nos próximos 30 dias ou atrasadas
  const upcomingSchedulesCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return schedules.filter((s) => {
      if (s.status === "completed" || s.status === "canceled") return false;
      const due = new Date(`${s.due_date}T00:00:00`);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      return diffDays <= 30;
    }).length;
  }, [schedules]);

  // Handlers de filtro de status
  const handleSelectStatusFilter = (nextStatus: string) => {
    setStatusFilter(nextStatus);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextStatus === "all") {
        url.searchParams.delete("status");
      } else {
        url.searchParams.set("status", nextStatus);
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Abre a Calculadora de Próxima Revisão por KM ao concluir um orçamento
  const handleOpenCompletionCalculator = (q: VehicleQuote) => {
    setFormError(null);
    const existingInsp = inspectionByQuoteId.get(q.id);
    setCalcCurrentKm(
      existingInsp?.entry_km ? String(existingInsp.entry_km) : ""
    );
    setCalcOilSelected(true);
    setCalcBeltSelected(true);
    setCalcBrakesSelected(true);
    setCompletingQuote(q);
  };

  const handleConfirmCompletionCalculator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingQuote) return;

    setIsCompletingWithCalc(true);
    setFormError(null);

    const baseKm = Number(calcCurrentKm) || 0;
    const itemsToCreate: Array<{
      serviceType: string;
      dueDate: string;
      dueKm?: number | null;
      notes?: string | null;
    }> = [];

    if (calcOilSelected) {
      itemsToCreate.push({
        serviceType: "Troca de Óleo e Filtros",
        dueDate: addMonthsToDateStr(6),
        dueKm: baseKm > 0 ? baseKm + 10000 : null,
        notes:
          baseKm > 0
            ? `Calculado em ${baseKm.toLocaleString("pt-BR")} km (+10.000 km ou 6 meses)`
            : "Revisão programada para +6 meses",
      });
    }

    if (calcBeltSelected) {
      itemsToCreate.push({
        serviceType: "Correia Dentada e Tensores",
        dueDate: addMonthsToDateStr(24),
        dueKm: baseKm > 0 ? baseKm + 40000 : null,
        notes:
          baseKm > 0
            ? `Calculado em ${baseKm.toLocaleString("pt-BR")} km (+40.000 km ou 2 anos)`
            : "Revisão programada para +2 anos",
      });
    }

    if (calcBrakesSelected) {
      itemsToCreate.push({
        serviceType: "Revisão de Freios",
        dueDate: addMonthsToDateStr(12),
        dueKm: baseKm > 0 ? baseKm + 20000 : null,
        notes: "Revisão preventiva de freios (+12 meses)",
      });
    }

    const res = await completeQuoteWithMaintenanceCalculatorAction({
      quoteId: completingQuote.id,
      currentKm: baseKm > 0 ? baseKm : null,
      items: itemsToCreate,
    });

    setIsCompletingWithCalc(false);

    if (!res.success || !res.data) {
      setFormError(
        res.error || "Não foi possível concluir o serviço e agendar revisões."
      );
      return;
    }

    const { quote: updatedQuote, schedules: createdSchedules } = res.data;
    setQuotes((prev) =>
      prev.map((item) => (item.id === updatedQuote.id ? updatedQuote : item))
    );
    if (createdSchedules.length > 0) {
      setSchedules((prev) => [...prev, ...createdSchedules]);
    }

    const plateLabel =
      updatedQuote.plate_display ||
      formatLicensePlateDisplay(updatedQuote.license_plate);
    setCompletingQuote(null);
    setStatusFeedback(
      `Serviço da placa ${plateLabel} concluído e ${createdSchedules.length} revisão(ões) programada(s) automaticamente!`
    );
    setTimeout(() => setStatusFeedback(null), 4000);

    startTransition(() => {
      router.refresh();
    });
  };

  const handleQuickStatusChange = async (
    q: VehicleQuote,
    nextStatus: VehicleQuoteStatus,
    openPreventiveModalOnComplete = false
  ) => {
    // Se o novo status for "completed", abre o modal da Calculadora de Próxima Revisão por KM!
    if (nextStatus === "completed" || openPreventiveModalOnComplete) {
      handleOpenCompletionCalculator(q);
      return;
    }

    if (updatingStatusId === q.id) return;
    const previousStatus = q.status;
    setUpdatingStatusId(q.id);
    setFormError(null);

    setQuotes((prev) =>
      prev.map((item) =>
        item.id === q.id ? { ...item, status: nextStatus } : item
      )
    );

    const res = await updateVehicleQuoteStatusAction(q.id, nextStatus);
    setUpdatingStatusId(null);

    if (!res.success || !res.data) {
      setQuotes((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, status: previousStatus } : item
        )
      );
      setFormError(
        res.error || "Não foi possível atualizar o status do orçamento."
      );
      return;
    }

    const updatedQuote = res.data;
    setQuotes((prev) =>
      prev.map((item) => (item.id === updatedQuote.id ? updatedQuote : item))
    );

    const statusLabel = STATUS_CONFIG[nextStatus]?.label || nextStatus;
    const plateLabel =
      updatedQuote.plate_display ||
      formatLicensePlateDisplay(updatedQuote.license_plate);
    setStatusFeedback(
      `Status da placa ${plateLabel} atualizado para "${statusLabel}".`
    );
    setTimeout(() => setStatusFeedback(null), 3500);

    startTransition(() => {
      router.refresh();
    });
  };

  // Handlers de Vistoria Digital de Entrada
  const handleOpenInspectionModal = (q: VehicleQuote) => {
    setFormError(null);
    const existing = inspectionByQuoteId.get(q.id);
    setInspectingQuote(q);
    setInspEntryKm(existing?.entry_km ? String(existing.entry_km) : "");
    setInspFuelLevel(
      (existing?.fuel_level as (typeof FUEL_LEVEL_OPTIONS)[number]) || "1/2"
    );
    setInspSpareTire(existing?.spare_tire ?? true);
    setInspJackTool(existing?.jack_tool ?? true);
    const savedPhotos = Array.isArray(existing?.photos) ? existing!.photos! : [];
    setInspPhotos([
      savedPhotos[0] || "",
      savedPhotos[1] || "",
      savedPhotos[2] || "",
      savedPhotos[3] || "",
    ]);
    setInspScratchNotes(existing?.scratch_notes || "");
  };

  const handleUploadInspectionPhotoSlot = async (
    slotIndex: number,
    file: File | null
  ) => {
    if (!file || !inspectingQuote) return;
    setUploadingInspSlot(slotIndex);
    setFormError(null);

    const res = await compressAndUploadAutomotivePhoto(
      file,
      "inspections",
      inspectingQuote.license_plate
    );
    setUploadingInspSlot(null);

    if (!res.success || !res.url) {
      setFormError(res.error || "Falha ao comprimir/enviar foto da vistoria.");
      return;
    }

    setInspPhotos((prev) => {
      const next = [...prev];
      next[slotIndex] = res.url!;
      return next;
    });
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingQuote) return;
    setIsSavingInspection(true);
    setFormError(null);

    const res = await saveVehicleInspectionAction({
      quoteId: inspectingQuote.id,
      licensePlate: inspectingQuote.license_plate,
      entryKm: inspEntryKm ? Number(inspEntryKm) : null,
      fuelLevel: inspFuelLevel,
      spareTire: inspSpareTire,
      jackTool: inspJackTool,
      photos: inspPhotos.filter(Boolean),
      scratchNotes: inspScratchNotes,
    });

    setIsSavingInspection(false);

    if (!res.success || !res.data) {
      setFormError(res.error || "Erro ao salvar vistoria de entrada.");
      return;
    }

    const saved = res.data;
    setInspections((prev) => {
      const others = prev.filter((i) => i.quote_id !== saved.quote_id);
      return [saved, ...others];
    });
    setInspectingQuote(null);
    setStatusFeedback(
      `Vistoria de entrada salva com sucesso para a placa ${formatLicensePlateDisplay(
        saved.license_plate
      )}!`
    );
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  // Handlers de Avaliar / Editar Orçamento (+ Fotos de Peças Danificadas)
  const handleOpenEdit = (q: VehicleQuote) => {
    setFormError(null);
    setEditingQuote(q);
    setEditStatus((q.status as VehicleQuoteStatus) || "pending");
    setEditPartsCost(String(Number(q.parts_cost) || 0));
    setEditLaborCost(String(Number(q.labor_cost) || 0));
    setEditMechanicNotes(q.mechanic_notes || "");
    setEditVehicleModel(q.vehicle_model || "");
    setEditComplaint(q.complaint || "");
    setEditDamagedPhotos(
      Array.isArray(q.damaged_parts_photos)
        ? q.damaged_parts_photos.filter(Boolean).slice(0, 3)
        : []
    );
  };

  const handleUploadDamagedPhoto = async (
    slotIndex: number,
    file: File | null
  ) => {
    if (!file || !editingQuote) return;
    setUploadingDamagedSlot(slotIndex);
    setFormError(null);

    const res = await compressAndUploadAutomotivePhoto(
      file,
      "damaged-parts",
      editingQuote.license_plate
    );
    setUploadingDamagedSlot(null);

    if (!res.success || !res.url) {
      setFormError(
        res.error || "Erro ao enviar foto da peça danificada / laudo."
      );
      return;
    }

    setEditDamagedPhotos((prev) => {
      const next = [...prev];
      next[slotIndex] = res.url!;
      return next.filter(Boolean).slice(0, 3);
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    setIsSavingEdit(true);
    setFormError(null);

    const res = await updateVehicleQuoteAction({
      id: editingQuote.id,
      status: editStatus,
      partsCost: Number(editPartsCost) || 0,
      laborCost: Number(editLaborCost) || 0,
      mechanicNotes: editMechanicNotes,
      vehicleModel: editVehicleModel,
      complaint: editComplaint,
      damagedPartsPhotos: editDamagedPhotos.filter(Boolean).slice(0, 3),
    });

    setIsSavingEdit(false);

    if (!res.success || !res.data) {
      setFormError(res.error || "Erro ao salvar alterações.");
      return;
    }

    const updatedQuote = res.data;
    const becameCompleted =
      editStatus === "completed" && editingQuote.status !== "completed";

    setQuotes((prev) =>
      prev.map((item) => (item.id === updatedQuote.id ? updatedQuote : item))
    );
    setEditingQuote(null);

    if (becameCompleted) {
      handleOpenCompletionCalculator(updatedQuote);
    }

    startTransition(() => {
      router.refresh();
    });
  };

  // Links públicos de aprovação online (/orcamento/[token])
  const getPublicQuoteUrl = (q: VehicleQuote): string => {
    if (!q.public_token) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/orcamento/${q.public_token}`;
  };

  const handleCopyPublicQuoteLink = async (q: VehicleQuote) => {
    const link = getPublicQuoteUrl(q);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedTokenId(q.id);
      setTimeout(() => setCopiedTokenId(null), 2500);
    } catch (err) {
      console.error("Erro ao copiar link do orçamento:", err);
    }
  };

  // Monta link de WhatsApp para enviar orçamento + link público de aprovação online para o cliente
  const buildClientQuoteWhatsAppUrl = (q: VehicleQuote) => {
    const cleanPhone = sanitizePhoneNumber(q.client_phone);
    const targetPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    const plateDisplay =
      q.plate_display || formatLicensePlateDisplay(q.license_plate);
    const total = Number(q.total_cost) || 0;
    const parts = Number(q.parts_cost) || 0;
    const labor = Number(q.labor_cost) || 0;
    const publicLink = getPublicQuoteUrl(q);

    const costDetails =
      total > 0
        ? `\n💰 *Resumo de Valores:*\n` +
          `• Peças/Insumos: ${formatCurrency(parts)}\n` +
          `• Mão de Obra: ${formatCurrency(labor)}\n` +
          `• *Valor Total:* *${formatCurrency(total)}*\n`
        : "";

    const notesBlock = q.mechanic_notes
      ? `\n📋 *Diagnóstico / Parecer Técnico:*\n${q.mechanic_notes}\n`
      : "";

    const approvalLinkBlock = publicLink
      ? `\n🔗 *Confira as fotos técnicas e Aprove seu Orçamento Online em 1 clique:*\n${publicLink}\n`
      : "";

    const msg =
      `Olá, *${q.client_name}*! Tudo bem? 👋\n` +
      `Aqui é da equipe *${tenantName}* 🚗🔧\n\n` +
      `Segue o orçamento detalhado do seu veículo:\n` +
      `🪪 *Placa:* ${plateDisplay}\n` +
      `🚘 *Veículo:* ${q.vehicle_model || "Informado na triagem"}\n` +
      `🛠️ *Solicitação:* ${q.complaint || "Avaliação técnica"}` +
      `${notesBlock}${costDetails}${approvalLinkBlock}\n` +
      `Ficamos à disposição!`;

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Handler Pós-Venda Automático de 7 Dias
  const handlePostSaleWhatsAppClick = async (q: VehicleQuote) => {
    const cleanPhone = sanitizePhoneNumber(q.client_phone);
    const targetPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    const plateDisplay =
      q.plate_display || formatLicensePlateDisplay(q.license_plate);
    const vehicleLabel = q.vehicle_model || "veículo";

    const msg = `Olá, ${q.client_name}! Tudo bem? Aqui é da ${tenantName}. Passando para checar se o seu ${vehicleLabel} (Placa ${plateDisplay}) está rodando 100% após a revisão da semana passada. Qualquer dúvida estamos à disposição!`;
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(
      msg
    )}`;

    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    // Marca post_sale_contacted = true imediatamente
    setQuotes((prev) =>
      prev.map((item) =>
        item.id === q.id ? { ...item, post_sale_contacted: true } : item
      )
    );
    await markPostSaleContactedAction(q.id);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setFormError(null);

    const res = await createAdminVehicleQuoteAction({
      licensePlate: newPlate,
      vehicleModel: newModel,
      clientName: newClientName,
      clientPhone: newClientPhone,
      complaint: newComplaint,
      partsCost: Number(newPartsCost) || 0,
      laborCost: Number(newLaborCost) || 0,
      mechanicNotes: newMechanicNotes,
      status: newStatus,
    });

    setIsCreating(false);

    if (!res.success || !res.data) {
      setFormError(res.error || "Erro ao criar orçamento.");
      return;
    }

    setQuotes((prev) => [res.data!, ...prev]);
    setIsNewModalOpen(false);
    setNewPlate("");
    setNewModel("");
    setNewClientName("");
    setNewClientPhone("");
    setNewComplaint("");
    setNewPartsCost("");
    setNewLaborCost("");
    setNewMechanicNotes("");
    setNewStatus("pending");
  };

  const handleCreateScheduleFromQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingFromQuote) return;
    setIsCreatingSchedule(true);
    setFormError(null);

    const res = await createMaintenanceScheduleAction({
      licensePlate: schedulingFromQuote.license_plate,
      vehicleModel: schedulingFromQuote.vehicle_model || "",
      clientName: schedulingFromQuote.client_name,
      clientPhone: schedulingFromQuote.client_phone,
      serviceType: revServiceType,
      lastServiceDate: new Date().toISOString().split("T")[0],
      dueDate: revDueDate,
      dueKm: revDueKm ? Number(revDueKm) : null,
      status: "scheduled",
      notes: revNotes || null,
    });

    setIsCreatingSchedule(false);

    if (!res.success || !res.data) {
      setFormError(res.error || "Erro ao programar revisão preventiva.");
      return;
    }

    setSchedules((prev) => [...prev, res.data!]);
    setScheduleSuccessMsg(
      `Revisão programada com sucesso para a placa ${formatLicensePlateDisplay(
        schedulingFromQuote.license_plate
      )}!`
    );
    setTimeout(() => {
      setSchedulingFromQuote(null);
      setScheduleSuccessMsg(null);
    }, 1500);
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuote) return;
    setIsDeleting(true);
    const res = await deleteVehicleQuoteAction(deletingQuote.id);
    setIsDeleting(false);
    if (res.success) {
      setQuotes((prev) => prev.filter((q) => q.id !== deletingQuote.id));
      setDeletingQuote(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Abas Superiores de Navegação do Módulo Automotivo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orcamentos"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition"
          >
            <CarFront className="h-4 w-4 text-blue-400" />
            <span>Orçamentos & Histórico por Placa</span>
          </Link>

          <Link
            href="/admin/revisoes"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            <CalendarClock className="h-4 w-4 text-teal-700" />
            <span>Revisões Preventivas</span>
            {upcomingSchedulesCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                {upcomingSchedulesCount}
              </span>
            )}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Orçamento por Placa</span>
        </button>
      </div>

      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <CarFront className="h-6 w-6 text-blue-600" />
            <span>Orçamentos Inteligentes & Operação da Oficina</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Faça vistoria digital de entrada, anexe fotos de peças danificadas, envie link de aprovação online e calcule próximas revisões por KM.
          </p>
        </div>
      </div>

      {/* Cards de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Aguardando Avaliação
          </span>
          <p className="text-2xl font-black text-amber-950 mt-1">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            Orçados / Em Serviço
          </span>
          <p className="text-2xl font-black text-blue-950 mt-1">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Serviços Concluídos
            </span>
            {postSalePendingCount > 0 && (
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">
                {postSalePendingCount} Pós-Venda
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {completedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Volume Total Orçado
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalVolume)}
          </p>
        </div>
      </div>

      {/* PAINEL DE CONSULTA DE HISTÓRICO POR PLACA DO CARRO */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
              <History className="h-4 w-4" />
              <span>Prontuário & Histórico Automotivo</span>
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Consultar Histórico de Serviços pela Placa
            </h2>
            <p className="text-xs text-slate-300">
              Digite a placa do veículo para visualizar todas as passagens, queixas, peças trocadas, notas do mecânico e revisões programadas.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={plateSearch}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setPlateSearch(val);
                  if (normalizeLicensePlate(val).length >= 3) {
                    setInspectedPlate(normalizeLicensePlate(val));
                  } else {
                    setInspectedPlate(null);
                  }
                }}
                placeholder="Digite a placa (ex: ABC1D23)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 pl-10 pr-9 py-2.5 text-sm font-mono font-bold uppercase tracking-wider text-white placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              {plateSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPlateSearch("");
                    setInspectedPlate(null);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Atalhos de Placas Cadastradas */}
        {uniquePlates.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">
              Placas recentes:
            </span>
            {uniquePlates.slice(0, 8).map((item) => {
              const isSelected = inspectedPlate === item.plate;
              return (
                <button
                  key={item.plate}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setInspectedPlate(null);
                      setPlateSearch("");
                    } else {
                      setInspectedPlate(item.plate);
                      setPlateSearch(item.display);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition cursor-pointer border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-400 shadow-xs"
                      : "bg-slate-800/90 text-slate-200 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <span>🪪 {item.display}</span>
                  <span className="font-sans font-normal text-[11px] text-slate-300">
                    ({item.count})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Resultado do Histórico Completo por Placa */}
        {plateHistoryData && (
          <div className="mt-4 rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="rounded-lg border-2 border-slate-300 bg-white text-slate-950 overflow-hidden shadow-md shrink-0 min-w-[116px] text-center">
                  <div className="bg-[#003399] text-white text-[8px] font-bold tracking-widest uppercase py-0.5 px-2 flex items-center justify-between">
                    <span>BR</span>
                    <span>BRASIL</span>
                  </div>
                  <div className="px-2.5 py-1 font-mono text-sm font-black tracking-widest">
                    {plateHistoryData.plate}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {plateHistoryData.vehicleModel || "Veículo Consultado"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Proprietário:{" "}
                    <strong className="text-slate-200">
                      {plateHistoryData.clientName || "Não identificado"}
                    </strong>{" "}
                    {plateHistoryData.clientPhone
                      ? `• ${plateHistoryData.clientPhone}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Passagens na Oficina
                  </span>
                  <strong className="text-white text-sm font-extrabold">
                    {plateHistoryData.quotes.length} registro(s)
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Total em Serviços
                  </span>
                  <strong className="text-emerald-400 text-sm font-extrabold">
                    {formatCurrency(plateHistoryData.totalSpent)}
                  </strong>
                </div>
              </div>
            </div>

            {plateHistoryData.quotes.length === 0 &&
            plateHistoryData.schedules.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                Nenhum histórico de orçamento ou revisão encontrado para a placa{" "}
                <strong className="text-white font-mono">
                  {plateHistoryData.plate}
                </strong>
                .
              </p>
            ) : (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
                  Linha do Tempo de Serviços & Orçamentos desta Placa:
                </span>
                <div className="space-y-2.5">
                  {plateHistoryData.quotes.map((hq) => {
                    const st =
                      STATUS_CONFIG[hq.status] || STATUS_CONFIG.pending;
                    return (
                      <div
                        key={hq.id}
                        className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {formatDate(hq.created_at)}
                            </span>
                            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300 border border-slate-700">
                              {st.label}
                            </span>
                            {hq.vehicle_model && (
                              <span className="text-xs text-slate-400">
                                • {hq.vehicle_model}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-200">
                            <strong>Relato/Serviço:</strong>{" "}
                            {hq.complaint || "Avaliação geral"}
                          </p>
                          {hq.mechanic_notes && (
                            <p className="text-xs text-amber-300/90">
                              <strong>Parecer Técnico:</strong>{" "}
                              {hq.mechanic_notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold text-emerald-400 block">
                            {Number(hq.total_cost) > 0
                              ? formatCurrency(hq.total_cost)
                              : "Sob avaliação"}
                          </span>
                          {Number(hq.total_cost) > 0 && (
                            <span className="text-[11px] text-slate-400 block">
                              Peças: {formatCurrency(hq.parts_cost)} | M.O.:{" "}
                              {formatCurrency(hq.labor_cost)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {plateHistoryData.schedules.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Revisões Preventivas Vinculadas a esta Placa:
                    </span>
                    {plateHistoryData.schedules.map((sch) => (
                      <div
                        key={sch.id}
                        className="rounded-xl bg-emerald-950/30 border border-emerald-800/50 p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <strong className="text-emerald-300">
                            🔧 {sch.service_type}
                          </strong>
                          <span className="text-slate-300 ml-2">
                            • Vencimento: {formatDate(sch.due_date)}
                            {sch.due_km ? ` (${sch.due_km} km)` : ""}
                          </span>
                        </div>
                        <Link
                          href="/admin/revisoes"
                          className="text-emerald-400 hover:underline font-bold"
                        >
                          Ver em Revisões →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtros por Status */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mr-1">
            <Filter className="h-3.5 w-3.5 text-blue-600" />
            <span>Status:</span>
          </div>
          {[
            { id: "all", label: "Todos", count: quotes.length },
            { id: "pending", label: "Pendentes", count: pendingCount },
            {
              id: "quoted",
              label: "Orçamento Enviado",
              count: quotes.filter((q) => q.status === "quoted").length,
            },
            {
              id: "approved",
              label: "Aprovados",
              count: quotes.filter((q) => q.status === "approved").length,
            },
            {
              id: "in_progress",
              label: "Em Execução",
              count: quotes.filter((q) => q.status === "in_progress").length,
            },
            { id: "completed", label: "Concluídos", count: completedCount },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelectStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback instantâneo */}
        {statusFeedback && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusFeedback(null)}
              className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Lista de Solicitações de Orçamento */}
      {filteredQuotes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <CarFront className="h-12 w-12 mx-auto text-slate-400" />
          <p className="text-base font-bold text-slate-800">
            Nenhum orçamento encontrado para este filtro.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Quando clientes solicitarem orçamentos pela placa na vitrine pública ou você cadastrar manualmente no balcão, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((q) => {
            const st = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending;
            const plateDisplay =
              q.plate_display || formatLicensePlateDisplay(q.license_plate);
            const total = Number(q.total_cost) || 0;
            const existingInspection = inspectionByQuoteId.get(q.id);
            const damagedPhotos = Array.isArray(q.damaged_parts_photos)
              ? q.damaged_parts_photos.filter(Boolean)
              : [];
            const isPostSalePending = isPostSalePending7Days(q);
            const isPostSaleEligible =
              q.status === "completed" && !q.post_sale_contacted;

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Esquerda: Placa Mercosul, Modelo, Cliente e Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const clean = normalizeLicensePlate(q.license_plate);
                        setInspectedPlate(clean);
                        setPlateSearch(plateDisplay);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      title="Clique para consultar o histórico completo desta placa"
                      className="rounded-xl border-2 border-slate-400 bg-white text-slate-950 overflow-hidden shadow-sm shrink-0 min-w-[124px] text-center hover:scale-105 transition cursor-pointer self-start"
                    >
                      <div className="bg-[#003399] text-white text-[8px] font-extrabold tracking-widest uppercase py-0.5 px-2 flex items-center justify-between">
                        <span>BR</span>
                        <span>BRASIL</span>
                      </div>
                      <div className="px-3 py-1.5 font-mono text-base font-black tracking-widest">
                        {plateDisplay}
                      </div>
                    </button>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                          {q.vehicle_model || "Veículo não especificado"}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}
                          />
                          <span>{st.label}</span>
                        </span>

                        {existingInspection && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                            <ClipboardCheck className="h-3 w-3 text-teal-600" />
                            <span>
                              Vistoria OK
                              {existingInspection.entry_km
                                ? ` (${Number(
                                    existingInspection.entry_km
                                  ).toLocaleString("pt-BR")} km)`
                                : ""}
                            </span>
                          </span>
                        )}

                        {isPostSalePending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 border border-orange-300 px-2.5 py-0.5 text-xs font-extrabold text-orange-900 animate-pulse">
                            <BellRing className="h-3 w-3 text-orange-600" />
                            <span>Pós-Venda Pendente</span>
                          </span>
                        )}

                        {q.status === "completed" && q.post_sale_contacted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            <Check className="h-3 w-3" />
                            <span>Pós-Venda Realizado</span>
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          Solicitado em {formatDate(q.created_at)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>{q.client_name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <a
                            href={`https://wa.me/55${sanitizePhoneNumber(
                              q.client_phone
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-700 hover:underline"
                          >
                            {q.client_phone}
                          </a>
                        </span>
                        {damagedPhotos.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                            <Camera className="h-3.5 w-3.5" />
                            <span>{damagedPhotos.length} foto(s) de peças</span>
                          </span>
                        )}
                      </div>

                      {q.category_tags && q.category_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {q.category_tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direita: Resumo Financeiro do Orçamento */}
                  <div className="flex sm:items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Valor do Orçamento
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {total > 0 ? formatCurrency(total) : "A definir"}
                      </span>
                      {total > 0 && (
                        <span className="text-[11px] text-slate-500 block">
                          Peças: {formatCurrency(q.parts_cost)} • Mão de Obra:{" "}
                          {formatCurrency(q.labor_cost)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descrição do Problema e Parecer do Mecânico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <FileText className="h-3 w-3 text-slate-500" />
                      <span>Relato do Cliente / Descrição do Problema:</span>
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {q.complaint || "Nenhuma descrição informada."}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50/50 border border-amber-200/70 p-3 text-xs space-y-1">
                    <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Wrench className="h-3 w-3 text-amber-700" />
                      <span>Diagnóstico / Notas Técnicas da Oficina:</span>
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {q.mechanic_notes ||
                        "Clique em 'Avaliar / Valores' para registrar o diagnóstico, valores e fotos das peças danificadas."}
                    </p>
                  </div>
                </div>

                {/* Banner de Pós-Venda Automático (7 Dias) para Serviços Concluídos */}
                {isPostSaleEligible && (
                  <div
                    className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPostSalePending
                        ? "border-orange-300 bg-orange-50/90"
                        : "border-emerald-200 bg-emerald-50/50"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                            isPostSalePending
                              ? "bg-orange-500 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          <BellRing className="h-3 w-3" />
                          <span>
                            {isPostSalePending
                              ? "Pós-Venda Pendente (7+ Dias)"
                              : "Pós-Venda Disponível"}
                          </span>
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Acompanhamento de Qualidade • {q.client_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Envie mensagem automática para confirmar se o veículo{" "}
                        <strong>{q.vehicle_model || plateDisplay}</strong> está
                        rodando 100% após o serviço.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePostSaleWhatsAppClick(q)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold text-white shadow-xs transition shrink-0 cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5 fill-white text-emerald-600" />
                      <span>Enviar Pós-Venda no WhatsApp</span>
                    </button>
                  </div>
                )}

                {/* Barra de Ações do Orçamento & Avanço Rápido de Status */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {/* Esquerda: Ações Operacionais & Avanço Rápido */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* BOTÃO 1: FAZER VISTORIA DE ENTRADA */}
                    <button
                      type="button"
                      onClick={() => handleOpenInspectionModal(q)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition cursor-pointer border ${
                        existingInspection
                          ? "border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900"
                          : "border-slate-800 bg-slate-900 hover:bg-slate-800 text-white shadow-2xs"
                      }`}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      <span>
                        {existingInspection
                          ? "Ver / Editar Vistoria"
                          : "Fazer Vistoria de Entrada"}
                      </span>
                    </button>

                    {/* Botões de Ação Rápida por Etapa do Fluxo */}
                    {q.status === "pending" && (
                      <button
                        type="button"
                        disabled={updatingStatusId === q.id}
                        onClick={() => handleQuickStatusChange(q, "quoted")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                      >
                        {updatingStatusId === q.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Marcar como Orçamento Enviado</span>
                      </button>
                    )}

                    {q.status === "quoted" && (
                      <>
                        <button
                          type="button"
                          disabled={updatingStatusId === q.id}
                          onClick={() => handleQuickStatusChange(q, "approved")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                        >
                          {updatingStatusId === q.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Aprovar Serviço</span>
                        </button>

                        <button
                          type="button"
                          disabled={updatingStatusId === q.id}
                          onClick={() => handleQuickStatusChange(q, "canceled")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Recusar</span>
                        </button>
                      </>
                    )}

                    {q.status === "approved" && (
                      <button
                        type="button"
                        disabled={updatingStatusId === q.id}
                        onClick={() =>
                          handleQuickStatusChange(q, "in_progress")
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                      >
                        {updatingStatusId === q.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        <span>Iniciar Execução</span>
                      </button>
                    )}

                    {q.status === "in_progress" && (
                      <button
                        type="button"
                        disabled={updatingStatusId === q.id}
                        onClick={() => handleOpenCompletionCalculator(q)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Concluir Serviço</span>
                      </button>
                    )}

                    {/* Dropdown Direto de Status */}
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                      <span className="text-[11px] font-bold text-slate-500">
                        Status:
                      </span>
                      <select
                        aria-label={`Alterar status da placa ${plateDisplay}`}
                        disabled={updatingStatusId === q.id}
                        value={
                          q.status === "rejected"
                            ? "canceled"
                            : q.status || "pending"
                        }
                        onChange={(e) => {
                          const next = e.target.value as VehicleQuoteStatus;
                          handleQuickStatusChange(
                            q,
                            next,
                            next === "completed"
                          );
                        }}
                        className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="pending">Pendente</option>
                        <option value="quoted">Orçamento Enviado</option>
                        <option value="approved">Aprovado</option>
                        <option value="in_progress">Em Execução</option>
                        <option value="completed">Concluído</option>
                        <option value="canceled">Recusado / Cancelado</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(q)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 text-xs font-bold text-blue-800 transition cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Avaliar / Valores & Fotos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCompletionCalculator(q)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 text-xs font-bold text-teal-800 transition cursor-pointer"
                      title="Abrir Calculadora de Próxima Revisão por KM"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      <span>Calculadora Revisão KM</span>
                    </button>
                  </div>

                  {/* Direita: Copiar Link do Orçamento, Enviar no WhatsApp e Excluir */}
                  <div className="flex flex-wrap items-center gap-2">
                    {q.public_token && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopyPublicQuoteLink(q)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 transition cursor-pointer"
                          title="Copiar link público de aprovação online"
                        >
                          {copiedTokenId === q.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">
                                Link Copiado!
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                              <span>Copiar Link do Orçamento</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={`/orcamento/${q.public_token}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-700 transition"
                          title="Abrir página pública do orçamento"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </>
                    )}

                    <a
                      href={buildClientQuoteWhatsAppUrl(q)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold text-white shadow-xs transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5 fill-white text-emerald-600" />
                      <span>Enviar Link no WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeletingQuote(q)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Excluir orçamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL A: CHECKLIST DIGITAL DE ENTRADA (VISTORIA RÁPIDA NO CELULAR)    */}
      {/* ===================================================================== */}
      {inspectingQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingInspection) {
              setInspectingQuote(null);
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="h-5 w-5 text-teal-400" />
                <div>
                  <h3 className="text-base font-extrabold">
                    Checklist Digital de Entrada • Placa{" "}
                    {inspectingQuote.plate_display ||
                      formatLicensePlateDisplay(inspectingQuote.license_plate)}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {inspectingQuote.vehicle_model || "Veículo"} • Cliente:{" "}
                    {inspectingQuote.client_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingQuote(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveInspection}
              className="p-6 space-y-5 max-h-[82vh] overflow-y-auto"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {/* 1. Quilometragem de Entrada (KM) e Nível de Combustível */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quilometragem de Entrada (KM)
                  </label>
                  <div className="relative">
                    <Gauge className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      value={inspEntryKm}
                      onChange={(e) => setInspEntryKm(e.target.value)}
                      placeholder="Ex: 58400"
                      className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nível de Combustível
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FUEL_LEVEL_OPTIONS.map((lvl) => {
                      const active = inspFuelLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setInspFuelLevel(lvl)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center justify-center gap-1 ${
                            active
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <Fuel className="h-3 w-3 shrink-0" />
                          <span>[{lvl}]</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Checkboxes Rápidos: Estepe Presente e Chave/Macaco */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">
                      Estepe Presente?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Confirme se o estepe está no porta-malas
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInspSpareTire(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border cursor-pointer ${
                        inspSpareTire
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-600 border-slate-300"
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspSpareTire(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border cursor-pointer ${
                        !inspSpareTire
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-slate-600 border-slate-300"
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </label>

                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">
                      Chave de Roda / Macaco?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Kit de ferramentas de emergência presente
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInspJackTool(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border cursor-pointer ${
                        inspJackTool
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-600 border-slate-300"
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspJackTool(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border cursor-pointer ${
                        !inspJackTool
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-slate-600 border-slate-300"
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </label>
              </div>

              {/* 3. 4 Slots de Upload para Fotos (Frente, Traseira, Lateral Esquerda, Lateral Direita) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    4 Fotos da Vistoria do Veículo (Compressão Automática máx 1280px)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Bucket: establishment-photos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {INSPECTION_PHOTO_SLOTS.map(({ index, label }) => {
                    const photoUrl = inspPhotos[index];
                    const isUploading = uploadingInspSlot === index;

                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex flex-col justify-between gap-2"
                      >
                        <span className="text-[11px] font-extrabold text-slate-700 text-center">
                          {label}
                        </span>

                        {photoUrl ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 bg-slate-900">
                            <img
                              src={photoUrl}
                              alt={label}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setInspPhotos((prev) => {
                                  const next = [...prev];
                                  next[index] = "";
                                  return next;
                                })
                              }
                              className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-600 cursor-pointer"
                              title="Remover foto"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white text-slate-500 hover:text-blue-600 transition cursor-pointer p-2 text-center">
                            {isUploading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            ) : (
                              <>
                                <Camera className="h-5 w-5 mb-1" />
                                <span className="text-[10px] font-bold">
                                  Tirar / Enviar
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleUploadInspectionPhotoSlot(index, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Campo para Anotações de Avarias Pré-existentes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anotações de Avarias Pré-existentes (Arranhões / Amassados)
                </label>
                <textarea
                  rows={3}
                  value={inspScratchNotes}
                  onChange={(e) => setInspScratchNotes(e.target.value)}
                  placeholder="Ex: Pequeno risco no para-choque dianteiro direito; calota traseira esquerda com marca de guia..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectingQuote(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingInspection || uploadingInspSlot !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingInspection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Salvando Vistoria...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-4 w-4" />
                      <span>Salvar Vistoria de Entrada</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL B: CALCULADORA DE PRÓXIMA REVISÃO POR KM (AO CONCLUIR SERVIÇO)  */}
      {/* ===================================================================== */}
      {completingQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCompletingWithCalc) {
              setCompletingQuote(null);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calculator className="h-5 w-5 text-emerald-200" />
                <div>
                  <h3 className="text-base font-extrabold">
                    Concluir Serviço & Calculadora de Revisão por KM
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Placa{" "}
                    {completingQuote.plate_display ||
                      formatLicensePlateDisplay(completingQuote.license_plate)}{" "}
                    • {completingQuote.client_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletingQuote(null)}
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleConfirmCompletionCalculator}
              className="p-6 space-y-4"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quilometragem Atual do Veículo (KM na Entrega) *
                </label>
                <div className="relative">
                  <Gauge className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={calcCurrentKm}
                    onChange={(e) => setCalcCurrentKm(e.target.value)}
                    placeholder="Informe o KM atual do painel (ex: 60000)"
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm font-extrabold text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Próximas Revisões Calculadas Automaticamente:
                </span>

                {/* Item 1: Troca de Óleo e Filtros (+10.000 km ou +6 meses) */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 cursor-pointer hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={calcOilSelected}
                    onChange={(e) => setCalcOilSelected(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between font-extrabold text-slate-900">
                      <span>🛢️ Troca de Óleo e Filtros</span>
                      <span className="text-emerald-700">
                        {Number(calcCurrentKm) > 0
                          ? `${(Number(calcCurrentKm) + 10000).toLocaleString(
                              "pt-BR"
                            )} km`
                          : "+10.000 km"}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      KM Atual + 10.000 km ou vencimento em{" "}
                      <strong>{formatDate(addMonthsToDateStr(6))}</strong> (+6
                      meses)
                    </p>
                  </div>
                </label>

                {/* Item 2: Correia Dentada e Tensores (+40.000 km ou +2 anos) */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 cursor-pointer hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={calcBeltSelected}
                    onChange={(e) => setCalcBeltSelected(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between font-extrabold text-slate-900">
                      <span>⚙️ Correia Dentada e Tensores</span>
                      <span className="text-emerald-700">
                        {Number(calcCurrentKm) > 0
                          ? `${(Number(calcCurrentKm) + 40000).toLocaleString(
                              "pt-BR"
                            )} km`
                          : "+40.000 km"}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      KM Atual + 40.000 km ou vencimento em{" "}
                      <strong>{formatDate(addMonthsToDateStr(24))}</strong> (+2
                      anos)
                    </p>
                  </div>
                </label>

                {/* Item 3: Revisão de Freios (+12 meses) */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 cursor-pointer hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={calcBrakesSelected}
                    onChange={(e) => setCalcBrakesSelected(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between font-extrabold text-slate-900">
                      <span>🛑 Revisão de Freios</span>
                      <span className="text-emerald-700">+12 meses</span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      Vencimento programado para{" "}
                      <strong>{formatDate(addMonthsToDateStr(12))}</strong> (+12
                      meses)
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingQuote(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCompletingWithCalc}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isCompletingWithCalc ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calculando e Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Concluir e Agendar Revisões</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: AVALIAR / EDITAR ORÇAMENTO (+ 3 FOTOS DE PEÇAS DANIFICADAS)  */}
      {/* ===================================================================== */}
      {editingQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingEdit) {
              setEditingQuote(null);
            }
          }}
        >
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wrench className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-extrabold">
                    Avaliar Orçamento & Laudo Visual • Placa{" "}
                    {editingQuote.plate_display ||
                      formatLicensePlateDisplay(editingQuote.license_plate)}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Cliente: {editingQuote.client_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuote(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="p-6 space-y-4 max-h-[82vh] overflow-y-auto"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status do Orçamento
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as VehicleQuoteStatus)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="pending">Aguardando Avaliação</option>
                    <option value="quoted">Orçamento Enviado</option>
                    <option value="approved">Aprovado pelo Cliente</option>
                    <option value="in_progress">Em Execução na Oficina</option>
                    <option value="completed">Serviço Concluído</option>
                    <option value="canceled">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modelo / Ano do Veículo
                  </label>
                  <input
                    type="text"
                    value={editVehicleModel}
                    onChange={(e) => setEditVehicleModel(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peças / Insumos (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPartsCost}
                    onChange={(e) => setEditPartsCost(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mão de Obra (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editLaborCost}
                    onChange={(e) => setEditLaborCost(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold text-slate-500 mb-1">
                    Total Calculado
                  </span>
                  <div className="rounded-xl bg-slate-900 text-emerald-400 px-3 py-2 text-sm font-black">
                    {formatCurrency(
                      (Number(editPartsCost) || 0) +
                        (Number(editLaborCost) || 0)
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parecer Técnico / Peças e Serviços Necessários
                </label>
                <textarea
                  rows={3}
                  value={editMechanicNotes}
                  onChange={(e) => setEditMechanicNotes(e.target.value)}
                  placeholder="Ex: Substituição de jogo de pastilhas dianteiras + retífica de discos + fluido DOT4..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Campo para Anexar até 3 Fotos de Peças Danificadas / Laudo Visual */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Fotos de Peças Danificadas / Laudo Visual (Até 3 Fotos)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Visível na página pública do cliente
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((slotIdx) => {
                    const photoUrl = editDamagedPhotos[slotIdx];
                    const isUploading = uploadingDamagedSlot === slotIdx;

                    return (
                      <div
                        key={slotIdx}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex flex-col justify-between gap-1.5"
                      >
                        <span className="text-[10px] font-bold text-slate-600 text-center">
                          Peça / Laudo #{slotIdx + 1}
                        </span>

                        {photoUrl ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 bg-slate-900">
                            <img
                              src={photoUrl}
                              alt={`Peça danificada ${slotIdx + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditDamagedPhotos((prev) =>
                                  prev.filter((_, i) => i !== slotIdx)
                                )
                              }
                              className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-600 cursor-pointer"
                              title="Remover foto"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white text-slate-500 hover:text-blue-600 transition cursor-pointer p-2 text-center">
                            {isUploading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            ) : (
                              <>
                                <Camera className="h-4 w-4 mb-0.5" />
                                <span className="text-[10px] font-bold">
                                  Anexar Foto
                                </span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleUploadDamagedPhoto(slotIdx, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || uploadingDamagedSlot !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Orçamento</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NOVO ORÇAMENTO MANUAL NO BALCÃO */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCreating) {
              setIsNewModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CarFront className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-extrabold">
                  Novo Orçamento por Placa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    placeholder="ABC1D23 ou ABC-1234"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-bold uppercase text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modelo / Ano *
                  </label>
                  <input
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="Ex: Toyota Corolla 2021"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp do Cliente *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição do Problema / Serviço Solicitado
                </label>
                <textarea
                  rows={2}
                  value={newComplaint}
                  onChange={(e) => setNewComplaint(e.target.value)}
                  placeholder="Relato do cliente ou serviço solicitado..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peças (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPartsCost}
                    onChange={(e) => setNewPartsCost(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mão de Obra (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newLaborCost}
                    onChange={(e) => setNewLaborCost(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as VehicleQuoteStatus)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                  >
                    <option value="pending">Pendente</option>
                    <option value="quoted">Orçado</option>
                    <option value="approved">Aprovado</option>
                    <option value="in_progress">Em Execução</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas Técnicas do Mecânico
                </label>
                <input
                  type="text"
                  value={newMechanicNotes}
                  onChange={(e) => setNewMechanicNotes(e.target.value)}
                  placeholder="Diagnóstico técnico opcional..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Criar Orçamento</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PROGRAMAR REVISÃO PREVENTIVA AVULSA */}
      {schedulingFromQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCreatingSchedule) {
              setSchedulingFromQuote(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-teal-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="h-5 w-5 text-teal-200" />
                <div>
                  <h3 className="text-base font-extrabold">
                    Programar Revisão Preventiva
                  </h3>
                  <p className="text-xs text-teal-100">
                    Placa{" "}
                    {formatLicensePlateDisplay(
                      schedulingFromQuote.license_plate
                    )}{" "}
                    • {schedulingFromQuote.client_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingFromQuote(null)}
                className="text-teal-200 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateScheduleFromQuote}
              className="p-6 space-y-4"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}
              {scheduleSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{scheduleSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Serviço Preventivo Programado *
                </label>
                <input
                  type="text"
                  required
                  value={revServiceType}
                  onChange={(e) => setRevServiceType(e.target.value)}
                  placeholder="Ex: Troca de Óleo e Filtros, Revisão de Freios..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data do Próximo Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={revDueDate}
                    onChange={(e) => setRevDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    KM Previsto (Opcional)
                  </label>
                  <input
                    type="number"
                    value={revDueKm}
                    onChange={(e) => setRevDueKm(e.target.value)}
                    placeholder="Ex: 60000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações da Revisão
                </label>
                <input
                  type="text"
                  value={revNotes}
                  onChange={(e) => setRevNotes(e.target.value)}
                  placeholder="Ex: Óleo 5W30 Sintético utilizado nesta troca"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSchedulingFromQuote(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSchedule}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isCreatingSchedule ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Revisão Preventiva</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Excluir Orçamento da Placa{" "}
              {formatLicensePlateDisplay(deletingQuote.license_plate)}?
            </h3>
            <p className="text-xs text-slate-600">
              Tem certeza que deseja remover este registro de orçamento de{" "}
              <strong>{deletingQuote.client_name}</strong>? Esta ação não pode
              ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingQuote(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleQuotesClient;
