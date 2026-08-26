---
name: local-seo-schema
description: >-
  Use this skill when implementing or modifying local SEO features, Schema.org JSON-LD structured data (LocalBusiness, BlogPosting, OfferCatalog), meta tags, dynamic sitemaps, or local business showcase pages in the EssMendes Local platform.
---

# 🚀 Local SEO & Schema.org Structured Data Skill

Esta skill define as melhores práticas para posicionamento local no Google (Local SEO), injeção de JSON-LD (`Schema.org`), geração dinâmica de metadados e otimização de snippets no EssMendes Local.

---

## 🏛️ 1. Estrutura de Schema.org JSON-LD

A vitrine pública ([`src/app/(public)/[slug]/page.tsx`](file:///C:/Projetos/EssMendes-Local/src/app/(public)/[slug]/page.tsx)) e as páginas de artigos injetam blocos JSON-LD estruturados.

### 📍 LocalBusiness Schema

```typescript
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": profile.company_name,
  "description": profile.editorial_summary || profile.description,
  "url": `https://essmendes.com.br/${tenant.slug}`,
  "telephone": profile.phone_whatsapp || profile.phone,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": profile.address,
    "addressCountry": "BR"
  },
  ...(profile.latitude && profile.longitude ? {
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": profile.latitude,
      "longitude": profile.longitude
    }
  } : {}),
  ...(profile.google_rating ? {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": profile.google_rating,
      "reviewCount": profile.google_review_count || 1,
      "bestRating": "5",
      "worstRating": "1"
    }
  } : {}),
  "image": profile.place_photos?.length > 0 ? profile.place_photos : [profile.logo_url]
};
```

### 📝 BlogPosting Schema (Posts do Tenant com Tags Locais)

```typescript
const blogPostingSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.meta_description || post.content.substring(0, 160),
  "image": post.cover_image_url || profile.logo_url,
  "datePublished": post.created_at,
  "dateModified": post.updated_at,
  "author": {
    "@type": "Organization",
    "name": profile.company_name
  },
  "keywords": post.tags?.join(", ")
};
```

---

## 🗺️ 2. Dynamic Sitemap & Metadata Generation

### Metadados Dinâmicos (`generateMetadata`)
Cada página pública deve implementar `generateMetadata`:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Buscar tenant e perfil
  return {
    title: `${profile.company_name} | Serviços e Contato`,
    description: profile.editorial_summary || profile.description,
    openGraph: {
      title: profile.company_name,
      description: profile.description,
      images: profile.place_photos?.[0] ? [profile.place_photos[0]] : []
    },
    alternates: {
      canonical: `/${slug}`
    }
  };
}
```

### Sitemap XML Dinâmico ([`src/app/sitemap.ts`](file:///C:/Projetos/EssMendes-Local/src/app/sitemap.ts))
Garante indexação de todas as vitrines ativas de clientes.

---

## 🎯 3. Boas Práticas de SEO Local

1. **NAP Consistente (Name, Address, Phone):** Sempre manter sincronizado com o Google Maps via `google-places-sync`.
2. **Rotas Rápidas de Conversão:**
   - Waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
   - Google Maps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
   - WhatsApp Click-to-Chat com mensagem contextualizada.
3. **Tags de Busca Local:** Indexadas no banco via índice GIN para busca instantânea de termos locais.
