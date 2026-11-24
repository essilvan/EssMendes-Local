import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";

function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (
      authError ||
      !authContext ||
      (!authContext.isSuperAdmin && authContext.role !== "super_admin")
    ) {
      return NextResponse.json(
        { success: false, error: "Acesso restrito ao Super Admin." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === "string" ? body.leadId.trim() : "";

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "leadId não informado." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: lead, error: leadErr } = await supabase
      .from("prospecting_leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr || !lead) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    // Se já existe demo_slug e o tenant já existe, apenas retorna
    if (lead.demo_slug) {
      const { data: existingTenant } = await supabase
        .from("tenants")
        .select("id, slug")
        .eq("slug", lead.demo_slug)
        .maybeSingle();

      if (existingTenant) {
        return NextResponse.json({
          success: true,
          demoSlug: existingTenant.slug,
          demoUrl: `https://${existingTenant.slug}.essmendes.com.br/mesa/01`,
          alreadyExisted: true,
        });
      }
    }

    const baseSlug = `demo-${slugifyName(lead.business_name || "restaurante") || "bar"}`;
    let finalSlug = baseSlug;

    const { data: collision } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (collision) {
      finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 1. Cria tenant demonstrativo
    const { data: createdTenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        name: lead.business_name,
        slug: finalSlug,
        niche: "restaurant",
        theme_niche: "restaurant",
        primary_color: "#f59e0b",
        google_place_id: lead.place_id || null,
        google_rating: lead.rating ?? 4.8,
        google_reviews_count: lead.total_reviews ?? 42,
        google_review_url: lead.place_id
          ? `https://search.google.com/local/writereview?placeid=${lead.place_id}`
          : null,
        service_fee_enabled: true,
        service_fee_percent: 10,
        subscription_status: "trial",
        theme_settings: {
          template_id: "premium",
          niche: "restaurant",
          primary_color: "#f59e0b",
        },
      })
      .select("id, slug")
      .single();

    if (tenantErr || !createdTenant) {
      return NextResponse.json(
        {
          success: false,
          error: tenantErr?.message || "Erro ao criar tenant demonstrativo.",
        },
        { status: 500 }
      );
    }

    const tenantId = createdTenant.id;

    // 2. Cria perfil da vitrine
    await supabase.from("tenant_profiles").upsert(
      {
        tenant_id: tenantId,
        name: lead.business_name,
        description:
          "Cardápio digital inteligente com pedidos direto na mesa via QR Code.",
        editorial_summary: `Prévia exclusiva do cardápio digital e sistema de mesas do ${lead.business_name}. Peça direto pelo celular sem esperar na fila.`,
        phone_whatsapp: lead.phone || null,
        address: lead.address || null,
        primary_color: "#f59e0b",
        template_id: "premium",
        rating: lead.rating ?? 4.8,
        review_count: lead.total_reviews ?? 42,
      },
      { onConflict: "tenant_id" }
    );

    // 3. Cria categorias e 4 itens demonstrativos reais
    const { data: cats } = await supabase
      .from("menu_categories")
      .insert([
        { tenant_id: tenantId, name: "Bebidas", display_order: 1, is_active: true },
        { tenant_id: tenantId, name: "Pratos", display_order: 2, is_active: true },
        { tenant_id: tenantId, name: "Entradas", display_order: 3, is_active: true },
      ])
      .select("id, name");

    const catMap = new Map<string, string>();
    (cats || []).forEach((c: any) => catMap.set(c.name, c.id));

    await supabase.from("menu_items").insert([
      {
        tenant_id: tenantId,
        category_id: catMap.get("Bebidas") || null,
        category: "Bebidas",
        name: "Cerveja 600ml",
        description: "Garrafa 600ml trincando de gelada, servida com copos gelados.",
        price: 14.9,
        is_available: true,
      },
      {
        tenant_id: tenantId,
        category_id: catMap.get("Pratos") || null,
        category: "Pratos",
        name: "Espetinho de Carne Completo",
        description:
          "Espeto na brasa acompanhado de arroz branco, mandioca cozida, vinagrete e farofa crocante.",
        price: 24.9,
        is_available: true,
      },
      {
        tenant_id: tenantId,
        category_id: catMap.get("Entradas") || null,
        category: "Entradas",
        name: "Porção de Batata com Cheddar",
        description:
          "Batata frita sequinha e crocante coberta com creme de cheddar e bacon picado.",
        price: 32.0,
        is_available: true,
      },
      {
        tenant_id: tenantId,
        category_id: catMap.get("Bebidas") || null,
        category: "Bebidas",
        name: "Refrigerante Lata",
        description: "Lata 350ml bem gelada (Coca-Cola, Guaraná ou Sprite).",
        price: 6.5,
        is_available: true,
      },
    ]);

    // 4. Cria Mesa 01 padrão
    await supabase.from("restaurant_tables").insert({
      tenant_id: tenantId,
      table_number: "01",
      name: "Mesa 01",
      is_active: true,
    });

    // 5. Atualiza lead
    const nextStatus =
      lead.status === "new" || !lead.status ? "demo_created" : lead.status;
    await supabase
      .from("prospecting_leads")
      .update({
        demo_slug: finalSlug,
        status: nextStatus,
      })
      .eq("id", lead.id);

    return NextResponse.json({
      success: true,
      demoSlug: finalSlug,
      demoUrl: `https://${finalSlug}.essmendes.com.br/mesa/01`,
      status: nextStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro ao gerar vitrine de demonstração.",
      },
      { status: 500 }
    );
  }
}
