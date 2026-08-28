// Testes de Lógica do Módulo de Gestão Híbrida (Super Admin + Tenant Owner)

function checkIsSuperAdmin(user, role) {
  if (!user) return false;
  if (role === "super_admin") return true;
  if (
    user.user_metadata?.role === "super_admin" ||
    user.app_metadata?.role === "super_admin"
  ) {
    return true;
  }

  const envAdmins = (
    process.env.SUPER_ADMIN_EMAILS ||
    process.env.SUPER_ADMIN_EMAIL ||
    "admin@essmendes.com,superadmin@essmendes.com,contato@essmendes.com.br"
  )
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (user.email && envAdmins.includes(user.email.toLowerCase())) {
    return true;
  }

  return false;
}

function extractNeighborhoodAndCity(rawAddress) {
  if (!rawAddress) return "";
  const parts = rawAddress.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    const neighborhood = parts[1].replace(/^\d+\s*-\s*/, "").trim();
    const city = parts[2].split("-")[0].trim();
    if (neighborhood && city && neighborhood !== city) {
      return `${neighborhood}, ${city}`;
    }
    return city || neighborhood;
  }
  return parts[0] || "";
}

console.log("====================================================");
console.log("🧪 TESTES DO MÓDULO DE GESTÃO HÍBRIDA & SUPER ADMIN");
console.log("====================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, name, detail = "") {
  if (condition) {
    console.log(`  ✅ [PASS] ${name} ${detail ? "(" + detail + ")" : ""}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name} ${detail ? "- " + detail : ""}`);
    failed++;
  }
}

// 1. Validação de Regras de Super Admin vs Tenant Owner
console.log("👑 1. TESTES DE IDENTIFICAÇÃO DE PAPÉIS (RBAC)");

const superAdminUser = {
  id: "user-1",
  email: "admin@essmendes.com",
  user_metadata: { role: "super_admin" },
};
assert(
  checkIsSuperAdmin(superAdminUser, "super_admin") === true,
  "Super admin com metadata e role explícito"
);

const superAdminByEmail = {
  id: "user-env",
  email: "superadmin@essmendes.com",
  user_metadata: {},
};
assert(
  checkIsSuperAdmin(superAdminByEmail, "owner") === true,
  "Super admin reconhecido por e-mail administrativo"
);

const tenantOwnerUser = {
  id: "user-2",
  email: "lojista@barbearia.com",
  user_metadata: { role: "tenant_owner" },
};
assert(
  checkIsSuperAdmin(tenantOwnerUser, "owner") === false,
  "Tenant owner/lojista comum bloqueado de permissões master"
);

const staffUser = {
  id: "user-3",
  email: "funcionario@barbearia.com",
  user_metadata: {},
};
assert(
  checkIsSuperAdmin(staffUser, "staff") === false,
  "Staff comum bloqueado de permissões master"
);

// 2. Extração de Cidade e Bairro para Listagem no Master
console.log("\n📍 2. TESTES DE PARSER DE LOCALIZAÇÃO DO TENANT");
const addr1 = "Av. Paulista, Bela Vista, São Paulo - SP";
const city1 = extractNeighborhoodAndCity(addr1);
assert(city1.includes("São Paulo") || city1.includes("Bela Vista"), "Extração de endereço completo", city1);

const addr2 = "Rua Quinze de Novembro, Centro, Curitiba - PR";
const city2 = extractNeighborhoodAndCity(addr2);
assert(city2.includes("Curitiba"), "Extração de endereço simples", city2);

console.log("\n====================================================");
console.log(`📊 RESUMO: ${passed} PASSOU | ${failed} FALHOU`);
console.log("====================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
