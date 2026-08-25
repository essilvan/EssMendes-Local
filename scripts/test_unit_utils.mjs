import { generatePalette, getContrastTextColor, isValidHexColor } from '../src/utils/color.js';
import { formatPhoneBR, sanitizePhone } from '../src/utils/phone.js';
import { slugify } from '../src/utils/slugify.js';

console.log('====================================================');
console.log('🧪 TESTES UNITÁRIOS DE UTILITÁRIOS & HELPERS');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name} ${details ? '- ' + details : ''}`);
    failed++;
  }
}

// 1. Color utils
assert(isValidHexColor('#630eb9'), 'Validação de HEX #630eb9 válida');
assert(isValidHexColor('#fff'), 'Validação de HEX #fff válida');
assert(!isValidHexColor('invalid-color'), 'Rejeição de HEX inválido');

const palette = generatePalette('#630eb9');
assert(palette['500'] === '#630eb9', 'Paleta 500 corresponde à cor base');
assert(palette['50'] && palette['900'], 'Geração de shades 50 a 900');

const darkTextContrast = getContrastTextColor('#ffffff');
assert(darkTextContrast === '#0f172a', 'Contraste para fundo branco retorna texto escuro');

const lightTextContrast = getContrastTextColor('#000000');
assert(lightTextContrast === '#ffffff', 'Contraste para fundo preto retorna texto claro');

// 2. Phone utils
const sanitized = sanitizePhone('(11) 99999-8888');
assert(sanitized === '11999998888', 'Sanitização de telefone', sanitized);

const formatted = formatPhoneBR('11999998888');
assert(formatted === '(11) 99999-8888', 'Formatação de telefone celular BR', formatted);

// 3. Slugify
const slug = slugify('Novoh de Novo Embreagens & Direção');
assert(slug.length > 0 && !slug.includes(' ') && !slug.includes('&'), 'Slugify remove caracteres especiais', slug);

console.log('\n====================================================');
console.log(`📊 RESULTADO DOS TESTES UNITÁRIOS: ${passed} PASSOU | ${failed} FALHOU`);
console.log('====================================================');
