import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Home, MapPin, MessageCircle, Users, User, Shield, Plus, BarChart2, Heart, Trophy } from 'lucide-react';
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
    { href: '/dashboard', icon: <Home size={24} />, label: 'Anasayfa', badge: 0 },
    { href: '/map', icon: <MapPin size={24} />, label: 'Harita', badge: 0 },
    { href: '/friends', icon: <Users size={24} />, label: 'Arkadaşlar', badge: pendingRequests },
    { href: '/messages', icon: <MessageCircle size={24} />, label: 'Mesajlar', badge: unreadMessages },
    { href: '/good-deed', icon: <Heart size={24} />, label: 'İyilik Hareketi', badge: 0 },
    { href: '/leaderboard', icon: <Trophy size={24} />, label: 'Sıralama', badge: 0 },
    { href: '/profile', icon: <User size={24} />, label: 'Profil', badge: 0 },
    ...(profile?.is_admin ? [{ href: '/admin', icon: <Shield size={24} />, label: 'Admin', badge: 0 }] : []),
    ...((profile?.is_business || profile?.is_admin) ? [
      { href: '/business/stats', icon: <BarChart2 size={24} />, label: 'İstatistik', badge: 0 },
    ] : []),
  ];

  return (
    /* Dış kap: tam ekran yüksekliği, overflow gizli → sidebar sabit kalır */
    <div className="flex h-screen overflow-hidden" style={{ background: '#f7f9fa' }}>
      {user && <PushSubscriber userId={user.id} />}
      {user && <SoundUnlocker />}

      {/* ── SOL SİDEBAR (sabit) ── */}
      <div
        className="hidden md:flex flex-shrink-0 flex-col overflow-y-auto"
        style={{
          width: 72, background: '#fff',
          borderRight: '1px solid #eff3f4',
          height: '100vh', position: 'sticky', top: 0,
        }}>

        {/* Logo */}
        <Link href="/dashboard"
          className="flex items-center justify-center hover:bg-gray-100 transition-colors rounded-full mx-auto mt-3 mb-1"
          style={{ width: 48, height: 48, flexShrink: 0 }}>
          <div className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            <MapPin size={17} className="text-white" />
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 px-2 mt-1">
          {sidebarNav.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 relative"
              style={{ width: 48, height: 48, margin: '0 auto', color: '#0f1419' }}>
              <span className="relative">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] rounded-full text-[9px] font-black text-white flex items-center justify-center px-0.5"
                    style={{ background: '#ff6b2b' }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
            </Link>
          ))}

          {/* Bildirimler */}
          <Link href="/notifications"
            className="flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            style={{ width: 48, height: 48, margin: '0 auto', color: '#0f1419' }}>
            <NotificationBell />
          </Link>
        </nav>

        {/* Görev Ekle */}
        {(profile?.is_business || profile?.is_admin) && (
          <Link href="/quest/create"
            className="flex items-center justify-center rounded-full font-black text-white transition-all hover:opacity-90 mx-auto mb-2"
            style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)', flexShrink: 0 }}>
            <Plus size={22} />
          </Link>
        )}

        {/* Avatar */}
        {profile && (
          <Link href="/profile"
            className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors mx-auto mb-3"
            style={{ width: 48, height: 48, flexShrink: 0 }}>
            <div className="flex items-center justify-center rounded-full font-black text-white text-sm"
              style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          </Link>
        )}
      </div>

      {/* ── GENIŞ SİDEBAR xl+ ── */}
      <div
        className="hidden xl:flex flex-shrink-0 flex-col overflow-y-auto"
        style={{
          width: 260, background: '#fff',
          borderRight: '1px solid #eff3f4',
          height: '100vh', position: 'sticky', top: 0,
          marginLeft: -72,
        }}>
        {/* Logo */}
        <Link href="/dashboard"
          className="flex items-center gap-3 px-4 py-4 hover:bg-gray-100 transition-colors rounded-full mx-2 mt-1">
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            <MapPin size={17} className="text-white" />
          </div>
          <span className="text-xl font-black" style={{ color: '#0f1419' }}>İzi Bul</span>
        </Link>

        <nav className="flex-1 flex flex-col gap-0.5 px-2 mt-2">
          {sidebarNav.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 px-4 py-3 rounded-full transition-colors hover:bg-gray-100 relative"
              style={{ color: '#0f1419' }}>
              <span className="relative flex-shrink-0">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] rounded-full text-[9px] font-black text-white flex items-center justify-center px-0.5"
                    style={{ background: '#ff6b2b' }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="text-[17px] font-medium">{item.label}</span>
            </Link>
          ))}

          <Link href="/notifications"
            className="flex items-center gap-4 px-4 py-3 rounded-full transition-colors hover:bg-gray-100"
            style={{ color: '#0f1419' }}>
            <NotificationBell />
            <span className="text-[17px] font-medium">Bildirimler</span>
          </Link>
        </nav>

        {(profile?.is_business || profile?.is_admin) && (
          <Link href="/quest/create"
            className="flex items-center justify-center gap-2 mx-3 mb-3 py-3.5 rounded-full font-black text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            <Plus size={20} />
            <span className="text-base">Görev Ekle</span>
          </Link>
        )}

        {profile && (
          <div className="flex items-center gap-3 mx-2 mb-3 px-3 py-2.5 rounded-full hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-center rounded-full font-black text-white text-sm flex-shrink-0"
              style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: '#0f1419' }}>@{profile.username}</p>
            </div>
            <SignOutButton />
          </div>
        )}
      </div>

      {/* ── ORTA İÇERİK ── */}
      <main
        className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-0"
        style={{
          borderLeft: '1px solid #eff3f4',
          borderRight: aside ? '1px solid #eff3f4' : 'none',
          background: '#fff',
          height: '100vh',
        }}>
        {children}
      </main>

      {/* ── SAĞ PANEL ── */}
      {aside && (
        <div className="w-[350px] flex-shrink-0 hidden lg:block overflow-y-auto px-4 py-4"
          style={{ background: '#f7f9fa', height: '100vh' }}>
          {aside}
        </div>
      )}

      {/* ── ALT NAV (mobil) ── */}
      <MobileNav unreadMessages={unreadMessages} pendingRequests={pendingRequests} />
    </div>
  );
}
