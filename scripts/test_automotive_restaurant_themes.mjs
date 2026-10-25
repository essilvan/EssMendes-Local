import fs from 'fs';

console.log('====================================================');
console.log('🚗🍽️ TESTE DOS TEMAS AUTOMOTIVO & RESTAURANTES/GASTRONOMIA');
console.log('====================================================\n');

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

// -------------------------------------------------------------
// 1. Configuração Centralizada de Temas (src/config/themes.ts)
// -------------------------------------------------------------
const themesFile = fs.readFileSync('src/config/themes.ts', 'utf8');

// Automotivo
assert(themesFile.includes('automotive:'), 'Tema automotive configurado em THEMES');
assert(themesFile.includes('automotivo:'), 'Alias automotivo configurado em THEMES');
assert(themesFile.includes('#2563eb'), 'Automotive inclui azul automotivo (#2563eb)');
assert(themesFile.includes('#0f172a'), 'Automotive inclui fundo técnico escuro (#0f172a)');
assert(
  themesFile.includes('CarFront') &&
  themesFile.includes('Wrench') &&
  themesFile.includes('Gauge') &&
  themesFile.includes('Cog') &&
  themesFile.includes('Disc'),
  'Ícones Lucide automotivos (CarFront, Wrench, Gauge, Cog, Disc) importados e configurados'
);
assert(themesFile.includes('isAutomotiveTheme'), 'Função auxiliar isAutomotiveTheme exportada');

// Restaurante & Gastronomia
assert(themesFile.includes('restaurant:'), 'Tema restaurant configurado em THEMES');
assert(themesFile.includes('gastronomia:'), 'Alias gastronomia configurado em THEMES');
assert(themesFile.includes('#FAF7F2'), 'Restaurant inclui fundo linho/creme (#FAF7F2)');
assert(themesFile.includes('#dc2626'), 'Restaurant inclui vermelho brasa (#dc2626)');
assert(
  themesFile.includes('UtensilsCrossed') &&
  themesFile.includes('Flame') &&
  themesFile.includes('Wine') &&
  themesFile.includes('Soup') &&
  themesFile.includes('Coffee'),
  'Ícones Lucide gastronômicos (UtensilsCrossed, Flame, Wine, Soup, Coffee) importados e configurados'
);
assert(themesFile.includes('isRestaurantTheme'), 'Função auxiliar isRestaurantTheme exportada');

// ADMIN_THEME_OPTIONS
assert(
  themesFile.includes('Oficinas & Autopeças | Linhas Técnicas'),
  'Badge no admin de automotivo configurado em ADMIN_THEME_OPTIONS'
);
assert(
  themesFile.includes('Bares & Restaurantes | Apetite & Experiência'),
  'Badge no admin de restaurante configurado em ADMIN_THEME_OPTIONS'
);

// -------------------------------------------------------------
// 2. Configuração de Temas do Tenant (src/config/tenant-themes.ts)
// -------------------------------------------------------------
const tenantThemesFile = fs.readFileSync('src/config/tenant-themes.ts', 'utf8');
assert(tenantThemesFile.includes("'automotive'"), 'ThemeNiche inclui automotive');
assert(tenantThemesFile.includes("'restaurant'"), 'ThemeNiche inclui restaurant');
assert(tenantThemesFile.includes('automotive:'), 'NICHE_THEMES.automotive definido');
assert(tenantThemesFile.includes('restaurant:'), 'NICHE_THEMES.restaurant definido');
assert(tenantThemesFile.includes('bg-[#0f172a]'), 'Fundo automotivo (#0f172a) configurado em tenant-themes.ts');
assert(tenantThemesFile.includes('bg-[#FAF7F2]'), 'Fundo linho/creme (#FAF7F2) configurado em tenant-themes.ts');
assert(tenantThemesFile.includes('text.includes(\'auto\')'), 'Auto-detecção de palavras-chave automotivas');
assert(tenantThemesFile.includes('text.includes(\'restauran\')'), 'Auto-detecção de palavras-chave de restaurante');

// -------------------------------------------------------------
// 3. CSS e Microanimações (src/styles/globals.css)
// -------------------------------------------------------------
const cssFile = fs.readFileSync('src/styles/globals.css', 'utf8');
assert(cssFile.includes('@keyframes gear-spin'), 'Keyframes gear-spin definidos');
assert(cssFile.includes('.animate-gear-spin'), 'Classe .animate-gear-spin definida');
assert(cssFile.includes('@keyframes wrench-tilt'), 'Keyframes wrench-tilt definidos');
assert(cssFile.includes('.animate-wrench-tilt'), 'Classe .animate-wrench-tilt definida');
assert(cssFile.includes('@keyframes gauge-needle'), 'Keyframes gauge-needle definidos');
assert(cssFile.includes('.animate-gauge-needle'), 'Classe .animate-gauge-needle definida');
assert(cssFile.includes('@keyframes disc-spin'), 'Keyframes disc-spin definidos');
assert(cssFile.includes('.animate-disc-spin'), 'Classe .animate-disc-spin definida');

assert(cssFile.includes('@keyframes flame-flicker'), 'Keyframes flame-flicker definidos');
assert(cssFile.includes('.animate-flame-flicker'), 'Classe .animate-flame-flicker definida');
assert(cssFile.includes('@keyframes culinary-float'), 'Keyframes culinary-float definidos');
assert(cssFile.includes('.animate-culinary-float'), 'Classe .animate-culinary-float definida');
assert(cssFile.includes('@keyframes ember-rise'), 'Keyframes ember-rise definidos');
assert(cssFile.includes('.animate-ember-rise'), 'Classe .animate-ember-rise definida');

