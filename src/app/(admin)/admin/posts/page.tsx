import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { PostsManager } from "@/components/admin/PostsManager";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import type { TenantPost } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
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

  // Busca publicações do tenant
  const { data: rawPosts } = await supabase
    .from("tenant_posts")
    .select("*")
    .eq("tenant_id", tenantContext.tenantId)
    .order("published_at", { ascending: false });

  const posts = (rawPosts || []) as TenantPost[];
  const slug = tenantContext.tenant?.slug || "meu-negocio";

  return <PostsManager initialPosts={posts} slug={slug} />;
}
