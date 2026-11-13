"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedTenant } from "@/lib/supabase/tenant";
import type {
  MenuCategory,
  MenuItem,
  RestaurantTable,
  RestaurantOrder,
  RestaurantOrderItem,
  RestaurantOrderStatus,
  TenantProfessional,
} from "@/types";

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

const createMenuCategorySchema = z.object({
  name: z.string().min(2, "O nome da categoria deve ter pelo menos 2 caracteres."),
  description: z.string().optional().nullable(),
  display_order: z.coerce.number().int().optional().default(0),
});

const createMenuItemSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().optional().nullable(),
  category: z.string().min(1, "Selecione ou informe uma categoria.").default("Pratos"),
  name: z.string().min(2, "Informe o nome do prato ou bebida."),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Informe um preço válido."),
  image_url: z.string().optional().nullable(),
  is_available: z.boolean().optional().default(true),
});

const createRestaurantTableSchema = z.object({
  id: z.string().uuid().optional(),
  table_number: z.string().min(1, "Informe o número ou código da mesa (ex: 01)."),
  name: z.string().optional().nullable(),
  capacity: z.coerce.number().int().min(1).optional().default(4),
  waiter_id: z.string().optional().nullable(),
  assigned_staff_id: z.string().optional().nullable(),
});

const createTableOrderSchema = z.object({
  tenant_id: z.string().uuid("Estabelecimento inválido."),
  tenant_slug: z.string().optional(),
  table_number: z.string().min(1, "Mesa inválida."),
  customer_name: z.string().min(2, "Informe seu nome para identificar o pedido."),
  customer_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.coerce.number().min(0),
        quantity: z.coerce.number().int().min(1),
        notes: z.string().optional().nullable(),
      })
    )
    .min(1, "Adicione pelo menos 1 item ao pedido."),
});

// ============================================================================
// HELPERS DE NORMALIZAÇÃO E INSERÇÃO RESILIENTE
// ============================================================================

function normalizeCategory(row: any): MenuCategory {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name || row.title || "Categoria",
    description: row.description ?? null,
    display_order: Number(row.display_order ?? row.sort_order ?? 0),
    is_active: row.is_active !== false,
    created_at: row.created_at || new Date().toISOString(),
  };
}

function normalizeMenuItem(row: any, categoryMap?: Map<string, string>): MenuItem {
  const catId = row.category_id || null;
  const resolvedCategory =
    row.category ||
    row.category_name ||
    (catId && categoryMap?.get(catId)) ||
    "Pratos";

  const isAvail =
    typeof row.is_available === "boolean"
      ? row.is_available
      : typeof row.is_active === "boolean"
      ? row.is_active
      : true;

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    category_id: catId,
    category: resolvedCategory,
    name: row.name || row.title || "Item",
    description: row.description ?? null,
    price: Number(row.price ?? 0),
    image_url: row.image_url || row.photo_url || null,
    is_available: isAvail,
    is_active: isAvail,
    display_order: Number(row.display_order ?? row.sort_order ?? 0),
    created_at: row.created_at || new Date().toISOString(),
  };
}

function normalizeTable(
  row: any,
  professionalsMap?: Map<string, TenantProfessional>
): RestaurantTable {
  const waiterId =
    row.assigned_staff_id || row.waiter_id || row.professional_id || null;
  const linkedWaiter =
    waiterId && professionalsMap ? professionalsMap.get(waiterId) : null;
  const tableNum = String(row.table_number ?? row.number ?? "01").trim();

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    table_number: tableNum,
    name: row.name || row.label || `Mesa ${tableNum.padStart(2, "0")}`,
    capacity: Number(row.capacity ?? 4),
    waiter_id: waiterId,
    assigned_staff_id: waiterId,
    waiter_name: row.waiter_name || linkedWaiter?.name || null,
    waiter_phone: row.waiter_phone || linkedWaiter?.phone || null,
    is_active: row.is_active !== false,
    created_at: row.created_at || new Date().toISOString(),
  };
}

