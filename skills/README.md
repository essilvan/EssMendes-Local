# 🧰 Skills do Projeto — EssMendes Local

Esta pasta reúne a documentação, padrões arquiteturais e especificações de todas as **Skills Especializadas** do **EssMendes Local**.

---

## 📚 Índice de Skills Disponíveis

| Arquivo | Nome da Skill | Descrição e Finalidade |
| :--- | :--- | :--- |
| [`google-places-sync.md`](file:///c:/Projetos/EssMendes-Local/skills/google-places-sync.md) | **Google Places Sync** | Integração com a Google Places API (New), parsing universal de URLs do Maps, fotos em alta resolução e reviews oficiais (Zero Mock Data). |
| [`local-seo-schema.md`](file:///c:/Projetos/EssMendes-Local/skills/local-seo-schema.md) | **Local SEO & Schema.org** | Dados estruturados JSON-LD (`LocalBusiness`, `BlogPosting`, `OfferCatalog`), metadados dinâmicos e otimização para snippets do Google. |
| [`project-qa-suite.md`](file:///c:/Projetos/EssMendes-Local/skills/project-qa-suite.md) | **Project QA Suite** | Roteiro de garantia de qualidade: typecheck TypeScript (`npx tsc --noEmit`), testes de integridade e scripts de utilitários. |
| [`server-actions-workflow.md`](file:///c:/Projetos/EssMendes-Local/skills/server-actions-workflow.md) | **Server Actions Workflow** | Padrão arquitetural Next.js 15 (`"use server"`), tipagem de contratos com Zod e isolamento multi-tenant. |
| [`supabase-tenant-rls.md`](file:///c:/Projetos/EssMendes-Local/skills/supabase-tenant-rls.md) | **Supabase Tenant & RLS** | Migrações SQL numeradas, políticas de Row Level Security (RLS) e cadeia de isolamento multi-tenant. |
| [`frontend-design.md`](file:///c:/Projetos/EssMendes-Local/skills/frontend-design.md) | **Frontend Design & Aesthetics** | Criação de interfaces frontend de alto padrão estético, tipografia expressiva, microinterações e identidade visual única anti-"AI slop". |

---

## 🤖 Integração com o Antigravity IDE

Para que o agente de inteligência artificial carregue e execute automaticamente as skills durante as conversas, elas também permanecem ativas na pasta nativa de extensões do workspace:

```text
.agents/
└── skills/
    ├── frontend-design/SKILL.md
    ├── google-places-sync/SKILL.md
    ├── local-seo-schema/SKILL.md
    ├── project-qa-suite/SKILL.md
    ├── server-actions-workflow/SKILL.md
    └── supabase-tenant-rls/SKILL.md
```

> **Dica:** Ao criar ou atualizar uma nova skill nesta pasta `skills/`, basta manter uma cópia correspondente em `.agents/skills/<nome-da-skill>/SKILL.md` para que o Antigravity reconheça o gatilho sem necessidade de configurações extras.
