import { redirect } from "next/navigation";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

export const dynamic = "force-dynamic";

export default async function AntesEDepoisPage() {
  const { data: tenantContext } = await getAuthenticatedTenant();

  if (!tenantContext?.isSuperAdmin && tenantContext?.tenant?.permissions?.before_after === false) {
    redirect("/admin/dashboard?error=recurso_indisponivel");
  }

  redirect("/admin/portfolio");
}