function normalizeOrder(row: any): RestaurantOrder {
  let parsedItems: RestaurantOrderItem[] = [];
  if (Array.isArray(row.items)) {
    parsedItems = row.items;
  } else if (typeof row.items === "string") {
    try {
      const p = JSON.parse(row.items);
      if (Array.isArray(p)) parsedItems = p;
    } catch {}
  }

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    table_id: row.table_id || null,
    table_number: String(row.table_number ?? row.table ?? "01"),
    customer_name: row.customer_name || row.client_name || "Cliente na Mesa",
    customer_phone: row.customer_phone || row.client_phone || null,
    items: parsedItems.map((it: any) => ({
      id: String(it.id || ""),
      name: String(it.name || "Item"),
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 1),
      notes: it.notes || null,
    })),
    notes: row.notes || row.observations || null,
    total_amount: Number(row.total_amount ?? row.total_price ?? row.total ?? 0),
    status: (row.status as RestaurantOrderStatus) || "pending",
    waiter_id: row.waiter_id || row.professional_id || null,
    waiter_name: row.waiter_name || null,
    waiter_phone: row.waiter_phone || null,
    created_at: row.created_at || new Date().toISOString(),
  };
}

function cleanWhatsAppDigits(raw?: string | null): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Executa insert resiliente removendo colunas inexistentes caso o banco reporte PGRST204.
 */
async function resilientInsert(
  supabase: any,
  table: string,
  payload: Record<string, any>
): Promise<{ data: any; error: any }> {
  const workingPayload = { ...payload };
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await supabase
      .from(table)
      .insert(workingPayload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return { data, error: null };
    }

    const msg = String(error.message || "");
    const match =
      msg.match(/Could not find the '([^']+)' column/i) ||
      msg.match(/column "([^"]+)" of relation/i);

    if (match && match[1] && match[1] in workingPayload) {
      delete workingPayload[match[1]];
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: { message: "Falha ao inserir registro após tentativas." } };
}

async function resilientUpdate(
  supabase: any,
  table: string,
  id: string,
  tenantId: string,
  payload: Record<string, any>
): Promise<{ data: any; error: any }> {
  const workingPayload = { ...payload };
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await supabase
      .from(table)
      .update(workingPayload)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .maybeSingle();

    if (!error) {
      return { data, error: null };
    }

    const msg = String(error.message || "");
    const match =
      msg.match(/Could not find the '([^']+)' column/i) ||
      msg.match(/column "([^"]+)" of relation/i);

    if (match && match[1] && match[1] in workingPayload) {
      delete workingPayload[match[1]];
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: { message: "Falha ao atualizar registro." } };
}

// ============================================================================
// 1. GESTÃO DO CARDÁPIO DIGITAL (CATEGORIAS & ITENS)
// ============================================================================

export async function getAdminMenuDataAction(): Promise<{
  success: boolean;
  data?: {
    categories: MenuCategory[];
    items: MenuItem[];
  };
  error?: string;
}> {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const tenantId = authContext.tenantId;

    const [catsRes, itemsRes] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
    ]);

    const categories = (catsRes.data || []).map(normalizeCategory);
    const categoryMap = new Map<string, string>();
    categories.forEach((c) => categoryMap.set(c.id, c.name));

    const items = (itemsRes.data || []).map((row: any) =>
      normalizeMenuItem(row, categoryMap)
    );

    return {
      success: true,
      data: { categories, items },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erro ao carregar cardápio.",
    };
  }
}

export async function createMenuCategoryAction(input: {
  name: string;
  description?: string;
  display_order?: number;
}): Promise<{ success: boolean; data?: MenuCategory; error?: string }> {
  try {
    const parsed = createMenuCategorySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Dados inválidos.",
      };
    }

    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const { data, error } = await resilientInsert(supabase, "menu_categories", {
      tenant_id: authContext.tenantId,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      display_order: parsed.data.display_order ?? 0,
      is_active: true,
    });

    if (error || !data) {
      return {
        success: false,
        error: error?.message || "Não foi possível criar a categoria.",
      };
    }

    revalidatePath("/admin/cardapio");
    if (authContext.tenant?.slug) {
      revalidatePath(`/${authContext.tenant.slug}`);
    }

    return { success: true, data: normalizeCategory(data) };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao criar categoria." };
  }
}

