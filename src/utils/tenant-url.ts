/**
 * Retorna a URL pública completa do tenant no formato oficial de subdomínio wildcard:
 * - Em desenvolvimento local (se janela do browser ou env for localhost/127.0.0.1): http://${slug}.localhost:3000
 * - Em produção: https://${slug}.essmendes.com.br
 */
export function getTenantPublicUrl(slug: string, path: string = ""): string {
  const cleanSlug = slug.trim();
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";

  if (typeof window !== "undefined") {
    const host = window.location.host;
    const protocol = window.location.protocol;
    
    // Se estiver rodando localmente (ex: localhost:3000 ou 127.0.0.1:3000)
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${protocol}//${cleanSlug}.localhost${port}${cleanPath}`;
    }
  }

  // No servidor (SSR) ou produção:
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    try {
      const parsed = new URL(appUrl);
      const port = parsed.port ? `:${parsed.port}` : "";
      return `${parsed.protocol}//${cleanSlug}.localhost${port}${cleanPath}`;
    } catch {
      return `http://${cleanSlug}.localhost:3000${cleanPath}`;
    }
  }

  return `https://${cleanSlug}.essmendes.com.br${cleanPath}`;
}

/**
 * Retorna o texto formatado para exibição do subdomínio (ex: slug.essmendes.com.br)
 */
export function getTenantDisplayDomain(slug: string): string {
  const cleanSlug = slug.trim();

  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${cleanSlug}.localhost${port}`;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    try {
      const parsed = new URL(appUrl);
      const port = parsed.port ? `:${parsed.port}` : "";
      return `${cleanSlug}.localhost${port}`;
    } catch {
      return `${cleanSlug}.localhost:3000`;
    }
  }

  return `${cleanSlug}.essmendes.com.br`;
}
