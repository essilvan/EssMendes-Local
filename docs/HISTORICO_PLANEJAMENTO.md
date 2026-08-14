# 📜 Histórico de Planejamento & Handover: EssMendes Local
**Data de Consolidação:** 13 de Agosto de 2026  
**Empresa:** EssMendes Tecnologia  
**Produto:** EssMendes Local (Plataforma SaaS de Presença Digital Local)  
**Status do Projeto:** Em Desenvolvimento Incremental

---

## 📌 1. Resumo Executivo da Sessão

Durante a sessão de alinhamento e design de software, foi realizada a estruturação e revisão arquitetural completa do **EssMendes Local**.

O diretório do projeto (`C:\Projetos\EssMendes-Local`) foi estruturado para receber a base profissional em Next.js App Router, TypeScript, Tailwind CSS e Supabase.

---

## 🎯 2. Visão do Produto & Posicionamento

O **EssMendes Local** **não** é apenas um criador de sites nem uma simples agenda online. Seu posicionamento oficial é:

> **"Plataforma de presença digital e geração de clientes para negócios locais."**

### Funil de Conversão Integrado:
```
[ Google / Busca / Redes Sociais ]
              │
              ▼
   [ Página Profissional ] 
              │
              ├──────────────────────────┐
              ▼                          ▼
   [ Catálogo de Serviços ]    [ WhatsApp Direto ]
              │                          │
              ▼                          │
   [ Agendamento Online ]                │
              │                          │
              └──────────────┬───────────┘
                             ▼
                    [ Cliente Retido ]
```

### Público-Alvo Inicial:
* Salões de beleza e barbearias
* Manicures e clínicas de estética
* Prestadores de serviços e profissionais autônomos
* Pequenos negócios locais com atendimento agendado ou contato direto via WhatsApp

---

## 🛠️ 3. Stack Tecnológica Confirmada

* **Frontend:** Next.js (App Router, React 19, TypeScript 5)
* **Estilização:** Tailwind CSS v4 + Radix UI / Shadcn UI + Lucide React
* **Backend:** Next.js Server Actions + Route Handlers com validação Zod
* **Banco de Dados:** PostgreSQL 16+ via **Projeto Supabase Exclusivo e Isolado**
* **Autenticação:** Supabase Auth (Email/Senha, Magic Links)
* **Storage:** Supabase Storage (Buckets privados e públicos com RLS)
* **SEO Local:** Next.js Metadata API, sitemap dinâmico XML e JSON-LD (`LocalBusiness`)

---

## 📐 4. Decisões Arquiteturais Definitivas (Ajustes Consolidados)

### A. Modelo Multi-tenant & RLS Desacoplado
* A relação de autorização **NÃO** depende de `tenant_id = auth.uid()`.
* **Cadeia de Relação:** `auth.users` ➔ `tenant_users` ➔ `tenants` ➔ `dados do tenant`.
* Permite que um mesmo usuário pertença a múltiplas empresas no futuro.
* **Roles RBAC:**
  * `owner`: Acesso total (configurações, cobrança, usuários, serviços).
  * `admin`: Acesso operacional completo (serviços, profissionais, agenda, clientes).
  * `staff`: Acesso restrito (visualizar sua agenda e alterar status de atendimentos).

### B. Agendamento Público & Proteção Anti-Abuso
* **Zero INSERT Direto por Clientes Anônimos:** A página pública não tem permissão RLS de inserção direta nas tabelas do banco.
* **Fluxo Seguro:** Cliente ➔ Página Pública ➔ Server Action (Validação Zod + Rate Limiting + Honeypot + Idempotency Key) ➔ Stored Procedure PostgreSQL (`RPC`).
* **Proteções:** Rate limit de 3 tentativas/10min por IP, campo honeypot anti-bot e validação E.164 de telefones brasileiros.

### C. Prevenção de Double-Booking Nativa no PostgreSQL
* Utilização da extensão `btree_gist` e do tipo de dado `TSTZRANGE` para representar o intervalo `[start_time, end_time)`.
* **Constraint de Exclusão Nativa (`EXCLUDE USING gist`):**
  ```sql
  CONSTRAINT no_double_booking EXCLUDE USING gist (
      tenant_id WITH =,
      professional_id WITH =,
      booking_period WITH &&
  ) WHERE (status != 'canceled')
  ```
