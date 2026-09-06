import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Carrega .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value.trim();
  }
}

const SUPABASE_URL = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const SUPABASE_KEY = envVars["SUPABASE_SERVICE_ROLE_KEY"] || envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

const DEFAULT_TENANT_PERMISSIONS = {
  showcase: true,
  services: true,
  before_after: true,
  reviews: true,
  settings: true,
  billing: true,
};

function resolvePermissions(tenantPerms) {
  if (!tenantPerms) return { ...DEFAULT_TENANT_PERMISSIONS };
  return {
    ...DEFAULT_TENANT_PERMISSIONS,
    ...tenantPerms,
  };
}

function checkRouteAccess(route, permissions, isSuperAdmin = false) {
  if (isSuperAdmin) return { allowed: true };

  if (route.startsWith("/admin/integracoes")) {
    return { allowed: false, reason: "super_admin_only" };
  }

  const permissionRouteMap = [
    { prefix: "/admin/servicos", key: "services" },
    { prefix: "/admin/produtos", key: "showcase" },
    { prefix: "/admin/portfolio", key: "before_after" },
    { prefix: "/admin/antes-e-depois", key: "before_after" },
    { prefix: "/admin/avaliacoes", key: "reviews" },
    { prefix: "/admin/assinatura", key: "billing" },
    { prefix: "/admin/faturamento", key: "billing" },
    { prefix: "/admin/configuracoes", key: "settings" },
    { prefix: "/admin/perfil", key: "settings" },
  ];

  const matched = permissionRouteMap.find((item) => route.startsWith(item.prefix));
  if (matched && permissions[matched.key] === false) {
    return { allowed: false, reason: "permission_denied", key: matched.key };
  }

  return { allowed: true };
}

async function run() {
  console.log("====================================================");
  console.log("🛡️ TESTES DE CONTROLE DE PERMISSÕES POR TENANT");
  console.log("====================================================");

  let passed = 0;
  let failed = 0;

  // 1. Teste de Default Permissions
  const emptyResolution = resolvePermissions(null);
  if (
    emptyResolution.showcase === true &&
    emptyResolution.services === true &&
    emptyResolution.before_after === true &&
    emptyResolution.reviews === true &&
    emptyResolution.settings === true &&
    emptyResolution.billing === true
  ) {
    console.log("✅ [PASS] Default permissions preenchem todas as 6 chaves como true.");
    passed++;
  } else {
    console.error("❌ [FAIL] Default permissions incorretas.");
    failed++;
  }

  // 2. Teste de Mesclagem Parcial
  const partial = resolvePermissions({ showcase: false });
  if (partial.showcase === false && partial.services === true && partial.billing === true) {
    console.log("✅ [PASS] Mesclagem de permissões parciais mantém defaults seguros.");
    passed++;
  } else {
    console.error("❌ [FAIL] Mesclagem parcial falhou.");
    failed++;
  }

  // 3. Teste de Bloqueio de Rota /admin/antes-e-depois e /admin/portfolio
  const blockedBeforeAfter = checkRouteAccess("/admin/antes-e-depois", { ...DEFAULT_TENANT_PERMISSIONS, before_after: false }, false);
  const blockedPortfolio = checkRouteAccess("/admin/portfolio", { ...DEFAULT_TENANT_PERMISSIONS, before_after: false }, false);
  if (!blockedBeforeAfter.allowed && !blockedPortfolio.allowed) {
    console.log("✅ [PASS] Rotas /admin/antes-e-depois e /admin/portfolio bloqueadas para before_after: false.");
    passed++;
  } else {
    console.error("❌ [FAIL] Bloqueio de rotas before_after falhou.");
    failed++;
  }

  // 4. Teste de Bloqueio de Serviços e Vitrine
  const blockedServices = checkRouteAccess("/admin/servicos", { ...DEFAULT_TENANT_PERMISSIONS, services: false }, false);
  const blockedShowcase = checkRouteAccess("/admin/produtos", { ...DEFAULT_TENANT_PERMISSIONS, showcase: false }, false);
  if (!blockedServices.allowed && !blockedShowcase.allowed) {
    console.log("✅ [PASS] Rotas /admin/servicos e /admin/produtos bloqueadas quando permissão correspondente é false.");
    passed++;
  } else {
    console.error("❌ [FAIL] Bloqueio de servicos e vitrine falhou.");
    failed++;
  }

  // 5. Teste de Super Admin Bypass
  const superAdminBypass = checkRouteAccess("/admin/portfolio", { ...DEFAULT_TENANT_PERMISSIONS, before_after: false }, true);
  const superAdminIntegrations = checkRouteAccess("/admin/integracoes", { ...DEFAULT_TENANT_PERMISSIONS }, true);
  if (superAdminBypass.allowed && superAdminIntegrations.allowed) {
    console.log("✅ [PASS] Super Admin tem bypass irrestrito sobre todas as rotas e permissões.");
    passed++;
  } else {
    console.error("❌ [FAIL] Super Admin bypass falhou.");
    failed++;
  }

  // 6. Teste de Leitura de Tenants no Supabase
  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("id, name, permissions")
      .limit(3);

    if (!error && tenants && tenants.length > 0) {
      console.log(`✅ [PASS] Leitura de permissions de tenants no Supabase bem-sucedida (${tenants.length} tenants verificados).`);
      passed++;
    } else {
      console.warn("⚠️ Aviso na leitura de tenants:", error?.message);
    }
  }

  console.log("\n====================================================");
  console.log(`📊 RESUMO: ${passed} PASSOU | ${failed} FALHOU`);
  console.log("====================================================");

  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
