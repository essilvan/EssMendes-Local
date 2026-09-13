"use server";

import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";
import { revalidatePath } from "next/cache";
import type { PlatformPixSettings } from "@/types";

// ==============================================================================
// Schemas Zod de Validação
// ==============================================================================

const updatePlatformPixSettingsSchema = z.object({
  pixAgencyKey: z.string().trim().min(3, "A Chave Pix deve ter pelo menos 3 caracteres."),
  pixAgencyHolder: z.string().trim().min(2, "O Nome do Titular deve ter pelo menos 2 caracteres."),
});

const updateTenantPricingSchema = z.object({
  tenantId: z.string().uuid("ID do estabelecimento inválido."),
  setupFeeAmount: z.coerce.number().min(0, "A taxa de setup deve ser maior ou igual a zero."),
  monthlyFeeAmount: z.coerce.number().min(0, "A mensalidade recorrente deve ser maior ou igual a zero."),
});

const confirmTenantSetupPaymentSchema = z.object({
  tenantId: z.string().uuid("ID do estabelecimento inválido."),
  setupFeeAmount: z.coerce.number().min(0, "O valor de setup deve ser maior ou igual a zero.").optional(),
  monthlyFeeAmount: z.coerce.number().min(0, "A mensalidade deve ser maior ou igual a zero.").optional(),
  firstBillingDays: z.coerce
    .number()
    .min(1, "O prazo para a primeira mensalidade deve ser de no mínimo 1 dia.")
    .default(30),
});

// ==============================================================================
// Helpers Internos de Permissão e Supabase Service Role
// ==============================================================================

async function verifySuperAdminPermission() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && process.env.NODE_ENV !== "development") {
    return { authorized: false, error: "Usuário não autenticado. Faça login como Super Admin." };
  }

  let isSuper = false;
  const userEmail = (user?.email || "").toLowerCase().trim();
  if (userEmail === "essilvanmendes@gmail.com") {
    isSuper = true;
  }

  if (user && !isSuper) {
    if (
      user.user_metadata?.role === "super_admin" ||
      user.app_metadata?.role === "super_admin" ||
      checkIsSuperAdmin(user)
    ) {
      isSuper = true;
    }
  }

  if (user && !isSuper) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "super_admin") {
        isSuper = true;
      }
    } catch {}
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
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausente no servidor.");
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
 * Busca as configurações de Pix da Agência armazenadas na tabela platform_settings.
 * Caso não existam no banco, utiliza fallbacks seguros de variáveis de ambiente.
 */
export async function getPlatformPixSettingsAction(): Promise<{
  success: boolean;
  data: PlatformPixSettings;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();
    const { data: rows, error } = await supabase
      .from("platform_settings")
      .select("key, value, updated_at")
      .in("key", ["pix_agency_key", "pix_agency_holder"]);

    if (error) {
      console.warn("[getPlatformPixSettingsAction] Aviso ao consultar platform_settings:", error);
    }

    const map = new Map<string, string>();
    let lastUpdatedAt: string | undefined;

    if (rows) {
      for (const row of rows) {
        map.set(row.key, row.value);
        if (row.updated_at) lastUpdatedAt = row.updated_at;
      }
    }

    const pixAgencyKey =
      map.get("pix_agency_key") ||
      process.env.NEXT_PUBLIC_AGENCY_PIX_KEY ||
      "essilvanmendes@gmail.com";

    const pixAgencyHolder =
      map.get("pix_agency_holder") ||
      process.env.NEXT_PUBLIC_AGENCY_HOLDER ||
      "EssMendes Tecnologia";

    return {
      success: true,
      data: {
        pix_agency_key: pixAgencyKey,
        pix_agency_holder: pixAgencyHolder,
        updated_at: lastUpdatedAt,
      },
    };
  } catch (err: any) {
    console.error("[getPlatformPixSettingsAction] Erro:", err);
    return {
      success: true,
      data: {
        pix_agency_key: process.env.NEXT_PUBLIC_AGENCY_PIX_KEY || "essilvanmendes@gmail.com",
        pix_agency_holder: process.env.NEXT_PUBLIC_AGENCY_HOLDER || "EssMendes Tecnologia",
      },
    };
  }
}

/**
 * Atualiza as chaves globais da agência na tabela platform_settings utilizando o service_role.
 * Revalida /super-admin e /admin/assinatura.
 */
export async function updatePlatformPixSettingsAction(input: {
  pixAgencyKey: string;
  pixAgencyHolder: string;
}): Promise<{
  success: boolean;
  data?: { pixAgencyKey: string; pixAgencyHolder: string };
  error?: string;
}> {
  try {
    const authCheck = await verifySuperAdminPermission();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validation = updatePlatformPixSettingsSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Dados de configuração Pix inválidos.",
      };
    }

    const { pixAgencyKey, pixAgencyHolder } = validation.data;
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const [resKey, resHolder] = await Promise.all([
      supabaseAdmin.from("platform_settings").upsert(
        {
          key: "pix_agency_key",
          value: pixAgencyKey,
          updated_at: now,
        },
        { onConflict: "key" }
      ),
      supabaseAdmin.from("platform_settings").upsert(
        {
          key: "pix_agency_holder",
          value: pixAgencyHolder,
          updated_at: now,
        },
        { onConflict: "key" }
      ),
    ]);

    if (resKey.error || resHolder.error) {
      const errorMsg = resKey.error?.message || resHolder.error?.message || "Erro desconhecido";
      console.error("[updatePlatformPixSettingsAction] Erro ao salvar configurações:", errorMsg);
      return {
        success: false,
        error: `Falha ao salvar configurações Pix: ${errorMsg}`,
      };
    }

    revalidatePath("/super-admin");
    revalidatePath("/admin/assinatura");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin", "layout");

    return {
      success: true,
      data: {
        pixAgencyKey,
        pixAgencyHolder,
      },
    };
  } catch (err: any) {
    console.error("[updatePlatformPixSettingsAction] Exceção:", err);
    return {
      success: false,
      error: err?.message || "Erro interno ao atualizar configurações Pix da agência.",
    };
  }
}

