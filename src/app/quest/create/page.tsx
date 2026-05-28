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
  const categories = await getCategories();

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-white mb-1">Yeni Görev Ekle</h1>
        <p className="text-white/30 text-sm mb-6">Gizli bir konumdan fotoğraf paylaş, oyuncular bulsun.</p>
        <CreateQuestForm categories={categories} />
      </main>
    </div>
  );
}
