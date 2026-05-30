import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import GoodDeedClient from './GoodDeedClient';

export const revalidate = 30;
export const metadata = { title: 'İyilik Hareketi — İzi Bul' };

export default async function GoodDeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <AppShell>
      <GoodDeedClient currentUserId={user?.id ?? null} />
    </AppShell>
  );
}
