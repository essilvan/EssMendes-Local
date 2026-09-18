"use client";

import React, { useState } from "react";
import { AdminPixBillingModal, type AdminPixBillingTenant } from "@/components/admin/AdminPixBillingModal";
import { Zap, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminManagedBarBillingButtonProps {
  tenant: AdminPixBillingTenant;
}

export function AdminManagedBarBillingButton({ tenant }: AdminManagedBarBillingButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(Boolean(tenant.setup_fee_paid || tenant.setup_paid));

  const amount = Number(tenant.setup_fee_amount || 197).toFixed(0);

  const handlePaymentApproved = () => {
    setIsPaid(true);
    setTimeout(() => {
      router.refresh();
    }, 2000);
  };

  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-700/90 px-2 py-1 text-[11px] font-bold text-white shadow-2xs">
        <Check className="h-3 w-3" />
        <span>Setup Quitado</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={`⚡ Gerar cobrança Pix de R$ ${amount},00 e enviar pelo WhatsApp`}
        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-emerald-500 transition shadow-2xs cursor-pointer animate-pulse hover:animate-none"
      >
        <Zap className="h-3 w-3 fill-white" />
        <span>⚡ Cobrar Setup via Pix (R$ {amount},00)</span>
      </button>

      <AdminPixBillingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tenant={tenant}
        onPaymentApproved={handlePaymentApproved}
      />
    </>
  );
}
