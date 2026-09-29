"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

export interface ContentPillar {
  id: string;
  name: string;
  angleDescription: string;
}

export const CONTENT_PILLARS: ContentPillar[] = [
  {
    id: "guia_pratico",
    name: "Pilar 1: Guia prático / Dica de manutenção preventiva ou cuidado rápido",
    angleDescription:
      "Guia prático com dicas de cuidados essenciais, manutenção preventiva ou rotina ideal que o cliente local pode aplicar imediatamente no dia a dia para preservar os resultados e evitar problemas.",
  },
  {
    id: "mito_vs_verdade",
    name: "Pilar 2: Mito vs. Verdade sobre os serviços prestados",
    angleDescription:
      "Desmistificar mitos e crenças populares sobre os serviços ou procedimentos do nicho, apresentando fatos técnicos com autoridade, clareza e transparência.",
  },
  {
    id: "sinais_alerta",
    name: "Pilar 3: Sinais de alerta (quando o cliente precisa procurar o serviço com urgência)",
    angleDescription:
      "Identificar sinais claros de perigo, desgaste ou necessidade imediata de atendimento, mostrando por que adiar a visita pode causar prejuízos ou agravar a situação.",
  },
  {
    id: "bastidores_tecnologia",
    name: "Pilar 4: Bastidores / Tecnologia, precisão e peças/produtos de alta qualidade usados",
    angleDescription:
      "Mostrar os bastidores da execução, o rigor técnico, os equipamentos modernos, ferramentas de precisão ou produtos de primeira linha utilizados para entregar um resultado impecável.",
  },
  {
    id: "faq_cliente",
    name: "Pilar 5: Pergunta frequente de clientes respondida de forma simples e técnica",
    angleDescription:
      "Responder a uma das dúvidas mais comuns dos clientes de forma direta, didática, acolhedora e acessível, quebrando inseguranças e facilitando o agendamento.",
  },
  {
    id: "economia_seguranca",
    name: "Pilar 6: Economia e segurança a longo prazo",
    angleDescription:
      "Demonstrar como a manutenção regular e a contratação de profissionais especializados geram economia financeira real e garantem tranquilidade e segurança a longo prazo.",
  },
];

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
  source: "gemini" | "openai" | "fallback";
  pillar?: string;
}

export interface GeneratePostResult {
  success: boolean;
  data?: GeneratedPostData;
  error?: string;
}

/**
 * Motor contextual de geração de posts semanais de alta conversão para SEO Local
 * com rotação inteligente baseada no pilar selecionado.
 */
