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
  const isAdminPage = pathname.startsWith('/admin') && !isLoginPage;
  const isSuperAdminPage = pathname.startsWith('/superadmin');

  if (isSuperAdminPage) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // Verifica se o email está na tabela super_admins
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('email', user.email)
      .single();
      
    if (!superAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  if (isAdminPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isLoginPage && user) {
    // Se for o super admin acessando login, jogue pro superadmin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('email', user.email)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = superAdmin ? '/superadmin' : '/admin';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/superadmin/:path*'],
};

