import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { tenantId, email, password, permissions } = await req.json();

    if (!tenantId || !email || !password) {
      return NextResponse.json(
        { error: 'TenantId, email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Tenta criar o usuário diretamente
    let authUserId: string | null = null;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: { tenant_id: tenantId },
    });

    if (createError) {
      const errMsg = createError.message.toLowerCase();
      const isAlreadyRegistered =
        errMsg.includes('already') ||
        errMsg.includes('registered') ||
        (createError as any).status === 422;

      if (isAlreadyRegistered) {
        // 1.a Tenta capturar o ID via RPC get_user_id_by_email
        try {
          const { data: rpcUserId } = await supabaseAdmin.rpc('get_user_id_by_email', {
            user_email: cleanEmail,
          });
          if (typeof rpcUserId === 'string' && rpcUserId) {
            authUserId = rpcUserId;
          }
        } catch {
          // RPC pode não estar disponível ainda
        }

        // 1.b Fallback: busca na tabela profiles
        if (!authUserId) {
          try {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .ilike('email', cleanEmail)
              .maybeSingle();
            if (profile?.id) {
              authUserId = profile.id;
            }
          } catch {}
        }

        // 1.c Fallback: busca via listUsers
        if (!authUserId) {
          try {
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
              page: 1,
              perPage: 1000,
            });
            const matched = listData?.users?.find(
              (u) => u.email?.toLowerCase() === cleanEmail
            );
            if (matched?.id) {
              authUserId = matched.id;
            }
          } catch (listErr) {
            console.warn('[Credentials] Fallback listUsers:', listErr);
          }
        }

        // Se encontramos o usuário existente, atualiza a senha, confirma email e vincula metadados
        if (authUserId) {
          const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            {
              password: cleanPassword,
              email_confirm: true,
              user_metadata: { tenant_id: tenantId },
            }
          );

          if (updateAuthErr) {
            console.error('[Credentials] Erro ao atualizar usuário existente:', updateAuthErr);
            return NextResponse.json(
              { error: `Erro ao atualizar usuário existente: ${updateAuthErr.message}` },
              { status: 400 }
            );
          }
        } else {
          console.warn('[Credentials] Usuário já existe no Auth, sincronizando dados...');
        }
      } else {
        return NextResponse.json({ error: `Erro Auth: ${createError.message}` }, { status: 400 });
      }
    } else if (newUser?.user) {
      authUserId = newUser.user.id;
    }

    // Garante vínculo relacional em tenant_users se authUserId foi identificado
    if (authUserId) {
      try {
        await supabaseAdmin.from('tenant_users').upsert(
          {
            tenant_id: tenantId,
            user_id: authUserId,
            role: 'owner',
          },
          { onConflict: 'tenant_id,user_id' }
        );
      } catch (tuErr) {
        console.warn('Aviso ao vincular tenant_users:', tuErr);
      }

      try {
        await supabaseAdmin.from('profiles').upsert(
          {
            id: authUserId,
            email: cleanEmail,
            role: 'tenant_owner',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (profErr) {
        console.warn('Aviso ao atualizar profiles:', profErr);
      }
    }

    // 2. Atualiza a tabela tenants com o e-mail e as permissões de menu
    const updatePayload: any = {
      contact_email: cleanEmail,
    };
    if (permissions) {
      updatePayload.permissions = permissions;
    }

    const { error: tenantError } = await supabaseAdmin
      .from('tenants')
      .update(updatePayload)
      .eq('id', tenantId);

    if (tenantError) {
      return NextResponse.json({ error: `Erro Tenant: ${tenantError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Acesso gerado e salvo com sucesso!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
