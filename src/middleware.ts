import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Sadece üyeler girebilir
const MEMBERS_ONLY = [
  '/dashboard',
  '/profile',
  '/messages',
  '/notifications',
  '/friends',
  '/map',
  '/good-deed',
  '/admin',
  '/quest/create',
  '/business',
];

// Auth sayfaları — giriş yapmışlar buraya giremez
const AUTH_PAGES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStatic = /\.(png|svg|ico|jpg|webp|css|js|woff2?)$/.test(pathname);
  if (isStatic) return NextResponse.next();

  const isMembersOnly = MEMBERS_ONLY.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Korumalı sayfa veya auth sayfasıysa oturumu kontrol et
  if (!isMembersOnly && !isAuthPage) {
    // Açık sayfa (/, /quest/[id], /about, vb.) — geç
    const response = NextResponse.next();
    if (pathname.startsWith('/api/')) response.headers.set('Cache-Control', 'no-store');
    return response;
  }

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

  if (!user && isMembersOnly) {
    // Üye değil, korumalı sayfaya girmeye çalışıyor → login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    // Zaten giriş yapmış, login/register'a gitmeye çalışıyor → dashboard
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
