'use client';

import { useRef, useTransition, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface Props {
  avatarUrl: string | null;
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

export default function ProfileAvatar({ avatarUrl, username }: Props) {
  const [avatar, setAvatar] = useState(avatarUrl);
  const [uploading, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload(async () => {
      const url = await uploadFile(file);
      await fetch('/api/profile/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'avatar', url }),
      });
      setAvatar(url);
    });
  };

  return (
    <div className="relative group cursor-pointer w-fit" onClick={() => inputRef.current?.click()}>
      <div
        className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-black text-white border-2"
        style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)', borderColor: '#eff3f4' }}>
        {avatar
          ? <img src={avatar} className="w-full h-full object-cover" alt="" />
          : username?.charAt(0).toUpperCase()}
      </div>
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.45)' }}>
        {uploading
          ? <Loader2 size={16} className="text-white animate-spin" />
          : <Camera size={16} className="text-white" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}
