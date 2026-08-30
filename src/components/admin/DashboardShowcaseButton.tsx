"use client";

import React, { useState } from "react";
import { Globe, ExternalLink, Copy, Check } from "lucide-react";
import { getTenantPublicUrl, getTenantDisplayDomain } from "@/utils/tenant-url";

interface DashboardShowcaseButtonProps {
  slug: string;
}

export function DashboardShowcaseButton({ slug }: DashboardShowcaseButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getTenantPublicUrl(slug);
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl bg-white p-1 text-xs font-bold text-teal-900 shadow-sm border border-teal-100">
      <a
        href={getTenantPublicUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition"
        title={`Abrir vitrine: https://${slug}.essmendes.com.br`}
      >
        <Globe className="h-4 w-4 text-teal-700 shrink-0" />
        <span className="font-mono text-xs">{getTenantDisplayDomain(slug)}</span>
        <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
        title={copied ? "Link copiado!" : "Copiar link do subdomínio"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
