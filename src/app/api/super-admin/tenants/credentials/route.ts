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

    // 1. Tenta criar o usuário diretamente
    let authUserId: string | null = null;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { tenant_id: tenantId },
    });

    if (createError) {
      // Se o usuário já existir, busca ou atualiza a senha
      if (createError.message.toLowerCase().includes('already') || createError.status === 422) {
        // Busca na tabela auth.users se necessário, ou atualiza via update
        const { data: updateData, error: updateError } = await supabaseAdmin.rpc('get_user_id_by_email', { user_email: email });

        if (typeof updateData === 'string' && updateData) {
          authUserId = updateData;
          await supabaseAdmin.auth.admin.updateUserById(updateData, {
            password,
            user_metadata: { tenant_id: tenantId },
          });
        }

        // Se não tiver RPC, tenta atualizar por reset de credenciais ou prossegue
        console.warn('Usuário já existe no Auth, sincronizando dados...');
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
    }

    // 2. Atualiza a tabela tenants com o e-mail e as permissões de menu
    const updatePayload: any = {
      contact_email: email,
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
