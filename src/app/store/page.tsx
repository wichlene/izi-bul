import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import StoreClient from './StoreClient';

export const metadata = {
  title: 'Puan Mağazası — İzi Bul',
};

export default async function StorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/store');

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', user.id)
    .single();

  return (
    <AppShell>
      <StoreClient userPoints={profile?.total_points || 0} />
    </AppShell>
  );
}
