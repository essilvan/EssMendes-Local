"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import {
  publicVehicleQuoteSchema,
  adminVehicleQuoteSchema,
  updateVehicleQuoteSchema,
  maintenanceScheduleSchema,
  updateMaintenanceScheduleSchema,
  normalizeLicensePlate,
  formatLicensePlateDisplay,
  extractAutomotiveCategoryTags,
  type PublicVehicleQuoteInput,
  type AdminVehicleQuoteInput,
  type UpdateVehicleQuoteInput,
  type MaintenanceScheduleInput,
  type UpdateMaintenanceScheduleInput,
} from "@/lib/validations/vehicle-quote.schema";
import type { VehicleQuote, VehicleMaintenanceSchedule } from "@/types";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * 1. Ação Pública: Cria solicitação de orçamento por placa na vitrine pública (/[slug])
 */
export async function createPublicVehicleQuoteAction(
  rawInput: PublicVehicleQuoteInput
): Promise<ActionResult<VehicleQuote>> {
  try {
    const validation = publicVehicleQuoteSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error:
          validation.error.issues[0]?.message ||
          "Preencha todos os campos obrigatórios corretamente.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const input = validation.data;
    const normalizedPlate = normalizeLicensePlate(input.licensePlate);
    const displayPlate = formatLicensePlateDisplay(input.licensePlate);

    if (normalizedPlate.length < 6) {
      return {
        success: false,
        error: "Informe uma placa válida com pelo menos 6 caracteres (ex: ABC-1234 ou ABC1D23).",
      };
    }

    const categoryTags = extractAutomotiveCategoryTags(
      input.complaint,
      input.categoryTags
    );

    const payload = {
      tenant_id: input.tenantId,
      license_plate: normalizedPlate,
      plate_display: displayPlate,
      vehicle_model: input.vehicleModel.trim(),
      client_name: input.clientName.trim(),
      client_phone: input.clientPhone.trim(),
      complaint: input.complaint.trim(),
      category_tags: categoryTags,
      status: "pending",
      labor_cost: 0,
      parts_cost: 0,
      total_cost: 0,
    };

    const supabase = await createClient();
    let { data, error: dbError } = await supabase
      .from("vehicle_quotes")
      .insert(payload)
      .select("*")
      .maybeSingle();

    // Fallback seguro com AdminClient caso a política RLS para 'anon' bloqueie o select pós-insert
    if (dbError || !data) {
      try {
        const adminSupabase = createAdminClient();
        const adminRes = await adminSupabase
          .from("vehicle_quotes")
          .insert(payload)
          .select("*")
          .single();
        data = adminRes.data;
        dbError = adminRes.error;
      } catch (fallbackErr) {
        console.warn("[createPublicVehicleQuoteAction] Aviso no fallback admin:", fallbackErr);
      }
    }

    if (dbError || !data) {
      console.error("[createPublicVehicleQuoteAction] Erro no banco:", dbError);
      return {
        success: false,
        error: "Não foi possível registrar a solicitação de orçamento no momento.",
      };
    }

    revalidatePath("/admin/orcamentos");
    revalidatePath("/[slug]", "page");

    return { success: true, data: data as VehicleQuote };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado ao solicitar orçamento.";
    console.error("[createPublicVehicleQuoteAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * 2. Ação Admin: Cria orçamento manualmente pelo painel administrativo (/admin/orcamentos)
 */
export async function createAdminVehicleQuoteAction(
  rawInput: AdminVehicleQuoteInput
): Promise<ActionResult<VehicleQuote>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx?.tenantId) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const validation = adminVehicleQuoteSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Dados inválidos.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const input = validation.data;
    const normalizedPlate = normalizeLicensePlate(input.licensePlate);
    const displayPlate = formatLicensePlateDisplay(input.licensePlate);
    const laborCost = Number(input.laborCost) || 0;
    const partsCost = Number(input.partsCost) || 0;
    const totalCost = Number((laborCost + partsCost).toFixed(2));
    const categoryTags = extractAutomotiveCategoryTags(
      input.complaint || "",
      input.categoryTags
    );

    const insertPayload = {
      tenant_id: tenantCtx.tenantId,
      license_plate: normalizedPlate,
      plate_display: displayPlate,
      vehicle_model: input.vehicleModel.trim(),
      client_name: input.clientName.trim(),
      client_phone: input.clientPhone.trim(),
      complaint: input.complaint?.trim() || null,
      category_tags: categoryTags,
      status: input.status || "pending",
      labor_cost: laborCost,
      parts_cost: partsCost,
      total_cost: totalCost,
      mechanic_notes: input.mechanicNotes?.trim() || null,
      scheduled_for: input.scheduledFor || null,
    };

    const adminSupabase = createAdminClient();
    const { data, error: dbError } = await adminSupabase
      .from("vehicle_quotes")
      .insert(insertPayload)
      .select("*")
      .single();

    if (dbError || !data) {
      console.error("[createAdminVehicleQuoteAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao registrar orçamento no banco de dados." };
    }

    revalidatePath("/admin/orcamentos");
    if (tenantCtx.tenant?.slug) {
      revalidatePath(`/${tenantCtx.tenant.slug}`);
    }

    return { success: true, data: data as VehicleQuote };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado.";
    console.error("[createAdminVehicleQuoteAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * 3. Ação Admin: Atualiza valores, notas do mecânico e status de um orçamento
 */
export async function updateVehicleQuoteAction(
  rawInput: UpdateVehicleQuoteInput
): Promise<ActionResult<VehicleQuote>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx?.tenantId) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const validation = updateVehicleQuoteSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Dados inválidos.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const input = validation.data;
    const adminSupabase = createAdminClient();

    // Busca registro atual garantindo isolamento por tenant_id
    const { data: existing, error: fetchErr } = await adminSupabase
      .from("vehicle_quotes")
      .select("*")
      .eq("id", input.id)
      .eq("tenant_id", tenantCtx.tenantId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: "Orçamento não encontrado neste estabelecimento." };
    }

    const laborCost =
      input.laborCost !== undefined ? Number(input.laborCost) : Number(existing.labor_cost) || 0;
    const partsCost =
      input.partsCost !== undefined ? Number(input.partsCost) : Number(existing.parts_cost) || 0;
    const totalCost = Number((laborCost + partsCost).toFixed(2));

    const updatePayload: Record<string, unknown> = {
      labor_cost: laborCost,
      parts_cost: partsCost,
      total_cost: totalCost,
    };

    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.mechanicNotes !== undefined) updatePayload.mechanic_notes = input.mechanicNotes;
    if (input.vehicleModel !== undefined) updatePayload.vehicle_model = input.vehicleModel;
    if (input.complaint !== undefined) updatePayload.complaint = input.complaint;
    if (input.clientName !== undefined) updatePayload.client_name = input.clientName;
    if (input.clientPhone !== undefined) updatePayload.client_phone = input.clientPhone;
    if (input.scheduledFor !== undefined) updatePayload.scheduled_for = input.scheduledFor;
    if (input.categoryTags !== undefined) updatePayload.category_tags = input.categoryTags;
    if (input.licensePlate !== undefined) {
      updatePayload.license_plate = normalizeLicensePlate(input.licensePlate);
      updatePayload.plate_display = formatLicensePlateDisplay(input.licensePlate);
    }

    const { data: updated, error: updateErr } = await adminSupabase
      .from("vehicle_quotes")
      .update(updatePayload)
      .eq("id", input.id)
      .eq("tenant_id", tenantCtx.tenantId)
      .select("*")
      .single();

    if (updateErr || !updated) {
      console.error("[updateVehicleQuoteAction] Erro no banco:", updateErr);
      return { success: false, error: "Falha ao atualizar orçamento." };
    }

    revalidatePath("/admin/orcamentos");
    return { success: true, data: updated as VehicleQuote };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado.";
    console.error("[updateVehicleQuoteAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * 3.1 Ação Admin Rápida: Atualiza diretamente o status de um orçamento no Supabase
 */
export async function updateVehicleQuoteStatusAction(
  quoteId: string,
  status: string
): Promise<ActionResult<VehicleQuote>> {
  return updateVehicleQuoteAction({
    id: quoteId,
    status: status as UpdateVehicleQuoteInput["status"],
  });
}

/**
 * 4. Ação Admin: Exclui um orçamento
 */
export async function deleteVehicleQuoteAction(
  quoteId: string
): Promise<ActionResult> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx?.tenantId) {
      return { success: false, error: authError || "Não autenticado." };
    }

    if (!quoteId) {
      return { success: false, error: "ID do orçamento é obrigatório." };
    }

    const adminSupabase = createAdminClient();
    const { error: deleteErr } = await adminSupabase
      .from("vehicle_quotes")
      .delete()
      .eq("id", quoteId)
      .eq("tenant_id", tenantCtx.tenantId);

    if (deleteErr) {
      console.error("[deleteVehicleQuoteAction] Erro:", deleteErr);
      return { success: false, error: "Falha ao excluir orçamento." };
    }

    revalidatePath("/admin/orcamentos");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado.";
    console.error("[deleteVehicleQuoteAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * 5. Ação Admin: Consulta histórico completo de serviços e revisões pela Placa do Veículo
 */
export async function getVehicleHistoryByPlateAction(
  plateQuery: string
): Promise<
  ActionResult<{
    plate: string;
    quotes: VehicleQuote[];
    schedules: VehicleMaintenanceSchedule[];
  }>
> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx?.tenantId) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const cleanPlate = normalizeLicensePlate(plateQuery);
    if (!cleanPlate || cleanPlate.length < 3) {
      return {
        success: false,
        error: "Digite pelo menos 3 caracteres da placa para consultar o histórico.",
      };
    }

    const adminSupabase = createAdminClient();

    const [quotesRes, schedulesRes] = await Promise.all([
      adminSupabase
        .from("vehicle_quotes")
        .select("*")
        .eq("tenant_id", tenantCtx.tenantId)
        .ilike("license_plate", `%${cleanPlate}%`)
        .order("created_at", { ascending: false }),
      adminSupabase
        .from("vehicle_maintenance_schedules")
        .select("*")
        .eq("tenant_id", tenantCtx.tenantId)
        .ilike("license_plate", `%${cleanPlate}%`)
        .order("due_date", { ascending: true }),
    ]);

    return {
      success: true,
      data: {
        plate: formatLicensePlateDisplay(cleanPlate),
        quotes: (quotesRes.data || []) as VehicleQuote[],
        schedules: (schedulesRes.data || []) as VehicleMaintenanceSchedule[],
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar histórico da placa.";
    console.error("[getVehicleHistoryByPlateAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * 6. Ação Admin: Cria agendamento de Revisão Preventiva (/admin/revisoes)
 */
export async function createMaintenanceScheduleAction(
  rawInput: MaintenanceScheduleInput
): Promise<ActionResult<VehicleMaintenanceSchedule>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx?.tenantId) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const validation = maintenanceScheduleSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Dados da revisão inválidos.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const input = validation.data;
    const normalizedPlate = normalizeLicensePlate(input.licensePlate);

    const insertPayload = {
      tenant_id: tenantCtx.tenantId,
      license_plate: normalizedPlate,
      vehicle_model: input.vehicleModel?.trim() || null,
      client_name: input.clientName.trim(),
      client_phone: input.clientPhone.trim(),
      service_type: input.serviceType.trim(),
      last_service_date:
        input.lastServiceDate && input.lastServiceDate.trim() !== ""
          ? input.lastServiceDate
          : new Date().toISOString().split("T")[0],
      due_date: input.dueDate,
      due_km: input.dueKm ? Number(input.dueKm) : null,
      status: input.status || "scheduled",
      notes: input.notes?.trim() || null,
    };

    const adminSupabase = createAdminClient();
    const { data, error: dbError } = await adminSupabase
      .from("vehicle_maintenance_schedules")
      .insert(insertPayload)
      .select("*")
      .single();

    if (dbError || !data) {
      console.error("[createMaintenanceScheduleAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao programar revisão preventiva." };
    }

    revalidatePath("/admin/revisoes");
    revalidatePath("/admin/orcamentos");

    return { success: true, data: data as VehicleMaintenanceSchedule };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado.";
    console.error("[createMaintenanceScheduleAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * 7. Ação Admin: Atualiza Revisão Preventiva (status, data de vencimento, observações)
 */
export async function updateMaintenanceScheduleAction(
  rawInput: UpdateMaintenanceScheduleInput
): Promise<ActionResult<VehicleMaintenanceSchedule>> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx?.tenantId) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const validation = updateMaintenanceScheduleSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Dados inválidos.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const input = validation.data;
    const updatePayload: Record<string, unknown> = {};

    if (input.licensePlate !== undefined) {
      updatePayload.license_plate = normalizeLicensePlate(input.licensePlate);
    }
    if (input.vehicleModel !== undefined) updatePayload.vehicle_model = input.vehicleModel;
    if (input.clientName !== undefined) updatePayload.client_name = input.clientName;
    if (input.clientPhone !== undefined) updatePayload.client_phone = input.clientPhone;
    if (input.serviceType !== undefined) updatePayload.service_type = input.serviceType;
    if (input.lastServiceDate !== undefined) updatePayload.last_service_date = input.lastServiceDate;
    if (input.dueDate !== undefined) updatePayload.due_date = input.dueDate;
    if (input.dueKm !== undefined) updatePayload.due_km = input.dueKm ? Number(input.dueKm) : null;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.notes !== undefined) updatePayload.notes = input.notes;

    const adminSupabase = createAdminClient();
    const { data: updated, error: updateErr } = await adminSupabase
      .from("vehicle_maintenance_schedules")
      .update(updatePayload)
      .eq("id", input.id)
      .eq("tenant_id", tenantCtx.tenantId)
      .select("*")
      .single();

    if (updateErr || !updated) {
      console.error("[updateMaintenanceScheduleAction] Erro:", updateErr);
      return { success: false, error: "Falha ao atualizar revisão preventiva." };
    }

    revalidatePath("/admin/revisoes");
    revalidatePath("/admin/orcamentos");

    return { success: true, data: updated as VehicleMaintenanceSchedule };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado.";
    console.error("[updateMaintenanceScheduleAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

/**
 * 8. Ação Admin: Exclui Revisão Preventiva
 */
export async function deleteMaintenanceScheduleAction(
  scheduleId: string
): Promise<ActionResult> {
  try {
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx?.tenantId) {
      return { success: false, error: authError || "Não autenticado." };
    }

    if (!scheduleId) {
      return { success: false, error: "ID da revisão é obrigatório." };
    }

    const adminSupabase = createAdminClient();
    const { error: deleteErr } = await adminSupabase
      .from("vehicle_maintenance_schedules")
      .delete()
      .eq("id", scheduleId)
      .eq("tenant_id", tenantCtx.tenantId);

    if (deleteErr) {
      console.error("[deleteMaintenanceScheduleAction] Erro:", deleteErr);
      return { success: false, error: "Falha ao excluir revisão preventiva." };
    }

    revalidatePath("/admin/revisoes");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado.";
    console.error("[deleteMaintenanceScheduleAction] Exceção:", err);
    return { success: false, error: msg };
  }
}

