import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GenerateGeminiOptions {
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Invoca a API do Google Generative AI (Gemini) utilizando o SDK oficial.
 * Remove prefixos incorretos e implementa fallback entre modelos suportados:
 * 1. gemini-1.5-flash (padrão)
 * 2. gemini-2.0-flash (fallback)
 * 3. gemini-1.5-pro (fallback avançado)
 */
export async function generateContentWithGemini(
  promptText: string,
  options?: GenerateGeminiOptions
): Promise<string> {
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Chave GEMINI_API_KEY ausente nas variáveis de ambiente.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Lista ordenada de modelos para tentativa e fallback automático
  const candidateModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  let lastError: Error | null = null;

  for (const modelCandidate of candidateModels) {
    try {
      // Garante remoção de qualquer prefixo "models/"
      const cleanModelName = modelCandidate.replace(/^models\//, "");

      const model = genAI.getGenerativeModel({
        model: cleanModelName,
        generationConfig: {
          temperature: options?.temperature ?? 0.8,
          maxOutputTokens: options?.maxOutputTokens ?? 1000,
        },
      });

      // Envio do payload com a string de texto simples conforme padrão do SDK
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();

      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[gemini] Falha com modelo ${modelCandidate}:`, lastError.message);

      // Se o erro indicar que o modelo não foi encontrado ou não é suportado, prossegue para o próximo da lista
      const isModelError =
        lastError.message.includes("is not found") ||
        lastError.message.includes("not supported") ||
        lastError.message.includes("404");

      if (!isModelError && candidateModels.indexOf(modelCandidate) === 0) {
        // Tenta o próximo modelo mesmo assim por tolerância a falhas temporárias
        continue;
      }
    }
  }

  throw lastError || new Error("Não foi possível gerar conteúdo com os modelos Gemini disponíveis.");
}
