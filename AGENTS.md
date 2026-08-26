# 🏢 EssMendes Local — Diretrizes do Projeto & Regras para Agentes

Bem-vindo ao repositório **EssMendes Local**, uma plataforma multi-tenant de alto desempenho para **SEO Local, Vitrines Dinâmicas de Negócios e Sincronização com Google Places API (New)**.

---

## 📐 1. Visão Geral da Arquitetura & Stack

- **Framework:** Next.js 15 (App Router, Server Actions, React 19)
- **Backend & Auth:** Supabase (PostgreSQL, Auth, Row Level Security — RLS)
- **Estilização:** Tailwind CSS v4 + Lucide React
- **Validação de Schemas:** Zod
- **SEO & Dados Estruturados:** Schema.org JSON-LD (`LocalBusiness`, `BlogPosting`, `OfferCatalog`)
- **Integração Externa:** Google Places API (New) com parsing universal de URLs do Maps

---

## 📁 2. Estrutura de Diretórios

```text
EssMendes-Local/
├── .agents/
│   └── skills/                 # Skills especializadas do Antigravity
│       ├── google-places-sync/ # Sincronização e parsing Google Places API (New)
│       ├── supabase-tenant-rls/# Migrações SQL, multi-tenancy e RLS
│       ├── local-seo-schema/   # SEO local, Schema.org e metadados dinâmicos
│       ├── server-actions-workflow/ # Padrão de Server Actions e Zod
│       └── project-qa-suite/   # Validação estática e scripts de teste
├── src/
│   ├── app/
│   │   ├── (admin)/            # Painel administrativo multi-tenant
│   │   ├── (auth)/             # Login, registro e recuperação
│   │   ├── (public)/[slug]/    # Vitrine pública otimizada para SEO local
│   │   └── sitemap.ts          # Geração dinâmica do sitemap XML
│   ├── components/
│   │   ├── admin/              # Componentes do painel admin
│   │   ├── public/             # Componentes da vitrine pública
│   │   └── ui/                 # Componentes base e design system
│   ├── lib/
│   │   ├── actions/            # Server Actions utilitárias e integrações
│   │   └── supabase/           # Clientes SSR (server, client, tenant)
│   └── services/               # Server Actions de entidades de negócio
├── supabase/
│   └── migrations/             # Migrações SQL numeradas por timestamp
└── scripts/                    # Baterias de testes automatizados
```

---

## 🔒 3. Invariantes de Segurança e Boas Práticas

1. **Isolamento Multi-Tenant**: Nunca confie no `tenant_id` vindo do formulário ou cliente. Sempre utilize `getAuthenticatedTenant()` em [`src/lib/supabase/tenant.ts`](file:///C:/Projetos/EssMendes-Local/src/lib/supabase/tenant.ts).
2. **Zero Mock Data no Google Places**: Não inventar ou salvar depoimentos fictícios. Se a API não retornar avaliações para o link fornecido, salvar apenas os dados reais existentes.
3. **Padrão de Server Actions**: Toda ação de escrita no banco deve ser uma Server Action (`"use server"`) validada por Zod e retornar `{ success: boolean, data?: T, error?: string }`.
4. **Migrações SQL Padronizadas**: Novas migrações devem ser criadas em `supabase/migrations/YYYYMMDDHHMMSS_nome.sql` com políticas completas de RLS.
5. **Next.js 15 Async Params**: Parâmetros de rotas em páginas públicas (`[slug]`) são assíncronos (`const { slug } = await params;`).

---

## 🧪 4. Validação Contínua (QA)

Antes de finalizar qualquer tarefa, execute:
```bash
npx tsc --noEmit
node scripts/test_complete_suite.mjs
```

---

## 🧰 5. Skills Disponíveis no Projeto

- [Google Places Sync](file:///C:/Projetos/EssMendes-Local/.agents/skills/google-places-sync/SKILL.md)
- [Supabase Tenant & RLS](file:///C:/Projetos/EssMendes-Local/.agents/skills/supabase-tenant-rls/SKILL.md)
- [Local SEO & Schema.org](file:///C:/Projetos/EssMendes-Local/.agents/skills/local-seo-schema/SKILL.md)
- [Server Actions Workflow](file:///C:/Projetos/EssMendes-Local/.agents/skills/server-actions-workflow/SKILL.md)
- [Project QA Suite](file:///C:/Projetos/EssMendes-Local/.agents/skills/project-qa-suite/SKILL.md)
