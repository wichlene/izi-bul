import type { Metadata, Viewport } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import LocationSync from '@/components/LocationSync';

export const viewport: Viewport = {
  themeColor: '#ff6b2b',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'İzi Bul — Konumu Bul, Ödülü Kazan',
  description: 'Fotoğraftan konumu bul, ödülü kap! Kafeler ve işletmeler gizli konum yayınlar, sen bulursun.',
  openGraph: {
    title: 'İzi Bul',
    description: 'Fotoğraftan konumu bul, ödülü kazan!',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'İzi Bul',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: '#f7f8f8' }}>
        {children}
        {user && <LocationSync userId={user.id} />}
      </body>
    </html>
  );
}
