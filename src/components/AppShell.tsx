import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Home, MapPin, Bell, MessageCircle, Users, User, Shield, Plus, BarChart2, MoreHorizontal } from 'lucide-react';
import SignOutButton from './SignOutButton';
import NotificationBell from './NotificationBell';

interface Props {
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export default async function AppShell({ children, aside }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, is_admin, is_business')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const nav = [
    { href: '/dashboard', icon: <Home size={26} />, label: 'Anasayfa' },
    { href: '/map', icon: <MapPin size={26} />, label: 'Harita' },
    { href: '/friends', icon: <Users size={26} />, label: 'Arkadaşlar' },
    { href: '/messages', icon: <MessageCircle size={26} />, label: 'Mesajlar' },
    { href: '/profile', icon: <User size={26} />, label: 'Profil' },
    ...(profile?.is_admin ? [{ href: '/admin', icon: <Shield size={26} />, label: 'Admin' }] : []),
    ...((profile?.is_business || profile?.is_admin) ? [{ href: '/business/stats', icon: <BarChart2 size={26} />, label: 'İstatistik' }] : []),
  ];

  return (
    <div className="flex min-h-screen" style={{ background: '#000' }}>

      {/* SOL SİDEBAR — X gibi siyah */}
      <div className="w-[72px] xl:w-[275px] flex-shrink-0 flex flex-col h-screen sticky top-0 px-2 xl:px-3 py-2">

        {/* Logo */}
        <Link href="/dashboard"
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors mb-1 xl:ml-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            <MapPin size={18} className="text-white" />
          </div>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-0.5 mt-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-5 px-3 py-3 rounded-full hover:bg-white/10 transition-colors w-fit xl:w-full">
              <span className="text-white flex-shrink-0">{item.icon}</span>
              <span className="text-white text-xl font-medium hidden xl:block">{item.label}</span>
            </Link>
          ))}

          {/* Bildirimler — NotificationBell ile */}
          <div className="flex items-center gap-5 px-3 py-3 rounded-full hover:bg-white/10 transition-colors w-fit xl:w-full cursor-pointer">
            <NotificationBell />
            <span className="text-white text-xl font-medium hidden xl:block">Bildirimler</span>
          </div>

          <Link href="/" className="flex items-center gap-5 px-3 py-3 rounded-full hover:bg-white/10 transition-colors w-fit xl:w-full">
            <MoreHorizontal size={26} className="text-white flex-shrink-0" />
            <span className="text-white text-xl font-medium hidden xl:block">Daha fazla</span>
          </Link>
        </nav>

        {/* Görev Ekle butonu */}
        {(profile?.is_business || profile?.is_admin) && (
          <Link href="/quest/create"
            className="flex items-center justify-center gap-2 mb-3 py-3.5 rounded-full font-black text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            <Plus size={22} />
            <span className="hidden xl:block text-lg">Görev Ekle</span>
          </Link>
        )}

        {/* Kullanıcı profili — X'teki gibi altta */}
        {profile && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 hidden xl:block">
              <p className="text-white font-bold text-sm truncate">@{profile.username}</p>
            </div>
            <div className="hidden xl:block">
              <SignOutButton />
            </div>
          </div>
        )}
      </div>

      {/* ORTA — beyaz feed */}
      <main
        className="flex-1 min-w-0 overflow-y-auto"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', borderRight: aside ? '1px solid rgba(255,255,255,0.15)' : 'none', background: '#fff', minHeight: '100vh' }}>
        {children}
      </main>

      {/* SAĞ PANEL */}
      {aside && (
        <div className="w-[350px] flex-shrink-0 hidden lg:block px-4 py-4 overflow-y-auto" style={{ background: '#000' }}>
          {aside}
        </div>
      )}
    </div>
  );
}
