import Link from 'next/link';
import { MapPin, Plus, Shield, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';
import NotificationBell from './NotificationBell';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, is_admin, is_premium, is_business')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50" style={{ background: '#ffffff', borderBottom: '1px solid #efefef' }}>
      <div className="max-w-[935px] mx-auto px-4 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            <MapPin size={18} className="text-white" />
          </div>
          <span className="text-lg font-black tracking-tight" style={{ color: '#262626' }}>İZİ BUL</span>
        </Link>

        {/* Arama (dekoratif) */}
        <div className="hidden md:flex flex-1 max-w-xs">
          <div className="w-full px-4 py-2 rounded-xl text-sm" style={{ background: '#fafafa', border: '1px solid #efefef', color: '#8e8e8e' }}>
            🔍 Görev ara...
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link href="/map"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-gray-50"
            style={{ color: '#8e8e8e' }}>
            <MapPin size={15} />
            Harita
          </Link>

          {user && profile ? (
            <>
              {profile.is_admin && (
                <Link href="/admin"
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-purple-50"
                  style={{ color: '#a855f7' }}>
                  <Shield size={15} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              {(profile.is_business || profile.is_admin) && (
                <Link href="/business/stats"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-gray-50"
                  style={{ color: '#8e8e8e' }}>
                  <BarChart2 size={15} />
                </Link>
              )}
              {(profile.is_business || profile.is_admin) && (
                <Link href="/quest/create"
                  className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                  <Plus size={15} />
                  <span className="hidden sm:inline">Görev Ekle</span>
                </Link>
              )}
              <NotificationBell />
              <Link href="/profile"
                className="flex items-center gap-2 ml-1 px-2 py-1.5 rounded-xl transition-colors hover:bg-gray-50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium" style={{ color: '#262626' }}>@{profile.username}</span>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login"
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-gray-50"
                style={{ color: '#262626' }}>
                Giriş
              </Link>
              <Link href="/register"
                className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