/**
 * Atualiza os valores customizados de taxa de setup e mensalidade recorrente de um tenant.
 * Salva setup_fee_amount e monthly_fee_amount na tabela tenants.
 */
export async function updateTenantPricingAction(input: {
  tenantId: string;
  setupFeeAmount: number;
  monthlyFeeAmount: number;
}): Promise<{
  success: boolean;
  data?: { tenantId: string; setupFeeAmount: number; monthlyFeeAmount: number };
  error?: string;
}> {
  try {
    const authCheck = await verifySuperAdminPermission();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const validation = updateTenantPricingSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Valores de precificação inválidos.",
      };
    }

    const { tenantId, setupFeeAmount, monthlyFeeAmount } = validation.data;
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("tenants")
      .update({
        setup_fee_amount: setupFeeAmount,
        monthly_fee_amount: monthlyFeeAmount,
        updated_at: now,
      })
      .eq("id", tenantId);

    if (updateError) {
      console.error("[updateTenantPricingAction] Erro ao atualizar tabela tenants:", updateError);
      return {
        success: false,
        error: `Erro ao salvar precificação do estabelecimento: ${updateError.message}`,
      };
    }

    revalidatePath("/super-admin");
    revalidatePath("/admin/assinatura");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      data: {
        tenantId,
        setupFeeAmount,
        monthlyFeeAmount,
      },
    };
  } catch (err: any) {
    console.error("[updateTenantPricingAction] Exceção:", err);
    return {
      success: false,
      error: err?.message || "Erro interno ao atualizar precificação do estabelecimento.",
    };
  }
}

/**
 * Confirma o pagamento manual de setup via Pix direto.
 * Atualiza:
 * - setup_fee_paid = true
 * - setup_paid = true (coluna legada)
 * - setup_paid_at = now()
 * - subscription_starts_at = now()
 * - subscription_expires_at = now() + 30 dias
 * - current_period_end = now() + 30 dias
 * - subscription_status = 'active'
 */
export async function confirmTenantSetupPaymentAction(input: {
  tenantId: string;
  setupFeeAmount?: number;
  monthlyFeeAmount?: number;
  firstBillingDays?: number;
}): Promise<{
  success: boolean;
  data?: {
    tenantId: string;
    setupFeeAmount?: number;
    monthlyFeeAmount?: number;
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

    const validation = confirmTenantSetupPaymentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Dados de confirmação inválidos.",
      };
    }

    const { tenantId, setupFeeAmount, monthlyFeeAmount, firstBillingDays } = validation.data;
    const supabaseAdmin = getSupabaseAdmin();

    const now = new Date();
    const setupPaidAt = now.toISOString();
    const subscriptionStartsAt = now.toISOString();
    const expiresDate = new Date(now.getTime() + firstBillingDays * 24 * 60 * 60 * 1000);
    const subscriptionExpiresAt = expiresDate.toISOString();

    const updatePayload: Record<string, any> = {
      setup_fee_paid: true,
      setup_paid: true,
      setup_paid_at: setupPaidAt,
      subscription_starts_at: subscriptionStartsAt,
      subscription_expires_at: subscriptionExpiresAt,
      current_period_end: subscriptionExpiresAt,
      subscription_status: "active",
      updated_at: now.toISOString(),
    };

    if (setupFeeAmount !== undefined && setupFeeAmount !== null) {
      updatePayload.setup_fee_amount = setupFeeAmount;
    }

    if (monthlyFeeAmount !== undefined && monthlyFeeAmount !== null) {
      updatePayload.monthly_fee_amount = monthlyFeeAmount;
    }

    const { error: updateError } = await supabaseAdmin
      .from("tenants")
      .update(updatePayload)
      .eq("id", tenantId);

    if (updateError) {
      console.error("[confirmTenantSetupPaymentAction] Erro ao atualizar tenant:", updateError);
      return {
        success: false,
        error: `Erro ao salvar confirmação de setup: ${updateError.message}`,
      };
    }

    revalidatePath("/super-admin");
    revalidatePath("/admin/assinatura");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin", "layout");

    return {
      success: true,
      data: {
        tenantId,
        setupFeeAmount,
        monthlyFeeAmount,
        subscriptionExpiresAt,
        setupPaidAt,
      },
    };
  } catch (err: any) {
    console.error("[confirmTenantSetupPaymentAction] Exceção:", err);
    return {
      success: false,
      error: err?.message || "Erro interno ao confirmar setup do estabelecimento.",
    };
  }
}
