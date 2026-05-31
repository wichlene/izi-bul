import AppShell from '@/components/AppShell';
import LeaderboardClient from './LeaderboardClient';

export const metadata = { title: 'Sıralama — İzi Bul' };

export default function LeaderboardPage() {
  return (
    <AppShell>
      <LeaderboardClient />
    </AppShell>
  );
}
