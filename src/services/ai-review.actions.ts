"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

export interface GenerateReviewResponseParams {
  authorName: string;
  rating: number;
  reviewText: string;
  businessCategory?: string;
  businessName?: string;
}

export interface ReviewResponseResult {
  success: boolean;
  data?: {
    responseText: string;
    source: "gemini" | "fallback";
  };
  error?: string;
}

/**
 * Motor contextual de fallback para gerar respostas de alta conversão e SEO Local
 */
function generateFallbackReviewResponse(params: {
  authorName: string;
  rating: number;
  reviewText: string;
  businessName: string;
  businessCategory: string;
  phoneWhatsapp?: string;
}): string {
  const firstName = params.authorName ? params.authorName.split(" ")[0] : "Cliente";
  const business = params.businessName || "nossa equipe";

  if (params.rating >= 4) {
    const positiveTemplates = [
      `Olá, ${firstName}! Muito obrigado pela avaliação ${params.rating} estrelas e pelas palavras gentis! Ficamos muito felizes em saber que você teve uma excelente experiência aqui na ${business}. Nosso compromisso é sempre entregar o melhor atendimento e serviços de alta qualidade. Conte sempre conosco e esperamos te receber novamente em breve! ✨`,
      `Oi, ${firstName}! Que alegria ler seu feedback! Toda a equipe da ${business} agradece de coração pela confiança em nosso trabalho. Saber que superamos suas expectativas nos motiva a evoluir a cada dia. Seja sempre muito bem-vindo(a) de volta! 🚀`,
      `Olá, ${firstName}! Agradecemos imensamente pela sua avaliação de ${params.rating} estrelas! Para nós da ${business}, a satisfação de cada cliente é prioridade máxima. Esperamos vê-lo(a) novamente em breve para cuidar de você com o mesmo carinho e excelência! 👏`,
    ];
    return positiveTemplates[Math.floor(Math.random() * positiveTemplates.length)];
  } else {
    const contactInfo = params.phoneWhatsapp ? `pelo WhatsApp (${params.phoneWhatsapp})` : "pelo nosso WhatsApp de atendimento";
    const criticalTemplates = [
      `Olá, ${firstName}. Lamentamos sinceramente que sua experiência não tenha atingido o padrão de excelência que prezamos na ${business}. Valorizamos muito seu feedback e queremos entender a fundo o ocorrido para corrigir e melhorar. Por favor, entre em contato diretamente conosco ${contactInfo} para que possamos resolver essa situação da melhor forma para você.`,
      `Olá, ${firstName}. Pedimos sinceras desculpas por qualquer inconveniente em sua experiência. Na ${business}, nosso objetivo diário é a satisfação completa de cada cliente. Gostaríamos muito de uma oportunidade para conversar e esclarecer o que aconteceu. Por gentileza, nos envie uma mensagem ${contactInfo}. Estamos à total disposição.`,
    ];
    return criticalTemplates[Math.floor(Math.random() * criticalTemplates.length)];
  }
}

/**
 * Server Action: Gera resposta inteligente para avaliação usando IA (Gemini com fallback contextual)
 */
export async function generateReviewResponse(
  params: GenerateReviewResponseParams
): Promise<ReviewResponseResult> {
  try {
    const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
    if (tenantError || !tenantContext) {
      return { success: false, error: tenantError || "Sessão expirada. Faça login novamente." };
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("tenant_profiles")
      .select("name, business_category, phone_whatsapp, phone")
      .eq("tenant_id", tenantContext.tenantId)
      .maybeSingle();

    const businessName = params.businessName || profile?.name || tenantContext.tenant?.name || "Nosso Estabelecimento";
    const businessCategory = params.businessCategory || profile?.business_category || "Serviços Locais";
    const phoneWhatsapp = profile?.phone_whatsapp || profile?.phone || "";

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY;

    if (apiKey) {
      try {
        const prompt = `Você é o proprietário e responsável pelo atendimento ao cliente do estabelecimento "${businessName}" (categoria: ${businessCategory}).
Escreva uma resposta pública, profissional, simpática e humana para a seguinte avaliação recebida no Google Maps:

- Nome do Cliente: ${params.authorName}
- Nota dada: ${params.rating} de 5 estrelas
- Comentário do cliente: "${params.reviewText || "Sem comentário por escrito, apenas nota."}"
${phoneWhatsapp ? `- WhatsApp da empresa: ${phoneWhatsapp}` : ""}

DIRETRIZES DE RESPOSTA:
1. Se a nota for 4 ou 5 estrelas: Agradeça efusivamente pelo nome, reforce o compromisso com qualidade e excelência, cite o nome da empresa e convide-o amigavelmente a retornar.
2. Se a nota for 1, 2 ou 3 estrelas: Mantenha postura empática, humilde e profissional. Peça desculpas pelo descontentamento, afirme que isso não reflete o padrão da empresa e convide o cliente a entrar em contato diretamente via WhatsApp para entender o caso e encontrar uma solução.
3. Não use placeholders como [Seu Nome] ou [Data]. A resposta deve estar 100% pronta para ser publicada.
4. Mantenha entre 30 e 70 palavras, em português brasileiro fluente e sem jargões corporativos excessivos.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            },
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            return {
              success: true,
              data: {
                responseText: candidateText.trim(),
                source: "gemini",
              },
            };
          }
        }
      } catch (geminiErr) {
        console.warn("[generateReviewResponse] Erro ao consultar Gemini API, acionando motor contextual:", geminiErr);
      }
    }

    // Fallback inteligente contextual
    const fallbackText = generateFallbackReviewResponse({
      authorName: params.authorName,
      rating: params.rating,
      reviewText: params.reviewText,
      businessName,
      businessCategory,
      phoneWhatsapp,
    });

    return {
      success: true,
      data: {
        responseText: fallbackText,
        source: "fallback",
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado ao gerar resposta.";
    console.error("[generateReviewResponse] Exceção:", err);
    return { success: false, error: message };
  }
}
