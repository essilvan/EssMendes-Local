'use client';

import { useState, useTransition } from 'react';
import { updateAppointmentStatusAction } from '@/services/appointment.actions';
import type { AppointmentStatus } from '@/types';
import { Loader2, Check, CheckCheck, X } from 'lucide-react';

interface Props {
  appointmentId: string;
  currentStatus: AppointmentStatus;
}

export default function AppointmentStatusButton({ appointmentId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateAppointmentStatusAction(appointmentId, newStatus);
      if (!res.success) {
        setErrorMsg(res.error || 'Erro ao alterar status.');
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {errorMsg && <span className="text-xs text-red-600 font-medium">{errorMsg}</span>}
      
      <div className="flex items-center gap-1.5 flex-wrap">
        {isPending ? (
          <div className="flex items-center gap-1 text-xs text-slate-500 py-1 px-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
            <span>Atualizando...</span>
          </div>
        ) : (
          <>
            {currentStatus !== 'confirmed' && currentStatus !== 'completed' && (
              <button
                type="button"
                onClick={() => handleStatusChange('confirmed')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar</span>
              </button>
            )}

            {currentStatus !== 'completed' && currentStatus !== 'canceled' && (
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition shadow-2xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Concluir</span>
              </button>
            )}

            {currentStatus !== 'canceled' && currentStatus !== 'completed' && (
              <button
                type="button"
                onClick={() => handleStatusChange('canceled')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 text-red-700 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}