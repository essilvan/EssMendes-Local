import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware para proteção de rotas e separação entre Super Admin e Tenant Owner
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Aplica validação estrita em rotas administrativas
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/admin")) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Se não estiver autenticado, redireciona para login
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Proteção da rota Master (/super-admin)
    if (pathname.startsWith("/super-admin")) {
      const isMetadataSuperAdmin =
        user.user_metadata?.role === "super_admin" ||
        user.app_metadata?.role === "super_admin";

      const envAdmins = (
        process.env.SUPER_ADMIN_EMAILS ||
        process.env.SUPER_ADMIN_EMAIL ||
        "admin@essmendes.com,superadmin@essmendes.com,contato@essmendes.com.br"
      )
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const isEmailSuperAdmin =
        !!user.email && envAdmins.includes(user.email.toLowerCase());

      // Se for tenant_owner tentando acessar /super-admin, redireciona para seu /admin
      if (!isMetadataSuperAdmin && !isEmailSuperAdmin) {
        // Checagem rápida de tenant_users se aplicável
        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (tenantUser?.role !== "super_admin") {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
      }
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/super-admin/:path*", "/admin/:path*"],
};
