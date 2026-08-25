"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

export interface GooglePlaceSyncResult {
  success?: boolean;
  error?: string;
  data?: {
    companyName: string;
    phoneWhatsapp: string;
    phone?: string;
    address: string;
    description?: string;
    editorialSummary?: string;
    logoUrl?: string;
    businessCategory?: string;
    rating: number | null;
    reviewCount: number | null;
    googleMapsUrl: string;
    weeklyHours?: string[];
    placePhotos: string[];
    latitude?: number;
    longitude?: number;
    reviewsCountImported: number;
    photosCountImported: number;
    servicesCountImported?: number;
    services?: Array<{
      id: string;
      name: string;
      description?: string | null;
      price: number;
      duration_minutes: number;
      is_active: boolean;
    }>;
  };
}

interface ParsedReview {
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  text: string;
  relativeTime: string;
}

/**
 * Resolve links curtos do Google Maps (e.g. maps.app.goo.gl/xxx ou goo.gl/maps/xxx)
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
    console.warn("[resolveShortGoogleMapsUrl] Erro ao desencarar URL curta:", err);
    return url;
  }
}

import { extractNeighborhoodAndCity } from "@/utils/address";

/**
 * Gera Headline e Resumo Editorial Inteligente com base na categoria e endereço
 */
function generateSmartHeadlineAndSummary(
  companyName: string,
  category: string,
  address: string,
  rawSummary?: string
): { headline: string; editorialSummary: string } {
  const catName = category ? category.trim() : "Serviços Especializados";

  // Extrai cidade ou bairro a partir do endereço evitando números de CEP ou fragmentos corrompidos
  const neighborhoodCity = extractNeighborhoodAndCity(address);
  const locationLabel = neighborhoodCity ? `em ${neighborhoodCity}` : "na sua região";

  // 1. Headline de alto impacto (para o Topo / Hero)
  const headline = `Especialistas em ${catName.toLowerCase()} com atendimento de excelência e compromisso com sua satisfação ${locationLabel}.`;

  // 2. Sobre a Empresa / Apresentação Detalhada
  const editorialSummary =
    rawSummary && rawSummary.trim().length > 20
      ? rawSummary.trim()
      : `Bem-vindo à ${companyName}! Somos referência no segmento de ${catName.toLowerCase()}, oferecendo atendimento ágil, profissionais altamente qualificados e serviços de primeira linha. Nosso compromisso é entregar a melhor experiência, confiança e soluções sob medida para cada cliente.`;

  return { headline, editorialSummary };
}

interface ServiceTemplate {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
}

/**
 * Sugere catálogo de serviços essenciais de acordo com o segmento da empresa
 */
