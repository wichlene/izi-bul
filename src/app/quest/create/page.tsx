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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Yeni Görev Ekle</h1>
        <p className="text-gray-500 mb-6">
          Gizli bir konumdan fotoğraf paylaş, oyuncular bulsun.
        </p>
        <CreateQuestForm categories={categories} />
      </main>
    </div>
  );
}
