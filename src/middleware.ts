import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isAdminPage = pathname.startsWith('/admin');
  const isSuperAdminPage = pathname.startsWith('/superadmin');

  // 1. Se estiver tentando entrar no SuperAdmin ou Admin e não estiver logado -> Login
  if ((isSuperAdminPage || isAdminPage) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Se estiver logado, verificar se é Super Admin
  let isMaster = false;
  if (user) {
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('email', user.email)
      .single();
    if (superAdmin) isMaster = true;
  }

  // 3. Regras de redirecionamento para Logados
  if (user) {
    // Se logado e no login -> Redirecionar para o painel correto
    if (isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = isMaster ? '/superadmin' : '/admin';
      return NextResponse.redirect(url);
    }

    // Se Super Admin tentando entrar no /admin -> Manda pro /superadmin
    if (isAdminPage && isMaster) {
      const url = request.nextUrl.clone();
      url.pathname = '/superadmin';
      return NextResponse.redirect(url);
    }

    // Se Lojista comum tentando entrar no /superadmin -> Manda pro /admin
    if (isSuperAdminPage && !isMaster) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/superadmin/:path*'],
};


