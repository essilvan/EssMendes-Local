import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkIsSuperAdmin } from "@/lib/supabase/tenant";

export const dynamic = "force-dynamic";

/**
 * Valida se o usuário que está chamando a rota possui permissão de Super Admin.
 */
async function verifySuperAdminCaller() {
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user: currentUser },
    } = await serverSupabase.auth.getUser();

    if (!currentUser && process.env.NODE_ENV !== "development") {
      return {
        authorized: false,
        currentUser: null,
        error: "Acesso não autorizado. Faça login como Super Admin.",
        status: 401,
      };
    }

    let isCallerSuperAdmin = currentUser ? checkIsSuperAdmin(currentUser) : false;
    if (currentUser && !isCallerSuperAdmin) {
      const { data: profile } = await serverSupabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profile?.role === "super_admin") {
        isCallerSuperAdmin = true;
      }
    }

    if (!isCallerSuperAdmin && process.env.NODE_ENV !== "development") {
      return {
        authorized: false,
        currentUser,
        error: "Apenas Super Administradores podem acessar esta função.",
        status: 403,
      };
    }

    return { authorized: true, currentUser, error: null, status: 200 };
  } catch (authErr: any) {
    console.warn("[SuperAdmin Admins] Falha na validação de sessão:", authErr);
    if (process.env.NODE_ENV === "development") {
      return { authorized: true, currentUser: null, error: null, status: 200 };
    }
    return {
      authorized: false,
      currentUser: null,
      error: "Erro de autenticação de sessão.",
      status: 401,
    };
  }
}

/**
 * Retorna cliente Supabase com Service Role Key para operações de administração.
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurados.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * GET: Lista todos os usuários que possuem perfil ou metadados de Super Admin.
 */
export async function GET() {
  try {
    const authCheck = await verifySuperAdminCaller();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const currentUser = authCheck.currentUser;

    const [usersRes, profilesRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("profiles").select("*"),
    ]);

    const users = usersRes.data?.users || [];
    const profiles = profilesRes.data || [];

    const profileMap = new Map<string, any>();
    for (const p of profiles) {
      profileMap.set(p.id, p);
    }

    const envAdmins = (
      process.env.SUPER_ADMIN_EMAILS ||
      process.env.SUPER_ADMIN_EMAIL ||
      "essilvanmendes@gmail.com,admin@essmendes.com,superadmin@essmendes.com,contato@essmendes.com.br"
    )
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const superAdminsMap = new Map<string, any>();

    for (const u of users) {
      const uEmail = (u.email || "").toLowerCase().trim();
      const p = profileMap.get(u.id);

      const isSuper =
        u.user_metadata?.role === "super_admin" ||
        u.app_metadata?.role === "super_admin" ||
        p?.role === "super_admin" ||
        envAdmins.includes(uEmail);

      if (isSuper) {
        superAdminsMap.set(u.id, {
          id: u.id,
          email: u.email,
          name:
            u.user_metadata?.name ||
            p?.full_name ||
            u.email?.split("@")[0] ||
            "Administrador",
          role: "super_admin",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          isCurrentAdmin:
            currentUser?.id === u.id ||
            (!!currentUser?.email &&
              currentUser.email.toLowerCase().trim() === uEmail),
          isMasterOwner: uEmail === "essilvanmendes@gmail.com",
        });
      }
    }

    // Complementa com perfis que tenham role super_admin caso não estejam em listUsers
    for (const p of profiles) {
      if (p.role === "super_admin" && !superAdminsMap.has(p.id)) {
        const pEmail = (p.email || "").toLowerCase().trim();
        superAdminsMap.set(p.id, {
          id: p.id,
          email: p.email,
          name: p.full_name || p.email?.split("@")[0] || "Administrador",
          role: "super_admin",
          created_at: p.created_at || new Date().toISOString(),
          isCurrentAdmin:
            currentUser?.id === p.id ||
            (!!currentUser?.email &&
              currentUser.email.toLowerCase().trim() === pEmail),
          isMasterOwner: pEmail === "essilvanmendes@gmail.com",
        });
      }
    }

    const adminsList = Array.from(superAdminsMap.values()).sort((a, b) => {
      if (a.isMasterOwner) return -1;
      if (b.isMasterOwner) return 1;
      if (a.isCurrentAdmin) return -1;
      if (b.isCurrentAdmin) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      success: true,
      admins: adminsList,
    });
  } catch (err: any) {
    console.error("[SuperAdmin Admins GET] Erro:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro ao listar super administradores.",
      },
      { status: 500 }
    );
  }
}

