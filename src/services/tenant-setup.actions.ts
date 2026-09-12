"use server";

import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";

// ==============================================================================
// Schemas Zod de Validação
// ==============================================================================

const confirmManualSetupSchema = z.object({
  tenantId: z.string().uuid("ID do estabelecimento inválido."),
  amount: z.coerce.number().min(0, "O valor de setup deve ser maior ou igual a zero."),
  firstBillingDays: z.coerce
    .number()
    .min(1, "O prazo para a primeira mensalidade deve ser de no mínimo 1 dia.")
    .default(30),
});

const updateSetupAmountSchema = z.object({
  tenantId: z.string().uuid("ID do estabelecimento inválido."),
  amount: z.coerce.number().min(0, "O valor de setup deve ser maior ou igual a zero."),
});

// ==============================================================================
// Helpers Internos de Autenticação e Supabase Admin
// ==============================================================================

async function verifySuperAdminPermission() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && process.env.NODE_ENV !== "development") {
    return { authorized: false, error: "Usuário não autenticado. Faça login como Super Admin." };
  }

  let isSuper = user ? checkIsSuperAdmin(user) : false;
  if (user && !isSuper) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "super_admin") {
      isSuper = true;
    }
  }

  if (!isSuper && process.env.NODE_ENV !== "development") {
    return { authorized: false, error: "Apenas Super Administradores podem realizar esta operação." };
  }

  return { authorized: true, user };
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausente.");
  }

  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ==============================================================================
// Server Actions
// ==============================================================================

/**
 * Confirma o pagamento manual da taxa de setup (ex: Pix direto) e agenda a primeira mensalidade.
 * Desbloqueia o tenant e ativa a vitrine.
 */
export async function confirmManualSetupPaymentAction(input: {
  tenantId: string;
  amount: number;
  firstBillingDays?: number;
}): Promise<{
  success: boolean;
  data?: {
    tenantId: string;
    amount: number;
    subscriptionExpiresAt: string;
    setupPaidAt: string;
  };
  error?: string;
}> {
  try {
    const authCheck = await verifySuperAdminPermission();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validation = confirmManualSetupSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Dados de entrada inválidos.",
      };
    }

    const { tenantId, amount, firstBillingDays } = validation.data;
    const supabaseAdmin = getSupabaseAdmin();

    const now = new Date();
    const setupPaidAt = now.toISOString();
    const subscriptionStartsAt = now.toISOString();
    const expiresDate = new Date(now.getTime() + firstBillingDays * 24 * 60 * 60 * 1000);
    const subscriptionExpiresAt = expiresDate.toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("tenants")
      .update({
        setup_paid_at: setupPaidAt,
        subscription_starts_at: subscriptionStartsAt,
        subscription_expires_at: subscriptionExpiresAt,
        current_period_end: subscriptionExpiresAt,
        setup_fee_paid: true,
        setup_paid: true, // Sincroniza coluna legada
        setup_fee_amount: amount,
        subscription_status: "active",
        updated_at: now.toISOString(),
      })
      .eq("id", tenantId);

    if (updateError) {
      console.error("[confirmManualSetupPaymentAction] Erro ao atualizar tenant:", updateError);
      return {
        success: false,
        error: `Erro ao salvar confirmação de setup: ${updateError.message}`,
      };
    }

    // Revalidação de cache nas telas afetadas
    revalidatePath("/super-admin");
    revalidatePath("/admin/assinatura");
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      data: {
        tenantId,
        amount,
        subscriptionExpiresAt,
        setupPaidAt,
      },
    };
  } catch (err: any) {
    console.error("[confirmManualSetupPaymentAction] Exceção:", err);
    return {
      success: false,
      error: err?.message || "Erro interno do servidor ao confirmar setup.",
    };
  }
}

/**
 * Permite ao Super Admin ajustar apenas o valor customizado de setup de um tenant
 * (por exemplo, durante a negociação antes do pagamento ser realizado).
 */
export async function updateTenantSetupAmountAction(input: {
  tenantId: string;
  amount: number;
}): Promise<{
  success: boolean;
  data?: { tenantId: string; amount: number };
  error?: string;
}> {
  try {
    const authCheck = await verifySuperAdminPermission();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validation = updateSetupAmountSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Valor inválido para o setup.",
      };
    }

    const { tenantId, amount } = validation.data;
    const supabaseAdmin = getSupabaseAdmin();

    const { error: updateError } = await supabaseAdmin
      .from("tenants")
      .update({
        setup_fee_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (updateError) {
      console.error("[updateTenantSetupAmountAction] Erro ao atualizar valor:", updateError);
      return {
        success: false,
        error: `Erro ao salvar valor negociado: ${updateError.message}`,
      };
    }

    revalidatePath("/super-admin");
    revalidatePath("/admin/assinatura");

    return {
      success: true,
      data: {
        tenantId,
        amount,
      },
    };
  } catch (err: any) {
    console.error("[updateTenantSetupAmountAction] Exceção:", err);
    return {
      success: false,
      error: err?.message || "Erro interno ao atualizar valor de setup.",
    };
  }
}
