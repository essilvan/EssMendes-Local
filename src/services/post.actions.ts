"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export interface PostActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function createPostAction(
  prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;
  const ctaType = (formData.get("ctaType") as string)?.trim() || "booking";
  const ctaLabel = (formData.get("ctaLabel") as string)?.trim() || "Agendar Horário";
  const ctaUrl = (formData.get("ctaUrl") as string)?.trim() || null;
  const rawTags = (formData.get("tags") as string)?.trim() || "";
  const metaDescription = (formData.get("metaDescription") as string)?.trim() || null;

  if (!title) {
    return { error: "O título da publicação é obrigatório." };
  }
  if (!content) {
    return { error: "O texto da publicação é obrigatório." };
  }

  // Processa tags separadas por vírgula em array de strings limpas
  const tags = rawTags
    ? rawTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);

  const supabase = await createClient();
  const tenantId = tenantContext.tenantId;

  const insertPayload: Record<string, any> = {
    tenant_id: tenantId,
    title,
    content,
    image_url: imageUrl,
    cta_type: ctaType,
    cta_label: ctaLabel,
    cta_url: ctaUrl,
    tags: tags.length > 0 ? tags : [],
    meta_description: metaDescription,
    slug: slug || null,
    is_active: true,
    published_at: new Date().toISOString(),
  };

  let { error } = await supabase.from("tenant_posts").insert(insertPayload);

  // Fallback caso colunas de SEO ainda não existam no banco remoto
  if (error && error.code === "PGRST204") {
    const fallbackPayload = {
      tenant_id: tenantId,
      title,
      content,
      image_url: imageUrl,
      cta_type: ctaType,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      is_active: true,
      published_at: new Date().toISOString(),
    };
    const fallbackRes = await supabase.from("tenant_posts").insert(fallbackPayload);
    error = fallbackRes.error;
  }

  if (error) {
    console.error("[createPostAction] Erro ao cadastrar post:", error);
    return { error: `Erro ao criar publicação: ${error.message}` };
  }

  revalidatePath("/admin/posts");
  revalidatePath("/admin/dashboard");
  if (tenantContext.tenant?.slug) {
    revalidatePath(`/${tenantContext.tenant.slug}`);
  }

  return { success: true, message: "Publicação cadastrada com sucesso!" };
}

export async function deletePostAction(postId: string): Promise<PostActionState> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_posts")
    .delete()
    .eq("id", postId)
    .eq("tenant_id", tenantContext.tenantId);

  if (error) {
    return { error: "Erro ao excluir publicação." };
  }

  revalidatePath("/admin/posts");
  if (tenantContext.tenant?.slug) {
    revalidatePath(`/${tenantContext.tenant.slug}`);
  }

  return { success: true, message: "Publicação excluída com sucesso." };
}

export async function togglePostStatusAction(
  postId: string,
  currentStatus: boolean
): Promise<PostActionState> {
  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: "Sessão expirada." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_posts")
    .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("tenant_id", tenantContext.tenantId);

  if (error) {
    return { error: "Erro ao alterar status da publicação." };
  }

  revalidatePath("/admin/posts");
  if (tenantContext.tenant?.slug) {
    revalidatePath(`/${tenantContext.tenant.slug}`);
  }

  return { success: true };
}
