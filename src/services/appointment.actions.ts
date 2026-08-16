'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedTenant } from '@/lib/supabase/tenant';
import {
  appointmentSchema,
  availableSlotsQuerySchema,
  type AppointmentInput,
  type AvailableSlotsQuery,
} from '@/lib/validations/appointment.schema';
import type { Appointment, AvailableSlot, AppointmentStatus } from '@/types';
import { revalidatePath } from 'next/cache';

// Helper para converter "HH:mm" em minutos desde a meia-noite
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper para converter minutos em "HH:mm"
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Consulta horários disponíveis para um tenant em uma data específica
 */
export async function getAvailableSlotsAction(
  queryInput: AvailableSlotsQuery & {
    startHour?: number;
    endHour?: number;
    intervalMinutes?: number;
  }
): Promise<{ data: AvailableSlot[]; error: string | null }> {
  try {
    const parsed = availableSlotsQuerySchema.safeParse(queryInput);
    if (!parsed.success) {
      return {
        data: [],
        error: parsed.error.issues[0]?.message || 'Parâmetros de consulta inválidos.',
      };
    }

    const { tenantId, date, totalDuration } = parsed.data;
    const startHour = queryInput.startHour ?? 8;
    const endHour = queryInput.endHour ?? 18;
    const intervalMinutes = queryInput.intervalMinutes ?? 30;

    const supabase = await createClient();

    // Início e fim do dia para consulta
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    // Busca agendamentos do dia não cancelados
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('tenant_id', tenantId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .neq('status', 'canceled');

    if (error) {
      console.error('[getAvailableSlotsAction] Erro ao buscar agendamentos:', error);
      return { data: [], error: 'Erro ao consultar agenda.' };
    }

    // Converte os agendamentos existentes para intervalos em minutos
    const busyIntervals = (existingAppointments || []).map((app) => {
      const startDt = new Date(app.start_time);
      const endDt = new Date(app.end_time);
      const startM = startDt.getUTCHours() * 60 + startDt.getUTCMinutes();
      const endM = endDt.getUTCHours() * 60 + endDt.getUTCMinutes();
      return { start: startM, end: endM };
    });

    const slots: AvailableSlot[] = [];
    const dayStartMinutes = startHour * 60;
    const dayEndMinutes = endHour * 60;

    for (
      let currentMinutes = dayStartMinutes;
      currentMinutes + totalDuration <= dayEndMinutes;
      currentMinutes += intervalMinutes
    ) {
      const slotStart = currentMinutes;
      const slotEnd = currentMinutes + totalDuration;

      // Verifica se sobrepõe algum agendamento existente
      const hasConflict = busyIntervals.some(
        (busy) => slotStart < busy.end && slotEnd > busy.start
      );

      slots.push({
        time: minutesToTime(slotStart),
        available: !hasConflict,
        reason: hasConflict ? 'Horário ocupado' : undefined,
      });
    }

    return { data: slots, error: null };
  } catch (err) {
    console.error('[getAvailableSlotsAction] Erro inesperado:', err);
    return { data: [], error: 'Falha ao processar solicitação de horários.' };
  }
}

/**
 * Cria um novo agendamento com validação, idempotência básica e prevenção de conflitos
 */
export async function createAppointmentAction(
  rawInput: AppointmentInput
): Promise<{ data: Appointment | null; error: string | null }> {
  try {
    const parsed = appointmentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        data: null,
        error: parsed.error.issues[0]?.message || 'Dados do agendamento inválidos.',
      };
    }

    const input = parsed.data;
    const supabase = await createClient();

    // Monta start_time e end_time em ISO UTC
    const [h, m] = input.time.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + input.durationMinutes;

    const startTimeISO = `${input.date}T${input.time}:00.000Z`;
    const endTimeISO = `${input.date}T${minutesToTime(endMinutes)}:00.000Z`;

    // 1. Prevenção de conflito / Race Condition
    const { data: conflicts, error: conflictErr } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', input.tenantId)
      .neq('status', 'canceled')
      .lt('start_time', endTimeISO)
      .gt('end_time', startTimeISO);

    if (conflictErr) {
      console.error('[createAppointmentAction] Erro ao verificar conflitos:', conflictErr);
      return { data: null, error: 'Erro ao verificar disponibilidade.' };
    }

    if (conflicts && conflicts.length > 0) {
      return {
        data: null,
        error: 'Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro.',
      };
    }

    // 2. Cria ou vincula cliente na base
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', input.tenantId)
      .eq('phone', input.customerPhone)
      .maybeSingle();

    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          tenant_id: input.tenantId,
          name: input.customerName,
          phone: input.customerPhone,
          email: input.customerEmail || null,
        })
        .select('id')
        .maybeSingle();

      if (newCustomer?.id) {
        customerId = newCustomer.id;
      }
    }

    // 3. Insere o agendamento
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        tenant_id: input.tenantId,
        customer_id: customerId,
        service_id: input.serviceId,
        service_name: input.serviceName,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        customer_email: input.customerEmail || null,
        start_time: startTimeISO,
        end_time: endTimeISO,
        total_duration: input.durationMinutes,
        price: input.price,
        status: 'pending',
        notes: input.notes || null,
      })
      .select('*')
      .single();

    if (insertError || !appointment) {
      console.error('[createAppointmentAction] Erro ao inserir agendamento:', insertError);
      return { data: null, error: 'Não foi possível registrar o agendamento.' };
    }

    revalidatePath('/[slug]', 'page');
    revalidatePath('/admin/agendamentos');

    return { data: appointment as Appointment, error: null };
  } catch (err) {
    console.error('[createAppointmentAction] Erro inesperado:', err);
    return { data: null, error: 'Ocorreu um erro ao processar o agendamento.' };
  }
}

/**
 * Atualiza o status de um agendamento (Ação restrita ao proprietário/membro do tenant)
 */
export async function updateAppointmentStatusAction(
  appointmentId: string,
  newStatus: AppointmentStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: tenantData, error: tenantErr } = await getAuthenticatedTenant();
    if (tenantErr || !tenantData?.tenantId) {
      return { success: false, error: 'Não autorizado.' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .eq('tenant_id', tenantData.tenantId);

    if (error) {
      console.error('[updateAppointmentStatusAction] Erro:', error);
      return { success: false, error: 'Falha ao atualizar status.' };
    }

    revalidatePath('/admin/agendamentos');
    return { success: true, error: null };
  } catch (err) {
    console.error('[updateAppointmentStatusAction] Erro inesperado:', err);
    return { success: false, error: 'Ocorreu um erro ao atualizar o agendamento.' };
  }
}