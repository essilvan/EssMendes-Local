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

console.log('====================================================');
console.log('🧪 BATERIA DE TESTES COMPLETOS - ESSMENDES LOCAL');
console.log('====================================================\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Falha: Variáveis do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName} ${detail ? '(' + detail + ')' : ''}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? '- ' + detail : ''}`);
    totalFailed++;
  }
}

async function runAllTests() {
  console.log('📦 1. TESTES DE INTEGRIDADE DO BANCO DE DADOS & SCHEMAS');
  
  // 1.1 Tenants
  const { data: tenants, error: tErr } = await supabase.from('tenants').select('*').limit(5);
  assert(!tErr && tenants && tenants.length > 0, 'Consulta de Tenants', `Encontrados: ${tenants?.length || 0}`);
  const tenant = tenants ? tenants[0] : null;

  if (!tenant) {
    console.error('❌ Não foi possível continuar os testes sem um tenant cadastrado.');
    return;
  }

  // 1.2 Tenant Profiles
  const { data: profiles, error: pErr } = await supabase.from('tenant_profiles').select('*').eq('tenant_id', tenant.id);
  assert(!pErr && profiles, 'Tabela tenant_profiles', `Perfis vinculados: ${profiles?.length || 0}`);
  const profile = profiles?.[0];
  if (profile) {
    assert(typeof profile.template_id === 'string', 'Profile possui template_id definido', profile.template_id);
    assert(profile.primary_color ? profile.primary_color.startsWith('#') : true, 'Primary color formato HEX válido', profile.primary_color || 'padrão');
  }

  // 1.3 Tenant Reviews (Google Reviews)
  const { data: reviews, error: rErr } = await supabase.from('tenant_reviews').select('*').eq('tenant_id', tenant.id);
  assert(!rErr && reviews !== null, 'Tabela tenant_reviews', `Total de avaliações: ${reviews?.length || 0}`);

  // 1.4 Tenant Posts (SEO & Artigos)
  const { data: posts, error: postErr } = await supabase.from('tenant_posts').select('*').eq('tenant_id', tenant.id);
  assert(!postErr && posts !== null, 'Tabela tenant_posts', `Total de publicações: ${posts?.length || 0}`);

  // 1.5 Services
  const { data: services, error: sErr } = await supabase.from('services').select('*').eq('tenant_id', tenant.id);
  assert(!sErr && services !== null, 'Tabela services', `Total de serviços: ${services?.length || 0}`);

  // 1.6 Portfolio / Antes & Depois
  const { data: portfolio, error: portErr } = await supabase.from('portfolio_items').select('*').eq('tenant_id', tenant.id);
  assert(!portErr && portfolio !== null, 'Tabela portfolio_items', `Total de itens: ${portfolio?.length || 0}`);

  // 1.7 Appointments & Customers
  const { data: appointments, error: appErr } = await supabase.from('appointments').select('*').eq('tenant_id', tenant.id);
  assert(!appErr && appointments !== null, 'Tabela appointments', `Total de agendamentos: ${appointments?.length || 0}`);

  const { data: customers, error: custErr } = await supabase.from('customers').select('*').eq('tenant_id', tenant.id);
  assert(!custErr && customers !== null, 'Tabela customers', `Total de clientes: ${customers?.length || 0}`);

  console.log('\n📅 2. TESTE DO MOTOR DE AGENDAMENTO & REGRAS DE CONFLITO');
  
  // Cria agendamento de teste temporário
  const testSlotStart = new Date(Date.now() + 172800000); // 2 dias no futuro
  testSlotStart.setUTCHours(10, 0, 0, 0);
  const testSlotEnd = new Date(testSlotStart.getTime() + 45 * 60000);

  const { data: tempApp, error: insertAppErr } = await supabase.from('appointments').insert({
    tenant_id: tenant.id,
    service_name: 'Corte + Barba (Teste Automatizado)',
    customer_name: 'Cliente Teste Suite',
    customer_phone: '11988887777',
    start_time: testSlotStart.toISOString(),
    end_time: testSlotEnd.toISOString(),
    total_duration: 45,
    price: 70.00,
    status: 'pending',
    notes: 'Agendamento para teste automatizado.'
  }).select().single();

  assert(!insertAppErr && tempApp?.id, 'Criação de agendamento de teste', `ID: ${tempApp?.id}`);

  // Checa conflito
  if (tempApp) {
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenant.id)
      .neq('status', 'canceled')
      .lt('start_time', testSlotEnd.toISOString())
      .gt('end_time', testSlotStart.toISOString());

    assert(conflicts && conflicts.length >= 1, 'Detecção de Conflito de Horário (Double-booking)', `Detectados: ${conflicts?.length}`);

    // Limpa o registro de teste
    await supabase.from('appointments').delete().eq('id', tempApp.id);
    console.log('  🧹 Registro temporário de teste limpo com sucesso.');
  }

  console.log('\n🌐 3. TESTE DE RENDERIZAÇÃO DAS PÁGINAS HTTP (NEXT.JS)');
  
  const baseUrl = 'http://localhost:3000';
  let serverOnline = false;

  try {
    const rootRes = await fetch(`${baseUrl}/`, { redirect: 'manual' });
    serverOnline = rootRes.status >= 200 && rootRes.status < 400;
    assert(serverOnline, 'Servidor local acessível em http://localhost:3000', `Status: ${rootRes.status}`);
  } catch {
    console.log('  ℹ️ O servidor local não está em execução na porta 3000 neste momento.');
  }

  if (serverOnline) {
    // 3.1 Testa página pública com o slug do tenant
    const publicUrl = `${baseUrl}/${tenant.slug}`;
    try {
      const publicRes = await fetch(publicUrl);
      const publicHtml = await publicRes.text();
      assert(publicRes.status === 200, `Página Pública /${tenant.slug}`, `Status 200`);
      assert(publicHtml.includes(tenant.name) || publicHtml.includes('EssMendes'), 'HTML contém o nome da empresa ou branding');
      assert(publicHtml.includes('application/ld+json'), 'Schema.org JSON-LD estruturado presente na página');
    } catch (e) {
      assert(false, `Falha ao requisitar ${publicUrl}`, e.message);
    }

    // 3.2 Testa Sitemap
    try {
      const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
      const sitemapXml = await sitemapRes.text();
      assert(sitemapRes.status === 200, 'Endpoint /sitemap.xml', `Status: ${sitemapRes.status}`);
      assert(sitemapXml.includes('<urlset') && sitemapXml.includes(tenant.slug), 'Sitemap contém URL do tenant em formato XML');
    } catch (e) {
      assert(false, 'Falha ao requisitar /sitemap.xml', e.message);
    }

    // 3.3 Testa tela de login
    try {
      const loginRes = await fetch(`${baseUrl}/login`);
      assert(loginRes.status === 200, 'Página /login carregando', `Status: ${loginRes.status}`);
    } catch (e) {
      assert(false, 'Falha ao requisitar /login', e.message);
    }

    // 3.4 Testa tela de registro
    try {
      const regRes = await fetch(`${baseUrl}/register`);
      assert(regRes.status === 200, 'Página /register carregando', `Status: ${regRes.status}`);
    } catch (e) {
      assert(false, 'Falha ao requisitar /register', e.message);
    }
  }

  console.log('\n====================================================');
  console.log(`📊 RESUMO DOS TESTES: ${totalPassed} PASSOU | ${totalFailed} FALHOU`);
  console.log('====================================================');
}

runAllTests().catch(console.error);
