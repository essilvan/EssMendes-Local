import { NextResponse } from "next/server";
import {
  generateLocalSeoPost,
  generatePostCoverImageAction,
} from "@/services/ai-post.actions";
import { generateContentWithGemini, extractValidJson } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          "Não foi possível gerar no momento (tempo limite de 15s excedido). Tente novamente em alguns segundos."
        )
      );
    }, timeoutMs);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY não configurada no servidor.",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Se solicitado apenas geração de imagem de capa com IA:
    if (body?.action === "generate_image") {
      const imgResult = await withTimeout(
        generatePostCoverImageAction({
          title: body.title,
          content: body.content,
          niche: body.niche,
          excludeImageUrls: body.excludeImageUrls,
        }),
        14500
      );
      return NextResponse.json(imgResult, {
        status: imgResult.success ? 200 : 500,
      });
    }

    // Se enviado promptText diretamente:
    if (body?.promptText) {
      const responseText = await withTimeout(
        generateContentWithGemini(body.promptText, { timeoutMs: 12000 }),
        14000
      );

      let cleanJson = (responseText || "")
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let postData: Record<string, any>;
      try {
        postData = JSON.parse(cleanJson);
      } catch {
        postData = extractValidJson(responseText, {
          title: "Dica Especializada para Você",
          content:
            "Confira nossas recomendações práticas e entre em contato com nossa equipe para agendar seu atendimento com qualidade e transparência.",
          keywords: "atendimento local, serviços especializados, qualidade",
          meta_description:
            "Dicas e recomendações especializadas para cuidar do que é importante para você.",
        });
      }

      return NextResponse.json({
        success: true,
        post: postData,
        generatedText: responseText,
        text: responseText,
      });
    }

    // Fluxo padrão de geração de post estruturado para SEO local (com timeout máximo de 15s)
    const result = await withTimeout(generateLocalSeoPost(body), 14500);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error ||
            "Não foi possível gerar no momento. Tente novamente em alguns segundos.",
        },
        { status: 500 }
      );
    }

    const postData = {
      title: result.data.title,
      content: result.data.content,
      tags: result.data.tags,
      keywords: result.data.tags,
      metaDescription: result.data.metaDescription,
      meta_description: result.data.metaDescription,
      ctaType: result.data.ctaType,
      cta_type: result.data.ctaType,
      ctaLabel: result.data.ctaLabel,
      cta_label: result.data.ctaLabel,
      imageUrl: result.data.imageUrl,
      image_url: result.data.imageUrl,
      pillar: result.data.pillar,
    };

    return NextResponse.json({
      success: true,
      data: result.data,
      post: postData,
    });
  } catch (err: any) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : String(err || "Não foi possível gerar no momento. Tente novamente em alguns segundos.");
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
