import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#f97316',
};

export const metadata: Metadata = {
  title: 'İzi Bul — Konumu Bul, Ödülü Kazan',
  description: 'Fotoğraftan konumu bul, ödülü kap! Kafeler ve işletmeler gizli konum yayınlar, sen bulursun.',
  openGraph: {
    title: 'İzi Bul',
    description: 'Fotoğraftan konumu bul, ödülü kazan!',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  );
}
