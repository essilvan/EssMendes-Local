import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedTenant } from '@/lib/supabase/tenant';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import AppointmentStatusButton from './AppointmentStatusButton';
import type { Appointment } from '@/types';

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

  // Busca agendamentos ordenados pelos mais recentes
  const { data: rawAppointments, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('[AdminAgendamentosPage] Erro ao carregar agendamentos:', error);
  }

  const appointments = (rawAppointments || []) as Appointment[];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  // Contadores
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="h-6 w-6 text-teal-700" />
            <span>Gestão de Agendamentos</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhe e gerencie as reservas de atendimento realizadas na sua página pública.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pendentes</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
          <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">Confirmados</p>
          <p className="text-2xl font-black text-teal-900 mt-1">{confirmedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Concluídos</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Agendamentos List */}
      {appointments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-slate-400" />
          <p className="font-semibold text-slate-700">Nenhum agendamento registrado ainda.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Assim que clientes realizarem reservas através do seu link público, os atendimentos aparecerão organizados aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
            >
              <div className="space-y-2.5 flex-1">
                {/* Cliente e Status */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" /> {app.customer_name}
                  </span>
                  
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      app.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : app.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {app.status === 'confirmed' && 'Confirmado'}
                    {app.status === 'pending' && 'Aguardando Confirmação'}
                    {app.status === 'completed' && 'Concluído'}
                    {app.status === 'canceled' && 'Cancelado'}
                  </span>

                  <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                    {app.service_name}
                  </span>
                </div>

                {/* Detalhes de Data, Hora e Telefone */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    <strong className="text-slate-800">{formatDate(app.start_time)}</strong>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-700" />
                    <span>
                      {formatTime(app.start_time)} - {formatTime(app.end_time)} ({app.total_duration} min)
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <a
                      href={`https://wa.me/55${app.customer_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-medium hover:underline"
                    >
                      {app.customer_phone}
                    </a>
                  </span>

                  {app.customer_email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.customer_email}</span>
                    </span>
                  )}

                  <span className="font-bold text-slate-900">
                    {formatCurrency(Number(app.price))}
                  </span>
                </div>

                {/* Observações */}
                {app.notes && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="italic">{app.notes}</span>
                  </div>
                )}
              </div>

              {/* Botões de Ação do Status */}
              <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <AppointmentStatusButton
                  appointmentId={app.id}
                  currentStatus={app.status}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}