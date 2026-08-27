import { calculateLocalPresenceScore } from "../src/utils/presence-score-engine.ts";

console.log("====================================================");
console.log("🧪 TESTE UNITÁRIO: MOTOR ESSMENDES LOCAL SCORE");
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

// 1. Cenário: Perfil Completo
const completeProfile = {
  tenant: {
    id: "tenant-1",
    name: "Auto Center Taguatinga",
    slug: "auto-center-taguatinga",
    google_rating: 4.9,
    google_reviews_count: 35,
  },
  profile: {
    name: "Auto Center Taguatinga",
    business_category: "Oficina Mecânica",
    phone_whatsapp: "61988887777",
    phone: "61988887777",
    address: "QNA 15 Lote 3, Taguatinga Norte, DF",
    description: "Referência em troca de óleo, freios e alinhamento computadorizado.",
    editorial_summary: "Referência em troca de óleo, freios e alinhamento computadorizado na região de Taguatinga há mais de 10 anos.",
    logo_url: "https://example.com/logo.jpg",
    opening_hours_json: ["Segunda a Sexta: 08:00 às 18:00", "Sábado: 08:00 às 12:00"],
    place_photos: ["https://example.com/p1.jpg", "https://example.com/p2.jpg", "https://example.com/p3.jpg"],
    latitude: -15.83,
    longitude: -48.05,
    google_rating: 4.9,
    rating: 4.9,
    google_reviews_count: 35,
    review_count: 35,
  },
  servicesCount: 4,
  productsCount: 3,
  postsCount: 2,
  reviews: [
    { id: "r1", rating: 5, text: "Excelente atendimento!", reply_text: "Obrigado!" },
    { id: "r2", rating: 5, text: "Profissionais rápidos.", reply_text: "Valeu!" },
  ],
  portfolioCount: 2,
};

const resultComplete = calculateLocalPresenceScore(completeProfile);
assert(resultComplete.scoreResult.totalScore >= 80, "Perfil Completo atinge Score Forte/Excelente", `Score: ${resultComplete.scoreResult.totalScore}/100`);
assert(resultComplete.scoreResult.categories.length === 5, "Divide o Score em 5 Categorias Estruturadas", `Categorias: ${resultComplete.scoreResult.categories.length}`);
assert(resultComplete.scoreResult.statusLevel === "forte" || resultComplete.scoreResult.statusLevel === "excelente", "Nível de maturidade condizente", resultComplete.scoreResult.statusLevel);

// 2. Cenário: Perfil Mínimo / Vazio (detecta oportunidades)
const minimalProfile = {
  tenant: {
    id: "tenant-2",
    name: "Oficina Nova",
    slug: "oficina-nova",
    google_rating: null,
    google_reviews_count: null,
  },
  profile: null,
  servicesCount: 0,
  productsCount: 0,
  postsCount: 0,
  reviews: [],
  portfolioCount: 0,
};

const resultMinimal = calculateLocalPresenceScore(minimalProfile);
assert(resultMinimal.scoreResult.totalScore < 50, "Perfil Inicial pontua abaixo de 50 (Crítico)", `Score: ${resultMinimal.scoreResult.totalScore}/100`);
assert(resultMinimal.opportunities.length >= 3, "Detecta Oportunidades de Melhoria para o Proprietário", `Oportunidades: ${resultMinimal.opportunities.length}`);
assert(resultMinimal.opportunities.some((o) => o.category === "catalog"), "Gera oportunidade para cadastrar catálogo/produtos");

console.log("\n====================================================");
console.log(`📊 RESULTADO: ${passed} PASSOU | ${failed} FALHOU`);
console.log("====================================================");
