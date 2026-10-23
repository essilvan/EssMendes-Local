import fs from 'fs';

console.log('====================================================');
console.log('🍰 TESTE DO SISTEMA DE TEMAS (CONFEITARIA & BOLOS)');
console.log('====================================================\n');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName} ${detail ? '(' + detail + ')' : ''}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? '- ' + detail + ')' : ''}`);
    totalFailed++;
  }
}

// 1. Configuração Centralizada de Temas (src/config/themes.ts)
const themesFile = fs.readFileSync('src/config/themes.ts', 'utf8');
assert(themesFile.includes('confeitaria:'), 'Tema confeitaria configurado em THEMES');
assert(themesFile.includes('#f43f5e'), 'Paleta inclui rosa doce (#f43f5e)');
assert(themesFile.includes('#fffdf9'), 'Paleta inclui fundo baunilha/creme suave (#fffdf9)');
assert(themesFile.includes('Cake') && themesFile.includes('Cookie') && themesFile.includes('Cherry') && themesFile.includes('Sparkles'), 'Ícones da Lucide (Cake, Cookie, Cherry, Sparkles) importados e configurados');
assert(themesFile.includes('isConfectioneryTheme'), 'Função auxiliar isConfectioneryTheme exportada');

// 2. Configuração de Temas do Tenant (src/config/tenant-themes.ts)
const tenantThemesFile = fs.readFileSync('src/config/tenant-themes.ts', 'utf8');
assert(tenantThemesFile.includes("'confeitaria'"), 'Tipo ThemeNiche inclui confeitaria');
assert(tenantThemesFile.includes('confeitaria:'), 'NICHE_THEMES.confeitaria definido');
assert(tenantThemesFile.includes('bg-[#fffdf9]'), 'Fundo suave de confeitaria (#fffdf9) configurado em tenant-themes.ts');
assert(tenantThemesFile.includes('text.includes(\'bolo\')') || tenantThemesFile.includes('text.includes(\'confeit\')'), 'Auto-detecção de palavras-chave de confeitaria configurada');

// 3. CSS e Microanimações (src/styles/globals.css)
const cssFile = fs.readFileSync('src/styles/globals.css', 'utf8');
assert(cssFile.includes('@keyframes sweet-float'), 'Keyframes sweet-float definidos');
assert(cssFile.includes('.animate-sweet-float'), 'Classe .animate-sweet-float definida');
assert(cssFile.includes('@keyframes sprinkle-fall'), 'Keyframes sprinkle-fall definidos');
assert(cssFile.includes('.animate-sprinkle-fall'), 'Classe .animate-sprinkle-fall definida');
assert(cssFile.includes('@keyframes sparkle-twinkle'), 'Keyframes sparkle-twinkle definidos');
assert(cssFile.includes('.animate-sparkle-twinkle'), 'Classe .animate-sparkle-twinkle definida');

// 4. Componente de Fundo Temático (src/components/public/ConfectioneryBackground.tsx)
const bgFile = fs.readFileSync('src/components/public/ConfectioneryBackground.tsx', 'utf8');
assert(bgFile.includes('SprinklesSvg'), 'ConfectioneryBackground possui SVG de confeitos/granulados');
assert(bgFile.includes('CakeSliceSvg'), 'ConfectioneryBackground possui SVG de fatia de bolo/torta');
assert(bgFile.includes('Cake') && bgFile.includes('Cookie') && bgFile.includes('Cherry') && bgFile.includes('Sparkles'), 'ConfectioneryBackground utiliza ícones Lucide temáticos');
assert(bgFile.includes('opacity-15') || bgFile.includes('opacity-20') || bgFile.includes('opacity-25'), 'ConfectioneryBackground respeita a faixa de opacidade suave (15% a 25%)');
assert(bgFile.includes('animate-sweet-float') && bgFile.includes('animate-sprinkle-fall'), 'ConfectioneryBackground aplica microanimações nos confeitos e doces');

// 5. Integração com o Painel Admin (src/components/admin/ProfileForm.tsx)
const profileFormFile = fs.readFileSync('src/components/admin/ProfileForm.tsx', 'utf8');
assert(profileFormFile.includes('id: "confeitaria"'), 'Opção Confeitaria & Bolos disponível em NICHE_OPTIONS');
assert(profileFormFile.includes('Rosa Doce / Confeitaria'), 'Preset de cor Rosa Doce disponível em BRAND_COLOR_PRESETS');
assert(profileFormFile.includes('nicheId === "confeitaria"'), 'Handler de troca de nicho auto-sugere cor primária de confeitaria');
assert(profileFormFile.includes('selectedNiche === "confeitaria"'), 'Banner interativo exclusivo exibido ao selecionar Confeitaria & Bolos');

// 6. Vitrine Pública e Componentes Públicos
const hubFile = fs.readFileSync('src/components/public/PublicTenantHub.tsx', 'utf8');
assert(hubFile.includes('isConfectionery'), 'PublicTenantHub detecta isConfectionery');
assert(hubFile.includes('ConfectioneryBackground'), 'PublicTenantHub renderiza ConfectioneryBackground');
assert(hubFile.includes('bg-[#fffdf9]'), 'PublicTenantHub aplica fundo claro baunilha para Confeitaria');

const heroSplitFile = fs.readFileSync('src/components/public/PublicHeroSplit.tsx', 'utf8');
assert(heroSplitFile.includes('isConfectionery'), 'PublicHeroSplit detecta isConfectionery');
assert(heroSplitFile.includes('Fazer Encomenda'), 'PublicHeroSplit renderiza CTA temático de encomenda');

const trustBarFile = fs.readFileSync('src/components/public/TrustMetricsBar.tsx', 'utf8');
assert(trustBarFile.includes('isConfectionery'), 'TrustMetricsBar possui diferenciais temáticos de confeitaria');

console.log('\n====================================================');
console.log(`📊 RESULTADO DOS TESTES DE CONFEITARIA: ${totalPassed} PASSOU | ${totalFailed} FALHOU`);
console.log('====================================================');

if (totalFailed > 0) process.exit(1);
