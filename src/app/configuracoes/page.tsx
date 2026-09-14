import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function RootConfiguracoesRedirect() {
  redirect("/admin/configuracoes");
}
