import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const idx = line.indexOf("=");
  if (idx > 0) {
    env[line.slice(0, idx).trim()] = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CATEGORIES = [
  "Bufantes",
  "Nadantes",
  "Fuçantes",
  "Ciscantes",
  "Frios",
  "Acompanhamentos",
  "Fritantes",
  "Embriagantes - Long Neck",
];

// Imagens reais de alta resolução (Unsplash) verificadas antes do insert
const IMG = {
  carneSol:
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  escondidinho:
    "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=900&q=80",
  lagarto:
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=80",
  picanha:
    "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80",
  iscaPeixe:
    "https://images.unsplash.com/photo-1579208575657-c595a05383b7?auto=format&fit=crop&w=900&q=80",
  bolinhoBacalhau:
    "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=900&q=80",
  camaraoEmpanado:
    "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=80",
  tilapiaChefe:
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80",
  tilapiaMolhoBranco:
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
  moqueca:
    "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=900&q=80",
  calabresa:
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
  linguicaBatata:
    "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80",
  mixGalera:
    "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80",
  salsichao:
    "https://images.unsplash.com/photo-1612392062631-94dd858cba88?auto=format&fit=crop&w=900&q=80",
  fileSuino:
    "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=900&q=80",
  torresmo:
    "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=900&q=80",
  sassami:
    "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80",
  frangoPassarinho:
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80",
  moela:
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
  tabuaFrios:
    "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=900&q=80",
  pao:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
  escaldado:
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  mandioca:
    "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=900&q=80",
  batataFrita:
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
  batataBaconQueijo:
    "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=900&q=80",
  pastel:
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
  cervejaBrahma:
    "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=900&q=80",
  cervejaHeineken:
    "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=900&q=80",
  skolBeats:
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80",
};

const MENU_ITEMS = [
  // [Categoria: Bufantes]
  {
    category: "Bufantes",
    name: "Carne de Sol",
    description: "Porção inteira de carne de sol acebolada na chapa, macia e suculenta.",
    price: 44.9,
    image_url: IMG.carneSol,
  },
  {
    category: "Bufantes",
    name: "Carne de Sol (Meia Porção)",
    description: "Meia porção de carne de sol acebolada na chapa.",
    price: 26.6,
    image_url: IMG.carneSol,
  },
  {
    category: "Bufantes",
    name: "Escondidinhos: Carne Seca e Bacalhau",
    description: "Escondidinho cremoso gratinado com queijo, opção de carne seca ou bacalhau.",
    price: 40.0,
    image_url: IMG.escondidinho,
  },
  {
    category: "Bufantes",
    name: "Escondidinhos: Carne Seca e Bacalhau (Meia Porção)",
    description: "Meia porção de escondidinho cremoso gratinado (carne seca ou bacalhau).",
    price: 20.0,
    image_url: IMG.escondidinho,
  },
  {
    category: "Bufantes",
    name: "Lagarto c/ Purê e Farofa",
    description: "Fatias suculentas de lagarto ao molho acompanhadas de purê cremoso e farofa crocante.",
    price: 25.0,
    image_url: IMG.lagarto,
  },
  {
    category: "Bufantes",
    name: "Lagarto c/ Purê e Farofa (Meia Porção)",
    description: "Meia porção de lagarto ao molho com purê e farofa.",
    price: 14.0,
    image_url: IMG.lagarto,
  },
  {
    category: "Bufantes",
    name: "Picanha na Chapa",
    description: "Picanha fatiada na chapa bem quente com cebola dourada.",
    price: 44.9,
    image_url: IMG.picanha,
  },
  {
    category: "Bufantes",
    name: "Picanha na Chapa (Meia Porção)",
    description: "Meia porção de picanha fatiada na chapa bem quente.",
    price: 26.6,
    image_url: IMG.picanha,
  },

  // [Categoria: Nadantes]
  {
    category: "Nadantes",
    name: "Isca de Peixe / Camarão Alho e Óleo",
    description: "Porção generosa de isca de peixe crocante ou camarão salteado no alho e óleo.",
    price: 44.9,
    image_url: IMG.iscaPeixe,
  },
  {
    category: "Nadantes",
    name: "Isca de Peixe / Camarão Alho e Óleo (Meia Porção)",
    description: "Meia porção de isca de peixe crocante ou camarão no alho e óleo.",
    price: 29.6,
    image_url: IMG.iscaPeixe,
  },
  {
    category: "Nadantes",
    name: "Bolinho de Bacalhau (12 unid.)",
    description: "12 unidades de bolinho de bacalhau sequinho por fora e cremoso por dentro.",
    price: 32.9,
    image_url: IMG.bolinhoBacalhau,
  },
  {
    category: "Nadantes",
    name: "Camarão / Salmão Empanado",
    description: "Porção caprichada de camarão ou salmão empanado crocante.",
    price: 48.0,
    image_url: IMG.camaraoEmpanado,
  },
  {
    category: "Nadantes",
    name: "Filé de Tilápia à Moda do Chefe",
    description: "Filé de tilápia preparado com tempero especial da casa.",
    price: 36.9,
    image_url: IMG.tilapiaChefe,
  },
  {
    category: "Nadantes",
    name: "Filé de Tilápia com Molho Branco",
    description: "Filé de tilápia grelhado coberto com molho branco cremoso.",
    price: 36.9,
    image_url: IMG.tilapiaMolhoBranco,
  },
  {
    category: "Nadantes",
    name: "Perda Capixaba (Moqueca / Peixada)",
    description: "Peixada estilo moqueca capixaba bem temperada, servida fumegante.",
    price: 32.0,
    image_url: IMG.moqueca,
  },

  // [Categoria: Fuçantes]
  {
    category: "Fuçantes",
    name: "Calabresa Acebolada",
    description: "Linguiça calabresa fatiada na chapa com cebola caramelizada.",
    price: 28.9,
    image_url: IMG.calabresa,
  },
  {
    category: "Fuçantes",
    name: "Linguiça Apimentada com Batata",
    description: "Linguiça artesanal levemente apimentada acompanhada de batatas fritas.",
    price: 28.9,
    image_url: IMG.linguicaBatata,
  },
  {
    category: "Fuçantes",
    name: "Mix Galera (Batata, Nuggets de Frango e Calabresa)",
    description: "Porção completa para dividir: batata frita, nuggets de frango crocantes e calabresa acebolada.",
    price: 44.9,
    image_url: IMG.mixGalera,
  },
  {
    category: "Fuçantes",
    name: "Salsichão Holandês",
    description: "Salsichão holandês grelhado servido fatiado como petisco.",
    price: 22.9,
    image_url: IMG.salsichao,
  },
  {
    category: "Fuçantes",
    name: "Filé Suíno com Purê de Banana",
    description: "Filé mignon suíno grelhado acompanhado de purê de banana da terra.",
    price: 34.9,
    image_url: IMG.fileSuino,
  },
  {
    category: "Fuçantes",
    name: "Torresmo Crocante",
    description: "Torresmo pururuca sequinho e estalando, ideal para acompanhar cerveja gelada.",
    price: 22.0,
    image_url: IMG.torresmo,
  },

  // [Categoria: Ciscantes]
  {
    category: "Ciscantes",
    name: "Filé de Sassami",
    description: "Tirinhas de filé de sassami temperadas e fritas na hora.",
    price: 34.9,
    image_url: IMG.sassami,
  },
  {
    category: "Ciscantes",
    name: "Filé de Sassami (Meia Porção)",
    description: "Meia porção de tirinhas de filé de sassami temperadas.",
    price: 20.0,
    image_url: IMG.sassami,
  },
  {
    category: "Ciscantes",
    name: "Frango a Passarinho",
    description: "Clássico frango a passarinho dourado e crocante com alho frito.",
    price: 31.0,
    image_url: IMG.frangoPassarinho,
  },
  {
    category: "Ciscantes",
    name: "Frango a Passarinho (Meia Porção)",
    description: "Meia porção de frango a passarinho dourado e crocante.",
    price: 20.0,
    image_url: IMG.frangoPassarinho,
  },
  {
    category: "Ciscantes",
    name: "Moela ao Molho",
    description: "Moela de frango bem cozida e macia no molho caseiro temperado.",
    price: 22.0,
    image_url: IMG.moela,
  },

  // [Categoria: Frios]
  {
    category: "Frios",
    name: "Porção de Queijo, Azeitona, Palmito, Batata Cozida e Salaminho",
    description: "Tábua completa de frios com queijo em cubos, azeitonas, palmito, batatinha temperada e salaminho.",
    price: 44.9,
    image_url: IMG.tabuaFrios,
  },
  {
    category: "Frios",
    name: "Porção de Frios (Meia Porção)",
    description: "Meia porção da tábua de frios da casa.",
    price: 28.9,
    image_url: IMG.tabuaFrios,
  },

  // [Categoria: Acompanhamentos]
  {
    category: "Acompanhamentos",
    name: "Porção de Pão",
    description: "Pão fatiado fresquinho para acompanhar petiscos e caldos.",
    price: 6.0,
    image_url: IMG.pao,
  },
  {
    category: "Acompanhamentos",
    name: "Escaldado",
    description: "Caldo escaldado tradicional bem temperado, servido quente.",
    price: 15.0,
    image_url: IMG.escaldado,
  },

  // [Categoria: Fritantes]
  {
    category: "Fritantes",
    name: "Mandioca Frita",
    description: "Porção inteira de mandioca macia por dentro e dourada por fora.",
    price: 22.0,
    image_url: IMG.mandioca,
  },
  {
    category: "Fritantes",
    name: "Mandioca Frita (Meia Porção)",
    description: "Meia porção de mandioca frita sequinha.",
    price: 14.0,
    image_url: IMG.mandioca,
  },
  {
    category: "Fritantes",
    name: "Batata Frita",
    description: "Porção inteira de batata frita crocante.",
    price: 22.0,
    image_url: IMG.batataFrita,
  },
  {
    category: "Fritantes",
    name: "Batata Frita (Meia Porção)",
    description: "Meia porção de batata frita crocante.",
    price: 14.0,
    image_url: IMG.batataFrita,
  },
  {
    category: "Fritantes",
    name: "Batata Frita com Bacon e Queijo",
    description: "Porção inteira de batata frita coberta com queijo derretido e bacon crocante.",
    price: 28.0,
    image_url: IMG.batataBaconQueijo,
  },
  {
    category: "Fritantes",
    name: "Batata Frita com Bacon e Queijo (Meia Porção)",
    description: "Meia porção de batata frita com queijo derretido e bacon.",
    price: 17.0,
    image_url: IMG.batataBaconQueijo,
  },
  {
    category: "Fritantes",
    name: "Pastelzinho e Bolinho de Carne (12 unid.)",
    description: "Porção mista com 12 unidades de pastelzinho e bolinho de carne fritos na hora.",
    price: 25.0,
    image_url: IMG.pastel,
  },
  {
    category: "Fritantes",
    name: "Pastelzinho e Bolinho de Carne (6 unid.)",
    description: "Porção mista com 6 unidades de pastelzinho e bolinho de carne.",
    price: 15.0,
    image_url: IMG.pastel,
  },

  // [Categoria: Embriagantes - Long Neck]
  {
    category: "Embriagantes - Long Neck",
    name: "Brahma / Malzbier (Long Neck)",
    description: "Cerveja Brahma ou Brahma Malzbier Long Neck trincando de gelada.",
    price: 10.0,
    image_url: IMG.cervejaBrahma,
  },
  {
    category: "Embriagantes - Long Neck",
    name: "Stella Artois / Heineken / Budweiser (Long Neck)",
    description: "Cerveja Long Neck Premium (Stella Artois, Heineken ou Budweiser) bem gelada.",
    price: 10.0,
    image_url: IMG.cervejaHeineken,
  },
  {
    category: "Embriagantes - Long Neck",
    name: "Skol Beats (Long Neck)",
    description: "Skol Beats Long Neck bem gelada.",
    price: 12.0,
    image_url: IMG.skolBeats,
  },
];

async function verifyImages() {
  const uniqueUrls = Array.from(new Set(Object.values(IMG)));
  const broken = [];
  await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) broken.push({ url, status: res.status });
      } catch (err) {
        broken.push({ url, status: err.message });
      }
    })
  );
  return broken;
}

