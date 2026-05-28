import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Category } from '@/types';
import Header from '@/components/Header';
import CreateQuestForm from './CreateQuestForm';

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('categories').select('*');
  return data || [];
}

export default async function CreateQuestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/quest/create');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_business, business_name')
    .eq('id', user.id)
    .single();

  const canCreate = profile?.is_admin || profile?.is_business;

  const categories = await getCategories();

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {!canCreate ? (
          <div className="rounded-3xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-5xl mb-4">🏪</div>
            <h1 className="text-xl font-black text-white mb-2">İşletme Hesabı Gerekli</h1>
            <p className="text-white/40 text-sm max-w-sm mx-auto">
              Görev eklemek için işletme hesabına ihtiyacın var. Site sahibiyle iletişime geç.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div>
                <h1 className="text-2xl font-black text-white">Yeni Görev Ekle</h1>
                {profile?.business_name && (
                  <p className="text-white/30 text-sm mt-0.5">🏪 {profile.business_name}</p>
                )}
              </div>
            </div>
            <CreateQuestForm categories={categories} />
          </>
        )}
      </main>
    </div>
  );
}
