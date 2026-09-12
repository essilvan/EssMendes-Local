"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyPixButtonProps {
  pixKey: string;
  className?: string;
}

export function CopyPixButton({ pixKey, className }: CopyPixButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(pixKey);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = pixKey;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Falha ao copiar Pix:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ||
        "inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 transition px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 cursor-pointer shrink-0"
      }
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span>Chave Copiada! ✅</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copiar Chave Pix</span>
        </>
      )}
    </button>
  );
}
