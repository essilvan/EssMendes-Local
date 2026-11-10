"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant, resolveTenantNiche } from "@/lib/supabase/tenant";
import { CONTENT_PILLARS, type ContentPillar } from "@/lib/constants/pillars";
import {
  generateContentWithGemini,
  extractValidJson,
  sanitizeAiText,
} from "@/lib/gemini";

export type { ContentPillar };

export interface GeneratePostParams {
  businessName?: string;
  businessCategory?: string;
  niche?: string;
  servicesList?: string[];
  targetCity?: string;
  focusTopic?: string;
  pillarId?: string;
}

export interface GeneratedPostData {
  title: string;
  content: string;
  tags: string;
  metaDescription: string;
  ctaType: "booking" | "whatsapp" | "link";
  ctaLabel: string;
  imageUrl?: string;
  source: "gemini" | "fallback";
  pillar?: string;
}

export interface GeneratePostResult {
  success: boolean;
  data?: GeneratedPostData;
  error?: string;
}

/**
 * Mapeamento de contexto e dores reais por nicho para calibrar o prompt da IA
 */
function getNichePromptInstructions(niche: string, services: string[]): {
  nicheLabel: string;
  domainGuidelines: string;
  defaultServices: string[];
  defaultCtaType: "booking" | "whatsapp";
  defaultCtaLabel: string;
} {
  const norm = (niche || "").toLowerCase();

  if (
    norm === "automotive" ||
    norm === "auto" ||
    norm.includes("auto") ||
    norm.includes("mecanic") ||
    norm.includes("oficina")
  ) {
    return {
      nicheLabel: "Oficina Mecânica e Centro Automotivo",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO AUTOMOTIVO:
- Aborde dicas práticas e reais de manutenção preventiva e corretiva automotiva: troca de óleo e filtros no prazo correto, revisão do sistema de freios (pastilhas, discos e fluido), alinhamento, balanceamento e suspensão (amortecedores, buchas, pivôs), barulhos no motor, kit de embreagem, direção hidráulica/elétrica, correia dentada ou higienização de ar-condicionado automotivo.
- Destaque a segurança da família nas ruas e estradas, economia de combustível, prevenção de quebras inesperadas e diagnóstico técnico transparente por placa.
- NUNCA mencione serviços de salão, barbearia ou estética corporal.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Troca de Óleo e Filtros",
              "Revisão de Freios e Suspensão",
              "Manutenção de Embreagem e Direção",
              "Diagnóstico Eletrônico por Scanner",
              "Revisão Preventiva por Quilometragem",
            ],
      defaultCtaType: "whatsapp",
      defaultCtaLabel: "Solicitar Orçamento por Placa",
    };
  }

  if (
    norm.includes("barbea") ||
    norm.includes("barber") ||
    norm.includes("corte")
  ) {
    return {
      nicheLabel: "Barbearia e Estética Masculina",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO BARBEARIA:
- Aborde exclusivamente cuidados masculinos: corte degradê (fade), corte social, alinhamento e hidratação de barba, barbaterapia com toalha quente, cuidados com o couro cabeludo e visual impecável para o dia a dia ou eventos.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Corte Degradê e Social",
              "Barba Completa e Barbaterapia",
              "Acabamento e Sobrancelha",
              "Hidratação Capilar e de Barba",
            ],
      defaultCtaType: "booking",
      defaultCtaLabel: "Agendar Horário Online",
    };
  }

  if (
    norm.includes("pet") ||
    norm.includes("veterin") ||
    norm.includes("bicho") ||
    norm.includes("animal")
  ) {
    return {
      nicheLabel: "Pet Shop e Clínica Veterinária",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO PET & VETERINÁRIA:
- Aborde exclusivamente saúde, higiene e bem-estar de cães e gatos: banho e tosa higiênica, hidratação de pelagem, vacinação em dia, check-up veterinário preventivo, controle de pulgas/carrapatos e alimentação saudável para pets.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Banho e Tosa Especializada",
              "Consulta Veterinária e Check-up",
              "Vacinação e Vermifugação",
              "Hidratação e Cuidados para Pets",
            ],
      defaultCtaType: "booking",
      defaultCtaLabel: "Agendar Atendimento Pet",
    };
  }

  if (
    norm.includes("confeit") ||
    norm.includes("bolo") ||
    norm.includes("doce")
  ) {
    return {
      nicheLabel: "Confeitaria Artesanal e Doceria",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO CONFEITARIA:
- Aborde exclusivamente bolos artesanais, tortas especiais, doces finos para festas e aniversários, ingredientes selecionados e encomendas personalizadas.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Bolos Decorados sob Encomenda",
              "Doces Finos e Brigadeiros Gourmet",
              "Tortas Artesanais e Kits Festa",
            ],
      defaultCtaType: "whatsapp",
      defaultCtaLabel: "Fazer Encomenda no WhatsApp",
    };
  }

  if (
    norm.includes("estetica") ||
    norm.includes("beleza") ||
    norm.includes("salao") ||
    norm.includes("cilios") ||
    norm.includes("lash") ||
    norm.includes("clinica")
  ) {
    return {
      nicheLabel: "Estética, Beleza e Bem-Estar",
      domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO ESTÉTICA & BELEZA:
- Aborde exclusivamente autoestima, cuidados estéticos faciais e corporais, durabilidade dos procedimentos, biossegurança, técnicas modernas e atendimento personalizado.`,
      defaultServices:
        services.length > 0
          ? services
          : [
              "Procedimentos Estéticos Personalizados",
              "Cuidados Faciais e Beleza",
              "Atendimento com Hora Marcada",
            ],
      defaultCtaType: "booking",
      defaultCtaLabel: "Agendar Horário Online",
    };
  }

  return {
    nicheLabel: niche || "Comércio e Serviços Locais",
    domainGuidelines: `FOCO OBRIGATÓRIO DO NICHO:
- Aborde exclusivamente os serviços reais da empresa, resolvendo dúvidas reais dos clientes da cidade e destacando a qualidade do atendimento local.`,
    defaultServices:
      services.length > 0
        ? services
        : ["Atendimento Especializado", "Serviços de Qualidade"],
    defaultCtaType: "booking",
    defaultCtaLabel: "Agendar Horário Online",
  };
}

/**
 * Curadoria inteligente de imagens de alta definição por nicho e palavras-chave do título
 */
const NICHE_ILLUSTRATIVE_IMAGES: Record<
  string,
  Array<{ keywords: string[]; url: string }>
> = {
  automotive: [
    {
      keywords: ["óleo", "oleo", "filtro", "motor", "lubrific"],
      url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: ["freio", "pastilha", "disco", " roda", "pneu", "alinhamento"],
      url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: ["suspens", "amortecedor", "direção", "direcao", "embreagem", "câmbio"],
      url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: ["scanner", "diagnóstic", "eletrônic", "painel", "bateria", "revisão"],
      url: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: [],
      url: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  barbearia: [
    {
      keywords: ["barba", "toalha", "navalha"],
      url: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: ["corte", "degradê", "fade", "cabelo"],
      url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: [],
      url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  petshop: [
    {
      keywords: ["gato", "felino"],
      url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: ["banho", "tosa", "higiene"],
      url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: ["veterin", "vacina", "consulta", "saúde"],
      url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: [],
      url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  confeitaria: [
    {
      keywords: ["bolo", "festa", "aniversário"],
      url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1280&q=80",
    },
    {
      keywords: [],
      url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  estetica_saude: [
    {
      keywords: [],
      url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1280&q=80",
    },
  ],
  default: [
    {
      keywords: [],
      url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1280&q=80",
    },
  ],
};

function selectCuratedImageForNicheAndTitle(
  niche: string,
  titleText: string
): string {
  const normNiche = (niche || "").toLowerCase();
  const normTitle = (titleText || "").toLowerCase();

  let bucketKey = "default";
  if (
    normNiche.includes("auto") ||
    normNiche.includes("mecanic") ||
    normNiche.includes("oficina")
  ) {
    bucketKey = "automotive";
  } else if (normNiche.includes("barbea") || normNiche.includes("barber")) {
    bucketKey = "barbearia";
  } else if (normNiche.includes("pet") || normNiche.includes("veterin")) {
    bucketKey = "petshop";
  } else if (normNiche.includes("confeit") || normNiche.includes("bolo")) {
    bucketKey = "confeitaria";
  } else if (
    normNiche.includes("estetica") ||
    normNiche.includes("beleza") ||
    normNiche.includes("salao")
  ) {
    bucketKey = "estetica_saude";
  }

  const candidates =
    NICHE_ILLUSTRATIVE_IMAGES[bucketKey] || NICHE_ILLUSTRATIVE_IMAGES.default;

  for (const item of candidates) {
    if (
      item.keywords.length > 0 &&
      item.keywords.some((kw) => normTitle.includes(kw))
    ) {
      return item.url;
    }
  }

  return candidates[candidates.length - 1].url;
}

/**
 * Server Action: Gera Post Semanal Otimizado para SEO Local com IA
 * Calibrado estritamente pelo nicho do tenant (tenant.name, tenant.niche, tenant.city e services).
 */
export async function generateLocalSeoPost(
  params?: GeneratePostParams
): Promise<GeneratePostResult> {
  try {
    const { data: tenantContext, error: tenantError } =
      await getAuthenticatedTenant();
    if (tenantError || !tenantContext) {
      return {
        success: false,
        error: tenantError || "Sessão expirada. Faça login novamente.",
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY não configurada no servidor.",
      };
    }

    const tenantId = tenantContext.tenantId;
    const supabase = await createClient();

    // 1. Buscar dados completos do tenant, perfil, serviços e histórico recente de posts
    const [tenantRes, profileRes, servicesRes, recentPostsRes] =
      await Promise.all([
        supabase
          .from("tenants")
          .select("id, name, slug, niche, theme_niche, theme_settings")
          .eq("id", tenantId)
          .maybeSingle(),
        supabase
          .from("tenant_profiles")
          .select("name, business_category, address, phone_whatsapp")
          .eq("tenant_id", tenantId)
          .maybeSingle(),
        supabase
          .from("services")
          .select("name")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .limit(8),
        supabase
          .from("tenant_posts")
          .select("title, tags")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

    const tenantRow = tenantRes.data || tenantContext.tenant;
    const profile = profileRes.data;
    const servicesData = servicesRes.data || [];
    const recentPosts = recentPostsRes.data || [];

    const pastTitles =
      recentPosts.length > 0
        ? recentPosts
            .map((p) => `- "${p.title}"`)
            .join("\n")
        : "Nenhum post anterior.";

    const selectedPillar =
      CONTENT_PILLARS.find((p) => p.id === params?.pillarId) ||
      CONTENT_PILLARS[Math.floor(Math.random() * CONTENT_PILLARS.length)];

    // 2. Captura dinâmica de tenant.name, tenant.niche, tenant.city e services
    const businessName =
      params?.businessName ||
      tenantRow?.name ||
      profile?.name ||
      "Nosso Estabelecimento";

    const resolvedNiche =
      params?.niche ||
      resolveTenantNiche(tenantRow) ||
      params?.businessCategory ||
      profile?.business_category ||
      "general";

    const address = profile?.address || "";
    let extractedCity = params?.targetCity || (tenantRow as any)?.city || "";
    if (!extractedCity && address) {
      const parts = address.split(/[-–,]/);
      if (parts.length >= 2) {
        extractedCity = parts[parts.length - 2].trim();
      }
    }
    const targetCity: string = extractedCity || "sua cidade";

    const rawServices =
      params?.servicesList && params.servicesList.length > 0
        ? params.servicesList
        : servicesData.map((s) => s.name).filter(Boolean);

    const nicheContext = getNichePromptInstructions(resolvedNiche, rawServices);

    // 3. Prompt estrito em PT-BR sem vazamento de instruções de sistema
    const prompt = `Gere uma publicação persuasiva de blog/novidades otimizada para SEO Local no Google.

DADOS REAIS DO ESTABELECIMENTO:
- Nome da Empresa: ${businessName}
- Nicho de Atuação: ${nicheContext.nicheLabel} (código: ${resolvedNiche})
- Cidade / Região: ${targetCity}
- Serviços Principais: ${nicheContext.defaultServices.join(", ")}
- Tema / Pilar Editorial da Semana: ${selectedPillar.name} (${selectedPillar.angleDescription})
${params?.focusTopic ? `- Tópico específico solicitado: ${params.focusTopic}` : ""}

${nicheContext.domainGuidelines}

HISTÓRICO DE TÍTULOS JÁ PUBLICADOS (NÃO REPETIR):
${pastTitles}

REGRAS ESTRITAS E OBRIGATÓRIAS DE SAÍDA:
1. Retorne APENAS um objeto JSON puro e válido, sem blocos markdown (\`\`\`json) e sem nenhuma frase antes ou depois do JSON.
2. O conteúdo deve ser 100% em Português do Brasil (PT-BR) natural, humano e persuasivo.
3. PROIBIDO incluir termos técnicos de prompt ou meta-comentários dentro dos textos, tais como "SEO Specialist", "Copywriter", "placeholder", "[insira aqui]" ou textos em inglês.
4. O campo "title" deve ter entre 35 e 70 caracteres, em PT-BR, direto e atrativo para clientes locais.
5. O campo "content" deve ter entre 120 e 180 palavras divididas em 2 ou 3 parágrafos claros, educando o cliente e convidando-o a entrar em contato com a equipe da ${businessName} em ${targetCity}.
6. O campo "keywords" deve conter 5 palavras-chave locais separadas por vírgula em PT-BR (incluindo o serviço e ${targetCity}).
7. O campo "meta_description" deve ter até 155 caracteres em PT-BR resumindo o benefício do artigo para o Google.

FORMATO EXATO DO JSON:
{
  "title": "...",
  "content": "...",
  "keywords": "...",
  "meta_description": "..."
}`;

    const generatedText = await generateContentWithGemini(prompt, {
      apiKey,
      temperature: 0.65,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          content: { type: "STRING" },
          keywords: { type: "STRING" },
          meta_description: { type: "STRING" },
        },
        required: ["title", "content", "keywords", "meta_description"],
      },
    });

    const postData = extractValidJson(generatedText);

    const parsedTitle =
      sanitizeAiText(postData.title) ||
      (resolvedNiche === "automotive"
        ? `Revisão Preventiva em ${targetCity}: Cuide da Segurança do Seu Carro`
        : `Novidades e Atendimento Especializado em ${targetCity}`);

    const parsedContent = sanitizeAiText(postData.content) || "";
    const rawKeywords = postData.keywords || postData.tags || "";
    const parsedTags =
      typeof rawKeywords === "string"
        ? sanitizeAiText(rawKeywords)
        : Array.isArray(rawKeywords)
        ? rawKeywords.map((k: string) => sanitizeAiText(k)).join(", ")
        : "";
    const parsedMetaDesc = sanitizeAiText(
      postData.meta_description || postData.metaDescription || ""
    ).slice(0, 160);

    const suggestedImageUrl = selectCuratedImageForNicheAndTitle(
      resolvedNiche,
      `${parsedTitle} ${parsedContent}`
    );

    return {
      success: true,
      data: {
        title: parsedTitle,
        content: parsedContent,
        tags: parsedTags,
        metaDescription: parsedMetaDesc,
        ctaType: nicheContext.defaultCtaType,
        ctaLabel: nicheContext.defaultCtaLabel,
        imageUrl: suggestedImageUrl,
        source: "gemini",
        pillar: selectedPillar.name,
      },
    };
  } catch (err: any) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro inesperado ao gerar post de SEO.";
    console.error("[generateLocalSeoPost] Exceção:", err);
    return { success: false, error: message };
  }
}

