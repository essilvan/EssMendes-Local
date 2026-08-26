"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

export interface GeneratePostParams {
  businessName?: string;
  businessCategory?: string;
  servicesList?: string[];
  targetCity?: string;
  focusTopic?: string;
}

export interface GeneratedPostData {
  title: string;
  content: string;
  tags: string;
  metaDescription: string;
  ctaType: "booking" | "whatsapp" | "link";
  ctaLabel: string;
  source: "gemini" | "fallback";
}

export interface GeneratePostResult {
  success: boolean;
  data?: GeneratedPostData;
  error?: string;
}

/**
 * Motor contextual de geração de posts semanais de alta conversão para SEO Local
 */
function generateFallbackSeoPost(params: {
  businessName: string;
  businessCategory: string;
  services: string[];
  city: string;
  slug: string;
  topic?: string;
}): GeneratedPostData {
  const business = params.businessName || "Nosso Estabelecimento";
  const city = params.city || "sua região";
  const primaryService = params.services[0] || "atendimentos especializados";
  const otherServices = params.services.slice(1, 3).join(" e ") || "serviços completos";
  const topic = params.topic?.toLowerCase() || "destaque da semana";

  const cleanSlug = params.slug || "meu-negocio";
  const bookingLink = `app.essmendes.com.br/${cleanSlug}`;

  const variations: GeneratedPostData[] = [
    {
      title: `✨ Destaque da Semana: ${primaryService} em ${city} com Qualidade Impecável!`,
      content: `Procurando o melhor em ${params.businessCategory.toLowerCase()} em ${city}? Na ${business}, oferecemos atendimento de excelência com foco em pontualidade, técnicas modernas e satisfação garantida. 

Além de ${primaryService}, nosso catálogo conta com ${otherServices} pensados para transformar a sua rotina com o máximo de conforto.

Garanta seu horário com facilidade e sem filas através do nosso sistema online! 🚀

📅 Agende agora mesmo em poucos cliques pelo link: ${bookingLink} ou fale com nossa equipe!`,
      tags: `${params.businessCategory.toLowerCase()}, ${primaryService.toLowerCase()}, ${city.toLowerCase()}, agendamento online, atendimento de qualidade, melhor de ${city.toLowerCase()}`,
      metaDescription: `Conheça ${primaryService} e serviços de ${params.businessCategory.toLowerCase()} na ${business} em ${city}. Agendamento online rápido e seguro!`,
      ctaType: "booking",
      ctaLabel: "Agendar Horário Online",
      source: "fallback",
    },
    {
      title: `🔥 Cuidados & Excelência: Por que escolher a ${business} em ${city}?`,
      content: `Cuidar de você e do que você valoriza é a nossa missão principal! Na ${business}, somos referência em ${params.businessCategory.toLowerCase()} em ${city}, combinando dedicação, produtos de primeira linha e profissionais experientes.

Não deixe para última hora: reserve seu horário antecipado para ${primaryService} e aproveite uma experiência única e personalizada do início ao fim! ✨

👉 Acesse nosso portal oficial e faça sua reserva online: ${bookingLink}`,
      tags: `${primaryService.toLowerCase()}, ${business.toLowerCase()}, ${city.toLowerCase()}, ${params.businessCategory.toLowerCase()}, horario marcado, reserva online`,
      metaDescription: `Referência em ${primaryService} e ${params.businessCategory.toLowerCase()} em ${city}. Agende com comodidade na ${business}.`,
      ctaType: "booking",
      ctaLabel: "Reservar Horário",
      source: "fallback",
    },
    {
      title: `⏰ Vagas Abertas para Atendimento nesta Semana na ${business}!`,
      content: `Aproveite a semana para colocar seu bem-estar em dia com quem realmente entende do assunto! Nossa agenda está aberta para ${primaryService} e diversos outros procedimentos na ${business}.

📍 Localização de fácil acesso em ${city}, ambiente acolhedor e atendimento pontual para você economizar tempo.

Clique no botão abaixo, escolha o melhor dia e horário na nossa vitrine digital e receba a confirmação instantânea no seu WhatsApp! 💬

🌐 Link direto: ${bookingLink}`,
      tags: `vagas da semana, agendamento rapido, ${city.toLowerCase()}, ${primaryService.toLowerCase()}, ${business.toLowerCase()}`,
      metaDescription: `Agenda aberta para ${primaryService} em ${city} na ${business}. Escolha seu horário e confirme online!`,
      ctaType: "booking",
      ctaLabel: "Agendar Atendimento",
      source: "fallback",
    },
  ];

  return variations[Math.floor(Math.random() * variations.length)];
}

