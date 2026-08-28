"use server";

export interface PlacePreviewResult {
  name: string;
  phone: string;
  address: string;
  suggestedCategory: string;
  placeId: string;
  mapsUrl?: string;
}

/**
 * Resolve links curtos do Google Maps (maps.app.goo.gl)
 */
async function resolveShortGoogleMapsUrl(url: string): Promise<string> {
  if (!url.startsWith("http")) return url;
  if (!url.includes("goo.gl") && !url.includes("maps.app.goo.gl")) {
    return url;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    return res.url || url;
  } catch (err) {
    console.warn("[resolveShortGoogleMapsUrl] Erro ao resolver URL curta:", err);
    return url;
  }
}

import { formatBrazilianPhone } from "@/utils/phone";

/**
 * Server Action para Consulta Rápida da Ficha Google Places
 * Executa uma chamada leve buscando apenas telefone, nome, endereço e categoria
 */
export async function fetchPlacePreview(
  mapsUrlOrPlaceId: string
): Promise<{
  success: boolean;
  data?: PlacePreviewResult;
  error?: string;
}> {
  try {
    const cleanInput = (mapsUrlOrPlaceId || "").trim();
    if (!cleanInput) {
      return { success: false, error: "Link do Google Maps ou Place ID não informado." };
    }

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    let googlePlaceId = "";
    let textQuery = cleanInput;
    let resolvedUrl = cleanInput;

    // 1. Identifica se a entrada é um Place ID direto (ex: ChIJ...)
    if (cleanInput.startsWith("ChIJ") && !cleanInput.includes(" ") && !cleanInput.startsWith("http")) {
      googlePlaceId = cleanInput;
    } else if (cleanInput.startsWith("http")) {
      // 2. Se for link do Google Maps, resolve links curtos
      resolvedUrl = await resolveShortGoogleMapsUrl(cleanInput);

      // 2.1 Extrai place_id de parâmetro de query
      const placeIdMatch = resolvedUrl.match(/[?&]place_id=([a-zA-Z0-9_\-]+)/);
      if (placeIdMatch && placeIdMatch[1]) {
        googlePlaceId = placeIdMatch[1];
      }

      // 2.2 Extrai ChIJ da URL
      if (!googlePlaceId) {
        const chijMatch = resolvedUrl.match(/(ChIJ[a-zA-Z0-9_\-]{20,})/);
        if (chijMatch && chijMatch[1]) {
          googlePlaceId = chijMatch[1];
        }
      }

      // 2.3 Extrai nome da URL (/place/Nome+Do+Local)
      const placeNameMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
      if (placeNameMatch && placeNameMatch[1]) {
        textQuery = decodeURIComponent(placeNameMatch[1].replace(/\+/g, " ")).trim();
      } else {
        const queryMatch =
          resolvedUrl.match(/[?&]q=([^&]+)/) || resolvedUrl.match(/[?&]query=([^&]+)/);
        if (queryMatch && queryMatch[1]) {
          textQuery = decodeURIComponent(queryMatch[1].replace(/\+/g, " ")).trim();
        }
      }
    }

    // Se não tiver chave de API configurada, retorna os dados básicos inferidos da URL
    if (!apiKey) {
      const fallbackName = textQuery && !textQuery.startsWith("http") ? textQuery : "Estabelecimento Comercial";
      return {
        success: true,
        data: {
          name: fallbackName,
          phone: "",
          address: "",
          suggestedCategory: "Negócio Local",
          placeId: googlePlaceId || "",
          mapsUrl: resolvedUrl,
        },
      };
    }

    // 3. Consulta leve à Google Places API (New)
    let placeData: any = null;

    // 3.1 Consulta direta por Place ID (mais rápido e barato)
    if (googlePlaceId) {
      const detailsUrl = `https://places.googleapis.com/v1/places/${googlePlaceId}?languageCode=pt-BR`;
      const fieldMask = [
        "id",
        "displayName",
        "formattedAddress",
        "nationalPhoneNumber",
        "internationalPhoneNumber",
        "primaryTypeDisplayName",
        "types",
      ].join(",");

      const res = await fetch(detailsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
      });

      if (res.ok) {
        placeData = await res.json();
      }
    }

    // 3.2 Se não encontrou por ID, busca por texto com searchText
    if (!placeData && textQuery) {
      const searchUrl = "https://places.googleapis.com/v1/places:searchText";
      const fieldMask = [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.primaryTypeDisplayName",
        "places.types",
      ].join(",");

      const searchRes = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify({
          textQuery,
          languageCode: "pt-BR",
        }),
      });

      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        if (searchJson.places && searchJson.places.length > 0) {
          placeData = searchJson.places[0];
        }
      }
    }

    // 4. Se encontrou o local, extrai e formata os dados
    if (placeData) {
      const rawName = placeData.displayName?.text || placeData.name || textQuery;
      const rawPhone =
        placeData.nationalPhoneNumber ||
        placeData.internationalPhoneNumber ||
        placeData.formatted_phone_number ||
        "";
      const formattedPhone = formatBrazilianPhone(rawPhone);
      const address = placeData.formattedAddress || placeData.formatted_address || "";
      const suggestedCategory =
        placeData.primaryTypeDisplayName?.text ||
        (placeData.types && placeData.types[0] ? placeData.types[0].replace(/_/g, " ") : "Comércio Local");

      return {
        success: true,
        data: {
          name: rawName,
          phone: formattedPhone,
          address,
          suggestedCategory,
          placeId: placeData.id || googlePlaceId || "",
          mapsUrl: resolvedUrl,
        },
      };
    }

    // Se a API não localizou a ficha específica
    return {
      success: false,
      error: "Não foi possível localizar os dados desta ficha no Google Maps. Verifique o link fornecido.",
    };
  } catch (err: any) {
    console.error("[fetchPlacePreview] Exceção:", err);
    return {
      success: false,
      error: err.message || "Erro inesperado ao consultar a ficha do Google Places.",
    };
  }
}
