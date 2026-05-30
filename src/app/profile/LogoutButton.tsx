'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <button
      onClick={logout}
      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-red-50"
      style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
    >
      <LogOut size={16} /> Çıkış Yap
    </button>
  );
}
