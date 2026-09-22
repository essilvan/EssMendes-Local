'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedTenant } from '@/lib/supabase/tenant';
import {
  appointmentSchema,
  availableSlotsQuerySchema,
  adminAppointmentSchema,
  updateAppointmentDetailsSchema,
  type AppointmentInput,
  type AvailableSlotsQuery,
  type AdminAppointmentInput,
  type UpdateAppointmentDetailsInput,
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

    const { tenantId, date, totalDuration, professionalId } = parsed.data;
    const startHour = queryInput.startHour ?? 8;
    const endHour = queryInput.endHour ?? 18;
    const intervalMinutes = queryInput.intervalMinutes ?? 30;

    const supabase = await createClient();

    // Início e fim do dia para consulta
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    // CASO A: Profissional Específico Selecionado (professionalId)
    // CASO B: "Qualquer Profissional" Selecionado (professionalId === null)
    let appointmentsQuery = supabase
      .from('appointments')
      .select('id, start_time, end_time, status, professional_id')
      .eq('tenant_id', tenantId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .neq('status', 'canceled');

    // No Caso A, filtramos apenas os agendamentos do profissional selecionado
    if (professionalId) {
      appointmentsQuery = appointmentsQuery.eq('professional_id', professionalId);
    }

    // No Caso B, obtemos o total de profissionais ativos para capacidade da grade
    let activeProfessionalsCount = 1;
    if (!professionalId) {
      const { data: activePros } = await supabase
        .from('tenant_professionals')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (activePros && activePros.length > 0) {
        activeProfessionalsCount = activePros.length;
      }
    }

    const { data: existingAppointments, error } = await appointmentsQuery;

    if (error) {
      console.error('[getAvailableSlotsAction] Erro ao buscar agendamentos:', error);
      return { data: [], error: 'Erro ao consultar agenda.' };
    }

    // Converte os agendamentos existentes para intervalos em minutos
    const busyIntervals = (existingAppointments || [])
      .filter((app) => app.status !== 'canceled' && (app.status as string) !== 'cancelled')
      .map((app) => {
        const startDt = new Date(app.start_time);
        const endDt = new Date(app.end_time);
        const startM = startDt.getUTCHours() * 60 + startDt.getUTCMinutes();
        const endM = endDt.getUTCHours() * 60 + endDt.getUTCMinutes();
        return { start: startM, end: endM, professionalId: app.professional_id };
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

      let hasConflict = false;
      let reason: string | undefined = undefined;

      if (professionalId) {
        // CASO A: Profissional Específico Selecionado
        // Apenas agendamentos deste profissional causam indisponibilidade
        const isBusy = busyIntervals.some(
          (busy) => slotStart < busy.end && slotEnd > busy.start
        );
        if (isBusy) {
          hasConflict = true;
          reason = 'Horário indisponível para este profissional';
        }
      } else {
        // CASO B: "Qualquer Profissional" Selecionado
        // Um horário só deve ser marcado como indisponível se a quantidade de
        // agendamentos naquele horário for igual ou superior ao total de profissionais ativos
        const overlappingCount = busyIntervals.filter(
          (busy) => slotStart < busy.end && slotEnd > busy.start
        ).length;

        if (overlappingCount >= activeProfessionalsCount) {
          hasConflict = true;
          reason = 'Todos os profissionais ocupados neste horário';
        }
      }

      slots.push({
        time: minutesToTime(slotStart),
        available: !hasConflict,
        reason,
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

    // Sanitização estrita do professional_id
    const professionalId =
      typeof input.professionalId === 'string' && input.professionalId.trim() !== ''
        ? input.professionalId.trim()
        : null;

    // 1. Prevenção de conflito / Race Condition com isolamento por profissional
    let conflictQuery = supabase
      .from('appointments')
      .select('id, professional_id')
      .eq('tenant_id', input.tenantId)
      .neq('status', 'canceled')
      .lt('start_time', endTimeISO)
      .gt('end_time', startTimeISO);

    if (professionalId) {
      conflictQuery = conflictQuery.eq('professional_id', professionalId);
    }

    const { data: conflicts, error: conflictErr } = await conflictQuery;

    if (conflictErr) {
      console.error('[createAppointmentAction] Erro ao verificar conflitos:', conflictErr);
      return { data: null, error: 'Erro ao verificar disponibilidade.' };
    }

    if (professionalId) {
      if (conflicts && conflicts.length > 0) {
        return {
          data: null,
          error: 'Este horário acabou de ser reservado para este profissional. Por favor, escolha outro.',
        };
      }
    } else {
      // Para "Qualquer Profissional", só há conflito se todos os profissionais ativos estiverem ocupados
      const { data: activePros } = await supabase
        .from('tenant_professionals')
        .select('id')
        .eq('tenant_id', input.tenantId)
        .eq('is_active', true);

      const capacity = activePros && activePros.length > 0 ? activePros.length : 1;
      if (conflicts && conflicts.length >= capacity) {
        return {
          data: null,
          error: 'Todos os profissionais já estão ocupados neste horário. Por favor, escolha outro.',
        };
      }
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

    // Garantir sincronização com a tabela professionals caso a constraint ainda aponte para ela
    if (professionalId) {
      try {
        const adminSupabase = createAdminClient();
        const { data: profExists } = await adminSupabase
          .from('professionals')
          .select('id')
          .eq('id', professionalId)
          .maybeSingle();

        if (!profExists) {
          const { data: tp } = await adminSupabase
            .from('tenant_professionals')
            .select('*')
            .eq('id', professionalId)
            .maybeSingle();

          if (tp) {
            await adminSupabase.from('professionals').upsert({
              id: tp.id,
              tenant_id: tp.tenant_id,
              name: tp.name,
              role_title: tp.role_title || 'Profissional',
              avatar_url: tp.avatar_url || null,
              is_active: tp.is_active ?? true,
            });
          }
        }
      } catch (mirrorErr) {
        console.warn('[createAppointmentAction] Aviso ao sincronizar espelho do profissional:', mirrorErr);
      }
    }

    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        tenant_id: input.tenantId,
        customer_id: customerId,
        service_id: input.serviceId,
        professional_id: professionalId,
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
      .maybeSingle();

    if (insertError || !appointment) {
      console.error('Erro detalhado do Supabase:', insertError);
      console.error('[createAppointmentAction] Erro ao inserir agendamento:', {
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
        code: insertError?.code,
      });
      return {
        data: null,
        error: insertError?.message
          ? `Não foi possível registrar o agendamento: ${insertError.message}`
          : 'Não foi possível registrar o agendamento.',
      };
    }

    revalidatePath('/[slug]', 'page');
    revalidatePath('/admin/agendamentos');

    return { data: appointment as Appointment, error: null };
  } catch (err) {
    console.error('Erro detalhado do Supabase:', err);
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

/**
 * Criação manual de agendamento pelo Administrador do Tenant
 */
export async function createAdminAppointmentAction(
  rawInput: AdminAppointmentInput
): Promise<{ success: boolean; data?: Appointment; error?: string }> {
  try {
    const { data: tenantData, error: tenantErr } = await getAuthenticatedTenant();
    if (tenantErr || !tenantData?.tenantId) {
      return { success: false, error: tenantErr || 'Não autorizado. Faça login novamente.' };
    }

    const tenantId = tenantData.tenantId;

    const parsed = adminAppointmentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
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

    // 1. Cria ou vincula cliente na base
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', input.customerPhone)
      .maybeSingle();

    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
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

    // 2. Insere o agendamento
    const serviceId = input.serviceId && input.serviceId.trim() !== '' ? input.serviceId.trim() : null;
    const professionalId =
      typeof input.professionalId === 'string' && input.professionalId.trim() !== ''
        ? input.professionalId.trim()
        : null;

    if (professionalId) {
      try {
        const adminSupabase = createAdminClient();
        const { data: profExists } = await adminSupabase
          .from('professionals')
          .select('id')
          .eq('id', professionalId)
          .maybeSingle();

        if (!profExists) {
          const { data: tp } = await adminSupabase
            .from('tenant_professionals')
            .select('*')
            .eq('id', professionalId)
            .maybeSingle();

          if (tp) {
            await adminSupabase.from('professionals').upsert({
              id: tp.id,
              tenant_id: tp.tenant_id,
              name: tp.name,
              role_title: tp.role_title || 'Profissional',
              avatar_url: tp.avatar_url || null,
              is_active: tp.is_active ?? true,
            });
          }
        }
      } catch (mirrorErr) {
        console.warn('[createAdminAppointmentAction] Erro ao sincronizar espelho:', mirrorErr);
      }
    }

    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        service_id: serviceId,
        professional_id: professionalId,
        service_name: input.serviceName,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        customer_email: input.customerEmail || null,
        start_time: startTimeISO,
        end_time: endTimeISO,
        total_duration: input.durationMinutes,
        price: input.price,
        status: input.status,
        notes: input.notes || null,
      })
      .select('*')
      .maybeSingle();

    if (insertError || !appointment) {
      console.error('Erro detalhado do Supabase:', insertError);
      console.error('[createAdminAppointmentAction] Erro ao inserir agendamento:', insertError);
      return { success: false, error: 'Não foi possível registrar o agendamento no banco.' };
    }

    revalidatePath('/admin/agendamentos');
    if (tenantData.tenant?.slug) {
      revalidatePath(`/${tenantData.tenant.slug}`);
    }

    return { success: true, data: appointment as Appointment };
  } catch (err) {
    console.error('Erro detalhado do Supabase:', err);
    console.error('[createAdminAppointmentAction] Erro inesperado:', err);
    return { success: false, error: 'Ocorreu um erro ao processar o agendamento.' };
  }
}

/**
 * Atualiza os detalhes de um agendamento existente (Data, Horário e Profissional)
 */
export async function updateAppointmentDetailsAction(
  rawInput: UpdateAppointmentDetailsInput
): Promise<{ success: boolean; data?: Appointment; error?: string }> {
  try {
    const { data: tenantData, error: tenantErr } = await getAuthenticatedTenant();
    if (tenantErr || !tenantData?.tenantId) {
      return { success: false, error: tenantErr || 'Não autorizado. Faça login novamente.' };
    }

    const tenantId = tenantData.tenantId;

    const parsed = updateAppointmentDetailsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Dados inválidos para alteração.',
      };
    }

    const input = parsed.data;
    const supabase = await createClient();

    // 1. Busca o agendamento atual para verificar se pertence ao tenant e obter duração
    const { data: currentApp, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', input.appointmentId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchErr || !currentApp) {
      return { success: false, error: 'Agendamento não encontrado.' };
    }

    // 2. Calcula novos start_time e end_time
    const [h, m] = input.time.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const duration = currentApp.total_duration || 30;
    const endMinutes = startMinutes + duration;

    const startTimeISO = `${input.date}T${input.time}:00.000Z`;
    const endTimeISO = `${input.date}T${minutesToTime(endMinutes)}:00.000Z`;

    // 3. Sincronização de espelho com 'professionals' se professionalId for informado
    const professionalId =
      typeof input.professionalId === 'string' && input.professionalId.trim() !== ''
        ? input.professionalId.trim()
        : null;

    if (professionalId) {
      try {
        const adminSupabase = createAdminClient();
        const { data: profExists } = await adminSupabase
          .from('professionals')
          .select('id')
          .eq('id', professionalId)
          .maybeSingle();

        if (!profExists) {
          const { data: tp } = await adminSupabase
            .from('tenant_professionals')
            .select('*')
            .eq('id', professionalId)
            .maybeSingle();

          if (tp) {
            await adminSupabase.from('professionals').upsert({
              id: tp.id,
              tenant_id: tp.tenant_id,
              name: tp.name,
              role_title: tp.role_title || 'Profissional',
              avatar_url: tp.avatar_url || null,
              is_active: tp.is_active ?? true,
            });
          }
        }
      } catch (mirrorErr) {
        console.warn('[updateAppointmentDetailsAction] Erro ao sincronizar espelho:', mirrorErr);
      }
    }

    // 4. Executa o update na tabela appointments
    const { data: updatedAppointment, error: updateErr } = await supabase
      .from('appointments')
      .update({
        start_time: startTimeISO,
        end_time: endTimeISO,
        professional_id: professionalId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.appointmentId)
      .eq('tenant_id', tenantId)
      .select('*')
      .maybeSingle();

    if (updateErr || !updatedAppointment) {
      console.error('[updateAppointmentDetailsAction] Erro ao atualizar:', updateErr);
      return { success: false, error: 'Falha ao atualizar dados do agendamento.' };
    }

    revalidatePath('/admin/agendamentos');
    if (tenantData.tenant?.slug) {
      revalidatePath(`/${tenantData.tenant.slug}`);
    }

    return { success: true, data: updatedAppointment as Appointment };
  } catch (err) {
    console.error('[updateAppointmentDetailsAction] Erro inesperado:', err);
    return { success: false, error: 'Ocorreu um erro ao atualizar o agendamento.' };
  }
}

/**
 * Exclui um agendamento da base de dados
 */
export async function deleteAppointmentAction(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: tenantData, error: tenantErr } = await getAuthenticatedTenant();
    if (tenantErr || !tenantData?.tenantId) {
      return { success: false, error: tenantErr || 'Não autorizado. Faça login novamente.' };
    }

    if (!appointmentId) {
      return { success: false, error: 'ID do agendamento é obrigatório.' };
    }

    const tenantId = tenantData.tenantId;
    const supabase = await createClient();

    const { error: deleteErr } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId);

    if (deleteErr) {
      console.error('[deleteAppointmentAction] Erro ao excluir agendamento:', deleteErr);
      return { success: false, error: 'Falha ao excluir agendamento do sistema.' };
    }

    revalidatePath('/admin/agendamentos');
    if (tenantData.tenant?.slug) {
      revalidatePath(`/${tenantData.tenant.slug}`);
    }

    return { success: true };
  } catch (err) {
    console.error('[deleteAppointmentAction] Erro inesperado:', err);
    return { success: false, error: 'Ocorreu um erro ao excluir o agendamento.' };
  }
}