'use client';

import { useRef, useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';

interface Props {
  onUpload: (url: string) => void;
}

export default function PhotoUpload({ onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpload(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Yükleme başarısız');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-gray-100">
        <img src={preview} alt="Önizleme" className="w-full h-48 object-cover" />
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm animate-pulse">Yükleniyor...</div>
          </div>
        )}
        {!uploading && (
          <button
            onClick={() => { setPreview(null); onUpload(''); }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Kamera butonu — büyük ve belirgin */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className="w-full flex flex-col items-center gap-3 py-8 rounded-xl font-semibold text-white transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}
      >
        <Camera size={36} />
        <span className="text-lg">Fotoğraf Çek</span>
        <span className="text-sm opacity-80">Kamerayı aç</span>
      </button>

      {/* Galeriden seç */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors hover:border-orange-400 hover:bg-orange-50"
        style={{ borderColor: '#eff3f4', color: '#536471' }}
      >
        <Upload size={16} />
        Galeriden seç
      </button>

      {/* Kamera input — sadece kamera açar */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* Dosya input — galeri */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
