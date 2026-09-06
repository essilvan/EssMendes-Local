import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminRootPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; error?: string; [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const queryStr = search.toString();
  redirect(`/admin/dashboard${queryStr ? `?${queryStr}` : ""}`);
}