// -------------------------------------------------------------
// 4. Componentes Decorativos de Fundo
// -------------------------------------------------------------
const autoBgFile = fs.readFileSync('src/components/public/AutomotiveBackground.tsx', 'utf8');
assert(autoBgFile.includes('GearSvg'), 'AutomotiveBackground possui SVG de engrenagens');
assert(autoBgFile.includes('BrakeDiscSvg'), 'AutomotiveBackground possui SVG de disco de freio');
assert(
  autoBgFile.includes('CarFront') &&
  autoBgFile.includes('Wrench') &&
  autoBgFile.includes('Gauge') &&
  autoBgFile.includes('Cog') &&
  autoBgFile.includes('Disc'),
  'AutomotiveBackground possui os 5 ícones Lucide automotivos'
);
assert(
  autoBgFile.includes('opacity-15') || autoBgFile.includes('opacity-20'),
  'AutomotiveBackground aplica opacidade técnica suave (15-20%)'
);
assert(
  autoBgFile.includes('animate-gear-spin') && autoBgFile.includes('animate-wrench-tilt'),
  'AutomotiveBackground aplica microanimações nas engrenagens e ferramentas'
);

const restBgFile = fs.readFileSync('src/components/public/RestaurantBackground.tsx', 'utf8');
assert(restBgFile.includes('CulinarySparkSvg'), 'RestaurantBackground possui SVG de faíscas gastronômicas');
assert(restBgFile.includes('ClochePlateSvg'), 'RestaurantBackground possui SVG de prato/cloche');
assert(
  restBgFile.includes('UtensilsCrossed') &&
  restBgFile.includes('Flame') &&
  restBgFile.includes('Wine') &&
  restBgFile.includes('Soup') &&
  restBgFile.includes('Coffee'),
  'RestaurantBackground possui os 5 ícones Lucide gastronômicos'
);
assert(
  restBgFile.includes('opacity-15') || restBgFile.includes('opacity-20'),
  'RestaurantBackground aplica opacidade suave (15-20%)'
);
assert(
  restBgFile.includes('animate-flame-flicker') && restBgFile.includes('animate-culinary-float'),
  'RestaurantBackground aplica microanimações gastronômicas'
);

// -------------------------------------------------------------
// 5. Integração com o Painel Admin (src/components/admin/ProfileForm.tsx)
// -------------------------------------------------------------
const profileFormFile = fs.readFileSync('src/components/admin/ProfileForm.tsx', 'utf8');
assert(profileFormFile.includes('id: "automotive"'), 'Opção Automotivo disponível em NICHE_OPTIONS');
assert(profileFormFile.includes('id: "restaurant"'), 'Opção Restaurante disponível em NICHE_OPTIONS');
assert(
  profileFormFile.includes('Oficinas & Autopeças | Linhas Técnicas'),
  'Badge de Automotivo exibido nas opções de nicho do admin'
);
assert(
  profileFormFile.includes('Bares & Restaurantes | Apetite & Experiência'),
  'Badge de Restaurante exibido nas opções de nicho do admin'
);
assert(profileFormFile.includes('Azul Automotivo'), 'Preset Azul Automotivo disponível em BRAND_COLOR_PRESETS');
assert(profileFormFile.includes('Vermelho Brasa'), 'Preset Vermelho Brasa disponível em BRAND_COLOR_PRESETS');
assert(
  profileFormFile.includes('selectedNiche === "automotive"') &&
  profileFormFile.includes('selectedNiche === "restaurant"'),
  'Banners interativos com animações renderizados ao selecionar os nichos automotivo e restaurante'
);

// -------------------------------------------------------------
// 6. Vitrine Pública (PublicTenantHub, TrustMetricsBar, PublicHeroSplit, PublicHero)
// -------------------------------------------------------------
const hubFile = fs.readFileSync('src/components/public/PublicTenantHub.tsx', 'utf8');
assert(hubFile.includes('isAutomotive'), 'PublicTenantHub detecta isAutomotive');
assert(hubFile.includes('isRestaurant'), 'PublicTenantHub detecta isRestaurant');
assert(hubFile.includes('AutomotiveBackground'), 'PublicTenantHub renderiza AutomotiveBackground');
assert(hubFile.includes('RestaurantBackground'), 'PublicTenantHub renderiza RestaurantBackground');
assert(hubFile.includes('bg-[#0f172a]'), 'PublicTenantHub aplica fundo automotivo (#0f172a)');
assert(hubFile.includes('bg-[#FAF7F2]'), 'PublicTenantHub aplica fundo linho restaurante (#FAF7F2)');

const trustBarFile = fs.readFileSync('src/components/public/TrustMetricsBar.tsx', 'utf8');
assert(trustBarFile.includes('isAutomotive'), 'TrustMetricsBar possui suporte a automotivo');
assert(trustBarFile.includes('isRestaurant'), 'TrustMetricsBar possui suporte a restaurante');

const heroSplitFile = fs.readFileSync('src/components/public/PublicHeroSplit.tsx', 'utf8');
assert(heroSplitFile.includes('isAutomotive'), 'PublicHeroSplit possui suporte a automotivo');
assert(heroSplitFile.includes('isRestaurant'), 'PublicHeroSplit possui suporte a restaurante');

const heroFile = fs.readFileSync('src/components/public/PublicHero.tsx', 'utf8');
assert(heroFile.includes('isAutomotive'), 'PublicHero possui suporte a automotivo');
assert(heroFile.includes('isRestaurant'), 'PublicHero possui suporte a restaurante');

console.log('\n====================================================');
console.log(`📊 RESULTADO DOS TESTES: ${totalPassed} PASSOU | ${totalFailed} FALHOU`);
console.log('====================================================');

if (totalFailed > 0) process.exit(1);
