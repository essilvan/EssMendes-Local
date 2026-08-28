import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminRootPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const params = await searchParams;
  if (params.tenantId) {
    redirect(`/admin/dashboard?tenantId=${params.tenantId}`);
  }
  redirect("/admin/dashboard");
}