* Garante matematicamente a imutabilidade contra *race conditions* no próprio motor do banco de dados.

### D. Modelo de Horários Escalável
* Além de `business_hours`, o banco nasce estruturado com tabelas para: `professional_hours`, `special_hours`, `holidays` e `blocked_periods`.

### E. Diagnóstico de Presença Local Transparente
* Pontuação de 0% a 100% calculada **sem dados inventados** e **sem promessas falsas de ranking no Google**.
* Dividido em:
  1. *(A) Dados Informados pelo Proprietário* (WhatsApp, Instagram, Link do Google Meu Negócio).
  2. *(B) Verificações Técnicas do Sistema* (HTTPS, Metadados SEO, Sitemap, JSON-LD Schema, Responsividade Mobile, Serviços Ativos).
  3. *(C) Integrações Futuras* (API do Google Business Profile quando viável).

### F. Analytics & LGPD Compliance
* Tabela `analytics_events` estritamente **sem PII** (sem armazenar nomes, e-mails, telefones ou IPs).
* Eventos monitorados: `page_view`, `click_whatsapp`, `click_phone`, `click_directions`, `click_booking`, `booking_created`.

### G. Domínio e Roteamento
* Suporte nativo para `local.essmendes.com.br/[slug]` e domínios próprios `[cliente].com.br`.
* Middleware Next.js sanitiza o header `Host`, consulta o banco e reescreve a rota internamente com isolamento de cache.

---

## 🗄️ 5. Modelo do Banco de Dados Relacional (DDL Resumido)

1. `tenants` (Entidade da Empresa: id, name, slug, custom_domain, plan_tier)
2. `tenant_profiles` (Branding: description, phone_whatsapp, address, logo_url, template_id)
3. `tenant_seo` (SEO: meta_title, meta_description, og_image_url)
4. `tenant_users` (Associação: tenant_id, user_id, role)
5. `services` (Serviços: tenant_id, name, price, duration_minutes)
6. `professionals` (Profissionais: tenant_id, name, role_title, avatar_url)
7. `professional_services` (Vínculo N:N entre profissional e serviço)
8. `business_hours` (Horários gerais da empresa por dia da semana)
9. `professional_hours`, `special_hours`, `holidays`, `blocked_periods` (Escalabilidade de horários)
10. `customers` (Base de Clientes: tenant_id, name, phone)
11. `appointments` (Agendamentos com Exclusion Constraint em `booking_period`)
12. `gallery_images` (Fotos do estabelecimento: tenant_id, image_url, display_order)
13. `analytics_events` (Métricas agregadas sem PII: tenant_id, event_name, device_type)

---

## 📁 6. Estrutura de Pastas do Projeto

```
essmendes-local/
├── docs/                        # Documentação técnica e histórico
│   └── HISTORICO_PLANEJAMENTO.md
├── supabase/                    # Migrations SQL e políticas RLS
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (admin)/             # Dashboard do Proprietário
│   │   ├── (auth)/              # Autenticação Supabase
│   │   ├── (public)/            # Páginas Públicas ([slug])
│   │   ├── api/                 # Endpoints REST e Webhooks
│   │   ├── layout.tsx           # Layout raiz
│   │   └── page.tsx             # Página inicial / Validação
│   ├── components/
│   │   ├── ui/                  # Componentes base atômicos
│   │   └── common/              # Componentes compartilhados
│   ├── features/                # Módulos por domínio de negócio
│   ├── hooks/                   # Custom React Hooks
│   ├── lib/
│   │   └── supabase/            # Browser, Server e Admin clients
│   ├── services/                # Regras de Negócio e Server Actions
│   ├── styles/                  # globals.css e tokens visuais
│   ├── types/                   # Interfaces TypeScript
│   └── utils/                   # Utilitários puros
├── public/                      # Assets estáticos
├── .env.local                   # Credenciais do Supabase
├── package.json
└── tsconfig.json
```

---

## 🚫 7. O Que Fica Fora do MVP (Fase 1)

1. Geração de Conteúdo por IA.
2. Integração com API Oficial do Google Business Profile.
3. Pagamentos online durante o agendamento.
4. Lembretes automáticos via WhatsApp API / SMS.
5. Sincronização com Google Agenda / Outlook Calendar.
