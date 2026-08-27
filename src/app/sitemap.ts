import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://local.essmendes.com.br';

  try {
    const supabase = await createClient();
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[sitemap] Erro ao buscar tenants no Supabase:', error);
    }

    const tenantEntries: MetadataRoute.Sitemap = (tenants || []).map((t) => ({
      url: `${baseUrl}/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/diagnostico`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      ...tenantEntries,
    ];
  } catch (err) {
    console.error('[sitemap] Falha ao gerar sitemap dinâmico:', err);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];
  }
}
