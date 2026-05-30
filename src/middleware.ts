import { NextRequest, NextResponse } from 'next/server';

// Giriş gerektiren sayfalar
const PROTECTED = ['/dashboard', '/profile', '/messages', '/notifications', '/admin', '/quest', '/good-deed', '/friends', '/map'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Giriş kontrolü: token cookie yoksa login'e yönlendir
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const token =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('sb-refresh-token')?.value ||
      // Supabase v2 cookie formatı
      [...request.cookies.getAll()].some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();

  // API rotaları için CORS: sadece kendi domainden
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host') || '';
    const allowed = !origin || origin.includes(host) || origin.includes('izi-bul.vercel.app');
    if (!allowed) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
