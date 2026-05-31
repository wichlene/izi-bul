'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Trophy, ShoppingBag, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface Props {
  unreadMessages: number;
}

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Keşfet' },
  { href: '/map', icon: MapPin, label: 'Harita' },
  { href: '/leaderboard', icon: Trophy, label: 'Sıralama' },
  { href: '/store', icon: ShoppingBag, label: 'Mağaza' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export default function MobileNav({ unreadMessages }: Props) {
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
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href === '/dashboard' && pathname === '/');
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
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
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