/**
 * Server Action: Gera Post Semanal Otimizado para SEO Local com IA
 */
export async function generateLocalSeoPost(
  params?: GeneratePostParams
): Promise<GeneratePostResult> {
  try {
    const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
    if (tenantError || !tenantContext) {
      return { success: false, error: tenantError || "Sessão expirada. Faça login novamente." };
    }

    const supabase = await createClient();

    // 1. Busca dados do perfil do negócio
    const { data: profile } = await supabase
      .from("tenant_profiles")
      .select("name, business_category, address, phone_whatsapp")
      .eq("tenant_id", tenantContext.tenantId)
      .maybeSingle();

    // 2. Busca lista de serviços cadastrados
    const { data: servicesData } = await supabase
      .from("services")
      .select("name")
      .eq("tenant_id", tenantContext.tenantId)
      .eq("is_active", true)
      .limit(6);

    const businessName =
      params?.businessName ||
      profile?.name ||
      tenantContext.tenant?.name ||
      "Meu Estabelecimento";

    const businessCategory =
      params?.businessCategory ||
      profile?.business_category ||
      "Serviços Especializados";

    const address = profile?.address || "";
    // Extrai cidade do endereço se possível
    let targetCity = params?.targetCity;
    if (!targetCity && address) {
      const parts = address.split(/[-–,]/);
      if (parts.length >= 2) {
        targetCity = parts[parts.length - 2].trim();
      }
    }
    targetCity = targetCity || "sua cidade";

    const services =
      params?.servicesList && params.servicesList.length > 0
        ? params.servicesList
        : servicesData && servicesData.length > 0
        ? servicesData.map((s) => s.name)
        : ["Atendimento Especializado", "Serviços Completos"];

    const slug = tenantContext.tenant?.slug || "meu-negocio";
    const focusTopic = params?.focusTopic || "Destaques e Agendamento da Semana";

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY;

    if (apiKey) {
      try {
        const prompt = `Você é um especialista em Marketing Digital e SEO Local para comércios e prestadores de serviços brasileiros.
Crie uma publicação semanal de alta conversão para o blog/feed do estabelecimento com os seguintes dados:

- Nome do Negócio: ${businessName}
- Categoria / Ramo: ${businessCategory}
- Cidade / Região de Atuação: ${targetCity}
- Principais Serviços Oferecidos: ${services.join(", ")}
- Link de Agendamento: app.essmendes.com.br/${slug}
- Tema / Foco: ${focusTopic}

INSTRUÇÕES OBRIGATÓRIAS:
1. Retorne ESTRITAMENTE um objeto JSON válido (sem tags markdown de código e sem texto antes ou depois) com a seguinte estrutura:
{
  "title": "Título atraente com 1 ou 2 emojis (máximo 70 caracteres)",
  "content": "Texto comercial atraente de 130 a 190 palavras, com parágrafos curtos, emojis, benefícios claros, reforçando a autoridade local na cidade e incluindo a chamada para agendamento online com o link app.essmendes.com.br/${slug}",
  "tags": "5 a 8 palavras-chave relevantes de SEO local separadas por vírgula (ex: servico, cidade, agendamento online)",
  "metaDescription": "Resumo de até 155 caracteres otimizado para o Google Snippet",
  "ctaType": "booking",
  "ctaLabel": "Agendar Horário Online"
}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.75,
              maxOutputTokens: 600,
            },
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const cleanJsonStr = candidateText
              .replace(/```json/gi, "")
              .replace(/```/g, "")
              .trim();
            const parsed = JSON.parse(cleanJsonStr);
            if (parsed.title && parsed.content) {
              return {
                success: true,
                data: {
                  title: parsed.title,
                  content: parsed.content,
                  tags: typeof parsed.tags === "string" ? parsed.tags : Array.isArray(parsed.tags) ? parsed.tags.join(", ") : "",
                  metaDescription: parsed.metaDescription || "",
                  ctaType: parsed.ctaType || "booking",
                  ctaLabel: parsed.ctaLabel || "Agendar Horário Online",
                  source: "gemini",
                },
              };
            }
          }
        }
      } catch (geminiErr) {
        console.warn("[generateLocalSeoPost] Erro na chamada Gemini, acionando fallback SEO:", geminiErr);
      }
    }

    // Fallback contextual avançado
    const fallbackData = generateFallbackSeoPost({
      businessName,
      businessCategory,
      services,
      city: targetCity,
      slug,
      topic: focusTopic,
    });

    return {
      success: true,
      data: fallbackData,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado ao gerar post de SEO.";
    console.error("[generateLocalSeoPost] Exceção:", err);
    return { success: false, error: message };
  }
}
