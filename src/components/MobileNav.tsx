'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, MessageCircle, Users, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface Props {
  unreadMessages: number;
  pendingRequests: number;
}

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Keşfet', badge: 0 },
  { href: '/map', icon: MapPin, label: 'Harita', badge: 0 },
  { href: '/messages', icon: MessageCircle, label: 'Mesajlar', badge: -1 },
  { href: '/friends', icon: Users, label: 'Arkadaşlar', badge: -2 },
  { href: '/profile', icon: User, label: 'Profil', badge: 0 },
];

export default function MobileNav({ unreadMessages, pendingRequests }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: '#fff',
        borderTop: '1px solid #eff3f4',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div className="flex items-center justify-around h-14">
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href === '/dashboard' && pathname === '/');
          const badgeCount = badge === -1 ? unreadMessages : badge === -2 ? pendingRequests : badge;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 relative transition-all"
              style={{ color: active ? '#ff6b2b' : '#8e9aab' }}>
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: '#ff6b2b' }}
                />
              )}
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] rounded-full text-[9px] font-black text-white flex items-center justify-center px-0.5"
                    style={{ background: '#ff6b2b' }}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileNavNotifications() {
  return (
    <Link
      href="/notifications"
      className="flex flex-col items-center justify-center gap-0.5 w-14 h-14">
      <NotificationBell />
      <span className="text-[10px] font-semibold leading-none" style={{ color: '#8e9aab' }}>Bildirim</span>
    </Link>
  );
}
