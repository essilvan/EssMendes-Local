export interface GenerateGeminiOptions {
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, any>;
  timeoutMs?: number;
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
 * Remove cercas de markdown (```json e ```), isola o objeto JSON entre chaves {}
 * e, se o parse falhar, utiliza extração segura ou fallback estruturado sem lançar exceção não tratada.
 */
export function extractValidJson(
  responseText: string,
  fallbackData?: {
    title?: string;
    content?: string;
    keywords?: string;
    meta_description?: string;
  }
): Record<string, any> {
  let cleanJson = (responseText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Isola do primeiro '{' até ao último '}'
  const firstBrace = cleanJson.indexOf("{");
  const lastBrace = cleanJson.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleanJson);
    if (parsed && typeof parsed === "object") {
      return {
        ...parsed,
        title: sanitizeAiText(parsed.title || fallbackData?.title || ""),
        content: sanitizeAiText(parsed.content || fallbackData?.content || ""),
        keywords:
          typeof parsed.keywords === "string"
            ? sanitizeAiText(parsed.keywords)
            : Array.isArray(parsed.keywords)
            ? parsed.keywords.map((k: string) => sanitizeAiText(k)).join(", ")
            : fallbackData?.keywords || "",
        meta_description: sanitizeAiText(
          parsed.meta_description ||
            parsed.metaDescription ||
            fallbackData?.meta_description ||
            ""
        ),
      };
    }
  } catch (err) {
    console.warn("[extractValidJson] Falha no JSON.parse direto, acionando parser de contingência...");
  }

  // Extração segura campo a campo por regex caso o JSON tenha alguma quebra de linha não escapada
  const extractField = (key: string): string => {
    const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "i");
    const match = cleanJson.match(regex);
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

  const title = extractField("title") || fallbackData?.title || "";
  const content = extractField("content") || fallbackData?.content || "";
  const keywords =
    extractField("keywords") ||
    extractField("tags") ||
    fallbackData?.keywords ||
    "";
  const meta_description =
    extractField("meta_description") ||
    extractField("metaDescription") ||
    fallbackData?.meta_description ||
    "";
  const cta_type = extractField("cta_type") || extractField("ctaType");
  const cta_label = extractField("cta_label") || extractField("ctaLabel");

  return {
    title,
    content,
    keywords,
    meta_description,
    cta_type: cta_type || undefined,
    cta_label: cta_label || undefined,
  };
}

/**
 * Invoca a API do Google Generative AI (Gemini) com timeout estrito (máx 12s)
 * para nunca travar a requisição no servidor.
 */
export async function generateContentWithGemini(
  promptText: string,
  options?: GenerateGeminiOptions
): Promise<string> {
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  const candidateModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
  ];

  const totalTimeoutMs = options?.timeoutMs ?? 12000;
  const startedAt = Date.now();
  let generatedText = "";
  let lastError: any = null;

  for (const modelToCall of candidateModels) {
    const elapsed = Date.now() - startedAt;
    const remainingMs = totalTimeoutMs - elapsed;
    if (remainingMs <= 1000) {
      break;
    }

    const controller = new AbortController();
    const perModelTimeout = Math.min(remainingMs, 7500);
    const timer = setTimeout(() => controller.abort(), perModelTimeout);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:generateContent?key=${apiKey}`;

      const generationConfig: Record<string, any> = {
        temperature: options?.temperature ?? 0.75,
        maxOutputTokens: options?.maxOutputTokens ?? 2048,
        responseMimeType: options?.responseMimeType ?? "application/json",
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.candidates?.[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        const jsonPart =
          parts.find(
            (p: any) => typeof p.text === "string" && p.text.includes("{")
          ) || parts[parts.length - 1];

        if (jsonPart?.text) {
          generatedText = jsonPart.text;
          clearTimeout(timer);
          break;
        }
      } else {
        lastError =
          data?.error?.message ||
          `Erro HTTP ${response.status} no modelo ${modelToCall}`;
        console.warn(`[gemini] Falha com modelo ${modelToCall}:`, lastError);
      }
    } catch (err: any) {
      lastError =
        err?.name === "AbortError"
          ? `Timeout ao aguardar resposta do modelo ${modelToCall}`
          : err?.message || String(err);
      console.warn(`[gemini] Exceção com modelo ${modelToCall}:`, lastError);
    } finally {
      clearTimeout(timer);
    }
  }

  if (!generatedText) {
    throw new Error(lastError || "A IA não retornou conteúdo textual dentro do tempo limite.");
  }

  return generatedText.trim();
}