/**
 * Server Action: Gera uma imagem ilustrativa com IA condizente com o título do post e o nicho do tenant,
 * persistindo no bucket 'establishment-photos' (pasta 'posts/') quando gerada em buffer.
 */
export async function generatePostCoverImageAction(input?: {
  title?: string;
  content?: string;
  niche?: string;
}): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    const { data: tenantContext, error: tenantError } =
      await getAuthenticatedTenant();
    if (tenantError || !tenantContext) {
      return {
        success: false,
        error: tenantError || "Sessão expirada. Faça login novamente.",
      };
    }

    const tenantId = tenantContext.tenantId;
    const resolvedNiche =
      input?.niche || resolveTenantNiche(tenantContext.tenant) || "general";
    const postTitle = (input?.title || "").trim();
    const postContent = (input?.content || "").trim();

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Tenta gerar imagem real via Gemini Imagen 3 (se disponível na conta Google AI)
    if (apiKey) {
      try {
        const subjectPrompt =
          resolvedNiche === "automotive"
            ? `Professional modern automotive workshop mechanic inspecting a car, ${postTitle || "preventive maintenance"}, clean lighting, photorealistic, 16:9 banner, no text`
            : `Professional local business photography for ${resolvedNiche}, ${postTitle || "featured service"}, warm lighting, photorealistic, 16:9 banner, no text`;

        const imagenRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: subjectPrompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio: "16:9",
                outputOptions: { mimeType: "image/jpeg" },
              },
            }),
          }
        );

        if (imagenRes.ok) {
          const imagenData = await imagenRes.json();
          const b64 =
            imagenData?.predictions?.[0]?.bytesBase64Encoded ||
            imagenData?.predictions?.[0]?.bytesBase64;

          if (b64) {
            const buffer = Buffer.from(b64, "base64");
            const adminSupabase = createAdminClient();
            const filePath = `posts/${tenantId}-ai-${Date.now()}.jpg`;

            const { error: upErr } = await adminSupabase.storage
              .from("establishment-photos")
              .upload(filePath, buffer, {
                contentType: "image/jpeg",
                upsert: true,
              });

            if (!upErr) {
              const { data: pubData } = adminSupabase.storage
                .from("establishment-photos")
                .getPublicUrl(filePath);
              if (pubData?.publicUrl) {
                return { success: true, imageUrl: pubData.publicUrl };
              }
            }
          }
        }
      } catch (imgErr) {
        console.warn("[generatePostCoverImageAction] Fallback curado ativado:", imgErr);
      }
    }

    // 2. Seleção inteligente calibrada pelo título + conteúdo + nicho e persistência no bucket 'establishment-photos/posts/'
    const sourceUrl = selectCuratedImageForNicheAndTitle(
      resolvedNiche,
      `${postTitle} ${postContent}`
    );

    try {
      const imgResponse = await fetch(sourceUrl);
      if (imgResponse.ok) {
        const arrayBuffer = await imgResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const adminSupabase = createAdminClient();
        const filePath = `posts/${tenantId}-ai-cover-${Date.now()}.jpg`;

        const { error: upErr } = await adminSupabase.storage
          .from("establishment-photos")
          .upload(filePath, buffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!upErr) {
          const { data: pubData } = adminSupabase.storage
            .from("establishment-photos")
            .getPublicUrl(filePath);
          if (pubData?.publicUrl) {
            return { success: true, imageUrl: pubData.publicUrl };
          }
        }
      }
    } catch (storageErr) {
      console.warn(
        "[generatePostCoverImageAction] Retornando URL direta:",
        storageErr
      );
    }

    return {
      success: true,
      imageUrl: sourceUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Não foi possível gerar a imagem com IA.",
    };
  }
}

