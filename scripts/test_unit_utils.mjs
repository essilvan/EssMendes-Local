// Testes unitários para utilitários puros (Color, Phone, Slugify)

function isValidHexColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function sanitizePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits;
}

function formatPhoneBR(digits) {
  const clean = digits.replace(/\D/g, "");
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return clean;
}

function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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

// 2. Phone utils
const sanitized = sanitizePhone('(11) 99999-8888');
assert(sanitized === '11999998888', 'Sanitização de telefone', sanitized);

const formatted = formatPhoneBR('11999998888');
assert(formatted === '(11) 99999-8888', 'Formatação de telefone celular BR', formatted);

// 3. Slugify
const slug = slugify('Novoh de Novo Embreagens & Direção');
assert(slug.length > 0 && !slug.includes(' ') && !slug.includes('&'), 'Slugify remove caracteres especiais', slug);

// 4. Canvas Composer File Naming
function sanitizeFileName(businessName) {
  const sanitized = (businessName || "empresa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `antes-e-depois-${sanitized || "trabalho"}.png`;
}

const fileName = sanitizeFileName('Clínica Estética & Spa São Paulo');
assert(fileName === 'antes-e-depois-clinica-estetica-spa-sao-paulo.png', 'Geração de nome de arquivo PNG para Antes e Depois', fileName);

console.log('\n====================================================');
console.log(`📊 RESULTADO DOS TESTES UNITÁRIOS: ${passed} PASSOU | ${failed} FALHOU`);
console.log('====================================================');
