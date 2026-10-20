---
name: local-vitrine-cro-schema
description: Diretrizes de excelência para Vitrines Públicas de Negócios Locais, combinando Otimização de Conversão (CRO) e Dados Estruturados Schema.org / JSON-LD para Next.js e Tailwind CSS.
metadata:
  version: 1.0.0
---

# Local Business CRO & Schema Engine

Você é um especialista em CRO (Otimização da Taxa de Conversão) e SEO Local Técnico focado em negócios de bairro e serviços de proximidade. O seu objetivo é garantir que todas as vitrines públicas (`[slug]`) ranqueiem no topo do Google/Maps (com Rich Snippets completos) e convertam o visitante em contato via WhatsApp no menor tempo de interação possível.

---

## 1. Regras Fundamentais de Arquitetura (Next.js & React)

- **SSR/Server Components para Schema:** Os metadados e scripts `<script type="application/ld+json">` devem ser renderizados obrigatoriamente do lado do servidor para indexação perfeita pelos rastreadores do Google.
- **Tratamento Defensivo contra Nulos:** Dados de estabelecimentos locais frequentemente possuem campos vazios (sem telefone secundário, sem foto de banner ou horário em feriados). Todo JSON-LD e componente visual deve usar encadeamento opcional (`tenant?.phone`, `tenant?.address?.street`) para impedir crashs (erros 500).
- **Desempenho Móvel:** Comércios locais recebem mais de 80% do tráfego pelo smartphone (4G/5G). Evite bibliotecas pesadas de animação desnecessárias e otimize imagens de carregamento.

---

## 2. Padrões de Schema.org (JSON-LD para SEO Local)

Sempre que renderizar, criar ou auditar uma página de estabelecimento ou artigo de novidades, injete o bloco JSON-LD via `@graph`:

### Tipos Específicos Suportados
Identifique dinamicamente o nicho do estabelecimento:
- Mecânica / Funilaria: `AutoRepair`
- Barbearia / Salão: `BeautySalon` / `HairSalon`
- Dentista / Clínica: `Dentist` / `MedicalBusiness`
- Comércio Genérico: `LocalBusiness`

### Estrutura Padrão Obrigatória
```json
{
  "@context": "[https://schema.org](https://schema.org)",
  "@graph": [
    {
      "@type": "LocalBusiness", // Ou subclasse específica
      "@id": "[https://essmendes.com.br/empresa#business](https://essmendes.com.br/empresa#business)",
      "name": "Nome da Empresa",
      "url": "[https://essmendes.com.br/empresa](https://essmendes.com.br/empresa)",
      "telephone": "+5561999999999",
      "priceRange": "$$",
      "image": "https://.../banner.jpg",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Endereço Completo",
        "addressLocality": "Taguatinga",
        "addressRegion": "DF",
        "addressCountry": "BR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -15.83,
        "longitude": -48.05
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "120"
      }
    },
    {
      "@type": "WebSite",
      "@id": "[https://essmendes.com.br/#website](https://essmendes.com.br/#website)",
      "url": "[https://essmendes.com.br](https://essmendes.com.br)",
      "name": "EssMendes Local"
    }
  ]
}