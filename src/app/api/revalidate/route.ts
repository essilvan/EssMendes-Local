import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawSlug = typeof body?.slug === "string" ? body.slug.trim() : "";

    if (!rawSlug) {
      return NextResponse.json(
        { revalidated: false, error: "Slug não informado." },
        { status: 400 }
      );
    }

    const cleanSlug = rawSlug.replace(/^\/+/, "");
    revalidatePath(`/${cleanSlug}`);
    revalidatePath(`/${cleanSlug}`, "layout");

    return NextResponse.json({
      revalidated: true,
      slug: cleanSlug,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { revalidated: false, error: err?.message || "Erro ao revalidar cache." },
      { status: 500 }
    );
  }
}

