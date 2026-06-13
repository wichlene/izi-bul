import { supabase } from './supabase';

/**
 * Uploads a local image URI to a Supabase storage bucket and returns its public URL.
 * Uses ArrayBuffer — the reliable path for Expo/React Native (FormData uploads
 * to Supabase storage are flaky on RN).
 */
export async function uploadImage(uri: string, prefix: string): Promise<string> {
  const ext = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const fileName = `${prefix}_${Date.now()}.${ext}`;

  const arrayBuffer = await fetch(uri).then((r) => r.arrayBuffer());

  // All app images live in the existing `quest-photos` bucket (public).
  const { data, error } = await supabase.storage
    .from('quest-photos')
    .upload(fileName, arrayBuffer, { contentType, upsert: false });

  if (error) throw new Error(error.message || 'Fotoğraf yüklenemedi');

  const { data: pub } = supabase.storage.from('quest-photos').getPublicUrl(data.path);
  return pub.publicUrl;
}
