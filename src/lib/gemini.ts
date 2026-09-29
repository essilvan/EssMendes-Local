export interface GenerateGeminiOptions {
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Invoca a API do Google Generative AI (Gemini) diretamente via fetch sem dependência do SDK.
 * Modelos em ordem de preferência: gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash-latest
 */
export async function generateContentWithGemini(
  promptText: string,
  options?: GenerateGeminiOptions
): Promise<string> {
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
  }

  // Modelos em ordem de preferência
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
  ];
  let generatedText = "";
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
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
        lastError = data?.error?.message || "Resposta inválida da API do Gemini";
        console.warn(`[gemini] Falha com modelo ${modelName}:`, lastError);
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[gemini] Erro de rede com modelo ${modelName}:`, lastError);
    }
  }

  if (!generatedText) {
    throw new Error(`Falha ao gerar post com a IA: ${lastError}`);
  }

  return generatedText.trim();
}
