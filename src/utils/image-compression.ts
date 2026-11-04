"use client";

import { createClient } from "@/lib/supabase/client";
import { uploadAutomotivePhotoAction } from "@/services/vehicle-quote.actions";

/**
 * Comprime e redimensiona uma imagem no cliente utilizando HTML5 Canvas (máx 1280px)
 * antes do envio para o bucket 'establishment-photos'.
 */
export async function compressImageViaCanvas(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<File> {
  if (typeof window === "undefined") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo de imagem."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanBaseName = file.name
              .replace(/\.[^/.]+$/, "")
              .replace(/[^a-zA-Z0-9_-]/g, "_");
            const compressedFile = new File(
              [blob],
              `${cleanBaseName}-${Date.now()}.jpg`,
              { type: "image/jpeg" }
            );
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime a imagem no cliente (máx 1280px) e faz upload para o bucket 'establishment-photos'
 */
export async function compressAndUploadAutomotivePhoto(
  file: File,
  folder: "inspections" | "damaged-parts" = "inspections",
  licensePlate = "veiculo"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const compressed = await compressImageViaCanvas(file, 1280, 0.82);

    // 1. Tenta upload via Server Action autenticada (garante tenant_id e bypass de RLS se necessário)
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("folder", folder);
    formData.append("licensePlate", licensePlate);

    const serverRes = await uploadAutomotivePhotoAction(formData);
    if (serverRes.success && serverRes.data?.url) {
      return { success: true, url: serverRes.data.url };
    }

    // 2. Fallback direto pelo cliente no bucket 'establishment-photos'
    const supabase = createClient();
    const cleanPlate = licensePlate.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "AUTO";
    const filePath = `automotive/${folder}/${cleanPlate}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("establishment-photos")
      .upload(filePath, compressed, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        error: serverRes.error || uploadError.message || "Falha ao enviar foto.",
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from("establishment-photos")
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao comprimir/enviar foto.";
    return { success: false, error: msg };
  }
}

