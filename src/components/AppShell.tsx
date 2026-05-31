import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Home, MapPin, MessageCircle, Users, User, Shield, Plus, BarChart2, Heart, Trophy, ShoppingBag } from 'lucide-react';
import SignOutButton from './SignOutButton';
import NotificationBell from './NotificationBell';
import PushSubscriber from './PushSubscriber';
import SoundUnlocker from './SoundUnlocker';
import MobileNav from './MobileNav';

interface Props {
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export default async function AppShell({ children, aside }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let unreadMessages = 0;
  let pendingRequests = 0;

  if (user) {
    const [profileRes, msgRes, reqRes] = await Promise.all([
      supabase.from('profiles').select('username, is_admin, is_business').eq('id', user.id).single(),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('to_user_id', user.id).eq('is_read', false),
      supabase.from('friend_requests').select('id', { count: 'exact', head: true }).eq('to_user_id', user.id).eq('status', 'pending'),
    ]);
    profile = profileRes.data;
    unreadMessages = msgRes.count || 0;
    pendingRequests = reqRes.count || 0;
  }

  const sidebarNav = [
    { href: '/dashboard', icon: <Home size={26} />, label: 'Anasayfa', badge: 0 },
    { href: '/map', icon: <MapPin size={26} />, label: 'Harita', badge: 0 },
    { href: '/friends', icon: <Users size={26} />, label: 'Arkadaşlar', badge: pendingRequests },
    { href: '/messages', icon: <MessageCircle size={26} />, label: 'Mesajlar', badge: unreadMessages },
    { href: '/good-deed', icon: <Heart size={26} />, label: 'İyilik Hareketi', badge: 0 },
    { href: '/leaderboard', icon: <Trophy size={26} />, label: 'Sıralama', badge: 0 },
    { href: '/store', icon: <ShoppingBag size={26} />, label: 'Mağaza', badge: 0 },
    { href: '/profile', icon: <User size={26} />, label: 'Profil', badge: 0 },
    ...(profile?.is_admin ? [{ href: '/admin', icon: <Shield size={26} />, label: 'Admin', badge: 0 }] : []),
    ...((profile?.is_business || profile?.is_admin) ? [
      { href: '/business/stats', icon: <BarChart2 size={26} />, label: 'İstatistik', badge: 0 },
      { href: '/business/plans', icon: <Trophy size={26} />, label: 'Planlar', badge: 0 },
    ] : []),
  ];

  const bottomNav = [
    { href: '/dashboard', icon: <Home size={24} />, badge: 0 },
    { href: '/map', icon: <MapPin size={24} />, badge: 0 },
    { href: '/messages', icon: <MessageCircle size={24} />, badge: unreadMessages },
    { href: '/profile', icon: <User size={24} />, badge: 0 },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: '#f7f9fa' }}>
      {user && <PushSubscriber userId={user.id} />}
      {user && <SoundUnlocker />}

      {/* SOL SİDEBAR — sadece md+ */}
      <div className="hidden md:flex w-[72px] xl:w-[275px] flex-shrink-0 flex-col h-screen sticky top-0 px-2 xl:px-3 py-2"
        style={{ background: '#ffffff', borderRight: '1px solid #eff3f4' }}>

        {/* Logo */}
        <Link href="/dashboard"
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors mb-1 xl:ml-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            <MapPin size={18} className="text-white" />
          </div>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-0.5 mt-1">
          {sidebarNav.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-5 px-3 py-3 rounded-full transition-colors w-fit xl:w-full hover:bg-gray-100 relative">
              <span className="flex-shrink-0 relative" style={{ color: '#0f1419' }}>
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-black text-white flex items-center justify-center px-0.5"
                    style={{ background: '#ff6b2b' }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="text-xl font-medium hidden xl:block" style={{ color: '#0f1419' }}>{item.label}</span>
            </Link>
          ))}

          {/* Bildirimler */}
          <Link href="/notifications"
            className="flex items-center gap-5 px-3 py-3 rounded-full transition-colors w-fit xl:w-full cursor-pointer hover:bg-gray-100">
            <NotificationBell />
            <span className="text-xl font-medium hidden xl:block" style={{ color: '#0f1419' }}>Bildirimler</span>
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

        {/* Kullanıcı profili — altta */}
        {profile && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 hidden xl:block">
              <p className="font-bold text-sm truncate" style={{ color: '#0f1419' }}>@{profile.username}</p>
            </div>
            <div className="hidden xl:block">
              <SignOutButton />
            </div>
          </div>
        )}
      </div>

      {/* ORTA — beyaz feed */}
      <main
        className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-0"
        style={{ borderLeft: '1px solid #eff3f4', borderRight: aside ? '1px solid #eff3f4' : 'none', background: '#fff', minHeight: '100vh' }}>
        {children}
      </main>

      {/* SAĞ PANEL */}
      {aside && (
        <div className="w-[350px] flex-shrink-0 hidden lg:block px-4 py-4 overflow-y-auto" style={{ background: '#f7f9fa' }}>
          {aside}
        </div>
      )}

      {/* ALT NAVİGASYON — sadece mobil */}
      <MobileNav unreadMessages={unreadMessages} />
    </div>
  );
}
