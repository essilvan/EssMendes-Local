"use server";

import { createClient } from "@/lib/supabase/server";

export interface DiagnosticInput {
  companyName: string;
  city: string;
  whatsapp: string;
}

export interface DiagnosticResult {
  success: boolean;
  data?: {
    companyName: string;
    city: string;
    score: number;
    googleFound: boolean;
    googleRating?: number | null;
    googleReviewsCount?: number | null;
    address?: string | null;
    issuesCount: number;
    opportunitiesCount: number;
    issues: string[];
    opportunities: string[];
  };
  error?: string;
}

/**
 * Server Action: Executa diagnóstico gratuito no Google Places e salva o lead
 */
export async function runFreeDiagnosticAction(
  input: DiagnosticInput
): Promise<DiagnosticResult> {
  const company = input.companyName?.trim();
  const city = input.city?.trim();
  const phone = input.whatsapp?.trim();

  if (!company || company.length < 2) {
    return { success: false, error: "Informe o nome da empresa." };
  }
  if (!city || city.length < 2) {
    return { success: false, error: "Informe a cidade do estabelecimento." };
  }
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return { success: false, error: "Informe um número de WhatsApp válido com DDD." };
  }

  try {
    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY;

    let googleFound = false;
    let placeId: string | undefined;
    let rating: number | undefined;
    let reviewsCount: number | undefined;
    let address: string | undefined;
    let hasPhotos = false;

    if (apiKey) {
      try {
        const searchUrl = "https://places.googleapis.com/v1/places:searchText";
        const queryText = `${company} ${city}`;

        const res = await fetch(searchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos",
          },
          body: JSON.stringify({
            textQuery: queryText,
            languageCode: "pt-BR",
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.places && json.places.length > 0) {
            const place = json.places[0];
            googleFound = true;
            placeId = place.id;
            rating = place.rating;
            reviewsCount = place.userRatingCount;
            address = place.formattedAddress;
            hasPhotos = Array.isArray(place.photos) && place.photos.length > 0;
          }
        }
      } catch (gErr) {
        console.warn("[runFreeDiagnosticAction] Erro no Google Places:", gErr);
      }
    }

    // Cálculo do mini-score do lead
    let calculatedScore = 30; // base inicial
    const issues: string[] = [];
    const opportunities: string[] = [];

    if (googleFound) {
      calculatedScore += 25;
      if (rating && rating >= 4.5) calculatedScore += 15;
      if (reviewsCount && reviewsCount >= 10) calculatedScore += 15;
      if (hasPhotos) calculatedScore += 10;

      if (!reviewsCount || reviewsCount < 5) {
        issues.push("Poucas avaliações registradas no Google (menos de 5 depoimentos).");
        opportunities.push("Ativar sincronização e motor de geração de avaliações.");
      }
      if (!hasPhotos) {
        issues.push("Ausência de fotos de fachada e catálogo em alta resolução.");
        opportunities.push("Adicionar galeria visual com links diretos.");
      }
      issues.push("Sem vitrine própria otimizada para compras via WhatsApp.");
      opportunities.push("Criar vitrine indexável no Google com catálogo de produtos e serviços.");
      opportunities.push("Habilitar agendamento online automático 24 horas.");
    } else {
      issues.push("Empresa não encontrada no topo das pesquisas locais do Google Maps.");
      issues.push("Sem metadados estruturados Schema.org para buscas na cidade.");
      issues.push("Falta de página profissional com conversão direta.");
      opportunities.push("Criar presença digital verificada com EssMendes Local.");
      opportunities.push("Integrar localização com rotas instantâneas para Waze e Google Maps.");
      opportunities.push("Publicar conteúdos locais com IA para ranquear nos termos da cidade.");
    }

    calculatedScore = Math.min(88, Math.max(35, calculatedScore));

    // Salva o lead no banco de dados
    try {
      const supabase = await createClient();
      await supabase.from("lead_diagnostics").insert({
        company_name: company,
        city: city,
        whatsapp: phone,
        calculated_score: calculatedScore,
        google_found: googleFound,
        google_place_id: placeId || null,
        google_rating: rating || null,
        google_reviews_count: reviewsCount || 0,
        issues_detected: issues,
        opportunities_detected: opportunities,
      });
    } catch (dbErr) {
      console.warn("[runFreeDiagnosticAction] Falha ao persistir lead:", dbErr);
    }

    return {
      success: true,
      data: {
        companyName: company,
        city,
        score: calculatedScore,
        googleFound,
        googleRating: rating,
        googleReviewsCount: reviewsCount,
        address,
        issuesCount: issues.length,
        opportunitiesCount: opportunities.length,
        issues,
        opportunities,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao processar diagnóstico.";
    return { success: false, error: msg };
  }
}
