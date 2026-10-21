import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Carrega variáveis do .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value.trim();
  }
}

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseServiceKey = envVars["SUPABASE_SERVICE_ROLE_KEY"] || envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Erro: Configurações do Supabase ausentes no .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET_NAME = "establishment-photos";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NICHE_FALLBACKS = {
  gastronomia: {
    hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  barbearia: {
    hero: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  automotivo: {
    hero: "https://images.unsplash.com/photo-1613214149922-f1809c99b414?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  estetica_saude: {
    hero: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  servicos: {
    hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1000&auto=format&fit=crop",
    ],
  },
};

function isGoogleUrl(url) {
  if (!url || typeof url !== "string") return false;
  const l = url.toLowerCase();
  return l.includes("googleusercontent.com") || l.includes("googleapis.com") || l.includes("ggpht.com");
}

function getFallback(niche, isGallery = false, index = 0) {
  const n = NICHE_FALLBACKS[niche] || NICHE_FALLBACKS.servicos;
  if (isGallery) {
    return n.gallery[index % n.gallery.length] || n.hero;
  }
  return n.hero;
}

async function downloadAndUploadImage(url, tenantId, photoType, niche, isGallery = false, galleryIndex = 0) {
  const fallback = getFallback(niche, isGallery, galleryIndex);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`    ⚠️ Falha HTTP ${res.status} ao baixar foto do Google. Aplicando fallback.`);
      return { success: false, newUrl: fallback, isFallback: true, error: `HTTP ${res.status}` };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) {
      console.warn(`    ⚠️ Buffer vazio. Aplicando fallback.`);
      return { success: false, newUrl: fallback, isFallback: true, error: "Empty buffer" };
    }

    const randomHash = Math.random().toString(36).substring(2, 8);
    const filePath = `${tenantId}/${photoType}-${Date.now()}-${randomHash}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.warn(`    ⚠️ Erro no upload para storage: ${uploadError.message}. Aplicando fallback.`);
      return { success: false, newUrl: fallback, isFallback: true, error: uploadError.message };
    }

    const { data: pub } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return { success: true, newUrl: pub.publicUrl, isFallback: false };
  } catch (err) {
    console.warn(`    ⚠️ Exceção ao processar imagem: ${err.message}. Aplicando fallback.`);
    return { success: false, newUrl: fallback, isFallback: true, error: err.message };
  }
}

async function run() {
  console.log("================================================================");
  console.log("📸 MIGRAÇÃO EM MASSA: FOTOS DO GOOGLE -> SUPABASE STORAGE");
  console.log(`Bucket Alvo: ${BUCKET_NAME}`);
  console.log("================================================================\n");

  // Garante bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET_NAME)) {
    console.log(`Criando bucket '${BUCKET_NAME}'...`);
    await supabase.storage.createBucket(BUCKET_NAME, { public: true });
  }

  const { data: tenants, error: tErr } = await supabase
    .from("tenants")
    .select("id, name, slug, cover_image_url, theme_niche")
    .order("created_at", { ascending: false });

  if (tErr || !tenants) {
    console.error("Erro ao buscar tenants:", tErr);
    process.exit(1);
  }

  const tenantIds = tenants.map((t) => t.id);
  const { data: profiles } = await supabase
    .from("tenant_profiles")
    .select("tenant_id, logo_url, place_photos, business_category")
    .in("tenant_id", tenantIds);

  const profileMap = new Map();
  profiles?.forEach((p) => profileMap.set(p.tenant_id, p));

  let totalMigrados = 0;
  let falhas = 0;

  for (const tenant of tenants) {
    const profile = profileMap.get(tenant.id);
    const niche = tenant.theme_niche || profile?.business_category || "servicos";

    let hasGoogle = false;
    let newCoverUrl = tenant.cover_image_url;
    let newLogoUrl = profile?.logo_url || null;
    let newPhotos = Array.isArray(profile?.place_photos) ? [...profile.place_photos] : [];

    // Checa Capa
    if (isGoogleUrl(tenant.cover_image_url)) {
      hasGoogle = true;
      console.log(`\n🏢 [${tenant.name}] Migrando cover_image_url...`);
      const res = await downloadAndUploadImage(tenant.cover_image_url, tenant.id, "cover", niche);
      newCoverUrl = res.newUrl;
      if (res.success) {
        totalMigrados++;
        console.log(`  ✅ Capa migrada: ${res.newUrl.substring(0, 80)}...`);
      } else {
        falhas++;
        console.log(`  ⚠️ Capa com fallback aplicado.`);
      }
      await sleep(150);
    }

    // Checa Logo
    if (profile && isGoogleUrl(profile.logo_url)) {
      hasGoogle = true;
      console.log(`🏢 [${tenant.name}] Migrando logo_url...`);
      const res = await downloadAndUploadImage(profile.logo_url, tenant.id, "logo", niche);
      newLogoUrl = res.newUrl;
      if (res.success) {
        totalMigrados++;
        console.log(`  ✅ Logo migrado: ${res.newUrl.substring(0, 80)}...`);
      } else {
        falhas++;
        console.log(`  ⚠️ Logo com fallback aplicado.`);
      }
      await sleep(150);
    }

    // Checa place_photos
    if (Array.isArray(profile?.place_photos) && profile.place_photos.some(isGoogleUrl)) {
      hasGoogle = true;
      console.log(`🏢 [${tenant.name}] Migrando fotos do local (${profile.place_photos.length} fotos)...`);
      const updatedList = [];
      for (let i = 0; i < profile.place_photos.length; i++) {
        const ph = profile.place_photos[i];
        if (isGoogleUrl(ph)) {
          const res = await downloadAndUploadImage(ph, tenant.id, `photo_${i + 1}`, niche, true, i);
          updatedList.push(res.newUrl);
          if (res.success) {
            totalMigrados++;
          } else {
            falhas++;
          }
          await sleep(150);
        } else {
          updatedList.push(ph);
        }
      }
      newPhotos = updatedList;
      console.log(`  ✅ Fotos da galeria processadas (${updatedList.length} itens).`);
    }

    if (hasGoogle) {
      const now = new Date().toISOString();

      if (newCoverUrl !== tenant.cover_image_url) {
        await supabase
          .from("tenants")
          .update({ cover_image_url: newCoverUrl, updated_at: now })
          .eq("id", tenant.id);
      }

      if (profile) {
        await supabase
          .from("tenant_profiles")
          .update({
            logo_url: newLogoUrl,
            place_photos: newPhotos,
            updated_at: now,
          })
          .eq("tenant_id", tenant.id);
      }
    }
  }

  console.log("\n================================================================");
  console.log(`🏁 RESUMO FINAL DA MIGRAÇÃO:`);
  console.log(`   totalMigrados: ${totalMigrados}`);
  console.log(`   falhas: ${falhas}`);
  console.log("================================================================\n");
}

run().catch(console.error);