async function run() {
  console.log("1. Validando URLs das imagens...");
  const broken = await verifyImages();
  if (broken.length > 0) {
    console.error("Imagens quebradas detectadas:", broken);
    process.exit(1);
  }
  console.log(`✅ Todas as ${Object.keys(IMG).length} imagens únicas retornaram HTTP 200.`);

  // 2. Localizar tenant
  const { data: tenants, error: tErr } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .ilike("slug", "%kaixa-dagua%");

  if (tErr || !tenants || tenants.length === 0) {
    console.error("Tenant não encontrado:", tErr);
    process.exit(1);
  }

  const tenant = tenants[0];
  console.log(`2. Tenant localizado: ${tenant.name} (${tenant.slug}) [${tenant.id}]`);

  // 3. Remover itens e categorias antigos
  const { error: delItemsErr } = await supabase
    .from("menu_items")
    .delete()
    .eq("tenant_id", tenant.id);
  if (delItemsErr) {
    console.error("Erro ao apagar menu_items antigos:", delItemsErr);
    process.exit(1);
  }

  const { error: delCatsErr } = await supabase
    .from("menu_categories")
    .delete()
    .eq("tenant_id", tenant.id);
  if (delCatsErr) {
    console.error("Erro ao apagar menu_categories antigas:", delCatsErr);
    process.exit(1);
  }
  console.log("🧹 Cardápio antigo removido com sucesso.");

  // 4. Criar categorias na ordem exata
  const { data: insertedCats, error: insCatsErr } = await supabase
    .from("menu_categories")
    .insert(
      CATEGORIES.map((name, idx) => ({
        tenant_id: tenant.id,
        name,
        order_index: idx + 1,
      }))
    )
    .select("id, name, order_index");

  if (insCatsErr || !insertedCats) {
    console.error("Erro ao inserir menu_categories:", insCatsErr);
    process.exit(1);
  }

  const catIdByName = new Map();
  insertedCats.forEach((c) => catIdByName.set(c.name, c.id));
  console.log(`✅ ${insertedCats.length} categorias criadas na ordem exata.`);

  // 5. Inserir todos os itens do cardápio físico
  const payload = MENU_ITEMS.map((item) => ({
    tenant_id: tenant.id,
    category_id: catIdByName.get(item.category) || null,
    category: item.category,
    name: item.name,
    description: item.description,
    price: item.price,
    image_url: item.image_url,
    is_available: true,
  }));

  const { data: insertedItems, error: insItemsErr } = await supabase
    .from("menu_items")
    .insert(payload)
    .select("id, name, category, price, image_url, is_available");

  if (insItemsErr || !insertedItems) {
    console.error("Erro ao inserir menu_items:", insItemsErr);
    process.exit(1);
  }

  const missingImg = insertedItems.filter((i) => !i.image_url);
  console.log(`✅ ${insertedItems.length} itens inseridos com sucesso!`);
  console.log(`🖼️ Itens com image_url preenchido: ${insertedItems.length - missingImg.length}/${insertedItems.length}`);

  const byCat = {};
  for (const it of insertedItems) {
    byCat[it.category] = (byCat[it.category] || 0) + 1;
  }
  console.log("📊 Distribuição por categoria:", byCat);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
