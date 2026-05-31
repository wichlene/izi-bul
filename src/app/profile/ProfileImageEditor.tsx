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
    <div
      onClick={() => inputRef.current?.click()}
      style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, cursor: 'pointer' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
        background: 'linear-gradient(135deg,#ff6b2b,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, fontWeight: 900, color: '#fff',
        border: '2px solid #eff3f4',
      }}>
        {avatar
          ? <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : username?.charAt(0).toUpperCase()}
      </div>
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 22, height: 22, borderRadius: '50%',
        background: '#ff6b2b', border: '2px solid #fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {uploading
          ? <Loader2 size={11} color="#fff" className="animate-spin" />
          : <Camera size={11} color="#fff" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
    </div>
  );
}
