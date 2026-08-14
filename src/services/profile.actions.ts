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
    phoneWhatsapp: formData.get("phoneWhatsapp")?.toString().trim() || "",
    address: formData.get("address")?.toString().trim() || "",
    logoUrl: formData.get("logoUrl")?.toString().trim() || "",
  };

  // 1. Validação com Zod
  const validation = updateProfileSchema.safeParse(rawData);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Dados inválidos.";
    console.error("[updateTenantProfileAction] Erro de validação Zod:", firstError, rawData);
    return { error: firstError };
  }

  const { companyName, description, phoneWhatsapp, address, logoUrl } = validation.data;

  // 2. Obter tenant_id e usuário autenticado com tratamento de erros
  const { data: tenantContext, error: tenantContextError } = await getAuthenticatedTenant();
  if (tenantContextError || !tenantContext) {
    console.error("[updateTenantProfileAction] Erro ao obter tenant autenticado:", tenantContextError);
    return { error: tenantContextError || "Sessão expirada. Faça login novamente." };
  }

  const tenantId = tenantContext.tenantId;
  const supabase = await createClient();

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
    const { error: profileError } = await supabase
      .from("tenant_profiles")
      .upsert(
        {
          tenant_id: tenantId,
          description: description || null,
          phone_whatsapp: phoneWhatsapp || null,
          address: address || null,
          logo_url: logoUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );

    if (profileError) {
      console.error("[updateTenantProfileAction] Erro no Supabase ao atualizar tabela 'tenant_profiles':", profileError);
      return { error: `Erro ao salvar perfil do estabelecimento: ${profileError.message}` };
    }

    // 5. Revalidação de Cache das páginas
    revalidatePath("/admin/configuracoes");
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