function getDefaultServicesForCategory(
  category: string,
  companyName: string
): ServiceTemplate[] {
  const text = `${category} ${companyName}`.toLowerCase();

  // 1. Oficinas Mecânicas / Automotivo / Câmbio / Embreagem / Carros / Direção
  if (
    text.includes("mecânic") ||
    text.includes("mecanic") ||
    text.includes("embreag") ||
    text.includes("direção") ||
    text.includes("direcao") ||
    text.includes("auto") ||
    text.includes("car") ||
    text.includes("oficina") ||
    text.includes("pneu") ||
    text.includes("motor") ||
    text.includes("freio") ||
    text.includes("suspensão") ||
    text.includes("suspensao") ||
    text.includes("óleo") ||
    text.includes("oleo")
  ) {
    return [
      {
        name: "Revisão Preventiva Completa",
        description: "Checagem detalhada de suspensão, freios, fluidos, correias e componentes vitais do veículo.",
        price: 250.0,
        duration_minutes: 90,
      },
      {
        name: "Troca de Óleo e Filtros",
        description: "Substituição do óleo do motor especificado e troca de filtros de óleo, ar e combustível.",
        price: 150.0,
        duration_minutes: 45,
      },
      {
        name: "Alinhamento e Balanceamento",
        description: "Alinhamento computadorizado da geometria da direção e balanceamento 3D das rodas.",
        price: 120.0,
        duration_minutes: 60,
      },
      {
        name: "Diagnóstico e Manutenção Geral",
        description: "Varredura eletrônica por scanner, análise de falhas e orçamento técnico detalhado.",
        price: 180.0,
        duration_minutes: 60,
      },
    ];
  }

  // 2. Salão de Beleza / Estética / Cabelereiro / Manicure / Spa
  if (
    text.includes("salão") ||
    text.includes("salao") ||
    text.includes("cabel") ||
    text.includes("beleza") ||
    text.includes("estétic") ||
    text.includes("estetic") ||
    text.includes("manicure") ||
    text.includes("unha") ||
    text.includes("spa") ||
    text.includes("beauty")
  ) {
    return [
      {
        name: "Corte Feminino & Escova",
        description: "Higienização especial, corte personalizado de acordo com o visagismo e escova modeladora.",
        price: 120.0,
        duration_minutes: 60,
      },
      {
        name: "Corte Masculino Degradê",
        description: "Corte moderno na tesoura e máquina, acabamento com navalha e lavagem com produtos premium.",
        price: 45.0,
        duration_minutes: 30,
      },
      {
        name: "Hidratação e Nutrição Capilar",
        description: "Tratamento profundo com produtos profissionais para recuperação da maciez e brilho.",
        price: 90.0,
        duration_minutes: 45,
      },
      {
        name: "Manicure & Pedicure Completa",
        description: "Cuidado completo para mãos e pés, cuticulagem segura, esfoliação e esmaltação impecável.",
        price: 65.0,
        duration_minutes: 50,
      },
    ];
  }

  // 3. Barbearia / Barbeiro
  if (text.includes("barbearia") || text.includes("barbeiro") || text.includes("barber")) {
    return [
      {
        name: "Corte Tradicional / Degradê",
        description: "Corte masculino com tesoura e máquina, acabamento com navalhete e finalização com pomada.",
        price: 45.0,
        duration_minutes: 30,
      },
      {
        name: "Barba Terapia com Toalha Quente",
        description: "Alinhamento e desenho de barba, aplicação de toalha quente, óleos essenciais e pós-barba calmante.",
        price: 40.0,
        duration_minutes: 30,
      },
      {
        name: "Combo Corte + Barba",
        description: "Experiência completa com corte de cabelo e tratamento completo da barba com desconto especial.",
        price: 75.0,
        duration_minutes: 50,
      },
      {
        name: "Acabamento de Pezinho e Sobrancelha",
        description: "Alinhamento e limpeza dos contornos do cabelo e sobrancelhas com lâmina descartável.",
        price: 25.0,
        duration_minutes: 20,
      },
    ];
  }

  // 4. Saúde / Clínica / Odontologia / Dentista / Fisioterapia / Psicologia
  if (
    text.includes("odont") ||
    text.includes("dent") ||
    text.includes("saúde") ||
    text.includes("saude") ||
    text.includes("clínica") ||
    text.includes("clinica") ||
    text.includes("fisioterapia") ||
    text.includes("psicolog") ||
    text.includes("médic") ||
    text.includes("medic")
  ) {
    return [
      {
        name: "Consulta e Avaliação Inicial",
        description: "Atendimento de triagem, análise diagnóstica e elaboração de plano de tratamento personalizado.",
        price: 150.0,
        duration_minutes: 50,
      },
      {
        name: "Sessão de Atendimento Especializado",
        description: "Execução do procedimento terapêutico ou preventivo com foco no seu bem-estar e saúde.",
        price: 120.0,
        duration_minutes: 50,
      },
      {
        name: "Procedimento e Manutenção Preventiva",
        description: "Cuidado contínuo para manutenção dos resultados com equipamentos modernos e esterilizados.",
        price: 200.0,
        duration_minutes: 60,
      },
    ];
  }

  // 5. Padrão / Prestadores de Serviços Gerais
  return [
    {
      name: "Atendimento e Avaliação Técnica",
      description: "Avaliação completa das necessidades com elaboração de diagnóstico e orçamento sem compromisso.",
      price: 100.0,
      duration_minutes: 45,
    },
    {
      name: "Serviço Especializado Padrão",
      description: "Execução de serviço profissional especializado com pontualidade e garantia de qualidade.",
      price: 180.0,
      duration_minutes: 60,
    },
    {
      name: "Consultoria e Diagnóstico Completo",
      description: "Diagnóstico aprofundado e execução técnica das melhores soluções para sua necessidade.",
      price: 250.0,
      duration_minutes: 90,
    },
  ];
}

