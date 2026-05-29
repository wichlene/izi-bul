import AppShell from '@/components/AppShell';
import NotificationsClient from './NotificationsClient';

export const metadata = { title: 'Bildirimler — İzi Bul' };

export default function NotificationsPage() {
  return (
    <AppShell>
      <NotificationsClient />
    </AppShell>
  );
}
