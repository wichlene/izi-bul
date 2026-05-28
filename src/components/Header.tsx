import Link from 'next/link';
import { MapPin, Plus, Trophy, Shield, Flame } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, total_points, is_admin, is_premium, level')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
              <MapPin size={18} className="text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tight">İZİ BUL</span>
            <div className="text-xs text-white/30 -mt-0.5 font-medium">Türkiye&apos;yi Keşfet</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link href="/map" className="hidden sm:flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-white/5">
            <MapPin size={15} />
            Harita
          </Link>
          <Link href="/leaderboard" className="hidden sm:flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-white/5">
            <Trophy size={15} />
            Sıralama
          </Link>

          {user && profile ? (
            <>
              {profile.is_admin && (
                <Link href="/admin" className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-purple-500/10">
                  <Shield size={15} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(255,107,43,0.15)', color: '#ff6b2b' }}>
                <Flame size={13} />
                {profile.total_points?.toLocaleString('tr-TR')}
              </div>

              <Link href="/quest/create" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)', color: 'white' }}>
                <Plus size={15} />
                <span className="hidden sm:inline">Görev Ekle</span>
              </Link>

              <Link href="/profile" className="flex items-center gap-2 ml-1 hover:bg-white/5 px-2 py-1.5 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-white/70">
                  @{profile.username}
                </span>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors hover:bg-white/5">
                Giriş
              </Link>
              <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)', color: 'white' }}>
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
