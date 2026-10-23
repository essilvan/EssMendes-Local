import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('====================================================');
console.log('🧪 TESTE DO SISTEMA DE TEMAS POR NICHO (PET SHOP)');
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

// 1. Teste de Configuração Centralizada de Temas
const themesFile = fs.readFileSync('src/config/themes.ts', 'utf8');
assert(themesFile.includes('export const THEMES'), 'Configuração centralizada THEMES existe em src/config/themes.ts');
assert(themesFile.includes('petshop:'), 'Tema petshop definido em THEMES');
assert(themesFile.includes('#ea580c') || themesFile.includes('#f59e0b'), 'Paleta do Pet Shop inclui tons quentes/âmbar');
assert(themesFile.includes('#fffbf5'), 'Paleta do Pet Shop inclui fundo claro aconchegante (#fffbf5)');
assert(themesFile.includes('Dog') && themesFile.includes('Cat') && themesFile.includes('Bone') && themesFile.includes('PawPrint'), 'Ícones da Lucide (Dog, Cat, Bone, PawPrint) importados e configurados');
assert(themesFile.includes('animate-tail-wag'), 'Microanimação de balanço de rabo configurada');
assert(themesFile.includes('animate-paw-float') || themesFile.includes('animate-paw-pulse'), 'Microanimação de patinhas configurada');

// 2. Teste de CSS e Microanimações
const cssFile = fs.readFileSync('src/styles/globals.css', 'utf8');
assert(cssFile.includes('@keyframes tail-wag'), 'Keyframes tail-wag definidos em globals.css');
assert(cssFile.includes('.animate-tail-wag'), 'Classe .animate-tail-wag definida em globals.css');
assert(cssFile.includes('@keyframes paw-float') || cssFile.includes('@keyframes paw-pulse'), 'Keyframes de patinhas definidos em globals.css');

// 3. Teste do Formulário Admin (ProfileForm)
const profileFormFile = fs.readFileSync('src/components/admin/ProfileForm.tsx', 'utf8');
assert(profileFormFile.includes('id: "petshop"'), 'Opção de nicho petshop disponível no ProfileForm');
assert(profileFormFile.includes('id: "default"'), 'Opção de nicho default disponível no ProfileForm');
assert(profileFormFile.includes('handleNicheChange'), 'Handler de seleção de nicho configurado no ProfileForm');
assert(profileFormFile.includes('Dog') && profileFormFile.includes('Cat') && profileFormFile.includes('Bone') && profileFormFile.includes('PawPrint'), 'Ícones da Lucide renderizados no preview do tema Pet Shop');

// 4. Teste da Vitrine Pública (PublicTenantHub & PetShopBackground)
const hubFile = fs.readFileSync('src/components/public/PublicTenantHub.tsx', 'utf8');
assert(hubFile.includes('isPetShop'), 'PublicTenantHub detecta isPetShop');
assert(hubFile.includes('bg-[#fffbf5]'), 'PublicTenantHub aplica fundo claro aconchegante para Pet Shop');
assert(hubFile.includes('PetShopBackground'), 'PublicTenantHub renderiza o componente temático PetShopBackground');

const bgFile = fs.readFileSync('src/components/public/PetShopBackground.tsx', 'utf8');
assert(bgFile.includes('PetPawSvg'), 'PetShopBackground possui SVG autêntico de patinha de pet');
assert(bgFile.includes('PawPrint'), 'PetShopBackground utiliza PawPrint da Lucide');
assert(bgFile.includes('Bone') && bgFile.includes('Dog') && bgFile.includes('Cat'), 'PetShopBackground possui variedade temática com Bone, Dog e Cat');
assert(bgFile.includes('opacity-15') || bgFile.includes('opacity-20') || bgFile.includes('opacity-25'), 'PetShopBackground utiliza opacidades suaves (15% a 25%)');

const heroSplitFile = fs.readFileSync('src/components/public/PublicHeroSplit.tsx', 'utf8');
assert(heroSplitFile.includes('isPetShop'), 'PublicHeroSplit detecta isPetShop');
assert(heroSplitFile.includes('animate-tail-wag'), 'PublicHeroSplit possui animação tail-wag');
assert(heroSplitFile.includes('Dog') && heroSplitFile.includes('Cat') && heroSplitFile.includes('Bone') && heroSplitFile.includes('PawPrint'), 'PublicHeroSplit renderiza ícones Dog, Cat, Bone e PawPrint');

console.log('\n====================================================');
console.log(`📊 RESULTADO DOS TESTES DE TEMA: ${totalPassed} PASSOU | ${totalFailed} FALHOU`);
console.log('====================================================');

if (totalFailed > 0) process.exit(1);
