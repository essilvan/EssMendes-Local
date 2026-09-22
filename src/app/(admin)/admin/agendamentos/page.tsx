import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedTenant } from '@/lib/supabase/tenant';
import { AlertCircle } from 'lucide-react';
import AppointmentsClient from '@/components/admin/AppointmentsClient';
import type { ServiceOption } from '@/components/admin/NewAppointmentModal';
import type { Appointment, TenantProfessional } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminAgendamentosPage() {
  const { data: tenantData, error: tenantErr } = await getAuthenticatedTenant();

  if (tenantErr || !tenantData?.tenantId) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <p className="font-bold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> Erro de autorização
        </p>
        <p className="text-sm mt-1">{tenantErr || 'Estabelecimento não identificado.'}</p>
      </div>
    );
  }

  const tenantId = tenantData.tenantId;
  const supabase = await createClient();

  // Busca agendamentos, serviços, profissionais e dados para avaliação no Google
  const [appointmentsRes, servicesRes, professionalsRes, tenantRes, profileRes] =
    await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('start_time', { ascending: false }),
      supabase
        .from('services')
        .select('id, name, price, duration_minutes, is_active')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('tenant_professionals')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true }),
      supabase
        .from('tenants')
        .select('id, name, google_place_id')
        .eq('id', tenantId)
        .maybeSingle(),
      supabase
        .from('tenant_profiles')
        .select('name, google_place_id, google_maps_url')
        .eq('tenant_id', tenantId)
        .maybeSingle(),
    ]);

  if (appointmentsRes.error) {
    console.error('[AdminAgendamentosPage] Erro ao carregar agendamentos:', appointmentsRes.error);
  }

  const appointments = (appointmentsRes.data || []) as Appointment[];
  const activeServices = (servicesRes.data || []) as ServiceOption[];
  const professionals = (professionalsRes.data || []) as TenantProfessional[];

  const tenantName =
    tenantRes.data?.name ||
    profileRes.data?.name ||
    tenantData.tenant?.name ||
    'Nosso Estabelecimento';

  const googlePlaceId =
    tenantRes.data?.google_place_id ||
    profileRes.data?.google_place_id ||
    null;

  const googleMapsUrl = profileRes.data?.google_maps_url || null;

  const googleReviewUrl = googlePlaceId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(googlePlaceId)}`
    : googleMapsUrl || null;

  return (
    <AppointmentsClient
      initialAppointments={appointments}
      professionals={professionals}
      services={activeServices}
      tenantName={tenantName}
      googlePlaceId={googlePlaceId}
      googleMapsUrl={googleMapsUrl}
      googleReviewUrl={googleReviewUrl}
    />
  );
}