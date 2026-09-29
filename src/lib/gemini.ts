export interface GenerateGeminiOptions {
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Invoca a API do Google Generative AI (Gemini) descobrindo em tempo real os modelos suportados
 * via ListModels (v1beta/models) para evitar erros 404 de modelo inexistente.
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

  // 2. Chamar o modelo descoberto (com fallback nos demais modelos disponíveis se necessário)
  for (const modelToCall of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.8,
            maxOutputTokens: options?.maxOutputTokens ?? 1200,
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
