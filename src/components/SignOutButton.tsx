'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
      title="Çıkış yap"
    >
      <LogOut size={16} />
    </button>
  );
}
