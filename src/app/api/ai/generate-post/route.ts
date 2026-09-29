import { NextResponse } from "next/server";
import { generateLocalSeoPost } from "@/services/ai-post.actions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Chave GEMINI_API_KEY ausente nas variáveis de ambiente.",
        },
        { status: 200 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = await generateLocalSeoPost(body);
    return NextResponse.json(result);
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
