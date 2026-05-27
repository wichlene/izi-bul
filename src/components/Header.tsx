import Link from 'next/link';
import { MapPin, Plus, Trophy, User, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, total_points')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-orange-500 text-white rounded-xl p-1.5">
            <MapPin size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900">İzi Bul</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/leaderboard" className="hidden sm:flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-xl transition-colors">
            <Trophy size={16} />
            Liderlik
          </Link>

          {user && profile ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                <span>{profile.total_points}</span>
                <span className="text-xs">puan</span>
              </div>
              <Link
                href="/quest/create"
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Görev Ekle</span>
              </Link>
              <Link href="/profile" className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1.5 rounded-xl transition-colors">
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  @{profile.username}
                </span>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-gray-700 hover:bg-gray-100 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
              >
                <LogIn size={16} />
                Giriş
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <User size={16} />
                <span className="hidden sm:inline">Kayıt Ol</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
