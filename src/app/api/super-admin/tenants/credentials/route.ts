import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Verificação de permissão do chamador (Super Admin)
    try {
      const serverSupabase = await createServerClient();
      const {
        data: { user: currentUser },
      } = await serverSupabase.auth.getUser();

      if (!currentUser && process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { success: false, error: "Acesso não autorizado. Faça login como Super Admin." },
          { status: 401 }
        );
      }

      if (currentUser && !checkIsSuperAdmin(currentUser) && process.env.NODE_ENV !== "development") {
        const { data: profile } = await serverSupabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profile?.role !== "super_admin") {
          return NextResponse.json(
            { success: false, error: "Apenas Super Administradores podem gerenciar credenciais." },
            { status: 403 }
          );
        }
      }
    } catch (authErr) {
      console.warn("[SuperAdmin Credentials] Aviso na validação de sessão:", authErr);
    }

    // 2. Leitura e validação do payload
    const body = await req.json();
    const { tenantId, email, password } = body;

    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { success: false, error: "O ID do estabelecimento (tenantId) é obrigatório." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Por favor, informe um endereço de e-mail válido para o lojista." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "A senha deve conter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 3. Inicializa cliente do Supabase com Service Role Key para operações de Admin Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[SuperAdmin Credentials] SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurada nas variáveis de ambiente.");
      return NextResponse.json(
        {
          success: false,
          error: "Configuração do servidor incompleta: SUPABASE_SERVICE_ROLE_KEY não configurada nas variáveis de ambiente.",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 4. Verificar se o usuário já existe no auth.users via listUsers()
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error("[SuperAdmin Credentials] Erro ao listar usuários no Supabase Auth:", listError);
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao consultar usuários no Supabase: ${listError.message}. Verifique a variável SUPABASE_SERVICE_ROLE_KEY.`,
        },
        { status: 500 }
      );
    }

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let targetUserId: string;

    if (!existingUser) {
      // 4.a Não existe: criar via createUser
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          tenant_id: tenantId,
          role: "tenant_owner",
        },
      });

      if (createError || !newUserData.user) {
        console.error("[SuperAdmin Credentials] Erro ao criar usuário no Supabase Auth:", createError);
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao criar usuário: ${createError?.message || "Falha desconhecida"}`,
          },
          { status: 400 }
        );
      }

      targetUserId = newUserData.user.id;
    } else {
      // 4.b Já existe: atualizar senha via updateUserById
      targetUserId = existingUser.id;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: cleanPassword,
        user_metadata: {
          ...(existingUser.user_metadata || {}),
          tenant_id: tenantId,
          role: "tenant_owner",
        },
      });

      if (updateError) {
        console.error("[SuperAdmin Credentials] Erro ao atualizar senha do usuário:", updateError);
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao atualizar a senha do usuário existente: ${updateError.message}`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Garantir vínculo relacional na tabela tenant_users
    try {
      await supabaseAdmin.from("tenant_users").upsert(
        {
          tenant_id: tenantId,
          user_id: targetUserId,
          role: "owner",
        },
        { onConflict: "tenant_id,user_id" }
      );
    } catch (tuErr) {
      console.warn("[SuperAdmin Credentials] Aviso ao vincular tenant_users:", tuErr);
    }

    // 6. Garantir registro na tabela profiles
    try {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: targetUserId,
          email: cleanEmail,
          role: "tenant_owner",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (profErr) {
      console.warn("[SuperAdmin Credentials] Aviso ao atualizar tabela profiles:", profErr);
    }

    // 7. Atualizar a tabela tenants com o contact_email e permissions correspondentes
    try {
      const tenantUpdatePayload: Record<string, any> = {
        contact_email: cleanEmail,
        updated_at: new Date().toISOString(),
      };

      if (body.permissions && typeof body.permissions === "object") {
        tenantUpdatePayload.permissions = {
          showcase: body.permissions.showcase !== false,
          services: body.permissions.services !== false,
          before_after: body.permissions.before_after !== false,
          reviews: body.permissions.reviews !== false,
          settings: body.permissions.settings !== false,
          billing: body.permissions.billing !== false,
        };
      }

      const { error: tenantUpdateErr } = await supabaseAdmin
        .from("tenants")
        .update(tenantUpdatePayload)
        .eq("id", tenantId);

      if (tenantUpdateErr) {
        console.warn("[SuperAdmin Credentials] Aviso ao atualizar tenant:", tenantUpdateErr.message);
      }
    } catch (tenErr) {
      console.warn("[SuperAdmin Credentials] Exceção ao atualizar tabela tenants:", tenErr);
    }

    return NextResponse.json({
      success: true,
      message: existingUser
        ? `Senha e credenciais de "${cleanEmail}" atualizadas com sucesso!`
        : `Acesso gerado com sucesso para "${cleanEmail}"! O lojista já pode entrar na plataforma.`,
      data: {
        tenantId,
        userId: targetUserId,
        email: cleanEmail,
        isNewUser: !existingUser,
      },
    });
  } catch (err: any) {
    console.error("[SuperAdmin Credentials] Erro inesperado:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro interno do servidor ao processar credenciais." },
      { status: 500 }
    );
  }
}
