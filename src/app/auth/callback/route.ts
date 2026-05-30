import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  if (code) {
    // PKCE akışı (kayıt, sosyal login, şifre sıfırlama)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=link_expired`);
    }
  } else if (tokenHash && type) {
    // Token hash akışı (bazı şifre sıfırlama e-postaları)
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'recovery' | 'email' });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=link_expired`);
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
