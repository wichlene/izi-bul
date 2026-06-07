import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'legendary'] as const;
const DIFF_LABELS: Record<string, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor', legendary: 'Efsane' };

interface Category { id: string; name: string; icon: string }

export default function CreateQuestScreen({ navigation }: any) {
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hint, setHint] = useState('');
  const [region, setRegion] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'legendary'>('medium');
  const [cashReward, setCashReward] = useState('0');
  const [maxDist, setMaxDist] = useState('50');
  const [requiresPhoto, setRequiresPhoto] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Görev Oluştur' });
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) { setCategories(data as Category[]); setCategoryId(data[0]?.id || ''); }
    });
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() || 'jpg';
    const fileName = `quest_${Date.now()}.${ext}`;
    const form = new FormData();
    form.append('file', { uri: asset.uri, name: fileName, type: `image/${ext}` } as any);
    const { data, error } = await supabase.storage.from('quest-photos').upload(fileName, form);
    if (error) { Alert.alert('Hata', 'Fotoğraf yüklenemedi.'); return; }
    const { data: u } = supabase.storage.from('quest-photos').getPublicUrl(data.path);
    setPhotoUrl(u.publicUrl);
    Alert.alert('✅', 'Fotoğraf yüklendi.');
  };

  const getMyLocation = async () => {
    setLocating(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin gerekli', 'Konum izni ver.'); setLocating(false); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setLat(loc.coords.latitude);
    setLng(loc.coords.longitude);
    setLocating(false);
    Alert.alert('✅', 'Konum alındı.');
  };

  const submit = async () => {
    if (!title || !description || !photoUrl || !lat || !lng) {
      Alert.alert('Eksik', 'Başlık, açıklama, fotoğraf ve konum zorunlu.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://izibul.com/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          category_id: categoryId,
          title, description, hint, region, difficulty,
          photo_url: photoUrl, latitude: lat, longitude: lng,
          cash_reward: parseInt(cashReward) || 0,
          max_distance_meters: parseInt(maxDist) || 50,
          requires_photo_proof: requiresPhoto,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      Alert.alert('✅ Görev oluşturuldu!', 'Onay için admin inceleyecek.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={s.label}>Başlık *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Görev başlığı" placeholderTextColor={colors.textMuted} />

      <Text style={s.label}>Açıklama *</Text>
      <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Görevin açıklaması..." placeholderTextColor={colors.textMuted} multiline />

      <Text style={s.label}>İpucu</Text>
      <TextInput style={s.input} value={hint} onChangeText={setHint} placeholder="İpucu (opsiyonel)" placeholderTextColor={colors.textMuted} />

      <Text style={s.label}>Bölge</Text>
      <TextInput style={s.input} value={region} onChangeText={setRegion} placeholder="Şehir / Bölge" placeholderTextColor={colors.textMuted} />

      <Text style={s.label}>Zorluk</Text>
      <View style={s.diffRow}>
        {DIFFICULTIES.map((d) => (
          <TouchableOpacity key={d} style={[s.diffBtn, difficulty === d && s.diffBtnActive]} onPress={() => setDifficulty(d)}>
            <Text style={[s.diffText, difficulty === d && s.diffTextActive]}>{DIFF_LABELS[d]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Nakit Ödül (₺)</Text>
      <TextInput style={s.input} value={cashReward} onChangeText={setCashReward} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />

      <Text style={s.label}>Maksimum Mesafe (metre)</Text>
      <TextInput style={s.input} value={maxDist} onChangeText={setMaxDist} keyboardType="numeric" placeholder="50" placeholderTextColor={colors.textMuted} />

      <View style={s.switchRow}>
        <Text style={s.label}>Fotoğraf Kanıtı Zorunlu</Text>
        <Switch value={requiresPhoto} onValueChange={setRequiresPhoto} trackColor={{ true: colors.primary }} />
      </View>

      <Text style={s.label}>Kategori</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {categories.map((c) => (
          <TouchableOpacity key={c.id} style={[s.catBtn, categoryId === c.id && s.catBtnActive]} onPress={() => setCategoryId(c.id)}>
            <Text style={[s.catText, categoryId === c.id && { color: '#fff' }]}>{c.icon} {c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={[s.btn, { backgroundColor: '#f0f2f4', marginBottom: 10 }]} onPress={pickPhoto}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{photoUrl ? '✅ Fotoğraf Yüklendi — Değiştir' : '📷 Fotoğraf Yükle *'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[s.btn, { backgroundColor: '#f0f2f4', marginBottom: 16 }]} onPress={getMyLocation} disabled={locating}>
        {locating ? <ActivityIndicator color={colors.primary} /> : (
          <Text style={{ color: colors.text, fontWeight: '700' }}>{lat ? `✅ Konum Alındı (${lat.toFixed(4)}, ${lng?.toFixed(4)})` : '📍 Mevcut Konumu Kullan *'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Görevi Oluştur ✅</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  label: { fontWeight: '700', color: colors.text, marginBottom: 6, fontSize: 14, marginTop: 4 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  diffRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  diffBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f2f4', alignItems: 'center' },
  diffBtnActive: { backgroundColor: colors.primary },
  diffText: { fontWeight: '700', color: colors.textMuted, fontSize: 12 },
  diffTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f2f4', marginRight: 8 },
  catBtnActive: { backgroundColor: colors.primary },
  catText: { fontWeight: '700', color: colors.text, fontSize: 13 },
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
