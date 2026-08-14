"use server";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/utils/slugify";
import { redirect } from "next/navigation";

export interface ActionState {
  success?: boolean;
  error?: string;
  message?: string;
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fullName = formData.get("fullName")?.toString().trim();
  const companyName = formData.get("companyName")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!fullName || !companyName || !email || !password) {
    return { error: "Todos os campos são obrigatórios." };
  }

  if (password.length < 6) {
    return { error: "A senha deve conter no mínimo 6 caracteres." };
  }

  const supabase = await createClient();
  const generatedSlug = slugify(companyName) || "minha-empresa";

  // 1. Criação do Usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName,
      },
    },
  });

  if (authError) {
    console.error("[registerAction] Erro no Supabase Auth signUp:", authError);
    return { error: `Erro no cadastro: ${authError.message}` };
  }

  if (!authData.user) {
    console.error("[registerAction] Usuário não retornado pelo signUp.");
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // 2. Se a sessão foi iniciada automaticamente, cria o tenant e vincula como owner
  if (authData.session) {
    try {
      const { error: rpcError } = await supabase.rpc(
        "create_tenant_and_owner",
        {
          p_company_name: companyName,
          p_company_slug: generatedSlug,
        }
      );

      if (rpcError) {
        console.warn("[registerAction] RPC create_tenant_and_owner falhou, tentando fallback direto:", rpcError);
        const { data: tenantData, error: insertTenantError } = await supabase
          .from("tenants")
          .insert({ name: companyName, slug: generatedSlug })
          .select("id")
          .single();

        if (insertTenantError) {
          console.error("[registerAction] Fallback de criação de tenant falhou:", insertTenantError);
        } else if (tenantData?.id) {
          const { error: linkError } = await supabase.from("tenant_users").insert({
            tenant_id: tenantData.id,
            user_id: authData.user.id,
            role: "owner",
          });
          if (linkError) {
            console.error("[registerAction] Fallback de vínculo tenant_users falhou:", linkError);
          }
        }
      }
    } catch (dbErr) {
      console.error("[registerAction] Exceção ao vincular tenant no cadastro:", dbErr);
    }
  }

  // 3. Se confirmação de e-mail estiver ativa no Supabase
  if (!authData.session && authData.user && authData.user.identities?.length) {
    return {
      success: true,
      message:
        "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta antes de fazer login.",
    };
  }

  redirect("/admin/dashboard");
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Por favor, informe seu e-mail e senha." };
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[loginAction] Erro no Supabase Auth signInWithPassword:", error);
    if (error.message.includes("Invalid login credentials")) {
      return { error: "E-mail ou senha incorretos." };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "Por favor, confirme seu e-mail antes de acessar." };
    }
    return { error: `Erro na autenticação: ${error.message}` };
  }

  // Auto-recuperação de tenant para usuários sem tenant_users
  if (authData.user) {
    try {
      const { data: existingTenantUser, error: checkError } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (checkError) {
        console.error("[loginAction] Erro ao checar tenant_users no login:", checkError);
      }

      if (!existingTenantUser) {
        const companyName =
          (authData.user.user_metadata?.company_name as string) ||
          "Meu Estabelecimento";
        const slug = slugify(companyName) || "meu-negocio";

        console.log("[loginAction] Usuário sem tenant_users, criando vínculo inicial...");
        await supabase.rpc("create_tenant_and_owner", {
          p_company_name: companyName,
          p_company_slug: slug,
        });
      }
    } catch (err) {
      console.error("[loginAction] Erro na auto-recuperação de tenant:", err);
    }
  }

  redirect("/admin/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[logoutAction] Erro ao fazer signOut:", error);
  }
  redirect("/login");
}
