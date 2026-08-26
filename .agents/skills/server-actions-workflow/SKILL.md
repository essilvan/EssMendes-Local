---
name: server-actions-workflow
description: >-
  Use this skill when building, refactoring, or testing Next.js 15 Server Actions, form mutations, Zod schema validations, cache revalidation, or handling tenant authentication in the EssMendes Local platform.
---

# ⚡ Next.js 15 Server Actions Workflow Skill

Esta skill define o padrão arquitetural para criação, validação e execução de Server Actions no projeto EssMendes Local.

---

## 📂 1. Organização e Localização

- Ações de domínio / entidades de negócio: [`src/services/`](file:///C:/Projetos/EssMendes-Local/src/services/) (e.g. `service.actions.ts`, `post.actions.ts`, `profile.actions.ts`)
- Ações globais / utilitárias / integrações externas: [`src/lib/actions/`](file:///C:/Projetos/EssMendes-Local/src/lib/actions/) (e.g. `google-places.actions.ts`)

---

## 🏗️ 2. Padrão Estrutural Obrigatório

Toda Server Action deve seguir o padrão:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 1. Contrato de Resposta Padronizado
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// 2. Schema de Validação com Zod
const ItemSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  price: z.number().positive("Preço deve ser positivo"),
});

// 3. Função Server Action
export async function createItemAction(
  formData: z.infer<typeof ItemSchema>
): Promise<ActionResult> {
  try {
    // A. Autenticação e obtenção segura de tenant_id
    const { data: tenantCtx, error: authError } = await getAuthenticatedTenant();
    if (authError || !tenantCtx) {
      return { success: false, error: authError || "Não autenticado" };
    }

    // B. Validação de Dados de Entrada
    const validation = ItemSchema.safeParse(formData);
    if (!validation.success) {
      return {
        success: false,
        error: "Dados inválidos",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    // C. Execução no Supabase
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from("tenant_items")
      .insert({
        tenant_id: tenantCtx.tenantId,
        name: validation.data.name,
        price: validation.data.price,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[createItemAction] Erro no banco:", dbError);
      return { success: false, error: "Falha ao salvar item no banco de dados." };
    }

    // D. Revalidação de Cache
    revalidatePath("/admin/items");
    revalidatePath(`/${tenantCtx.tenant?.slug}`);

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[createItemAction] Exceção:", err);
    return { success: false, error: msg };
  }
}
```

---

## 🛡️ 3. Regras e Boas Práticas

1. **Sempre `"use server"` no topo do arquivo**: Garante que o código execute exclusivamente no ambiente Node/V8 do servidor.
2. **Nunca expor chaves sensíveis ao cliente**: Chaves como `GOOGLE_PLACES_API_KEY` devem ser lidas exclusivamente dentro de Server Actions.
3. **Sempre revalidar rotas afetadas**: Utilizar `revalidatePath()` para manter os dados atualizados no cache do Next.js.
4. **Mensagens amigáveis no erro**: Nunca retornar stack traces brutos para a interface do usuário.
