import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicTenantHub } from "@/components/public/PublicTenantHub";
import { sanitizePhoneNumber } from "@/utils/phone";
import { getBusinessStatus } from "@/utils/opening-hours";
import { extractNeighborhoodAndCity, sanitizeDescription } from "@/utils/address";
import type { Service, TenantProfile, PortfolioItem, TenantReview, TenantPost, TenantProduct } from "@/types";

interface PublicPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 1. Geração Dinâmica de Metadados SEO Local Avançado
 */
export async function generateMetadata({
  params,
}: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = typeof slug === "string" ? slug.trim() : slug;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, city, cover_image_url")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (!tenant) {
    return {
      title: "Estabelecimento Não Encontrado | EssMendes Local",
      description: "A página solicitada não foi encontrada.",
    };
  }

  const [profileRes, servicesRes, rawPostsRes] = await Promise.all([
    supabase
      .from("tenant_profiles")
      .select("name, description, editorial_summary, logo_url, address, phone_whatsapp, phone, business_category, place_photos, cover_image_url")
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase
      .from("services")
      .select("name")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .limit(10),
    supabase
      .from("tenant_posts")
      .select("tags, title")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .limit(5),
  ]);

  const profile = profileRes.data;
  const services = servicesRes.data || [];
  const rawPosts = rawPostsRes.data || [];

  const postTags: string[] = rawPosts.flatMap((p) => p.tags || []);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.essmendes.com.br";
  const canonicalUrl = `${baseUrl}/${tenant.slug}`;

  // Trata fotos do local para Open Graph
  let ogImage = tenant.cover_image_url || profile?.cover_image_url || profile?.logo_url || null;
  if (!ogImage && profile?.place_photos) {
    if (Array.isArray(profile.place_photos) && profile.place_photos.length > 0) {
      ogImage = profile.place_photos[0];
    } else if (typeof profile.place_photos === "string") {
      try {
        const parsed = JSON.parse(profile.place_photos);
        if (Array.isArray(parsed) && parsed.length > 0) ogImage = parsed[0];
      } catch {
        if (profile.place_photos.startsWith("http")) ogImage = profile.place_photos;
      }
    }
  }

  const tenantCity = tenant.city || extractNeighborhoodAndCity(profile?.address) || "Sua Região";
  const title = `${tenant.name} - Serviços e Produtos em ${tenantCity}`;

  const serviceNames = services.slice(0, 4).map((s: any) => s.name).filter(Boolean);
  const description =
    serviceNames.length > 0
      ? `Conheça os serviços e produtos de ${tenant.name}: ${serviceNames.join(", ")}.`
      : `Conheça os serviços e produtos de ${tenant.name}.`;

  const ogImages = ogImage
    ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Capa e presença digital de ${tenant.name}`,
        },
      ]
    : [];

  const dynamicKeywords = Array.from(
    new Set([
      tenant.name,
      profile?.name || tenant.name,
      profile?.business_category || "",
      "agendamento online",
      "horário marcado",
      "catálogo de serviços",
      "catálogo de produtos",
      "atendimento local",
      tenantCity,
      ...postTags,
    ])
  ).filter(Boolean);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "EssMendes Local",
      locale: "pt_BR",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    keywords: dynamicKeywords,
  };
}

/**
 * 2. Página Pública do Estabelecimento (Local Business Hub)
 */
export default async function PublicTenantPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const cleanSlug = typeof slug === "string" ? slug.trim() : slug;
  const supabase = await createClient();

  // 2.1 Busca o tenant pelo slug selecionando todas as colunas
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", cleanSlug)
    .maybeSingle();

  console.log("Dados do Tenant carregados:", { slug: cleanSlug, theme_niche: tenant?.theme_niche });

  if (!tenant) {
    notFound();
  }

  // 2.2 Fetch paralelo e resiliente de todas as tabelas filhas vinculadas ao tenant.id
  const [
    profileRes,
    servicesRes,
    portfolioRes,
    reviewsRes,
    postsRes,
    productsRes,
  ] = await Promise.all([
    supabase
      .from("tenant_profiles")
      .select("*")
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("portfolio_items")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("tenant_reviews")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_visible", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("tenant_posts")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("published_at", { ascending: false }),
    supabase
      .from("tenant_products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_available", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data;

  // 2.2.1 Tratamento Seguro de Produtos Físicos
  const products: TenantProduct[] = (productsRes.data || []).map((p: any) => ({
    id: p.id,
    tenant_id: p.tenant_id,
    name: p.name,
    description: p.description || null,
    category: p.category || null,
    price: Number(p.price) || 0,
    promotional_price: p.promotional_price ? Number(p.promotional_price) : null,
    image_url: p.image_url || null,
    is_available: p.is_available ?? true,
    is_featured: p.is_featured ?? false,
    display_order: p.display_order ?? 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  // 2.3 Tratamento Seguro e Tipagem dos Serviços
  const activeServices: Service[] = (servicesRes.data || []).map((s: any) => ({
    id: s.id,
    tenant_id: s.tenant_id,
    name: s.name,
    description: s.description,
    price: s.price !== null && s.price !== undefined ? Number(s.price) : null,
    duration_minutes: s.duration_minutes !== null && s.duration_minutes !== undefined && Number(s.duration_minutes) > 0 ? Number(s.duration_minutes) : null,
    show_duration: Boolean(s.show_duration),
    is_active: s.is_active,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }));

  // 2.4 Tratamento do Portfólio de Transformações (Apenas itens reais)
  const portfolioItems = (portfolioRes.data || []) as PortfolioItem[];

  // 2.5 Tratamento e Mapeamento Seguro de Avaliações Oficiais do Google Maps
  const { data: rawReviews, error: reviewsError } = reviewsRes;
  console.log('Reviews carregadas na vitrine:', rawReviews?.length, reviewsError);

  const reviews: TenantReview[] = (rawReviews || [])
    .filter((r: any) => r.is_visible !== false)
    .map((r: any) => ({
      id: r.id,
      tenant_id: r.tenant_id,
      author_name: r.author_name || r.author || "Cliente Google",
      author_photo_url: r.author_photo_url || r.profile_photo_url || r.photo_url || null,
      profile_photo_url: r.author_photo_url || r.profile_photo_url || null,
      author_url: r.author_url || null,
      rating: Number(r.rating) || 5,
      text: r.review_text || r.text || "",
      review_text: r.review_text || r.text || "",
      relative_time: r.relative_time_description || r.relative_time || "recentemente",
      relative_time_description: r.relative_time_description || r.relative_time || "recentemente",
      is_visible: r.is_visible ?? true,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

  // 2.6 Tratamento e Filtragem de Posts / Artigos de SEO Ativos
  const rawPostsList = postsRes.data || [];
  const posts: TenantPost[] = rawPostsList
    .filter((p: any) => p.is_active !== false && p.is_published !== false)
    .map((p: any) => ({
      id: p.id,
      tenant_id: p.tenant_id,
      title: p.title,
      content: p.content,
      image_url: p.image_url || null,
      cta_type: p.cta_type || "booking",
      cta_label: p.cta_label || "Agendar Horário",
      cta_url: p.cta_url || null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      meta_description: p.meta_description || null,
      slug: p.slug || null,
      is_active: p.is_active ?? p.is_published ?? true,
      published_at: p.published_at || p.created_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

  // 2.7 Parsing Robusto de Fotos do Google Maps (place_photos)
  let cleanPlacePhotos: string[] = [];
  if (profile?.place_photos) {
    if (Array.isArray(profile.place_photos)) {
      cleanPlacePhotos = profile.place_photos.filter((p: any) => Boolean(p) && typeof p === "string");
    } else if (typeof profile.place_photos === "string") {
      try {
        const parsed = JSON.parse(profile.place_photos);
        if (Array.isArray(parsed)) {
          cleanPlacePhotos = parsed.filter((p: any) => Boolean(p) && typeof p === "string");
        }
      } catch {
        if (profile.place_photos.startsWith("http")) {
          cleanPlacePhotos = [profile.place_photos];
        }
      }
    }
  }

  // 2.8 Parsing Robusto de Horários de Funcionamento (opening_hours_json ou tenant.opening_hours)
  const rawHoursSource = profile?.opening_hours_json || (tenant as any)?.opening_hours || (profile as any)?.opening_hours;
  let cleanOpeningHours: string[] = [];
  if (rawHoursSource) {
    if (Array.isArray(rawHoursSource)) {
      cleanOpeningHours = rawHoursSource.filter((h: any) => Boolean(h) && typeof h === "string");
    } else if (typeof rawHoursSource === "string") {
      try {
        const parsed = JSON.parse(rawHoursSource);
        if (Array.isArray(parsed)) {
          cleanOpeningHours = parsed.filter((h: any) => Boolean(h) && typeof h === "string");
        }
      } catch {
        cleanOpeningHours = [rawHoursSource];
      }
    }
  }

  // 2.9 Objeto de Perfil Tipado com Todos os Campos Enriquecidos
  const fallbackLogo = profile?.logo_url || (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : null);
  const cleanDescription = sanitizeDescription(profile?.description, profile?.address);
  const typedProfile: TenantProfile | null = profile
    ? {
        id: profile.id,
        tenant_id: profile.tenant_id,
        name: profile.name || tenant.name,
        description: cleanDescription || null,
        editorial_summary: profile.editorial_summary || cleanDescription || null,
        phone_whatsapp: profile.phone_whatsapp || profile.phone || null,
        phone: profile.phone || profile.phone_whatsapp || null,
        address: profile.address || null,
        logo_url: fallbackLogo,
        template_id: profile.template_id || "default",
        primary_color: profile.primary_color || "#0d9488",
        google_maps_url: profile.google_maps_url || null,
        google_place_id: profile.google_place_id || null,
        place_id: profile.google_place_id || (profile as any).place_id || (tenant as any)?.google_place_id || (tenant as any)?.place_id || null,
        rating: profile.rating ?? profile.google_rating ?? null,
        google_rating: profile.google_rating ?? profile.rating ?? null,
        review_count: profile.review_count ?? profile.google_reviews_count ?? null,
        google_reviews_count: profile.google_reviews_count ?? profile.review_count ?? null,
        business_category: profile.business_category || null,
        opening_hours_json: cleanOpeningHours.length > 0 ? cleanOpeningHours : null,
        latitude: typeof profile.latitude === "number" ? profile.latitude : null,
        longitude: typeof profile.longitude === "number" ? profile.longitude : null,
        hero_image_url: profile.hero_image_url || (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : null),
        place_photos: cleanPlacePhotos,
        cover_image_url: profile.cover_image_url || profile.hero_image_url || (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : null),
        photos: cleanPlacePhotos,
        google_photo_url: profile.google_photo_url || (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : null),
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }
    : null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://local.essmendes.com.br";
  const canonicalUrl = `${baseUrl}/${tenant.slug}`;
  const cleanPhone = profile?.phone_whatsapp || profile?.phone ? sanitizePhoneNumber(profile.phone_whatsapp || profile.phone) : null;
  const internationalPhone = cleanPhone ? `+55${cleanPhone}` : undefined;
  
  // Cálculo dinâmico do horário de funcionamento real do estabelecimento
  const businessStatus = getBusinessStatus(cleanOpeningHours);

  // 2.10 Schema.org JSON-LD Padronizado com LocalBusiness e OfferCatalog Universal
  const schemaAddress = (tenant as any).address || typedProfile?.address || "";
  const schemaCity = tenant.city || extractNeighborhoodAndCity(typedProfile?.address) || "";
  const schemaState = (tenant as any).state || "SP";
  const schemaPhone = tenant.phone || typedProfile?.phone_whatsapp || typedProfile?.phone || "";
  const schemaImage =
    (tenant as any).cover_url ||
    tenant.cover_image_url ||
    (tenant as any).logo_url ||
    typedProfile?.cover_image_url ||
    typedProfile?.logo_url ||
    (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : undefined);
  const schemaLat = (tenant as any).latitude ?? typedProfile?.latitude ?? null;
  const schemaLng = (tenant as any).longitude ?? typedProfile?.longitude ?? null;
  const schemaType = (tenant as any).schema_type || "AutoRepair";

  const offerCatalogItems = [
    ...activeServices.map((s) => {
      const hasNumericPrice =
        s.price !== null &&
        s.price !== undefined &&
        !isNaN(Number(s.price)) &&
        Number(s.price) > 0;

      return {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": s.name,
          "description": s.description || `Serviço prestado por ${tenant.name}`,
        },
        ...(hasNumericPrice
          ? {
              "price": Number(s.price).toFixed(2),
              "priceCurrency": "BRL",
            }
          : {
              "priceSpecification": {
                "@type": "PriceSpecification",
                "priceCurrency": "BRL",
                "description": "Sob Consulta / Orçamento",
              },
            }),
      };
    }),
    ...products.map((p) => {
      const currentPrice =
        p.promotional_price && Number(p.promotional_price) > 0
          ? p.promotional_price
          : p.price;
      const hasNumericPrice =
        currentPrice !== null &&
        currentPrice !== undefined &&
        !isNaN(Number(currentPrice)) &&
        Number(currentPrice) > 0;

      return {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": p.name,
          "description": p.description || `Item/produto disponível em ${tenant.name}`,
        },
        ...(hasNumericPrice
          ? {
              "price": Number(currentPrice).toFixed(2),
              "priceCurrency": "BRL",
            }
          : {
              "priceSpecification": {
                "@type": "PriceSpecification",
                "priceCurrency": "BRL",
                "description": "Sob Consulta / Orçamento",
              },
            }),
      };
    }),
  ];

  const standardizedSchemaJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: tenant.name,
    image: schemaImage,
    telephone: schemaPhone,
    address: {
      "@type": "PostalAddress",
      streetAddress: schemaAddress,
      addressLocality: schemaCity,
      addressRegion: schemaState,
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: schemaLat,
      longitude: schemaLng,
    },
    ...(offerCatalogItems.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Serviços e Produtos",
            itemListElement: offerCatalogItems,
          },
        }
      : {}),
  };

  // Schemas Estruturados para Artigos e Posts de SEO Local (Schema.org BlogPosting)
  const articleJsonLdList = posts.map((post) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.content.substring(0, 160),
    articleBody: post.content,
    image: post.image_url || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      "@type": "Organization",
      name: typedProfile?.name || tenant.name,
    },
    publisher: {
      "@type": "Organization",
      name: typedProfile?.name || tenant.name,
    },
    keywords: post.tags && post.tags.length > 0 ? post.tags.join(", ") : undefined,
    mainEntityOfPage: `${canonicalUrl}#novidades`,
  }));

  const templateId = tenant.theme_settings?.template_id || typedProfile?.template_id || "premium";
  const primaryColor = tenant.theme_settings?.primary_color || typedProfile?.primary_color || "#e11d48";

  const templateClasses: Record<string, string> = {
    premium: "template-premium font-serif-headings",
    modern: "template-modern bento-layout",
    minimal: "template-minimal font-mono-accents",
    conversion: "template-conversion cta-high-contrast",
  };
  const selectedTemplateClass = templateClasses[templateId] || templateClasses.premium;

  return (
    <div
      className={`w-full max-w-full overflow-x-hidden ${selectedTemplateClass}`}
      style={{ "--brand-primary": primaryColor } as React.CSSProperties}
    >
      {/* Injeção JSON-LD Estruturado para SEO Local (LocalBusiness + OfferCatalog) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(standardizedSchemaJsonLd),
        }}
      />

      {/* Injeção JSON-LD para Artigos e Posts de SEO Local (se houver) */}
      {articleJsonLdList.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLdList),
          }}
        />
      )}

      {/* Renderização do Local Business Hub */}
      <PublicTenantHub
        tenant={{
          ...tenant,
          category: profile?.business_category || (tenant as any)?.category || null,
          segment: tenant.theme_niche || (tenant.theme_settings as any)?.niche || null,
          template: profile?.template_id || (tenant.theme_settings as any)?.template || null,
          place_id: (tenant as any)?.place_id || (tenant as any)?.google_place_id || typedProfile?.place_id || typedProfile?.google_place_id || null,
          google_place_id: (tenant as any)?.google_place_id || (tenant as any)?.place_id || typedProfile?.google_place_id || null,
          address: typedProfile?.address || (tenant as any)?.address || null,
          cover_image_url:
            tenant.cover_image_url ||
            typedProfile?.cover_image_url ||
            typedProfile?.hero_image_url ||
            (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : null),
          photos:
            Array.isArray(tenant.photos) && tenant.photos.length > 0
              ? tenant.photos
              : cleanPlacePhotos,
          google_photo_url:
            tenant.google_photo_url ||
            (cleanPlacePhotos.length > 0 ? cleanPlacePhotos[0] : null),
        }}
        profile={typedProfile}
        services={activeServices}
        portfolioItems={portfolioItems}
        reviews={reviews}
        posts={posts}
        products={products}
        isOpenNow={businessStatus.isOpenNow}
        statusBadgeText={businessStatus.badgeText}
        statusDetailText={businessStatus.detailText}
      />
    </div>
  );
}
