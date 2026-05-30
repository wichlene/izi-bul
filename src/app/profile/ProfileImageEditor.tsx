'use client';

import { useRef, useState, useTransition } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface Props {
  avatarUrl: string | null;
  bannerUrl: string | null;
  username: string;
}

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
  return data.url;
}

async function saveImage(type: 'avatar' | 'banner', url: string) {
  await fetch('/api/profile/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, url }),
  });
}

export default function ProfileImageEditor({ avatarUrl, bannerUrl, username }: Props) {
  const [avatar, setAvatar] = useState(avatarUrl);
  const [banner, setBanner] = useState(bannerUrl);
  const [uploadingAvatar, startAvatar] = useTransition();
  const [uploadingBanner, startBanner] = useTransition();

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startAvatar(async () => {
      const url = await uploadFile(file);
      await saveImage('avatar', url);
      setAvatar(url);
    });
  };

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startBanner(async () => {
      const url = await uploadFile(file);
      await saveImage('banner', url);
      setBanner(url);
    });
  };

  return (
    <div style={{ borderBottom: '1px solid #eff3f4' }}>
      {/* Banner */}
      <div className="relative h-36 group cursor-pointer" onClick={() => bannerRef.current?.click()}
        style={{ background: banner ? undefined : 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
        {banner && <img src={banner} className="w-full h-full object-cover" alt="" />}

        {/* Karartma + kamera ikonu hover'da */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          {uploadingBanner
            ? <Loader2 size={28} className="text-white animate-spin" />
            : <div className="flex flex-col items-center gap-1 text-white">
                <Camera size={28} />
                <span className="text-xs font-semibold">Banner değiştir</span>
              </div>
          }
        </div>
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
      </div>

      {/* Avatar + actions */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-3">
          {/* Avatar */}
          <div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden flex items-center justify-center text-3xl font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
              {avatar
                ? <img src={avatar} className="w-full h-full object-cover" alt="" />
                : username?.charAt(0).toUpperCase()}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.45)' }}>
              {uploadingAvatar
                ? <Loader2 size={18} className="text-white animate-spin" />
                : <Camera size={18} className="text-white" />}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
        </div>
      </div>
    </div>
  );
}