function generateFallbackSeoPost(params: {
  businessName: string;
  businessCategory: string;
  services: string[];
  city: string;
  slug: string;
  pillar: ContentPillar;
  topic?: string;
}): GeneratedPostData {
  const business = params.businessName || "Nosso Estabelecimento";
  const city = params.city || "sua região";
  const primaryService = params.services[0] || "atendimentos especializados";
  const secondService = params.services[1] || "serviços completos";
  const cleanSlug = params.slug || "meu-negocio";
  const bookingLink = `app.essmendes.com.br/${cleanSlug}`;

  switch (params.pillar.id) {
    case "guia_pratico":
      return {
        title: `💡 Guia Prático: Como Cuidar de ${primaryService} em ${city}`,
        content: `Você sabia que pequenos cuidados no dia a dia fazem toda a diferença para prolongar os resultados de ${primaryService.toLowerCase()}? Na ${business}, sempre orientamos nossos clientes a manterem uma rotina preventiva simples e eficaz.\n\nEvite soluções caseiras ou improvisadas que possam danificar ou diminuir a vida útil do procedimento. Além disso, manter a regularidade das visitas garante que você nunca seja pego de surpresa.\n\n📍 Atendemos com facilidade e estrutura completa em ${city}. Agende seu horário online em poucos cliques pelo link: ${bookingLink}!`,
        tags: `guia pratico ${city.toLowerCase()}, cuidados com ${primaryService.toLowerCase()}, dicas ${params.businessCategory.toLowerCase()}, manutencao preventiva ${city.toLowerCase()}, ${primaryService.toLowerCase()} de qualidade`,
        metaDescription: `Confira o guia prático de cuidados com ${primaryService.toLowerCase()} da ${business} em ${city}. Agende seu atendimento online com rapidez!`,
        ctaType: "booking",
        ctaLabel: "Agendar Horário Online",
        source: "fallback",
        pillar: params.pillar.name,
      };

    case "mito_vs_verdade":
      return {
        title: `🔍 Mito ou Verdade? O Que Você Precisa Saber Sobre ${primaryService}`,
        content: `Existem muitas dúvidas e mitos circulando sobre ${primaryService.toLowerCase()} e os serviços de ${params.businessCategory.toLowerCase()}. Um dos maiores equívocos é acreditar que qualquer procedimento rápido entrega a mesma segurança e durabilidade.\n\nA verdade é que o rigor técnico, os produtos de primeira linha e a atenção especializada fazem toda a diferença na entrega final. Na ${business}, trabalhamos com total transparência para que você tenha a melhor experiência.\n\nQuer tirar dúvidas ou fazer uma avaliação personalizada em ${city}? Acesse nossa agenda online: ${bookingLink}`,
        tags: `mito ou verdade ${primaryService.toLowerCase()}, duvidas sobre ${primaryService.toLowerCase()}, ${business.toLowerCase()} ${city.toLowerCase()}, transparencia ${params.businessCategory.toLowerCase()}, melhor de ${city.toLowerCase()}`,
        metaDescription: `Desvendamos os maiores mitos sobre ${primaryService.toLowerCase()}. Conheça a verdade com os especialistas da ${business} em ${city}.`,
        ctaType: "booking",
        ctaLabel: "Agendar Avaliação",
        source: "fallback",
        pillar: params.pillar.name,
      };

    case "sinais_alerta":
      return {
        title: `🚨 3 Sinais de Alerta: Quando Procurar ${primaryService} sem Adiar`,
        content: `Muitas vezes ignoramos os primeiros sinais de desgaste ou desconforto no dia a dia, mas quando se trata de ${params.businessCategory.toLowerCase()}, adiar o atendimento pode transformar um detalhe simples em uma grande dor de cabeça.\n\nSe você notou perda de rendimento, incômodo ou alteração na rotina, é o momento exato de buscar uma revisão especializada. Na ${business}, diagnosticamos e solucionamos tudo com rapidez e segurança comprovada.\n\n⚠️ Não espere a situação piorar! Vagas abertas para esta semana em ${city}: ${bookingLink}`,
        tags: `sinais de alerta ${city.toLowerCase()}, quando fazer ${primaryService.toLowerCase()}, urgencia ${params.businessCategory.toLowerCase()}, atendimento rapido ${city.toLowerCase()}, agendamento imediato`,
        metaDescription: `Identifique os sinais de alerta e saiba quando procurar ${primaryService.toLowerCase()} em ${city}. Agende com facilidade na ${business}.`,
        ctaType: "booking",
        ctaLabel: "Agendar com Urgência",
        source: "fallback",
        pillar: params.pillar.name,
      };

    case "bastidores_tecnologia":
      return {
        title: `⚙️ Bastidores da Excelência: A Precisão e Tecnologia na ${business}`,
        content: `O que torna o atendimento da ${business} referência em ${city}? A resposta está na dedicação dos nossos bastidores: processos bem alinhados, produtos homologados e ferramentas modernas que garantem o máximo padrão em ${primaryService.toLowerCase()} e ${secondService.toLowerCase()}.\n\nNão medimos esforços para que cada cliente se sinta seguro e receba um atendimento de nível superior do primeiro contato à finalização.\n\nVenha vivenciar esse padrão de qualidade na prática! Garanta seu horário pelo nosso portal digital: ${bookingLink}`,
        tags: `bastidores ${business.toLowerCase()}, tecnologia ${params.businessCategory.toLowerCase()}, ${primaryService.toLowerCase()} ${city.toLowerCase()}, referencia em ${city.toLowerCase()}, qualidade garantida`,
        metaDescription: `Conheça os bastidores e os padrões de excelência da ${business} para ${primaryService.toLowerCase()} em ${city}. Agende online!`,
        ctaType: "booking",
        ctaLabel: "Conhecer e Agendar",
        source: "fallback",
        pillar: params.pillar.name,
      };

    case "faq_cliente":
      return {
        title: `❓ Dúvida Frequente: Qual o Momento Certo de Fazer ${primaryService}?`,
        content: `Uma pergunta frequente que recebemos é: 'Qual é o momento ideal para agendar ${primaryService.toLowerCase()}?'\n\nA resposta ideal varia para cada perfil, mas o recomendado é realizar a manutenção periódica antes que surjam desconfortos ou falhas. Nossa equipe está sempre pronta para avaliar sua necessidade com cuidado e indicar o melhor plano de ação.\n\nQuer receber uma orientação sem compromisso? Reserve um horário com nossos especialistas em ${city}: ${bookingLink}`,
        tags: `perguntas frequentes ${params.businessCategory.toLowerCase()}, frequencia ${primaryService.toLowerCase()}, duvidas clientes ${city.toLowerCase()}, atendimento personalizado ${city.toLowerCase()}`,
        metaDescription: `Descubra a frequência ideal para ${primaryService.toLowerCase()} e tire suas dúvidas com a equipe da ${business} em ${city}.`,
        ctaType: "booking",
        ctaLabel: "Tirar Dúvidas e Agendar",
        source: "fallback",
        pillar: params.pillar.name,
      };

    case "economia_seguranca":
    default:
      return {
        title: `💰 Economia & Segurança: Por Que Cuidar de ${primaryService} Evita Gastos`,
        content: `Quem preza por economia inteligente sabe que a prevenção é o caminho mais seguro para proteger o bolso. Investir em ${primaryService.toLowerCase()} com profissionais qualificados na ${business} previne despesas emergenciais e garante tranquilidade.\n\nAlém de economizar tempo e evitar retrabalho, você tem a certeza de um serviço executado dentro dos mais altos padrões de segurança e durabilidade em ${city}.\n\nGaranta sua tranquilidade agora mesmo! Escolha a data ideal na nossa vitrine digital: ${bookingLink}`,
        tags: `economia e seguranca ${city.toLowerCase()}, custo beneficio ${primaryService.toLowerCase()}, prevencao inteligente ${city.toLowerCase()}, ${business.toLowerCase()}, agendamento rapido`,
        metaDescription: `Entenda como a manutenção preventiva de ${primaryService.toLowerCase()} gera economia e segurança na ${business} em ${city}.`,
        ctaType: "booking",
        ctaLabel: "Garantir Economia e Agendar",
        source: "fallback",
        pillar: params.pillar.name,
      };
  }
}