/**
 * Função interna para processar revogação de privilégio de Super Admin.
 */
async function handleRevoke(targetUserId: string, currentUser: any) {
  if (!targetUserId || typeof targetUserId !== "string") {
    return NextResponse.json(
      { success: false, error: "O ID do usuário (userId) é obrigatório." },
      { status: 400 }
    );
  }

  if (currentUser?.id === targetUserId) {
    return NextResponse.json(
      { success: false, error: "Você não pode revogar seu próprio acesso de Super Administrador." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: targetData, error: getUserError } =
    await supabaseAdmin.auth.admin.getUserById(targetUserId);

  if (getUserError || !targetData?.user) {
    return NextResponse.json(
      { success: false, error: "Usuário não encontrado." },
      { status: 404 }
    );
  }

  const targetUser = targetData.user;
  const targetEmail = (targetUser.email || "").toLowerCase().trim();

  if (targetEmail === "essilvanmendes@gmail.com") {
    return NextResponse.json(
      { success: false, error: "O privilégio do Administrador Master Principal não pode ser revogado." },
      { status: 403 }
    );
  }

  if (currentUser?.email && currentUser.email.toLowerCase().trim() === targetEmail) {
    return NextResponse.json(
      { success: false, error: "Você não pode revogar seu próprio acesso de Super Administrador." },
      { status: 400 }
    );
  }

  // 1. Rebaixa metadados em auth.users
  const currentMeta = targetUser.user_metadata || {};
  const updatedMeta = { ...currentMeta, role: "user" };
  await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
    user_metadata: updatedMeta,
  });

  // 2. Rebaixa na tabela profiles
  await supabaseAdmin
    .from("profiles")
    .update({
      role: "tenant_owner",
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  // 3. Rebaixa em tenant_users caso existisse como super_admin
  try {
    await supabaseAdmin
      .from("tenant_users")
      .update({ role: "owner" })
      .eq("user_id", targetUserId)
      .eq("role", "super_admin");
  } catch {}

  return NextResponse.json({
    success: true,
    message: `Privilégio de Super Administrador revogado com sucesso para ${targetUser.email}.`,
  });
}

/**
 * POST: Cadastra um novo Super Admin ou promove um usuário existente.
 */
export async function POST(req: Request) {
  try {
    const authCheck = await verifySuperAdminCaller();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await req.json();

    // Suporte a ação de revogação via POST (caso o client prefira POST com action: 'revoke')
    if (body?.action === "revoke") {
      return handleRevoke(body?.userId, authCheck.currentUser);
    }

    const { email, password, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "E-mail válido é obrigatório." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanPassword = typeof password === "string" ? password.trim() : "";

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Verificar se o usuário já existe no auth.users
    let existingUserId: string | null = null;
    let existingUserData: any = null;

    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const matched = listData?.users?.find(
        (u) => u.email?.toLowerCase().trim() === cleanEmail
      );
      if (matched?.id) {
        existingUserId = matched.id;
        existingUserData = matched;
      }
    } catch (listErr) {
      console.warn("[SuperAdmin Admins] Fallback listUsers:", listErr);
    }

    // Se não encontrou na lista, checa se existe na tabela profiles
    if (!existingUserId) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("email", cleanEmail)
          .maybeSingle();
        if (profile?.id) {
          existingUserId = profile.id;
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          if (authUser?.user) {
            existingUserData = authUser.user;
          }
        }
      } catch (profCheckErr) {
        console.warn("[SuperAdmin Admins] Fallback profile search:", profCheckErr);
      }
    }

    let userId: string;
    let isNewUser = false;

    if (!existingUserId) {
      // 2. Se NÃO existir: criar o usuário
      if (!cleanPassword || cleanPassword.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: "Para novos usuários, a senha provisória deve ter no mínimo 6 caracteres.",
          },
          { status: 400 }
        );
      }

      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            name: cleanName || cleanEmail.split("@")[0],
            role: "super_admin",
          },
        });

      if (createError) {
        const errMsg = createError.message.toLowerCase();
        const isAlready =
          errMsg.includes("already") ||
          errMsg.includes("registered") ||
          (createError as any).status === 422;

        if (isAlready) {
          // Tenta recuperar o ID via busca caso tenha falhado na verificação anterior
          const { data: retryList } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
          const retryMatch = retryList?.users?.find(
            (u) => u.email?.toLowerCase().trim() === cleanEmail
          );

          if (retryMatch?.id) {
            userId = retryMatch.id;
            const updatePayload: any = {
              user_metadata: {
                ...(retryMatch.user_metadata || {}),
                role: "super_admin",
                name: cleanName || retryMatch.user_metadata?.name || cleanEmail.split("@")[0],
              },
            };
            if (cleanPassword) {
              updatePayload.password = cleanPassword;
            }
            await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
          } else {
            return NextResponse.json(
              { success: false, error: createError.message },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { success: false, error: `Erro ao criar usuário: ${createError.message}` },
            { status: 400 }
          );
        }
      } else if (newUser?.user) {
        userId = newUser.user.id;
        isNewUser = true;
      } else {
        return NextResponse.json(
          { success: false, error: "Falha ao registrar novo usuário." },
          { status: 500 }
        );
      }
    } else {
      // 3. Se JÁ existir: atualizar o usuário com a role 'super_admin'
      userId = existingUserId;
      const updatePayload: any = {
        user_metadata: {
          ...(existingUserData?.user_metadata || {}),
          role: "super_admin",
          ...(cleanName ? { name: cleanName } : {}),
        },
      };

      if (cleanPassword && cleanPassword.length >= 6) {
        updatePayload.password = cleanPassword;
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        updatePayload
      );

      if (updateError) {
        return NextResponse.json(
          { success: false, error: `Erro ao promover usuário: ${updateError.message}` },
          { status: 400 }
        );
      }
    }

    // 4. Atualizar/Inserir na tabela auxiliar 'profiles' com role = 'super_admin'
    try {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          email: cleanEmail,
          full_name: cleanName || cleanEmail.split("@")[0],
          role: "super_admin",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (profUpsertErr: any) {
      console.warn("[SuperAdmin Admins] Aviso ao sincronizar profiles:", profUpsertErr);
    }

    return NextResponse.json({
      success: true,
      message: isNewUser
        ? "Novo Super Administrador criado e ativado com sucesso!"
        : "Usuário existente promovido a Super Administrador com sucesso!",
      user: {
        id: userId,
        email: cleanEmail,
        name: cleanName || cleanEmail.split("@")[0],
        isNewUser,
      },
    });
  } catch (err: any) {
    console.error("[SuperAdmin Admins POST] Erro:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Revoga o privilégio de Super Admin de um usuário.
 */
export async function DELETE(req: Request) {
  try {
    const authCheck = await verifySuperAdminCaller();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    let targetUserId = "";
    try {
      const body = await req.json();
      targetUserId = body?.userId || "";
    } catch {
      const { searchParams } = new URL(req.url);
      targetUserId = searchParams.get("userId") || "";
    }

    return handleRevoke(targetUserId, authCheck.currentUser);
  } catch (err: any) {
    console.error("[SuperAdmin Admins DELETE] Erro:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro ao revogar privilégio." },
      { status: 500 }
    );
  }
}
