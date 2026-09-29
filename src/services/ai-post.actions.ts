"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import { CONTENT_PILLARS, type ContentPillar } from "@/lib/constants/pillars";
import { generateContentWithGemini, extractValidJson } from "@/lib/gemini";

export type { ContentPillar };

export interface GeneratePostParams {
  businessName?: string;
  businessCategory?: string;
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
  source: "gemini" | "fallback";
  pillar?: string;
}

export interface GeneratePostResult {
  success: boolean;
  data?: GeneratedPostData;
  error?: string;
}

/**
 * Server Action: Gera Post Semanal Otimizado para SEO Local com IA
 * Com validação defensiva de GEMINI_API_KEY, modelo estável gemini-1.5-flash e try/catch seguro.
 */
export async function generateLocalSeoPost(
  params?: GeneratePostParams
): Promise<GeneratePostResult> {
  try {
    // 1. Validação de sessão e tenant seguro
    const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
    if (tenantError || !tenantContext) {
      return { success: false, error: tenantError || "Sessão expirada. Faça login novamente." };
    }

    // 2. Valide se process.env.GEMINI_API_KEY existe antes de invocar o modelo.
    // Se não existir, retorne erro amigável em vez de quebrar a execução com 500.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY não configurada no servidor.",
      };
    }

    const tenantId = tenantContext.tenantId;
    const supabase = await createClient();

    // 3. CONSULTAR HISTÓRICO RECENTE ANTES DE GERAR (Evita repetições)
    let pastTitles = "Nenhum post anterior.";
    try {
      const { data: recentPosts } = await supabase
        .from("tenant_posts")
        .select("title, tags")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(8);

      if (recentPosts && recentPosts.length > 0) {
        pastTitles = recentPosts
          .map((p) => {
            const tagsList =
              p.tags && Array.isArray(p.tags) && p.tags.length > 0
                ? ` (Tags: ${p.tags.join(", ")})`
                : "";
            return `- "${p.title}"${tagsList}`;
          })
          .join("\n");
      }
    } catch (histErr) {
      console.warn("[generateLocalSeoPost] Aviso ao buscar histórico recente de posts:", histErr);
    }

    // 4. SISTEMA DE ROTAÇÃO DE ÂNGULOS / PILARES DE CONTEÚDO
    const selectedPillar =
      CONTENT_PILLARS.find((p) => p.id === params?.pillarId) ||
      CONTENT_PILLARS[Math.floor(Math.random() * CONTENT_PILLARS.length)];

    // 5. Busca dados do perfil do negócio
    const { data: profile } = await supabase
      .from("tenant_profiles")
      .select("name, business_category, address, phone_whatsapp")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    // 6. Busca lista de serviços cadastrados
    const { data: servicesData } = await supabase
      .from("services")
      .select("name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .limit(6);

    const businessName =
      params?.businessName ||
      profile?.name ||
      tenantContext.tenant?.name ||
      "Nosso Estabelecimento";

    const businessCategory =
      params?.businessCategory ||
      profile?.business_category ||
      "Serviços Especializados";

    const address = profile?.address || "";
    let extractedCity = params?.targetCity;
    if (!extractedCity && address) {
      const parts = address.split(/[-–,]/);
      if (parts.length >= 2) {
        extractedCity = parts[parts.length - 2].trim();
      }
    }
    const targetCity: string = extractedCity || "sua região";

    const services =
      params?.servicesList && params.servicesList.length > 0
        ? params.servicesList
        : servicesData && servicesData.length > 0
        ? servicesData.map((s) => s.name)
        : ["Atendimento Especializado", "Serviços Completos"];

    const slug = tenantContext.tenant?.slug || "meu-negocio";

    // 7. Prompt refinado para SEO Local
    const prompt = `Responda EXCLUSIVAMENTE com um único objeto JSON válido, sem texto introdutório, sem formatação markdown (sem \`\`\`json), contendo as chaves: title, content, keywords, meta_description.

Você é um especialista em SEO Local e Copywriting.
Nicho da Empresa: ${businessCategory} (${businessName})
Cidade/Região: ${targetCity}
Principais Serviços Oferecidos: ${services.join(", ")}
Link de Agendamento Online: app.essmendes.com.br/${slug}

REGRAS CRÍTICAS DE INEDITISMO:
- PROIBIDO repetir ou parafrasear os seguintes temas/títulos já criados recentemente:
${pastTitles}

- Aborde o seguinte ângulo desta vez: [${selectedPillar.name}]
  Diretriz do ângulo: ${selectedPillar.angleDescription}
${params?.focusTopic ? `- Foco adicional requerido: ${params.focusTopic}` : ""}

DIRETRIZES DE CRIAÇÃO:
- Gere um título chamativo, único e focado na dor real do cliente local (com 1 ou 2 emojis, máximo 70 caracteres).
- O texto deve ter parágrafos dinâmicos (130 a 190 palavras), tom profissional e acolhedor, com chamada final para agendamento no WhatsApp ou localização da loja pelo link app.essmendes.com.br/${slug}.
- Gere palavras-chave de cauda longa (long-tail) específicas e não genéricas (ex: "melhor [serviço] em ${targetCity}", "onde fazer [procedimento] ${targetCity}").
- Resumo para meta descrição do Google de até 155 caracteres.

ESTRUTURA DO OBJETO JSON:
{
  "title": "Título chamativo e inédito com emoji",
  "content": "Texto dividido em 2 a 3 parágrafos dinâmicos de 130 a 190 palavras com chamada final persuasiva",
  "keywords": "termo cauda longa 1, termo cauda longa 2, termo cauda longa 3, termo cauda longa 4, termo cauda longa 5",
  "meta_description": "Resumo de até 155 caracteres otimizado para o Google Snippet"
}

Responda EXCLUSIVAMENTE com um único objeto JSON válido, sem texto introdutório, sem formatação markdown (sem \`\`\`json), contendo as chaves: title, content, keywords, meta_description.`;

    // 8. Chamada direta via fetch com responseMimeType e higienização defensiva de JSON
    try {
      const generatedText = await generateContentWithGemini(prompt, {
        apiKey,
        temperature: 0.7,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      });

      const postData = extractValidJson(generatedText);

      const parsedTitle = postData.title || "Novidade Especial da Semana";
      const parsedContent = postData.content || "";
      const rawKeywords = postData.keywords || postData.tags || "";
      const parsedTags =
        typeof rawKeywords === "string"
          ? rawKeywords
          : Array.isArray(rawKeywords)
          ? rawKeywords.join(", ")
          : "";
      const parsedMetaDesc = postData.meta_description || postData.metaDescription || "";

      return {
        success: true,
        data: {
          title: parsedTitle,
          content: parsedContent,
          tags: parsedTags,
          metaDescription: parsedMetaDesc,
          ctaType: postData.ctaType || postData.cta_type || "booking",
          ctaLabel: postData.ctaLabel || postData.cta_label || "Agendar Horário Online",
          source: "gemini",
          pillar: selectedPillar.name,
        },
      };
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : String(err || "Erro inesperado ao invocar o modelo de IA.");
      console.error("[generateLocalSeoPost] Erro na chamada de IA:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (err: any) {
    const message = err instanceof Error ? err.message : "Erro inesperado ao gerar post de SEO.";
    console.error("[generateLocalSeoPost] Exceção geral:", err);
    return { success: false, error: message };
  }
}
