export interface GenerateGeminiOptions {
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, any>;
}

/**
 * Remove frases vazadas de engenharia de prompt, placeholders ou instruções em inglês
 */
export function sanitizeAiText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/SEO Local Specialist and Copywriter[.:,-]?\s*/gi, "")
    .replace(/SEO Specialist[.:,-]?\s*/gi, "")
    .replace(/Copywriter[.:,-]?\s*/gi, "")
    .replace(/will use a placeholder[^.\n]*[.\n]?/gi, "")
    .replace(/\[placeholder[^\]]*\]/gi, "")
    .replace(/\(placeholder[^)]*\)/gi, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim();
}

/**
 * Função de higienização defensiva antes do JSON.parse()
 * Remove cercas de markdown (```json), isola o objeto JSON entre chaves {}
 * e extrai campos individualmente caso o JSON tenha sofrido corte.
 */
export function extractValidJson(raw: string): Record<string, any> {
  let clean = (raw || "").trim();

  // Remove cercas de código markdown se vierem incluídas
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  // Isola do primeiro '{' até ao último '}'
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === "object") {
      return {
        ...parsed,
        title: sanitizeAiText(parsed.title || ""),
        content: sanitizeAiText(parsed.content || ""),
        keywords:
          typeof parsed.keywords === "string"
            ? sanitizeAiText(parsed.keywords)
            : parsed.keywords,
        meta_description: sanitizeAiText(
          parsed.meta_description || parsed.metaDescription || ""
        ),
      };
    }
  } catch (err) {
    console.warn("[extractValidJson] Tentando extração por regex de campos JSON...");
  }

  // Extração segura campo a campo por regex caso o JSON tenha alguma quebra de linha não escapada
  const extractField = (key: string): string => {
    const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "i");
    const match = clean.match(regex);
    if (match?.[1]) {
      return sanitizeAiText(
        match[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\")
      );
    }
    return "";
  };

  const title = extractField("title");
  const content = extractField("content");
  const keywords = extractField("keywords") || extractField("tags");
  const meta_description =
    extractField("meta_description") || extractField("metaDescription");
  const cta_type = extractField("cta_type") || extractField("ctaType");
  const cta_label = extractField("cta_label") || extractField("ctaLabel");

  if (title && content) {
    return {
      title,
      content,
      keywords,
      meta_description,
      cta_type: cta_type || undefined,
      cta_label: cta_label || undefined,
    };
  }

  throw new Error(
    "A resposta da IA não retornou um formato JSON válido. Tente novamente."
  );
}

/**
 * Invoca a API do Google Generative AI (Gemini) priorizando modelos estáveis e rápidos
 * e forçando responseMimeType: application/json.
 */
export async function generateContentWithGemini(
  promptText: string,
  options?: GenerateGeminiOptions
): Promise<string> {
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  let availableModels: string[] = [];

  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (listRes.ok) {
      const listData = await listRes.json();
      availableModels = (listData.models || [])
        .filter((m: any) =>
          m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m: any) => m.name.replace("models/", ""));
    }
  } catch (e) {
    console.warn("Não foi possível listar modelos dinamicamente:", e);
  }

  // Prioriza gemini-2.0-flash e gemini-1.5-flash para JSON rápido sem desperdício de tokens de raciocínio
  const preferredOrder = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.5-flash",
  ];

  const candidateModels = Array.from(
    new Set([
      ...preferredOrder.filter(
        (m) => availableModels.length === 0 || availableModels.includes(m)
      ),
      ...availableModels.filter((m) => m.includes("flash")),
      ...preferredOrder,
    ])
  );

  let generatedText = "";
  let lastError: any = null;

  for (const modelToCall of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:generateContent?key=${apiKey}`;

      const generationConfig: Record<string, any> = {
        temperature: options?.temperature ?? 0.65,
        maxOutputTokens: options?.maxOutputTokens ?? 3072,
        responseMimeType: options?.responseMimeType ?? "application/json",
      };

      if (options?.responseSchema) {
        generationConfig.responseSchema = options.responseSchema;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig,
        }),
      });

      const data = await response.json();

      if (response.ok && data?.candidates?.[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        // Concatena ou pega a parte que contém o JSON
        const jsonPart =
          parts.find(
            (p: any) => typeof p.text === "string" && p.text.includes("{")
          ) || parts[parts.length - 1];

        if (jsonPart?.text) {
          generatedText = jsonPart.text;
          break;
        }
      } else {
        lastError =
          data?.error?.message ||
          `Erro HTTP ${response.status} no modelo ${modelToCall}`;
        console.warn(`[gemini] Falha com modelo ${modelToCall}:`, lastError);
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[gemini] Exceção com modelo ${modelToCall}:`, lastError);
    }
  }

  if (!generatedText) {
    throw new Error(lastError || "A IA não retornou conteúdo textual válido.");
  }

  return generatedText.trim();
}