/**
 * Server Action: Gera Post Semanal Otimizado para SEO Local com IA
 * Com histórico negativo recente, rotação de pilares e prompt refinado.
 */
export async function generateLocalSeoPost(
  params?: GeneratePostParams
): Promise<GeneratePostResult> {
  try {
    const { data: tenantContext, error: tenantError } = await getAuthenticatedTenant();
    if (tenantError || !tenantContext) {
      return { success: false, error: tenantError || "Sessão expirada. Faça login novamente." };
    }

    const tenantId = tenantContext.tenantId;
    const supabase = await createClient();

    // 1. CONSULTAR HISTÓRICO RECENTE ANTES DE GERAR (Evita repetições)
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

    // 2. SISTEMA DE ROTAÇÃO DE ÂNGULOS / PILARES DE CONTEÚDO
    const selectedPillar =
      CONTENT_PILLARS.find((p) => p.id === params?.pillarId) ||
      CONTENT_PILLARS[Math.floor(Math.random() * CONTENT_PILLARS.length)];

    // 3. Busca dados do perfil do negócio
    const { data: profile } = await supabase
      .from("tenant_profiles")
      .select("name, business_category, address, phone_whatsapp")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    // 4. Busca lista de serviços cadastrados
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

    // 5. REFORÇAR O SYSTEM PROMPT DA IA (Gemini / OpenAI)
    const prompt = `Você é um especialista em SEO Local e Copywriting.
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

INSTRUÇÕES OBRIGATÓRIAS:
Retorne ESTRITAMENTE um objeto JSON válido (sem tags markdown de código e sem texto antes ou depois) com a seguinte estrutura:
{
  "title": "Título chamativo e inédito com emoji",
  "content": "Texto dividido em 2 a 3 parágrafos dinâmicos de 130 a 190 palavras com chamada final persuasiva",
  "tags": "termo cauda longa 1, termo cauda longa 2, termo cauda longa 3, termo cauda longa 4, termo cauda longa 5",
  "metaDescription": "Resumo de até 155 caracteres otimizado para o Google Snippet",
  "ctaType": "booking",
  "ctaLabel": "Agendar Horário Online"
}`;

    // Tenta Gemini primeiro
    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY;

    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 800,
            },
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            let cleanJsonStr = candidateText
              .replace(/```json/gi, "")
              .replace(/```/g, "")
              .trim();
            const firstBrace = cleanJsonStr.indexOf("{");
            const lastBrace = cleanJsonStr.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleanJsonStr = cleanJsonStr.substring(firstBrace, lastBrace + 1);
            }
            const parsed = JSON.parse(cleanJsonStr);
            if (parsed.title && parsed.content) {
              return {
                success: true,
                data: {
                  title: parsed.title,
                  content: parsed.content,
                  tags:
                    typeof parsed.tags === "string"
                      ? parsed.tags
                      : Array.isArray(parsed.tags)
                      ? parsed.tags.join(", ")
                      : "",
                  metaDescription: parsed.metaDescription || "",
                  ctaType: parsed.ctaType || "booking",
                  ctaLabel: parsed.ctaLabel || "Agendar Horário Online",
                  source: "gemini",
                  pillar: selectedPillar.name,
                },
              };
            }
          }
        }
      } catch (geminiErr) {
        console.warn("[generateLocalSeoPost] Erro na chamada Gemini, tentando alternativas:", geminiErr);
      }
    }

    // Tenta OpenAI se configurado
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Você é um especialista em SEO Local e Copywriting de alta conversão para estabelecimentos locais brasileiros. Responda apenas em formato JSON.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.85,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const contentStr = json.choices?.[0]?.message?.content;
          if (contentStr) {
            const parsed = JSON.parse(contentStr);
            if (parsed.title && parsed.content) {
              return {
                success: true,
                data: {
                  title: parsed.title,
                  content: parsed.content,
                  tags:
                    typeof parsed.tags === "string"
                      ? parsed.tags
                      : Array.isArray(parsed.tags)
                      ? parsed.tags.join(", ")
                      : "",
                  metaDescription: parsed.metaDescription || "",
                  ctaType: parsed.ctaType || "booking",
                  ctaLabel: parsed.ctaLabel || "Agendar Horário Online",
                  source: "openai",
                  pillar: selectedPillar.name,
                },
              };
            }
          }
        }
      } catch (openAiErr) {
        console.warn("[generateLocalSeoPost] Erro na chamada OpenAI:", openAiErr);
      }
    }

    // Fallback contextual avançado garantindo rotação e ineditismo
    const fallbackData = generateFallbackSeoPost({
      businessName,
      businessCategory,
      services,
      city: targetCity,
      slug,
      pillar: selectedPillar,
      topic: params?.focusTopic,
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
