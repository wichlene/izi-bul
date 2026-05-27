'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface Props {
  onUpload: (url: string) => void;
}

export default function PhotoUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div>
      {preview ? (
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
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className="border-2 border-dashed border-orange-300 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
        >
          <div className="bg-orange-100 rounded-full p-3">
            <ImageIcon size={24} className="text-orange-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Fotoğraf yükle veya sürükle</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — maks 10MB</p>
          </div>
          <div className="flex items-center gap-1.5 text-orange-500 text-sm font-medium">
            <Upload size={14} />
            Dosya seç
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
