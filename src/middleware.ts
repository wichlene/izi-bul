import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Bu sayfalar giriş yapmadan erişilebilir
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || /\.(png|svg|ico|jpg|webp|css|js)$/.test(pathname);

  if (isStatic) return NextResponse.next();

  // Supabase oturumunu middleware'de doğru şekilde kontrol et
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Giriş yapmamış → sadece public sayfalara izin ver
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Giriş yapmış → /login ve /register'a gitmesin, dashboard'a yönlendir
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // API güvenliği
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
