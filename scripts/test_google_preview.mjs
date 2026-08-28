import { formatBrazilianPhone } from '../src/utils/phone.ts';

console.log("====================================================");
console.log("🧪 TESTES DE FORMATAÇÃO E PREVIEW GOOGLE PLACES");
console.log("====================================================");

let passCount = 0;
let failCount = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    failCount++;
  }
}

// 1. Testes de formatação de telefone
assert(
  formatBrazilianPhone("+55 11 98765-4321") === "(11) 98765-4321",
  "Formata celular com DDI 55 e espaços para (11) 98765-4321"
);

assert(
  formatBrazilianPhone("5511999998888") === "(11) 99999-8888",
  "Formata dígitos corridos 5511999998888 para (11) 99999-8888"
);

assert(
  formatBrazilianPhone("1133334444") === "(11) 3333-4444",
  "Formata telefone fixo 1133334444 para (11) 3333-4444"
);

assert(
  formatBrazilianPhone("(19) 98123-4567") === "(19) 98123-4567",
  "Mantém formato já correto (19) 98123-4567"
);

assert(
  formatBrazilianPhone("") === "",
  "Trata string vazia sem erros"
);

console.log("====================================================");
console.log(`📊 RESULTADO: ${passCount} PASSOU | ${failCount} FALHOU`);
console.log("====================================================");

if (failCount > 0) process.exit(1);
process.exit(0);