export async function deleteMenuCategoryAction(
  categoryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)
      .eq("tenant_id", authContext.tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/cardapio");
    if (authContext.tenant?.slug) {
      revalidatePath(`/${authContext.tenant.slug}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao remover categoria." };
  }
}

export async function saveMenuItemAction(input: {
  id?: string;
  category_id?: string | null;
  category?: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_available?: boolean;
}): Promise<{ success: boolean; data?: MenuItem; error?: string }> {
  try {
    const parsed = createMenuItemSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Dados do item inválidos.",
      };
    }

    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const tenantId = authContext.tenantId;

    // Se a categoria selecionada não tiver category_id UUID mas tiver nome, garante ou localiza na tabela menu_categories
    let resolvedCategoryId =
      parsed.data.category_id && parsed.data.category_id.length > 10
        ? parsed.data.category_id
        : null;
    const categoryName = parsed.data.category.trim() || "Pratos";

    if (!resolvedCategoryId && categoryName) {
      const { data: existingCat } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("tenant_id", tenantId)
        .ilike("name", categoryName)
        .maybeSingle();

      if (existingCat?.id) {
        resolvedCategoryId = existingCat.id;
      } else {
        const { data: createdCat } = await resilientInsert(supabase, "menu_categories", {
          tenant_id: tenantId,
          name: categoryName,
          is_active: true,
        });
        if (createdCat?.id) {
          resolvedCategoryId = createdCat.id;
        }
      }
    }

    const payload: Record<string, any> = {
      tenant_id: tenantId,
      category_id: resolvedCategoryId,
      category: categoryName,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      price: Number(parsed.data.price),
      image_url: parsed.data.image_url || null,
      photo_url: parsed.data.image_url || null,
      is_available: parsed.data.is_available ?? true,
      is_active: parsed.data.is_available ?? true,
    };

    let resultRow: any = null;

    if (parsed.data.id) {
      const { data, error } = await resilientUpdate(
        supabase,
        "menu_items",
        parsed.data.id,
        tenantId,
        payload
      );
      if (error) {
        return { success: false, error: error.message };
      }
      resultRow = data;
    } else {
      const { data, error } = await resilientInsert(supabase, "menu_items", payload);
      if (error) {
        return { success: false, error: error.message };
      }
      resultRow = data;
    }

    revalidatePath("/admin/cardapio");
    if (authContext.tenant?.slug) {
      revalidatePath(`/${authContext.tenant.slug}`);
    }

    return {
      success: true,
      data: normalizeMenuItem(resultRow || payload),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erro ao salvar item do cardápio.",
    };
  }
}

export async function toggleMenuItemAvailabilityAction(
  itemId: string,
  isAvailable: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const { error } = await resilientUpdate(
      supabase,
      "menu_items",
      itemId,
      authContext.tenantId,
      {
        is_available: isAvailable,
        is_active: isAvailable,
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/cardapio");
    if (authContext.tenant?.slug) {
      revalidatePath(`/${authContext.tenant.slug}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao alterar status do item." };
  }
}

export async function deleteMenuItemAction(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("tenant_id", authContext.tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/cardapio");
    if (authContext.tenant?.slug) {
      revalidatePath(`/${authContext.tenant.slug}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao excluir item." };
  }
}

// ============================================================================
// 2. GESTÃO DE MESAS & GARÇONS (/admin/mesas)
// ============================================================================

export async function getAdminTablesDataAction(): Promise<{
  success: boolean;
  data?: {
    tables: RestaurantTable[];
    professionals: TenantProfessional[];
    tenantSlug: string;
    tenantName: string;
  };
  error?: string;
}> {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const tenantId = authContext.tenantId;

    const [tablesRes, profsRes] = await Promise.all([
      supabase
        .from("restaurant_tables")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("table_number", { ascending: true }),
      supabase
        .from("tenant_professionals")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    const professionals: TenantProfessional[] = (profsRes.data || []).map((p: any) => ({
      id: p.id,
      tenant_id: p.tenant_id,
      name: p.name,
      phone: p.phone || "",
      role_title: p.role_title || p.specialty || "Garçom / Atendimento",
      specialty: p.specialty || p.role_title || "Garçom / Atendimento",
      avatar_url: p.avatar_url || null,
      is_active: p.is_active !== false,
      created_at: p.created_at,
    }));

    const profMap = new Map<string, TenantProfessional>();
    professionals.forEach((p) => profMap.set(p.id, p));

    const tables = (tablesRes.data || []).map((row: any) =>
      normalizeTable(row, profMap)
    );

    return {
      success: true,
      data: {
        tables,
        professionals,
        tenantSlug: authContext.tenant?.slug || "restaurante",
        tenantName: authContext.tenant?.name || "Restaurante",
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erro ao carregar mesas e garçons.",
    };
  }
}

export async function saveRestaurantTableAction(input: {
  id?: string;
  table_number: string;
  name?: string | null;
  capacity?: number;
  waiter_id?: string | null;
  assigned_staff_id?: string | null;
}): Promise<{ success: boolean; data?: RestaurantTable; error?: string }> {
  try {
    const parsed = createRestaurantTableSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Dados da mesa inválidos.",
      };
    }

    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const tenantId = authContext.tenantId;

    let waiterName: string | null = null;
    let waiterPhone: string | null = null;
    const rawStaffId =
      parsed.data.assigned_staff_id !== undefined
        ? parsed.data.assigned_staff_id
        : parsed.data.waiter_id;
    const cleanWaiterId =
      rawStaffId && rawStaffId.trim() !== "" ? rawStaffId.trim() : null;

    if (cleanWaiterId) {
      const { data: waiterRow } = await supabase
        .from("tenant_professionals")
        .select("id, name, phone")
        .eq("id", cleanWaiterId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (waiterRow) {
        waiterName = waiterRow.name || null;
        waiterPhone = waiterRow.phone || null;
      }
    }

    const cleanNum = parsed.data.table_number.trim();
    const displayName =
      parsed.data.name?.trim() || `Mesa ${cleanNum.padStart(2, "0")}`;

    const payload: Record<string, any> = {
      tenant_id: tenantId,
      table_number: cleanNum,
      assigned_staff_id: cleanWaiterId,
      label: displayName,
      name: displayName,
      capacity: parsed.data.capacity || 4,
      waiter_id: cleanWaiterId,
      professional_id: cleanWaiterId,
      waiter_name: waiterName,
      waiter_phone: waiterPhone,
      is_active: true,
    };

    let resultRow: any = null;
    if (parsed.data.id) {
      const { data, error } = await resilientUpdate(
        supabase,
        "restaurant_tables",
        parsed.data.id,
        tenantId,
        payload
      );
      if (error) {
        return { success: false, error: error.message };
      }
      resultRow = data;
    } else {
      const { data, error } = await resilientInsert(
        supabase,
        "restaurant_tables",
        payload
      );
      if (error) {
        return { success: false, error: error.message };
      }
      resultRow = data;
    }

    const normalized = normalizeTable(resultRow || payload);
    if (cleanWaiterId && waiterName) {
      normalized.waiter_id = cleanWaiterId;
      normalized.assigned_staff_id = cleanWaiterId;
      normalized.waiter_name = waiterName;
      normalized.waiter_phone = waiterPhone;
    }

    revalidatePath("/admin/mesas");
    return {
      success: true,
      data: normalized,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erro ao salvar mesa.",
    };
  }
}

export async function deleteRestaurantTableAction(
  tableId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("restaurant_tables")
      .delete()
      .eq("id", tableId)
      .eq("tenant_id", authContext.tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/mesas");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao remover mesa." };
  }
}

// ============================================================================
// 3. GESTÃO DE PEDIDOS DA MESA (/admin/pedidos)
// ============================================================================

export async function getAdminOrdersDataAction(): Promise<{
  success: boolean;
  data?: RestaurantOrder[];
  error?: string;
}> {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("restaurant_orders")
      .select("*")
      .eq("tenant_id", authContext.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data || []).map(normalizeOrder),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erro ao carregar pedidos das mesas.",
    };
  }
}

export async function updateRestaurantOrderStatusAction(
  orderId: string,
  status: RestaurantOrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: authContext, error: authError } = await getAuthenticatedTenant();
    if (authError || !authContext) {
      return { success: false, error: authError || "Não autenticado." };
    }

    const supabase = await createClient();
    const { error } = await resilientUpdate(
      supabase,
      "restaurant_orders",
      orderId,
      authContext.tenantId,
      { status }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erro ao atualizar status do pedido.",
    };
  }
}

// ============================================================================
// 4. AÇÕES PÚBLICAS (VITRINE & QR CODE DA MESA /[slug]/mesa/[tableNumber])
// ============================================================================

export async function getPublicRestaurantMenuAction(tenantId: string): Promise<{
  categories: MenuCategory[];
  items: MenuItem[];
}> {
  try {
    const supabase = await createClient();
    const [catsRes, itemsRes] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
    ]);

    const categories = (catsRes.data || [])
      .map(normalizeCategory)
      .filter((c) => c.is_active !== false);

    const categoryMap = new Map<string, string>();
    categories.forEach((c) => categoryMap.set(c.id, c.name));

    const items = (itemsRes.data || [])
      .map((row: any) => normalizeMenuItem(row, categoryMap))
      .filter((i) => i.is_available !== false && i.is_active !== false);

    return { categories, items };
  } catch {
    return { categories: [], items: [] };
  }
}

export async function createPublicTableOrderAction(
  rawInput: z.infer<typeof createTableOrderSchema>
): Promise<{
  success: boolean;
  data?: {
    orderId?: string;
    whatsappUrl: string;
    waiterName?: string | null;
    totalAmount: number;
  };
  error?: string;
}> {
  try {
    const parsed = createTableOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Verifique os dados do pedido.",
      };
    }

    const { tenant_id, table_number, customer_name, customer_phone, notes, items } =
      parsed.data;

    const supabase = await createClient();

    // 1. Calcula o total do pedido
    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    // 2. Busca a mesa em restaurant_tables para identificar o garçom vinculado
    const cleanTableNumber = table_number.trim();
    const { data: tableRows } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("tenant_id", tenant_id);

    const matchedTable = (tableRows || []).find((r: any) => {
      const rNum = String(r.table_number ?? r.number ?? "").trim().toLowerCase();
      const target = cleanTableNumber.toLowerCase();
      return (
        rNum === target ||
        rNum.replace(/^0+/, "") === target.replace(/^0+/, "") ||
        `mesa ${rNum}` === target
      );
    });

    let waiterId: string | null =
      matchedTable?.assigned_staff_id ||
      matchedTable?.waiter_id ||
      matchedTable?.professional_id ||
      null;
    let waiterName: string | null = matchedTable?.waiter_name || null;
    let waiterPhone: string | null = matchedTable?.waiter_phone || null;

    if (waiterId && !waiterPhone) {
      const { data: waiterProf } = await supabase
        .from("tenant_professionals")
        .select("id, name, phone")
        .eq("id", waiterId)
        .maybeSingle();

      if (waiterProf) {
        waiterName = waiterName || waiterProf.name || null;
        waiterPhone = waiterProf.phone || null;
      }
    }

    // 3. Fallback: busca WhatsApp principal do restaurante (tenant.whatsapp / tenant.phone / tenant_profiles.phone_whatsapp)
    let fallbackRestaurantPhone = "";
    const [{ data: tenantRow }, { data: profileRow }] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", tenant_id).maybeSingle(),
      supabase
        .from("tenant_profiles")
        .select("phone_whatsapp, phone")
        .eq("tenant_id", tenant_id)
        .maybeSingle(),
    ]);

    fallbackRestaurantPhone =
      (tenantRow as any)?.whatsapp ||
      (tenantRow as any)?.phone ||
      profileRow?.phone_whatsapp ||
      profileRow?.phone ||
      "";

    // 4. Salva o pedido em restaurant_orders com status 'pending'
    const orderPayload: Record<string, any> = {
      tenant_id,
      table_id: matchedTable?.id || null,
      table_number: cleanTableNumber,
      customer_name: customer_name.trim(),
      client_name: customer_name.trim(),
      customer_phone: customer_phone?.trim() || null,
      items,
      notes: notes?.trim() || null,
      observations: notes?.trim() || null,
      total_amount: totalAmount,
      total_price: totalAmount,
      total: totalAmount,
      status: "pending",
      waiter_id: waiterId,
      waiter_name: waiterName,
      waiter_phone: waiterPhone,
    };

    const { data: savedOrder } = await resilientInsert(
      supabase,
      "restaurant_orders",
      orderPayload
    );

    // 5. Monta a mensagem formatada para o WhatsApp do Garçom (ou fallback do Restaurante)
    const targetCleanPhone =
      cleanWhatsAppDigits(waiterPhone) || cleanWhatsAppDigits(fallbackRestaurantPhone);

    const itemLines = items
      .map((item) => {
        const lineSubtotal = (Number(item.price) * Number(item.quantity))
          .toFixed(2)
          .replace(".", ",");
        const itemNote = item.notes ? ` [${item.notes}]` : "";
        return `- ${item.quantity}x ${item.name}${itemNote} (R$ ${lineSubtotal})`;
      })
      .join("\n");

    const formattedTotal = totalAmount.toFixed(2).replace(".", ",");
    const obsText = notes?.trim() ? notes.trim() : "Nenhuma";

    const whatsappMessage = [
      `🔔 *Novo Pedido - Mesa ${cleanTableNumber}*`,
      `Cliente: ${customer_name.trim()}`,
      `Itens:`,
      itemLines,
      `Obs: ${obsText}`,
      `Total: R$ ${formattedTotal}`,
    ].join("\n");

    const encodedText = encodeURIComponent(whatsappMessage);
    const whatsappUrl = targetCleanPhone
      ? `https://wa.me/55${targetCleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    revalidatePath("/admin/pedidos");

    return {
      success: true,
      data: {
        orderId: savedOrder?.id,
        whatsappUrl,
        waiterName,
        totalAmount,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Não foi possível enviar o pedido.",
    };
  }
}

