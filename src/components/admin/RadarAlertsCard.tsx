"use client";

import React from "react";
import type { RadarAlert } from "@/services/opportunity.actions";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface RadarAlertsCardProps {
  alerts: RadarAlert[];
}

export function RadarAlertsCard({ alerts }: RadarAlertsCardProps) {
  if (alerts.length === 0) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50/70 text-red-900";
      case "warning":
        return "border-amber-200 bg-amber-50/70 text-amber-900";
      case "success":
        return "border-emerald-200 bg-emerald-50/70 text-emerald-900";
      default:
        return "border-blue-200 bg-blue-50/70 text-blue-900";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Radar de Saúde Digital
            </h3>
            <p className="text-xs text-slate-500">
              Monitoramento ativo de gargalos de conversão e reputação.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs ${getAlertStyle(
              alert.type
            )}`}
          >
            <div className="flex items-start gap-2.5">
              {getAlertIcon(alert.type)}
              <div className="space-y-0.5">
                <p className="font-bold text-xs">{alert.title}</p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {alert.description}
                </p>
              </div>
            </div>

            {alert.actionLabel && alert.actionUrl && (
              <Link
                href={alert.actionUrl}
                className="shrink-0 self-center text-[11px] font-bold text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs transition"
              >
                {alert.actionLabel}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
