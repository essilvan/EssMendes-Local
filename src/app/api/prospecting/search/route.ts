import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

interface NormalizedPlaceLead {
  place_id: string;
  business_name: string;
  phone: string;
  address: string | null;
  website: string | null;
  region: string | null;
  rating: number | null;
  total_reviews: number;
}

const CITY_OR_UF_REGEX =
  /\b(df|sp|rj|mg|go|ba|pr|rs|sc|pe|ce|pa|am|ma|es|pb|rn|al|pi|mt|ms|se|ro|to|ac|ap|rr|bras[ií]lia|taguatinga|ceil[aâ]ndia|samambaia|[aá]guas claras|guará|guara|gama|sobradinho|planaltina|vicente pires|recanto das emas|riacho fundo|santa maria|asa sul|asa norte|sudoeste|noroeste|lago sul|lago norte|valpara[ií]so|luz[iâ]nia|goi[aâ]nia|s[aã]o paulo|rio de janeiro|belo horizonte|curitiba|salvador|fortaleza|recife|porto alegre)\b/i;

function enrichLocalQuery(rawQuery: string): string {
  const trimmed = rawQuery.trim();
  if (CITY_OR_UF_REGEX.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} Taguatinga DF`;
}

function extractRegionFromComponentsOrAddress(
  components?: any[] | null,
  formattedAddress?: string | null
): string | null {
  if (Array.isArray(components) && components.length > 0) {
    const priorityTypes = [
      "sublocality_level_1",
      "sublocality",
      "neighborhood",
      "administrative_area_level_2",
      "locality",
    ];
    for (const targetType of priorityTypes) {
      const found = components.find(
        (c: any) => Array.isArray(c?.types) && c.types.includes(targetType)
      );
      const name = found?.longText || found?.long_name || found?.shortText || found?.short_name;
      if (name && String(name).trim()) {
        return String(name).trim();
      }
    }
  }

  if (formattedAddress) {
    const knownMatch = formattedAddress.match(
      /\b(Taguatinga|Ceil[aâ]ndia|[AÁ]guas Claras|Samambaia|Vicente Pires|Guar[aá]|Gama|Sobradinho|Planaltina|Recanto das Emas|Riacho Fundo|Santa Maria|Asa Sul|Asa Norte|Sudoeste|Noroeste|Lago Sul|Lago Norte|Bras[ií]lia)\b/i
    );
    if (knownMatch?.[1]) {
      return knownMatch[1];
    }
    const parts = formattedAddress.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 2].replace(/\s*-\s*[A-Z]{2}.*$/, "").trim();
      if (candidate && candidate.length <= 40) return candidate;
    }
  }

  return null;
}

async function searchPlacesNewApi(
  finalQuery: string,
  apiKey: string
): Promise<NormalizedPlaceLead[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.addressComponents",
    },
    body: JSON.stringify({
      textQuery: finalQuery,
      languageCode: "pt-BR",
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: -15.836, longitude: -48.056 },
          radius: 30000.0,
        },
      },
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const googleMsg =
      data?.error?.message ||
      data?.error?.status ||
      `HTTP ${res.status}`;
    throw new Error(`Places API (New): ${googleMsg}`);
  }

  const places: any[] = Array.isArray(data?.places) ? data.places : [];

  return places
    .map((p) => {
      const phone = String(
        p.nationalPhoneNumber || p.internationalPhoneNumber || ""
      ).trim();
      const address = p.formattedAddress ? String(p.formattedAddress).trim() : null;
      return {
        place_id: String(p.id || "").trim(),
        business_name: String(p.displayName?.text || "").trim(),
        phone,
        address,
        website: p.websiteUri ? String(p.websiteUri).trim() : null,
        region: extractRegionFromComponentsOrAddress(p.addressComponents, address),
        rating:
          p.rating !== undefined && p.rating !== null ? Number(p.rating) : null,
        total_reviews: Number(p.userRatingCount || 0),
      };
    })
    .filter((item) => item.place_id && item.business_name && item.phone);
}

async function searchPlacesLegacyApi(
  finalQuery: string,
  apiKey: string
): Promise<NormalizedPlaceLead[]> {
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    finalQuery
  )}&language=pt-BR&key=${encodeURIComponent(apiKey)}`;
  const searchRes = await fetch(searchUrl);
  const searchJson = await searchRes.json().catch(() => null);

  if (!searchRes.ok || !searchJson) {
    throw new Error(`Places Legacy API HTTP ${searchRes.status}`);
  }

  if (
    searchJson.status &&
    searchJson.status !== "OK" &&
    searchJson.status !== "ZERO_RESULTS"
  ) {
    throw new Error(
      `Places Legacy API (${searchJson.status}): ${
        searchJson.error_message || "Falha ao consultar Google Places."
      }`
    );
  }

  const results: any[] = Array.isArray(searchJson.results)
    ? searchJson.results.slice(0, 20)
    : [];

  const detailed = await Promise.all(
    results.map(async (r) => {
      if (!r?.place_id) return null;
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        r.place_id
      )}&fields=place_id,name,formatted_address,formatted_phone_number,international_phone_number,rating,user_ratings_total,website,address_components&language=pt-BR&key=${encodeURIComponent(
        apiKey
      )}`;
      try {
        const dRes = await fetch(detailsUrl);
        const dJson = await dRes.json().catch(() => null);
        const p = dJson?.result;
        if (!p) return null;
        const phone = String(
          p.formatted_phone_number || p.international_phone_number || ""
        ).trim();
        if (!phone) return null;
        const address = p.formatted_address || r.formatted_address || null;
        return {
          place_id: String(p.place_id || r.place_id),
          business_name: String(p.name || r.name || "").trim(),
          phone,
          address,
          website: p.website ? String(p.website).trim() : null,
          region: extractRegionFromComponentsOrAddress(p.address_components, address),
          rating:
            p.rating !== undefined && p.rating !== null
              ? Number(p.rating)
              : r.rating !== undefined
              ? Number(r.rating)
              : null,
          total_reviews: Number(
            p.user_ratings_total ?? r.user_ratings_total ?? 0
          ),
        } as NormalizedPlaceLead;
      } catch {
        return null;
      }
    })
  );

  return detailed.filter(Boolean) as NormalizedPlaceLead[];
}

export async function POST(request: Request) {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (
      authError ||
      !authContext ||
      (!authContext.isSuperAdmin && authContext.role !== "super_admin")
    ) {
      return NextResponse.json(
        { success: false, error: "Acesso restrito ao Super Admin." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawQuery = typeof body?.query === "string" ? body.query.trim() : "";

    if (!rawQuery || rawQuery.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe um termo de busca (ex: Espetinho Taguatinga DF).",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim() || "";
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Variável GOOGLE_PLACES_API_KEY não configurada na Vercel.",
        },
        { status: 400 }
      );
    }

    const finalQuery = enrichLocalQuery(rawQuery);
    let foundPlaces: NormalizedPlaceLead[] = [];
    let newApiErrorMsg: string | null = null;

    try {
      foundPlaces = await searchPlacesNewApi(finalQuery, apiKey);
    } catch (newErr: any) {
      newApiErrorMsg = newErr?.message || "Erro na Places API (New)";
      try {
        foundPlaces = await searchPlacesLegacyApi(finalQuery, apiKey);
      } catch (legacyErr: any) {
        const legacyMsg = legacyErr?.message || "Erro na Places API Clássica";
        return NextResponse.json(
          {
            success: false,
            error: `Erro na API do Google Places. ${newApiErrorMsg} | Fallback: ${legacyMsg}`,
          },
          { status: 502 }
        );
      }
    }

    const supabase = createAdminClient();
    const placeIds = foundPlaces.map((p) => p.place_id);

    const existingMap = new Map<string, any>();
    if (placeIds.length > 0) {
      const { data: existingRows, error: existingErr } = await supabase
        .from("prospecting_leads")
        .select("*")
        .in("place_id", placeIds);
      if (existingErr) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao consultar Supabase (prospecting_leads): ${existingErr.message}`,
          },
          { status: 500 }
        );
      }
      (existingRows || []).forEach((row: any) => {
        if (row?.place_id) existingMap.set(row.place_id, row);
      });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let dbErrorMsg: string | null = null;
    const foundByPlaceId = new Map<string, NormalizedPlaceLead>();
    foundPlaces.forEach((p) => foundByPlaceId.set(p.place_id, p));

    for (const lead of foundPlaces) {
      const existing = existingMap.get(lead.place_id);
      const baseFields = {
        business_name: lead.business_name,
        phone: lead.phone,
        address: lead.address,
        rating: lead.rating,
        total_reviews: lead.total_reviews,
      };
      const extendedFields = {
        ...baseFields,
        website: lead.website,
        region: lead.region,
      };

      if (existing) {
        let { error: updErr } = await supabase
          .from("prospecting_leads")
          .update(extendedFields)
          .eq("id", existing.id);

        if (updErr && (updErr.code === "PGRST204" || /column/i.test(updErr.message))) {
          const retry = await supabase
            .from("prospecting_leads")
            .update(baseFields)
            .eq("id", existing.id);
          updErr = retry.error;
        }

        if (updErr) {
          dbErrorMsg = updErr.message;
        } else {
          updatedCount++;
        }
      } else {
        let { error: insErr } = await supabase
          .from("prospecting_leads")
          .insert({
            place_id: lead.place_id,
            ...extendedFields,
            status: "new",
            chat_history: [],
          });

        if (insErr && (insErr.code === "PGRST204" || /column/i.test(insErr.message))) {
          const retry = await supabase
            .from("prospecting_leads")
            .insert({
              place_id: lead.place_id,
              ...baseFields,
              status: "new",
              chat_history: [],
            });
          insErr = retry.error;
        }

        if (insErr) {
          dbErrorMsg = insErr.message;
        } else {
          importedCount++;
        }
      }
    }

    if (dbErrorMsg && importedCount === 0 && updatedCount === 0 && foundPlaces.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao salvar leads no Supabase: ${dbErrorMsg}`,
        },
        { status: 500 }
      );
    }

    const { data: allLeads, error: listErr } = await supabase
      .from("prospecting_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (listErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao listar leads no Supabase: ${listErr.message}`,
        },
        { status: 500 }
      );
    }

    // Garante que website/region recém-extraídos apareçam imediatamente mesmo se a migration ainda não foi rodada
    const enrichedLeads = (allLeads || []).map((row: any) => {
      const fresh = foundByPlaceId.get(row.place_id);
      return {
        ...row,
        website: row.website ?? fresh?.website ?? null,
        region:
          row.region ??
          fresh?.region ??
          extractRegionFromComponentsOrAddress(null, row.address),
      };
    });

    return NextResponse.json({
      success: true,
      queryUsed: finalQuery,
      foundCount: foundPlaces.length,
      importedCount,
      updatedCount,
      leads: enrichedLeads,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro ao buscar leads no Google Places.",
      },
      { status: 500 }
    );
  }
}
