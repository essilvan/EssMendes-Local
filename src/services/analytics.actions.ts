'use server';

import { createClient } from '@/lib/supabase/server';

export type EventType =
  | 'page_view'
  | 'click_whatsapp'
  | 'click_phone'
  | 'click_directions'
  | 'click_booking'
  | 'booking_completed';

export interface AnalyticsSummary {
  pageViews: number;
  whatsappClicks: number;
  bookingClicks: number;
  bookingsCompleted: number;
  totalAppointments: number;
  confirmedAppointments: number;
  estimatedRevenue: number;
  conversionRate: number; // Porcentagem (0 - 100)
}

/**
 * Registra um evento de telemetria sem PII (Zero PII - LGPD Compliant)
 */
export async function recordAnalyticsEvent(
  tenantId: string,
  eventName: EventType,
  deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop'
) {
  if (!tenantId || !eventName) return;

  try {
    const supabase = await createClient();
    await supabase.from('analytics_events').insert({
      tenant_id: tenantId,
      event_name: eventName,
      device_type: deviceType,
    });
  } catch (error) {
    // Analytics opera de forma silenciosa e não bloqueante
    console.error('[recordAnalyticsEvent] Falha ao registrar evento de analytics:', error);
  }
}

/**
 * Consulta e consolida métricas e KPIs dos últimos 30 dias para o dashboard do proprietário
 */
export async function getTenantAnalyticsSummary(
  tenantId: string
): Promise<AnalyticsSummary> {
  const defaultSummary: AnalyticsSummary = {
    pageViews: 0,
    whatsappClicks: 0,
    bookingClicks: 0,
    bookingsCompleted: 0,
    totalAppointments: 0,
    confirmedAppointments: 0,
    estimatedRevenue: 0,
    conversionRate: 0,
  };

  if (!tenantId) return defaultSummary;

  try {
    const supabase = await createClient();

    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // 1. Busca eventos da tabela analytics_events
    let pageViews = 0;
    let whatsappClicks = 0;
    let bookingClicks = 0;
    let bookingsCompleted = 0;

    const { data: rawEvents, error: eventsError } = await supabase
      .from('analytics_events')
      .select('event_name')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgoISO);

    if (!eventsError && rawEvents) {
      for (const ev of rawEvents) {
        if (ev.event_name === 'page_view') pageViews++;
        else if (ev.event_name === 'click_whatsapp') whatsappClicks++;
        else if (ev.event_name === 'click_booking') bookingClicks++;
        else if (ev.event_name === 'booking_completed') bookingsCompleted++;
      }
    }

    // 2. Busca agendamentos reais da tabela appointments
    let totalAppointments = 0;
    let confirmedAppointments = 0;
    let estimatedRevenue = 0;

    const { data: rawAppointments, error: appError } = await supabase
      .from('appointments')
      .select('price, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgoISO);

    if (!appError && rawAppointments) {
      totalAppointments = rawAppointments.length;
      for (const app of rawAppointments) {
        if (app.status === 'confirmed' || app.status === 'completed') {
          confirmedAppointments++;
          estimatedRevenue += Number(app.price || 0);
        } else if (app.status === 'pending') {
          // Também podemos somar pendentes se desejado, mas mantemos confirmado para receita prevista
          estimatedRevenue += Number(app.price || 0);
        }
      }
    }

    // 3. Cálculo da Taxa de Conversão: (Agendamentos + Cliques WhatsApp) / Visualizações
    const totalConversions = whatsappClicks + (totalAppointments || bookingsCompleted);
    const conversionRate =
      pageViews > 0
        ? Math.min(100, Number(((totalConversions / pageViews) * 100).toFixed(1)))
        : totalConversions > 0
        ? 100
        : 0;

    return {
      pageViews,
      whatsappClicks,
      bookingClicks,
      bookingsCompleted: totalAppointments || bookingsCompleted,
      totalAppointments,
      confirmedAppointments,
      estimatedRevenue,
      conversionRate,
    };
  } catch (err) {
    console.error('[getTenantAnalyticsSummary] Erro ao consolidar métricas:', err);
    return defaultSummary;
  }
}
