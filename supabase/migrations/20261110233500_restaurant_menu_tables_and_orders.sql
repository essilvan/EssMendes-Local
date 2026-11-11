-- ============================================================================
-- Migração: Ecossistema de Gastronomia (Restaurante / Bar)
-- Tabelas: menu_categories, menu_items, restaurant_tables, restaurant_orders
-- ============================================================================

-- 1. Categorias do Cardápio Digital (menu_categories)
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_tenant_id ON public.menu_categories(tenant_id);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'menu_categories' AND policyname = 'Leitura publica de menu_categories'
    ) THEN
        CREATE POLICY "Leitura publica de menu_categories"
        ON public.menu_categories
        FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'menu_categories' AND policyname = 'Membros do tenant gerenciam menu_categories'
    ) THEN
        CREATE POLICY "Membros do tenant gerenciam menu_categories"
        ON public.menu_categories
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = menu_categories.tenant_id
                AND tu.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = menu_categories.tenant_id
                AND tu.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 2. Itens / Pratos do Cardápio Digital (menu_items)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'Pratos',
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_id ON public.menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'menu_items' AND policyname = 'Leitura publica de menu_items'
    ) THEN
        CREATE POLICY "Leitura publica de menu_items"
        ON public.menu_items
        FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'menu_items' AND policyname = 'Membros do tenant gerenciam menu_items'
    ) THEN
        CREATE POLICY "Membros do tenant gerenciam menu_items"
        ON public.menu_items
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = menu_items.tenant_id
                AND tu.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = menu_items.tenant_id
                AND tu.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 3. Mesas & Vinculação com Garçons (restaurant_tables)
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    name TEXT,
    capacity INTEGER DEFAULT 4,
    waiter_id UUID,
    waiter_name TEXT,
    waiter_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_tenant_id ON public.restaurant_tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_number ON public.restaurant_tables(tenant_id, table_number);
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'restaurant_tables' AND policyname = 'Leitura publica de restaurant_tables'
    ) THEN
        CREATE POLICY "Leitura publica de restaurant_tables"
        ON public.restaurant_tables
        FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'restaurant_tables' AND policyname = 'Membros do tenant gerenciam restaurant_tables'
    ) THEN
        CREATE POLICY "Membros do tenant gerenciam restaurant_tables"
        ON public.restaurant_tables
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = restaurant_tables.tenant_id
                AND tu.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = restaurant_tables.tenant_id
                AND tu.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- 4. Pedidos da Mesa (restaurant_orders)
CREATE TABLE IF NOT EXISTS public.restaurant_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    table_number TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    waiter_id UUID,
    waiter_name TEXT,
    waiter_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_orders_tenant_id ON public.restaurant_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_status ON public.restaurant_orders(tenant_id, status);
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'restaurant_orders' AND policyname = 'Clientes podem enviar pedido da mesa'
    ) THEN
        CREATE POLICY "Clientes podem enviar pedido da mesa"
        ON public.restaurant_orders
        FOR INSERT
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'restaurant_orders' AND policyname = 'Membros do tenant gerenciam restaurant_orders'
    ) THEN
        CREATE POLICY "Membros do tenant gerenciam restaurant_orders"
        ON public.restaurant_orders
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = restaurant_orders.tenant_id
                AND tu.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = restaurant_orders.tenant_id
                AND tu.user_id = auth.uid()
            )
        );
    END IF;
END $$;

