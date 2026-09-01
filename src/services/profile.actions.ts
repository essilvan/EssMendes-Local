"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { updateProfileSchema } from "@/lib/validations/profile.schema";
import { revalidatePath } from "next/cache";

export interface ProfileActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function updateTenantProfileAction(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const rawData = {
    companyName: formData.get("companyName")?.toString().trim() || "",
    description: formData.get("description")?.toString().trim() || "",
    editorialSummary: formData.get("editorialSummary")?.toString().trim() || "",
    phoneWhatsapp: formData.get("phoneWhatsapp")?.toString().trim() || "",
    address: formData.get("address")?.toString().trim() || "",
    logoUrl: formData.get("logoUrl")?.toString().trim() || "",
    primaryColor: formData.get("primaryColor")?.toString().trim() || "",
    googleMapsUrl: formData.get("googleMapsUrl")?.toString().trim() || "",
    rating: formData.get("rating") ? Number(formData.get("rating")) : 4.9,
    reviewCount: formData.get("reviewCount") ? Number(formData.get("reviewCount")) : 128,
    placePhotos: formData.get("placePhotos")?.toString().trim() || "",
    themeNiche: formData.get("themeNiche")?.toString().trim() || "",
  };

  // 1. Validação com Zod
  const validation = updateProfileSchema.safeParse(rawData);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Dados inválidos.";
    console.error("[updateTenantProfileAction] Erro de validação Zod:", firstError, rawData);
    return { error: firstError };
  }

  const {
    companyName,
    description,
    editorialSummary,
    phoneWhatsapp,
    address,
    logoUrl,
    primaryColor,
    googleMapsUrl,
    rating,
    reviewCount,
    placePhotos: rawPlacePhotos,
    themeNiche,
  } = validation.data;

  // 2. Obter tenant_id e usuário autenticado com tratamento de erros
  const { data: tenantContext, error: tenantContextError } = await getAuthenticatedTenant();
  if (tenantContextError || !tenantContext) {
    console.error("[updateTenantProfileAction] Erro ao obter tenant autenticado:", tenantContextError);
    return { error: tenantContextError || "Sessão expirada. Faça login novamente." };
  }

  const tenantId = tenantContext.tenantId;
  const supabase = await createClient();

  // Tratamento seguro do array de fotos
  let parsedPhotos: string[] | undefined;
  if (rawPlacePhotos) {
    try {
      const parsed = JSON.parse(rawPlacePhotos);
      if (Array.isArray(parsed)) {
        parsedPhotos = parsed.filter((p) => typeof p === "string" && p.trim().length > 0);
      }
    } catch {
      if (rawPlacePhotos.startsWith("http")) {
        parsedPhotos = [rawPlacePhotos];
      }
    }
  }

  try {
    // 3. Atualizar nome na tabela `tenants`
    const { error: tenantError } = await supabase
      .from("tenants")
      .update({
        name: companyName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (tenantError) {
      console.error("[updateTenantProfileAction] Erro no Supabase ao atualizar tabela 'tenants':", tenantError);
      return { error: `Erro ao atualizar dados da empresa: ${tenantError.message}` };
    }

    // 4. Upsert na tabela `tenant_profiles` com injeção segura de tenant_id
    const profilePayload: Record<string, any> = {
      tenant_id: tenantId,
      name: companyName,
      description: description || null,
      editorial_summary: editorialSummary || description || null,
      phone_whatsapp: phoneWhatsapp || null,
      address: address || null,
      logo_url: logoUrl || null,
      primary_color: primaryColor || "#0d9488",
      template_id: themeNiche || "retail_default",
      google_maps_url: googleMapsUrl || null,
      rating: rating ?? 4.9,
      review_count: reviewCount ?? 128,
      updated_at: new Date().toISOString(),
    };

    if (parsedPhotos !== undefined) {
      profilePayload.place_photos = parsedPhotos;
    }

    let { error: profileError } = await supabase
      .from("tenant_profiles")
      .upsert(profilePayload, { onConflict: "tenant_id" });

    // Fallback gracioso caso alguma coluna opcional ainda não exista no Supabase remoto
    if (profileError && profileError.code === "PGRST204") {
      const fallbackPayload: Record<string, any> = {
        tenant_id: tenantId,
        description: description || null,
        phone_whatsapp: phoneWhatsapp || null,
        address: address || null,
        logo_url: logoUrl || null,
        primary_color: primaryColor || "#0d9488",
        google_maps_url: googleMapsUrl || null,
        rating: rating ?? 4.9,
        review_count: reviewCount ?? 128,
        updated_at: new Date().toISOString(),
      };
      if (parsedPhotos !== undefined) {
        fallbackPayload.place_photos = parsedPhotos;
      }
      const fallbackRes = await supabase
        .from("tenant_profiles")
        .upsert(fallbackPayload, { onConflict: "tenant_id" });
      profileError = fallbackRes.error;
    }

    if (profileError) {
      console.error("[updateTenantProfileAction] Erro no Supabase ao atualizar tabela 'tenant_profiles':", profileError);
      return { error: `Erro ao salvar perfil do estabelecimento: ${profileError.message}` };
    }

    // 5. Revalidação de Cache das páginas
    revalidatePath("/admin/configuracoes");
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/dashboard");
    if (tenantContext.tenant?.slug) {
      revalidatePath(`/${tenantContext.tenant.slug}`);
    }

    return {
      success: true,
      message: "Configurações do estabelecimento salvas com sucesso!",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[updateTenantProfileAction] Exceção capturada ao salvar perfil:", err);
    return {
      error: `Erro ao processar alterações: ${errorMsg}`,
    };
  }
}
