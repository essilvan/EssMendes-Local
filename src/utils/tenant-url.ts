/**
 * Retorna a URL pública oficial do tenant no formato de subdomínio de produção:
 * https://${slug}.essmendes.com.br
 */
export function getTenantPublicUrl(slug: string, path: string = ""): string {
  const cleanSlug = slug.trim();
  const cleanPath = path ? (path.startsWith("/") || path.startsWith("#") ? path : `/${path}`) : "";
  return `https://${cleanSlug}.essmendes.com.br${cleanPath}`;
}

/**
 * Retorna o texto oficial formatado para exibição do subdomínio:
 * ${slug}.essmendes.com.br
 */
export function getTenantDisplayDomain(slug: string): string {
  const cleanSlug = slug.trim();
  return `${cleanSlug}.essmendes.com.br`;
}

