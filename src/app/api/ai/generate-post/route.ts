import { NextResponse } from "next/server";
import { generateLocalSeoPost } from "@/services/ai-post.actions";
import { generateContentWithGemini, extractValidJson } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY não configurada no servidor.",
        },
        { status: 200 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Se enviado promptText diretamente:
    if (body?.promptText) {
      const generatedText = await generateContentWithGemini(body.promptText);
      const postData = extractValidJson(generatedText);
      return NextResponse.json({
        success: true,
        post: postData,
        generatedText,
        text: generatedText,
      });
    }

    // Fluxo padrão de geração de post estruturado para SEO local
    const result = await generateLocalSeoPost(body);
    const postData = result.data
      ? {
          title: result.data.title,
          content: result.data.content,
          keywords: result.data.tags,
          meta_description: result.data.metaDescription,
          cta_type: result.data.ctaType,
          cta_label: result.data.ctaLabel,
        }
      : undefined;

    return NextResponse.json({
      ...result,
      post: postData,
    });
  } catch (err: any) {
    const errorMsg =
      err instanceof Error ? err.message : String(err || "Erro inesperado ao gerar post com IA.");
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 200 }
    );
  }
}
