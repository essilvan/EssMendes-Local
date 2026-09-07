import assert from "node:assert/strict";

console.log("====================================================");
console.log("📱 TESTES DE NAVEGAÇÃO ADMIN (DESKTOP & MOBILE)");
console.log("====================================================\n");

// Importação dinâmica do arquivo compilado ou leitura estática
import fs from "node:fs";

const navContent = fs.readFileSync("src/components/admin/admin-navigation.ts", "utf8");

// 1. Validar os 11 módulos oficiais definidos no arquivo
const expectedModules = [
  { name: "Dashboard", href: "/admin", key: "dashboard" },
  { name: "Agendamentos", href: "/admin/agendamentos", key: "appointments" },
  { name: "Serviços", href: "/admin/servicos", key: "services" },
  { name: "Vitrine Produtos", href: "/admin/produtos", key: "products" },
  { name: "Antes & Depois", href: "/admin/antes-depois", key: "before_after" },
  { name: "Avaliações Google", href: "/admin/avaliacoes", key: "reviews" },
  { name: "Posts & SEO", href: "/admin/posts-seo", key: "posts_seo" },
  { name: "Resultados & Relatórios", href: "/admin/relatorios", key: "reports" },
  { name: "Assinatura Pro", href: "/admin/assinatura", key: "subscription_pro" },
  { name: "Faturamento & Planos", href: "/admin/faturamento", key: "billing_plans" },
  { name: "Configurações", href: "/admin/configuracoes", key: "settings" },
];

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

test("Verificação dos 11 módulos oficiais no código fonte", () => {
  for (const mod of expectedModules) {
    assert.ok(
      navContent.includes(`name: "${mod.name}"`),
      `Módulo ${mod.name} não encontrado`
    );
    assert.ok(
      navContent.includes(`href: "${mod.href}"`),
      `Href ${mod.href} do módulo ${mod.name} não encontrado`
    );
    assert.ok(
      navContent.includes(`key: "${mod.key}"`),
      `Key ${mod.key} do módulo ${mod.name} não encontrado`
    );
  }
});

test("Sidebar e MobileNav consomem a mesma fonte de módulos (admin-navigation)", () => {
  const sidebarContent = fs.readFileSync("src/components/admin/AdminSidebar.tsx", "utf8");
  const mobileNavContent = fs.readFileSync("src/components/admin/AdminMobileNav.tsx", "utf8");

  assert.ok(
    sidebarContent.includes('from "./admin-navigation"'),
    "AdminSidebar não importa admin-navigation"
  );
  assert.ok(
    mobileNavContent.includes('from "./admin-navigation"'),
    "AdminMobileNav não importa admin-navigation"
  );
  assert.ok(
    sidebarContent.includes("getFilteredNavItems"),
    "AdminSidebar não utiliza getFilteredNavItems"
  );
  assert.ok(
    mobileNavContent.includes("getFilteredNavItems"),
    "AdminMobileNav não utiliza getFilteredNavItems"
  );
});

test("Eliminação do menu horizontal antigo no layout", () => {
  const layoutContent = fs.readFileSync("src/app/(admin)/layout.tsx", "utf8");

  // Não deve conter links soltos antigos
  assert.ok(!layoutContent.includes('>Início<'), "Menu antigo vazando 'Início'");
  assert.ok(!layoutContent.includes('>Agenda<'), "Menu antigo vazando 'Agenda'");
  assert.ok(!layoutContent.includes('>Vitrine<'), "Menu antigo vazando 'Vitrine'");
  assert.ok(
    layoutContent.includes("<AdminMobileNav"),
    "Layout não renderiza AdminMobileNav"
  );
});

test("Presença das rotas de alias para compatibilidade instantânea", () => {
  assert.ok(fs.existsSync("src/app/(admin)/admin/antes-depois/page.tsx"), "Rota /admin/antes-depois não existe");
  assert.ok(fs.existsSync("src/app/(admin)/admin/posts-seo/page.tsx"), "Rota /admin/posts-seo não existe");
  assert.ok(fs.existsSync("src/app/(admin)/admin/relatorios/page.tsx"), "Rota /admin/relatorios não existe");
  assert.ok(fs.existsSync("src/app/(admin)/admin/page.tsx"), "Rota /admin não existe");
});

test("Botão Sair / Desconectar presente na gaveta mobile", () => {
  const mobileNavContent = fs.readFileSync("src/components/admin/AdminMobileNav.tsx", "utf8");
  assert.ok(
    mobileNavContent.includes("Sair / Desconectar"),
    "MobileNav não possui botão 'Sair / Desconectar'"
  );
  assert.ok(
    mobileNavContent.includes("logoutAction"),
    "MobileNav não executa logoutAction"
  );
});

console.log("\n====================================================");
console.log(`📊 RESULTADO: ${passed} PASSOU | ${failed} FALHOU`);
console.log("====================================================");

if (failed > 0) process.exit(1);