/**
 * Server Action: Faz upload da foto de capa do post (comprimida no cliente via Canvas)
 * diretamente para o bucket 'establishment-photos' dentro da pasta 'posts/'.
 */
export async function uploadPostCoverPhotoAction(
  formData: FormData
): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    const { data: tenantContext, error: tenantError } =
      await getAuthenticatedTenant();
    if (tenantError || !tenantContext?.tenantId) {
      return {
        success: false,
        error: tenantError || "Sessão expirada. Faça login novamente.",
      };
    }

    const file = formData.get("file") as File | null;
    if (!file || typeof file.arrayBuffer !== "function") {
      return { success: false, error: "Arquivo de imagem inválido." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.type === "image/webp" ? "webp" : "jpg";
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const filePath = `posts/${tenantContext.tenantId}-${Date.now()}-${randomSuffix}.${ext}`;

    const adminSupabase = createAdminClient();
    const { error: uploadErr } = await adminSupabase.storage
      .from("establishment-photos")
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[uploadPostCoverPhotoAction] Erro storage:", uploadErr);
      return {
        success: false,
        error: "Falha ao salvar imagem no bucket establishment-photos.",
      };
    }

    const { data: publicUrlData } = adminSupabase.storage
      .from("establishment-photos")
      .getPublicUrl(filePath);

    return {
      success: true,
      imageUrl: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao enviar foto do post.",
    };
  }
}
