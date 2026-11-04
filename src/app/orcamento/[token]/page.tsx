import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PublicQuoteApprovalClient } from "@/components/public/PublicQuoteApprovalClient";
import type { VehicleQuote, VehicleInspection } from "@/types";
import type { Metadata } from "next";
import { formatLicensePlateDisplay } from "@/lib/validations/vehicle-quote.schema";

export const dynamic = "force-dynamic";

interface PublicQuotePageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({
  params,
}: PublicQuotePageProps): Promise<Metadata> {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("vehicle_quotes")
    .select("license_plate, plate_display, vehicle_model, tenant_id")
    .eq("public_token", token)
    .maybeSingle();

  if (!quote) {
    return {
      title: "Orçamento não encontrado",
    };
  }

  const plate =
    quote.plate_display || formatLicensePlateDisplay(quote.license_plate);
  return {
    title: `Orçamento Online • Placa ${plate} (${quote.vehicle_model || "Veículo"})`,
    description: `Confira a discriminação de peças, mão de obra, fotos técnicas e aprove online o orçamento do veículo ${plate}.`,
  };
}

export default async function PublicQuotePage({
  params,
}: PublicQuotePageProps) {
  const { token } = await params;

  if (!token || token.length < 10) {
    notFound();
  }

  const supabase = createAdminClient();

  const { data: quoteData, error: quoteErr } = await supabase
    .from("vehicle_quotes")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();

  if (quoteErr || !quoteData) {
    notFound();
  }

  const quote = quoteData as VehicleQuote;

  const [tenantRes, profileRes, inspectionRes, profRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, name, slug, phone")
      .eq("id", quote.tenant_id)
      .maybeSingle(),
    supabase
      .from("tenant_profiles")
      .select("name, phone_whatsapp, phone, address, logo_url")
      .eq("tenant_id", quote.tenant_id)
      .maybeSingle(),
    supabase
      .from("vehicle_inspections")
      .select("*")
      .eq("quote_id", quote.id)
      .maybeSingle(),
    supabase
      .from("tenant_professionals")
      .select("phone, receives_quotes, is_primary_quote_contact")
      .eq("tenant_id", quote.tenant_id)
      .eq("is_active", true)
      .order("is_primary_quote_contact", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const workshopName =
    tenantRes.data?.name || profileRes.data?.name || "Oficina Especializada";
  const workshopSlug = tenantRes.data?.slug || "";
  const workshopPhone =
    profRes.data?.phone ||
    profileRes.data?.phone_whatsapp ||
    profileRes.data?.phone ||
    (tenantRes.data as any)?.phone ||
    "";
  const workshopAddress = profileRes.data?.address || null;
  const workshopLogo = profileRes.data?.logo_url || null;

  return (
    <PublicQuoteApprovalClient
      initialQuote={quote}
      inspection={(inspectionRes.data as VehicleInspection) || null}
      workshop={{
        name: workshopName,
        slug: workshopSlug,
        phone: workshopPhone,
        address: workshopAddress,
        logoUrl: workshopLogo,
      }}
    />
  );
}

