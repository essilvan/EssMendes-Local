'use client';

import { useState, useTransition } from 'react';
import { updateAppointmentStatusAction } from '@/services/appointment.actions';
import type { AppointmentStatus } from '@/types';
import { Loader2, Check, CheckCheck, X } from 'lucide-react';

interface Props {
  appointmentId: string;
  currentStatus: AppointmentStatus;
  customerName?: string;
  customerPhone?: string;
  tenantName?: string;
  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;
  googleReviewUrl?: string | null;
  onStatusChange?: (newStatus: AppointmentStatus) => void;
}

export default function AppointmentStatusButton({
  appointmentId,
  currentStatus,
  customerName = 'Cliente',
  customerPhone,
  tenantName = 'nosso estabelecimento',
  googlePlaceId,
  googleMapsUrl,
  googleReviewUrl,
  onStatusChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const triggerGoogleReviewWhatsApp = () => {
    if (!customerPhone) return;

    const rawDigits = customerPhone.replace(/\D/g, '');
    if (!rawDigits) return;

    const cleanPhone = rawDigits.startsWith('55') ? rawDigits.slice(2) : rawDigits;
    const phoneWithDDI = `55${cleanPhone}`;

    // Obtém o link de avaliação do Google
    let reviewLink = '';
    if (googleReviewUrl && googleReviewUrl.trim()) {
      reviewLink = googleReviewUrl.trim();
    } else if (googlePlaceId && googlePlaceId.trim()) {
      reviewLink = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(googlePlaceId.trim())}`;
    } else if (googleMapsUrl && googleMapsUrl.trim()) {
      reviewLink = googleMapsUrl.trim();
    }

    const lines = [
      `Olá, ${customerName}! Tudo bem? 😊`,
      '',
      `Agradecemos muito pela sua presença hoje na ${tenantName}!`,
      '',
      'Poderia nos ajudar dedicando 30 segundos para avaliar o nosso atendimento no Google? Sua opinião é fundamental para a nossa equipe:',
    ];

    if (reviewLink) {
      lines.push(`👉 ${reviewLink}`);
    }

    lines.push('');
    lines.push('Muito obrigado e até a próxima!');

    const message = lines.join('\n');
    const whatsappUrl = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(message)}`;

    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateAppointmentStatusAction(appointmentId, newStatus);
      if (!res.success) {
        setErrorMsg(res.error || 'Erro ao alterar status.');
        return;
      }

      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      // Se o status for concluído, dispara o WhatsApp de solicitação de avaliação no Google
      if (newStatus === 'completed') {
        triggerGoogleReviewWhatsApp();
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
                title="Confirmar agendamento"
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
                title="Concluir agendamento e solicitar avaliação no Google"
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
                title="Cancelar agendamento"
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