import AppShell from '@/components/AppShell';
import GoodDeedClient from './GoodDeedClient';

export const revalidate = 30;
export const metadata = { title: 'İyilik Hareketi — İzi Bul' };

export default function GoodDeedPage() {
  return (
    <AppShell>
      <GoodDeedClient />
    </AppShell>
  );
}
