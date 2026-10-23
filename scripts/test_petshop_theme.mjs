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
assert(themesFile.includes('Dog') && themesFile.includes('Cat') && themesFile.includes('Bone') && themesFile.includes('Footprints'), 'Ícones da Lucide (Dog, Cat, Bone, Footprints) importados e configurados');
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
assert(profileFormFile.includes('Dog') && profileFormFile.includes('Cat') && profileFormFile.includes('Bone') && profileFormFile.includes('Footprints'), 'Ícones da Lucide renderizados no preview do tema Pet Shop');

// 4. Teste da Vitrine Pública (PublicTenantHub & PublicHeroSplit)
const hubFile = fs.readFileSync('src/components/public/PublicTenantHub.tsx', 'utf8');
assert(hubFile.includes('isPetShop'), 'PublicTenantHub detecta isPetShop');
assert(hubFile.includes('bg-[#fffbf5]'), 'PublicTenantHub aplica fundo claro aconchegante para Pet Shop');
assert(hubFile.includes('animate-paw-float') || hubFile.includes('animate-paw-pulse'), 'PublicTenantHub renderiza patinhas decorativas com microanimação');

const heroSplitFile = fs.readFileSync('src/components/public/PublicHeroSplit.tsx', 'utf8');
assert(heroSplitFile.includes('isPetShop'), 'PublicHeroSplit detecta isPetShop');
assert(heroSplitFile.includes('animate-tail-wag'), 'PublicHeroSplit possui animação tail-wag');
assert(heroSplitFile.includes('Dog') && heroSplitFile.includes('Cat') && heroSplitFile.includes('Bone') && heroSplitFile.includes('Footprints'), 'PublicHeroSplit renderiza ícones Dog, Cat, Bone e Footprints');

console.log('\n====================================================');
console.log(`📊 RESULTADO DOS TESTES DE TEMA: ${totalPassed} PASSOU | ${totalFailed} FALHOU`);
console.log('====================================================');

if (totalFailed > 0) process.exit(1);