/**
 * Server Action Principal: Sincroniza dados completos do Google Places (New API)
 * Aceita URL do Google Maps (completa ou curta) ou Nome/Endereço do estabelecimento.
 */
export async function syncGooglePlaceData(
  queryOrUrl: string
): Promise<GooglePlaceSyncResult> {
  if (!queryOrUrl || !queryOrUrl.trim()) {
    return {
      error: "Por favor, informe o link do Google Maps ou o nome do seu estabelecimento.",
    };
  }

  const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
  if (tenantError || !tenantContext) {
    return { error: "Sessão expirada. Faça login novamente para continuar." };
  }

  const tenantId = tenantContext.tenantId;
  const rawInput = queryOrUrl.trim();

  try {
    let companyName = "";
    let phoneWhatsapp = "";
    let phone = "";
    let address = "";
    let description = "";
    let businessCategory = "";
    let rating: number | null = null;
    let reviewCount: number | null = null;
    let weeklyHours: string[] = [];
    let placePhotos: string[] = [];
    let latitude: number | undefined;
    let longitude: number | undefined;
    let googlePlaceId = "";
    let googleMapsUrl = rawInput.startsWith("http")
      ? rawInput
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawInput)}`;
    const reviewsToInsert: ParsedReview[] = [];

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    // 1. Tratamento e extração inteligente de Place ID, coordenadas ou Nome a partir da URL
    let resolvedUrl = rawInput;
    let textQuery = rawInput;

    if (rawInput.startsWith("http")) {
      resolvedUrl = await resolveShortGoogleMapsUrl(rawInput);
      googleMapsUrl = resolvedUrl;

      // 1.1 Extração de place_id explícito na URL
      const placeIdParamMatch = resolvedUrl.match(/[?&]place_id=([a-zA-Z0-9_\-]+)/);
      if (placeIdParamMatch && placeIdParamMatch[1]) {
        googlePlaceId = placeIdParamMatch[1];
      }

      // 1.2 Extração de Place ID tipo ChIJ na URL
      const chijMatch = resolvedUrl.match(/(ChIJ[a-zA-Z0-9_\-]{20,})/);
      if (chijMatch && chijMatch[1]) {
        googlePlaceId = chijMatch[1];
      }

      // 1.3 Extração de coordenadas lat,lng da URL (ex: /@ -23.561684,-46.655981 ou !3d-23.561684!4d-46.655981)
      const coordsAtMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordsAtMatch && coordsAtMatch[1] && coordsAtMatch[2]) {
        latitude = parseFloat(coordsAtMatch[1]);
        longitude = parseFloat(coordsAtMatch[2]);
      } else {
        const coordsDataMatch = resolvedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (coordsDataMatch && coordsDataMatch[1] && coordsDataMatch[2]) {
          latitude = parseFloat(coordsDataMatch[1]);
          longitude = parseFloat(coordsDataMatch[2]);
        }
      }

      // 1.4 Extração do nome do local da URL do Google Maps (/place/Nome+Do+Local)
      const placeNameMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
      if (placeNameMatch && placeNameMatch[1]) {
        const rawPlace = decodeURIComponent(placeNameMatch[1].replace(/\+/g, " "));
        // Se vier como "Nome, Rua...", pega a primeira parte para melhorar busca
        textQuery = rawPlace.trim();
      } else {
        const queryMatch = resolvedUrl.match(/[?&]q=([^&]+)/) || resolvedUrl.match(/[?&]query=([^&]+)/);
        if (queryMatch && queryMatch[1]) {
          textQuery = decodeURIComponent(queryMatch[1].replace(/\+/g, " "));
        }
      }
    }

    // 2. Consulta à Google Places API (New)
    if (apiKey) {
      try {
        let placeDetailsData: any = null;

        // 2.1 Se já temos o placeId explícito, consulta direta por Place Details
        if (googlePlaceId) {
          const detailsUrl = `https://places.googleapis.com/v1/places/${googlePlaceId}?languageCode=pt-BR`;
          const detailsFieldMask = [
            "id",
            "displayName",
            "formattedAddress",
            "internationalPhoneNumber",
            "nationalPhoneNumber",
            "regularOpeningHours",
            "currentOpeningHours",
            "rating",
            "userRatingCount",
            "reviews",
            "editorialSummary",
            "photos",
            "primaryTypeDisplayName",
            "location",
            "googleMapsUri",
          ].join(",");

          const detailsRes = await fetch(detailsUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": detailsFieldMask,
            },
          });

          if (detailsRes.ok) {
            placeDetailsData = await detailsRes.json();
          }
        }

        // 2.2 Se não conseguiu pelo ID ou não tinha ID, faz SearchText (New API)
        if (!placeDetailsData) {
          const searchUrl = "https://places.googleapis.com/v1/places:searchText";
          const fieldMask = [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.internationalPhoneNumber",
            "places.nationalPhoneNumber",
            "places.regularOpeningHours",
            "places.currentOpeningHours",
            "places.rating",
            "places.userRatingCount",
            "places.reviews",
            "places.editorialSummary",
            "places.photos",
            "places.primaryTypeDisplayName",
            "places.location",
            "places.googleMapsUri",
          ].join(",");

          const requestBody: Record<string, any> = {
            textQuery,
            languageCode: "pt-BR",
          };

          // Se tiver coordenadas, orienta a busca para a localização exata
          if (typeof latitude === "number" && typeof longitude === "number") {
            requestBody.locationBias = {
              circle: {
                center: { latitude, longitude },
                radius: 1000.0,
              },
            };
          }

          const searchRes = await fetch(searchUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": fieldMask,
            },
            body: JSON.stringify(requestBody),
          });

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.places && searchData.places.length > 0) {
              placeDetailsData = searchData.places[0];
            }
          } else {
            const errBody = await searchRes.text();
            console.error("[syncGooglePlaceData] Erro na API searchText:", searchRes.status, errBody);
          }
        }

        // 2.3 Processamento fiel dos dados retornados pela Places API (New)
        if (placeDetailsData) {
          const place = placeDetailsData;

          if (place.id) {
            googlePlaceId = place.id;
          }
          if (place.displayName?.text) {
            companyName = place.displayName.text;
          }
          if (place.formattedAddress) {
            address = place.formattedAddress;
          }
          if (place.nationalPhoneNumber || place.internationalPhoneNumber) {
            phoneWhatsapp = place.nationalPhoneNumber || place.internationalPhoneNumber;
            phone = place.nationalPhoneNumber || place.internationalPhoneNumber;
          }
          if (typeof place.rating === "number") {
            rating = Number(place.rating.toFixed(1));
          }
          if (typeof place.userRatingCount === "number") {
            reviewCount = place.userRatingCount;
          }
          if (place.googleMapsUri) {
            googleMapsUrl = place.googleMapsUri;
          }
          if (place.primaryTypeDisplayName?.text) {
            businessCategory = place.primaryTypeDisplayName.text;
          }
          if (place.regularOpeningHours?.weekdayDescriptions) {
            weeklyHours = place.regularOpeningHours.weekdayDescriptions;
          } else if (place.currentOpeningHours?.weekdayDescriptions) {
            weeklyHours = place.currentOpeningHours.weekdayDescriptions;
          }
          if (place.editorialSummary?.text) {
            description = place.editorialSummary.text;
          }
          if (place.location?.latitude && place.location?.longitude) {
            latitude = place.location.latitude;
            longitude = place.location.longitude;
          }

          // 2.4 Extração de até 10 Fotos Oficiais em Alta Resolução
          if (place.photos && Array.isArray(place.photos)) {
            const maxPhotos = place.photos.slice(0, 10);
            for (const photo of maxPhotos) {
              if (photo.name) {
                const photoMediaUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=1000&maxWidthPx=1600&key=${apiKey}`;
                placePhotos.push(photoMediaUrl);
              }
            }
          }

          // 2.5 Extração das 5 avaliações oficiais mais recentes (sem dados inventados)
          if (place.reviews && Array.isArray(place.reviews)) {
            const slicedReviews = place.reviews.slice(0, 5);
            for (const r of slicedReviews) {
              const authorName = r.authorAttribution?.displayName || "Cliente Verificado";
              const authorPhotoUrl = r.authorAttribution?.photoUri || undefined;
              const revRating = r.rating || 5;
              const revText =
                r.text?.text ||
                r.originalText?.text ||
                "";
              const relativeTime = r.relativePublishTimeDescription || "recentemente";

              if (revText || authorName) {
                reviewsToInsert.push({
                  authorName,
                  authorPhotoUrl,
                  rating: revRating,
                  text: revText,
                  relativeTime,
                });
              }
            }
          }
        }
      } catch (apiErr) {
        console.error("[syncGooglePlaceData] Erro na requisição da Google Places API:", apiErr);
      }
    }

    // 3. Fallbacks inteligentes para Headline e Sobre a Empresa
    if (!companyName) {
      if (textQuery && !textQuery.startsWith("http")) {
        companyName = textQuery;
      } else {
        companyName = tenantContext.tenant?.name || "Meu Estabelecimento";
      }
    }

    const smartTexts = generateSmartHeadlineAndSummary(
      companyName,
      businessCategory,
      address,
      description
    );
    const finalHeadline = smartTexts.headline;
    const finalEditorialSummary = smartTexts.editorialSummary;

    const supabase = await createClient();

    // 4. Atualiza o nome da empresa na tabela tenants
    if (companyName && companyName !== tenantContext.tenant?.name) {
      await supabase
        .from("tenants")
        .update({ name: companyName, updated_at: new Date().toISOString() })
        .eq("id", tenantId);
    }

    // 4.1 Busca logo_url existente para manter ou preencher automaticamente se vazio
    const { data: existingProfile } = await supabase
      .from("tenant_profiles")
      .select("logo_url, primary_color, template_id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    let logoUrl = existingProfile?.logo_url || null;
    if (!logoUrl && placePhotos.length > 0) {
      logoUrl = placePhotos[0];
    }

    // 5. Salva os dados no perfil (tenant_profiles) com todos os campos sincronizados
    const profilePayload: Record<string, any> = {
      tenant_id: tenantId,
      name: companyName,
      description: finalHeadline,
      editorial_summary: finalEditorialSummary,
      address: address || null,
      phone_whatsapp: phoneWhatsapp || null,
      phone: phone || phoneWhatsapp || null,
      logo_url: logoUrl || null,
      google_maps_url: googleMapsUrl || null,
      google_place_id: googlePlaceId || null,
      rating: rating,
      google_rating: rating,
      review_count: reviewCount,
      google_reviews_count: reviewCount,
      business_category: businessCategory || null,
      opening_hours_json: weeklyHours.length > 0 ? weeklyHours : null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      place_photos: placePhotos,
      updated_at: new Date().toISOString(),
    };

    let { error: profileError } = await supabase
      .from("tenant_profiles")
      .upsert(profilePayload, { onConflict: "tenant_id" });

    // Fallback de compatibilidade caso alguma coluna não exista no banco remoto
    if (profileError && profileError.code === "PGRST204") {
      const fallbackPayload = {
        tenant_id: tenantId,
        description: finalHeadline,
        editorial_summary: finalEditorialSummary,
        address: address || null,
        phone_whatsapp: phoneWhatsapp || null,
        logo_url: logoUrl || null,
        google_maps_url: googleMapsUrl || null,
        rating: rating,
        review_count: reviewCount,
        place_photos: placePhotos,
        updated_at: new Date().toISOString(),
      };
      const fallbackRes = await supabase
        .from("tenant_profiles")
        .upsert(fallbackPayload, { onConflict: "tenant_id" });
      profileError = fallbackRes.error;
    }

    if (profileError) {
      console.error("[syncGooglePlaceData] Erro ao salvar profile:", profileError);
    }

    // 6. Limpa e recadastra exclusivamente as avaliações reais no `tenant_reviews`
    try {
      // Limpa registros anteriores para evitar duplicatas ou lixo
      await supabase.from("tenant_reviews").delete().eq("tenant_id", tenantId);

      if (reviewsToInsert.length > 0) {
        const reviewsRows = reviewsToInsert.map((r) => ({
          tenant_id: tenantId,
          author_name: r.authorName,
          author_photo_url: r.authorPhotoUrl || null,
          rating: r.rating,
          text: r.text,
          review_text: r.text,
          relative_time: r.relativeTime,
          relative_time_description: r.relativeTime,
        }));

        const { error: revInsertError } = await supabase
          .from("tenant_reviews")
          .insert(reviewsRows);

        if (revInsertError && revInsertError.code === "PGRST204") {
          // Fallback sem colunas extras
          const simpleRows = reviewsToInsert.map((r) => ({
            tenant_id: tenantId,
            author_name: r.authorName,
            author_photo_url: r.authorPhotoUrl || null,
            rating: r.rating,
            text: r.text,
            relative_time: r.relativeTime,
          }));
          await supabase.from("tenant_reviews").insert(simpleRows);
        }
      }
    } catch (revErr) {
      console.error("[syncGooglePlaceData] Erro ao cadastrar reviews:", revErr);
    }

    // 6.1 Verifica e gera serviços automáticos essenciais caso o estabelecimento não possua nenhum serviço
    let tenantServicesList: Array<{
      id: string;
      name: string;
      description?: string | null;
      price: number;
      duration_minutes: number;
      is_active: boolean;
    }> = [];

    try {
      const { data: existingServices } = await supabase
        .from("services")
        .select("id, name, description, price, duration_minutes, is_active")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true });

      if (existingServices && existingServices.length > 0) {
        tenantServicesList = existingServices.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: Number(s.price),
          duration_minutes: s.duration_minutes,
          is_active: s.is_active,
        }));
      } else {
        // Gera e insere de 3 a 4 serviços sugeridos de acordo com o segmento
        const templates = getDefaultServicesForCategory(businessCategory, companyName);
        const rowsToInsert = templates.map((t) => ({
          tenant_id: tenantId,
          name: t.name,
          description: t.description,
          price: t.price,
          duration_minutes: t.duration_minutes,
          is_active: true,
        }));

        const { data: inserted, error: insertServErr } = await supabase
          .from("services")
          .insert(rowsToInsert)
          .select("id, name, description, price, duration_minutes, is_active");

        if (!insertServErr && inserted) {
          tenantServicesList = inserted.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: Number(s.price),
            duration_minutes: s.duration_minutes,
            is_active: s.is_active,
          }));
        }
      }
    } catch (servErr) {
      console.error("[syncGooglePlaceData] Erro ao verificar/gerar serviços:", servErr);
    }

    // 7. Revalidação de Cache no Next.js
    revalidatePath("/admin/perfil");
    revalidatePath("/admin/configuracoes");
    revalidatePath("/admin/servicos");
    revalidatePath("/admin/avaliacoes");
    revalidatePath("/admin/portfolio");
    revalidatePath("/admin/posts");
    revalidatePath("/admin/dashboard");
    if (tenantContext.tenant?.slug) {
      revalidatePath(`/${tenantContext.tenant.slug}`);
    }

    return {
      success: true,
      data: {
        companyName,
        phoneWhatsapp,
        phone,
        address,
        description: finalHeadline,
        editorialSummary: finalEditorialSummary,
        logoUrl: logoUrl || undefined,
        businessCategory,
        rating,
        reviewCount,
        googleMapsUrl,
        weeklyHours,
        placePhotos,
        latitude,
        longitude,
        reviewsCountImported: reviewsToInsert.length,
        photosCountImported: placePhotos.length,
        servicesCountImported: tenantServicesList.length,
        services: tenantServicesList,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[syncGooglePlaceData] Erro inesperado:", err);
    return { error: `Erro ao importar dados do Google: ${errorMsg}` };
  }
}

/**
 * Alias de compatibilidade retroativa
 */
export async function syncGooglePlacesAction(
  googleInput: string
): Promise<GooglePlaceSyncResult> {
  return syncGooglePlaceData(googleInput);
}
