export interface GenerateGeminiOptions {
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

/**
 * Função de higienização defensiva antes do JSON.parse()
 * Remove cercas de markdown (```json), isola o objeto JSON entre chaves {}
 * e fornece fallback estruturado se o JSON estiver truncado ou malformado.
 */
export function extractValidJson(raw: string) {
  let clean = raw.trim();

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
    return JSON.parse(clean);
  } catch (err) {
    console.warn("Falha no JSON.parse direto, a usar fallback estruturado:", clean);
    return {
      title: clean.split("\n")[0].replace(/[#*"]/g, "").trim(),
      content: clean.replace(/[{}"\\]/g, "").trim(),
      keywords: "serviço especializado, atendimento, novidades",
      meta_description: clean.slice(0, 150).replace(/[#*"\n]/g, " ").trim(),
    };
  }
}

/**
 * Invoca a API do Google Generative AI (Gemini) descobrindo em tempo real os modelos suportados
 * via ListModels (v1beta/models) e forçando responseMimeType: application/json.
 */
export async function generateContentWithGemini(
  promptText: string,
  options?: GenerateGeminiOptions
): Promise<string> {
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  // 1. Descobrir dinamicamente os modelos disponíveis para esta chave
  let targetModel = "gemini-2.0-flash";
  let availableModels: string[] = [];

  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (listRes.ok) {
      const listData = await listRes.json();
      availableModels = (listData.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));

      // Prioriza modelos flash ou o primeiro disponível
      const foundFlash = availableModels.find((name: string) => name.includes("flash"));
      if (foundFlash) {
        targetModel = foundFlash;
      } else if (availableModels.length > 0) {
        targetModel = availableModels[0];
      }
    }
  } catch (e) {
    console.warn("Não foi possível listar modelos dinamicamente, usando fallback:", e);
  }

  // Monta lista de tentativa iniciando pelo modelo descoberto e outros disponíveis
  const candidateModels = Array.from(
    new Set([
      targetModel,
      ...availableModels.filter((m) => m !== targetModel),
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
    ])
  );

  let generatedText = "";
  let lastError: any = null;

  // 2. Chamar o modelo descoberto forçando resposta como JSON puro
  for (const modelToCall of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxOutputTokens ?? 1500,
            responseMimeType: options?.responseMimeType ?? "application/json",
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        generatedText = data.candidates[0].content.parts[0].text;
        break; // Sucesso, sai do loop
      } else {
        lastError =
          data?.error?.message || `Erro HTTP ${response.status} no modelo ${modelToCall}`;
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
