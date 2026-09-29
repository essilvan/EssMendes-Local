import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { PostsManager } from "@/components/admin/PostsManager";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import type { TenantPost } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  try {
    const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();

    if (tenantError || !tenantContext) {
      if (!tenantContext && !tenantError) {
        redirect("/login");
      }
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <div className="flex items-center gap-2 font-bold text-red-900">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Erro ao carregar publicações</span>
          </div>
          <p className="mt-1 text-xs text-red-700">
            {tenantError || "Estabelecimento não localizado."}
          </p>
        </div>
      );
    }

    const supabase = await createClient();

    // Busca publicações do tenant com tratamento defensivo
    const { data: rawPosts, error: postsDbError } = await supabase
      .from("tenant_posts")
      .select("*")
      .eq("tenant_id", tenantContext.tenantId)
      .order("published_at", { ascending: false });

    if (postsDbError) {
      console.warn("[AdminPostsPage] Aviso ao buscar posts do tenant:", postsDbError);
    }

    const posts = (rawPosts || []) as TenantPost[];
    const slug = tenantContext.tenant?.slug || "meu-negocio";

    return <PostsManager initialPosts={posts} slug={slug} />;
  } catch (err: any) {
    // Next.js redirect lida internamente com uma exceção especial
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[AdminPostsPage] Exceção ao renderizar página de posts:", err);
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="flex items-center gap-2 font-bold text-red-900">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Erro ao carregar publicações</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          {err?.message || "Ocorreu um erro ao carregar as publicações do estabelecimento."}
        </p>
      </div>
    );
  }
}
