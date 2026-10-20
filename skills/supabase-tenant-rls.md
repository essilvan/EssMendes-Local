---
name: supabase-tenant-rls
description: >-
  Use this skill when creating or modifying database schemas, writing Supabase migrations, implementing multi-tenant Row Level Security (RLS) policies, or working with Supabase Auth and client instances in the EssMendes Local platform.
---

# 🛡️ Supabase Multi-Tenant & RLS Skill

Esta skill define os padrões para evolução de banco de dados, isolamento multi-tenant e segurança com Row Level Security (RLS) no Supabase.

---

## 🗄️ 1. Padrões de Migração SQL

- **Localização:** [`supabase/migrations/`](file:///C:/Projetos/EssMendes-Local/supabase/migrations/)
- **Nomenclatura Obrigatória:** `YYYYMMDDHHMMSS_<descricao_em_snake_case>.sql` (e.g. `20260825000100_add_custom_field.sql`).
- **Idempotência:** Usar `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.

### 📑 Template de Nova Tabela com Multi-Tenancy e RLS:

```sql
-- 1. Criar tabela com vínculo ao tenant
CREATE TABLE IF NOT EXISTS public.tenant_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar índice para queries filtradas por tenant
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON public.tenant_features(tenant_id);

-- 3. Habilitar RLS
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS
-- Leitura pública (se aplicável para vitrine) ou restrita aos membros do tenant:
CREATE POLICY "Membros do tenant podem ler tenant_features"
ON public.tenant_features
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id = tenant_features.tenant_id
        AND tu.user_id = auth.uid()
    )
);

-- Inserção / Modificação restrita a membros autenticados do tenant:
CREATE POLICY "Membros do tenant podem gerenciar tenant_features"
ON public.tenant_features
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id = tenant_features.tenant_id
        AND tu.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id = tenant_features.tenant_id
        AND tu.user_id = auth.uid()
    )
);
```

---

## 🔑 2. Padrões de Clientes Supabase no Next.js

| Contexto | Módulo Importado | Como Usar |
| :--- | :--- | :--- |
| **Server Actions & Server Components** | [`@/lib/supabase/server`](file:///C:/Projetos/EssMendes-Local/src/lib/supabase/server.ts) | `const supabase = await createClient();` |
| **Client Components** | [`@/lib/supabase/client`](file:///C:/Projetos/EssMendes-Local/src/lib/supabase/client.ts) | `const supabase = createClient();` |
| **Validação de Auth + Tenant** | [`@/lib/supabase/tenant`](file:///C:/Projetos/EssMendes-Local/src/lib/supabase/tenant.ts) | `const { data: tenantCtx, error } = await getAuthenticatedTenant();` |

---

## 🔒 3. Invariantes de Segurança (Multi-Tenancy)

1. **Nunca confiar no `tenant_id` enviado pelo cliente**: Sempre obter o `tenantId` através de `getAuthenticatedTenant()` do backend.
2. **Sempre aplicar filtro de `tenant_id`**: Mesmo com RLS ativo, incluir `.eq('tenant_id', tenantId)` nas queries para redundância e performance de indexação.
3. **Cascading Deletes**: Todas as tabelas filhas de `tenants` devem conter `ON DELETE CASCADE`.

---

## 🧪 4. Validação de Migrações e Integridade

```bash
# Executar a bateria de testes de integridade do banco e tabelas
node scripts/test_complete_suite.mjs
```
