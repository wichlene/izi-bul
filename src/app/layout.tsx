import type { Metadata, Viewport } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import LocationSync from '@/components/LocationSync';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: '#ff6b2b',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'İzi Bul — Konumu Bul, Ödülü Kazan',
  description: 'Fotoğraftan konumu bul, ödülü kap! Kafeler ve işletmeler gizli konum yayınlar, sen bulursun.',
  metadataBase: new URL('https://izibul.com'),
  openGraph: {
    title: 'İzi Bul',
    description: 'Fotoğraftan konumu bul, ödülü kazan!',
    type: 'website',
    url: 'https://izibul.com',
    siteName: 'İzi Bul',
  },
  verification: {
    google: '5ea9338c3fbe2a1d',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
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
        <ServiceWorkerRegister />
        {user && <LocationSync userId={user.id} />}
      </body>
    </html>
  );
}
