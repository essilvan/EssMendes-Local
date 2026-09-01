import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { tenantId, googlePlaceId } = body;

    if (!tenantId) {
      const url = new URL(req.url);
      tenantId = url.searchParams.get("tenantId");
      if (!googlePlaceId) {
        googlePlaceId = url.searchParams.get("googlePlaceId");
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Parâmetro 'tenantId' é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Se o googlePlaceId não foi fornecido, busca no banco de dados
    if (!googlePlaceId) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, google_place_id")
        .eq("id", tenantId)
        .maybeSingle();

      if (tenant?.google_place_id) {
        googlePlaceId = tenant.google_place_id;
      } else {
        const { data: profile } = await supabase
          .from("tenant_profiles")
          .select("google_place_id")
          .eq("tenant_id", tenantId)
          .maybeSingle();

        if (profile?.google_place_id) {
          googlePlaceId = profile.google_place_id;
        }
      }
    }

    if (!googlePlaceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhum 'google_place_id' cadastrado para este estabelecimento.",
        },
        { status: 404 }
      );
    }

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Chave da Google Places API não configurada no servidor." },
        { status: 500 }
      );
    }

    let hours: string[] = [];

    // 1. Tenta consulta via Google Places Details API (Legacy)
    try {
      const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        googlePlaceId
      )}&fields=current_opening_hours,opening_hours&language=pt-BR&key=${apiKey}`;

      const legacyRes = await fetch(legacyUrl);
      if (legacyRes.ok) {
        const legacyData = await legacyRes.json();
        const legacyHours =
          legacyData.result?.current_opening_hours?.weekday_text ||
          legacyData.result?.opening_hours?.weekday_text;

        if (Array.isArray(legacyHours) && legacyHours.length > 0) {
          hours = legacyHours;
        }
      }
    } catch (err) {
      console.warn("[sync-google-hours] Aviso na API Legacy:", err);
    }

    // 2. Fallback para Google Places API (New) se não obteve horários
    if (hours.length === 0) {
      try {
        const newUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(
          googlePlaceId
        )}?languageCode=pt-BR`;

        const newRes = await fetch(newUrl, {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "currentOpeningHours,regularOpeningHours",
          },
        });

        if (newRes.ok) {
          const newData = await newRes.json();
          const newHours =
            newData.currentOpeningHours?.weekdayDescriptions ||
            newData.regularOpeningHours?.weekdayDescriptions;

          if (Array.isArray(newHours) && newHours.length > 0) {
            hours = newHours;
          }
        }
      } catch (err) {
        console.warn("[sync-google-hours] Aviso na API New:", err);
      }
    }

    if (hours.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A ficha do Google Places não possui horários cadastrados ou a API não retornou dados.",
        },
        { status: 404 }
      );
    }

    // 3. Atualiza na tabela tenants
    const { error: tenantUpdateError } = await supabase
      .from("tenants")
      .update({
        opening_hours: hours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (tenantUpdateError) {
      console.warn(
        "[sync-google-hours] Aviso ao atualizar coluna opening_hours em tenants:",
        tenantUpdateError.message
      );
    }

    // 4. Atualiza na tabela tenant_profiles
    const { error: profileUpdateError } = await supabase
      .from("tenant_profiles")
      .update({
        opening_hours_json: hours,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId);

    if (profileUpdateError) {
      console.warn(
        "[sync-google-hours] Aviso ao atualizar opening_hours_json em tenant_profiles:",
        profileUpdateError.message
      );
    }

    // 5. Revalida caches
    revalidatePath("/super-admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/configuracoes");

    return NextResponse.json({
      success: true,
      opening_hours: hours,
      tenantId,
      googlePlaceId,
    });
  } catch (err: any) {
    console.error("[sync-google-hours] Erro inesperado:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno ao sincronizar horários do Google." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
