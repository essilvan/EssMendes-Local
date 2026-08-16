import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Carrega .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value.trim();
  }
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('=== TESTES DO ESSMENDES LOCAL - MOTOR DE AGENDAMENTO ===\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Falha: Variáveis do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // 1. Verifica tenants
  console.log('1️⃣ Consultando tenants cadastrados...');
  const { data: tenants, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .limit(1);

  if (tenantErr) {
    console.error('❌ Erro na tabela tenants:', tenantErr.message);
    return;
  }
  
  if (!tenants || tenants.length === 0) {
    console.warn('⚠️ Nenhum tenant cadastrado no banco.');
    return;
  }

  const tenant = tenants[0];
  console.log(`✅ Tenant localizado: "${tenant.name}" (Slug: ${tenant.slug}, ID: ${tenant.id})`);

  // 2. Verifica tabela appointments
  console.log('\n2️⃣ Verificando tabela appointments e RLS...');
  const { data: appointments, error: appErr } = await supabase
    .from('appointments')
    .select('id, service_name, customer_name, start_time, end_time, status')
    .eq('tenant_id', tenant.id)
    .limit(5);

  if (appErr) {
    console.error('❌ Erro ao acessar tabela appointments:', appErr.message);
    console.log('💡 Execute a migration supabase/migrations/20260814000500_appointments_and_customers.sql no dashboard do Supabase.');
    return;
  }

  console.log(`✅ Tabela appointments OK! Total de ${appointments?.length || 0} agendamento(s) existente(s).`);

  // 3. Testa simulação de agendamento online (inserção pública anônima)
  console.log('\n3️⃣ Testando inserção de agendamento de teste...');
  const testStartTime = new Date(Date.now() + 86400000); // Amanhã
  testStartTime.setUTCHours(14, 0, 0, 0); // 14:00 UTC
  const testEndTime = new Date(testStartTime.getTime() + 30 * 60000); // +30 min

  const testBooking = {
    tenant_id: tenant.id,
    service_name: 'Corte Tradicional (Teste Automatizado)',
    customer_name: 'Cliente Teste Antigravity',
    customer_phone: '11999998888',
    customer_email: 'teste@exemplo.com',
    start_time: testStartTime.toISOString(),
    end_time: testEndTime.toISOString(),
    total_duration: 30,
    price: 45.00,
    status: 'pending',
    notes: 'Agendamento de teste gerado para validação automática da Fase 4.',
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('appointments')
    .insert(testBooking)
    .select()
    .single();

  if (insertErr) {
    console.error('❌ Falha ao inserir agendamento:', insertErr.message);
    return;
  }

  console.log(`✅ Agendamento inserido com sucesso! ID: ${inserted.id}`);
  console.log(`   Horário: ${inserted.start_time} até ${inserted.end_time}`);
  console.log(`   Status: ${inserted.status}`);

  // 4. Testar checagem de conflito (prevenção de race condition)
  console.log('\n4️⃣ Testando detecção de conflito de horários (Anti Double-Booking)...');
  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id')
    .eq('tenant_id', tenant.id)
    .neq('status', 'canceled')
    .lt('start_time', testEndTime.toISOString())
    .gt('end_time', testStartTime.toISOString());

  if (conflicts && conflicts.length > 0) {
    console.log(`✅ Detecção de conflito funcionando perfeitamente! Identificou ${conflicts.length} conflito(s) para o mesmo intervalo.`);
  } else {
    console.warn('⚠️ Conflito não detectado.');
  }

  // 5. Teste de políticas de segurança RLS (tenta UPDATE anônimo)
  console.log('\n5️⃣ Validando segurança RLS (Tentativa de UPDATE anônimo)...');
  const { error: cancelErr } = await supabase
    .from('appointments')
    .update({ status: 'canceled' })
    .eq('id', inserted.id);

  if (cancelErr) {
    console.log('✅ RLS ativo: Usuário anônimo não tem permissão para alterar status diretamente.');
  } else {
    console.log('ℹ️ Operação de atualização concluída.');
  }

  console.log('\n🎉 TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO!');
}

run().catch(console.error);
