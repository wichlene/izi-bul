import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/uploadPhoto';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'legendary'] as const;
const DIFF_LABELS: Record<string, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor', legendary: 'Efsane' };

interface Category { id: string; name: string; icon: string }

interface StepDraft {
  has_question: boolean;
  question: string;
  correct_answer: string;
  has_image: boolean;
  reference_photo_url: string;
  approach_radius_meters: number;
  hint: string;
}

const emptyStep = (): StepDraft => ({
  has_question: true, question: '', correct_answer: '',
  has_image: false, reference_photo_url: '',
  approach_radius_meters: 500, hint: '',
});

export default function CreateQuestScreen({ navigation }: any) {
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  // Quest fields
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

  // Multi-step
  const [multiStep, setMultiStep] = useState(false);
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);

  useEffect(() => {
    navigation.setOptions({ title: 'Görev Oluştur' });
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) { setCategories(data as Category[]); setCategoryId(data[0]?.id || ''); }
    });
  }, []);

  // ── Photo upload ──────────────────────────────────────────────────────────

  const pickAndUpload = (onDone: (url: string) => void, _bucket: string, prefix: string) => {
    const handle = async (uri: string) => {
      try {
        const url = await uploadImage(uri, prefix);
        onDone(url);
      } catch (e: any) {
        Alert.alert('Hata', e.message || 'Fotoğraf yüklenemedi.');
      }
    };
    Alert.alert('Fotoğraf Ekle', 'Kaynak seç', [
      {
        text: '📷 Kamera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('İzin gerekli', 'Kamera izni ver.'); return; }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
          if (!result.canceled && result.assets[0]) handle(result.assets[0].uri);
        },
      },
      {
        text: '🖼️ Galeri',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('İzin gerekli', 'Galeri izni ver.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
          if (!result.canceled && result.assets[0]) handle(result.assets[0].uri);
        },
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  // ── Location ──────────────────────────────────────────────────────────────

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

  // ── Steps ─────────────────────────────────────────────────────────────────

  const updateStep = (i: number, patch: Partial<StepDraft>) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const removeStep = (i: number) =>
    setSteps(prev => prev.filter((_, idx) => idx !== i));

  // ── Submit ────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (!title || !description || !photoUrl || !lat || !lng) {
      Alert.alert('Eksik', 'Başlık, açıklama, gizem fotoğrafı ve konum zorunlu.');
      return;
    }
    if (multiStep) {
      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];
        if (!s.has_question && !s.has_image) {
          Alert.alert('Eksik', `${i + 1}. adımda Soru-Cevap veya Resim Karşılaştırma seçili olmalı.`);
          return;
        }
        if (s.has_question && (!s.question || !s.correct_answer)) {
          Alert.alert('Eksik', `${i + 1}. adımda soru ve cevap girilmeli.`);
          return;
        }
        if (s.has_image && !s.reference_photo_url) {
          Alert.alert('Eksik', `${i + 1}. adımda referans fotoğraf yüklenmeli.`);
          return;
        }
      }
    }
    setLoading(true);
    try {
      const body: any = {
        category_id: categoryId,
        title, description, hint, region, difficulty,
        photo_url: photoUrl, latitude: lat, longitude: lng,
        cash_reward: parseInt(cashReward) || 0,
        max_distance_meters: parseInt(maxDist) || 50,
        requires_photo_proof: requiresPhoto,
      };
      if (multiStep && steps.length > 0) body.steps = steps;

      const res = await fetch('https://izibul.com/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(body),
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
      {/* ── Basic Info ── */}
      <Text style={s.label}>Başlık *</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Görev başlığı" placeholderTextColor={colors.textMuted} />

      <Text style={s.label}>Açıklama *</Text>
      <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Oyuncuya görev hakkında ipucu ver..." placeholderTextColor={colors.textMuted} multiline />

      <Text style={s.label}>Genel İpucu</Text>
      <TextInput style={s.input} value={hint} onChangeText={setHint} placeholder="İpucu (opsiyonel)" placeholderTextColor={colors.textMuted} />

      <Text style={s.label}>Bölge</Text>
      <TextInput style={s.input} value={region} onChangeText={setRegion} placeholder="Şehir / Bölge" placeholderTextColor={colors.textMuted} />

      {/* ── Difficulty ── */}
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

      <Text style={s.label}>Final Konum Yarıçapı (metre)</Text>
      <TextInput style={s.input} value={maxDist} onChangeText={setMaxDist} keyboardType="numeric" placeholder="50" placeholderTextColor={colors.textMuted} />

      <View style={s.switchRow}>
        <Text style={s.label}>Fotoğraf Kanıtı Zorunlu</Text>
        <Switch value={requiresPhoto} onValueChange={setRequiresPhoto} trackColor={{ true: colors.primary }} />
      </View>

      {/* ── Category ── */}
      <Text style={s.label}>Kategori</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {categories.map((c) => (
          <TouchableOpacity key={c.id} style={[s.catBtn, categoryId === c.id && s.catBtnActive]} onPress={() => setCategoryId(c.id)}>
            <Text style={[s.catText, categoryId === c.id && { color: '#fff' }]}>{c.icon} {c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Mystery Photo ── */}
      <TouchableOpacity
        style={[s.btn, { backgroundColor: '#f0f2f4', marginBottom: 10 }]}
        onPress={() => pickAndUpload((url) => { setPhotoUrl(url); Alert.alert('✅', 'Gizem fotoğrafı yüklendi.'); }, 'quest-photos', 'quest')}
      >
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {photoUrl ? '✅ Gizem Fotoğrafı Yüklendi — Değiştir' : '📷 Gizem Fotoğrafı Yükle *'}
        </Text>
      </TouchableOpacity>

      {/* ── Final Location ── */}
      <TouchableOpacity style={[s.btn, { backgroundColor: '#f0f2f4', marginBottom: 16 }]} onPress={getMyLocation} disabled={locating}>
        {locating ? <ActivityIndicator color={colors.primary} /> : (
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            {lat ? `✅ Final Konum: ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : '📍 Gizli Final Konumunu Seç *'}
          </Text>
        )}
      </TouchableOpacity>

      {/* ── Multi-step Toggle ── */}
      <View style={[s.switchRow, { marginBottom: 8 }]}>
        <View>
          <Text style={s.label}>Çoklu Adımlı Görev</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>Soru-cevap veya resim karşılaştırma adımları ekle</Text>
        </View>
        <Switch value={multiStep} onValueChange={(v) => { setMultiStep(v); if (v && steps.length === 0) setSteps([emptyStep()]); }} trackColor={{ true: colors.primary }} />
      </View>

      {/* ── Steps ── */}
      {multiStep && (
        <View style={{ marginBottom: 8 }}>
          {steps.map((step, i) => (
            <View key={i} style={s.stepCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontWeight: '900', color: colors.text, fontSize: 15 }}>Adım {i + 1}</Text>
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(i)}>
                    <Text style={{ color: colors.red, fontWeight: '700' }}>✕ Sil</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Soru-Cevap toggle */}
              <View style={s.switchRow}>
                <Text style={s.stepLabel}>Soru-Cevap</Text>
                <Switch
                  value={step.has_question}
                  onValueChange={(v) => updateStep(i, { has_question: v })}
                  trackColor={{ true: colors.primary }}
                />
              </View>
              {step.has_question && (
                <>
                  <TextInput
                    style={s.input}
                    value={step.question}
                    onChangeText={(v) => updateStep(i, { question: v })}
                    placeholder="Soru"
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                  <TextInput
                    style={s.input}
                    value={step.correct_answer}
                    onChangeText={(v) => updateStep(i, { correct_answer: v })}
                    placeholder="Doğru Cevap"
                    placeholderTextColor={colors.textMuted}
                  />
                </>
              )}

              {/* Resim Karşılaştırma toggle */}
              <View style={s.switchRow}>
                <Text style={s.stepLabel}>📷 Resim Karşılaştırma</Text>
                <Switch
                  value={step.has_image}
                  onValueChange={(v) => updateStep(i, { has_image: v })}
                  trackColor={{ true: colors.primary }}
                />
              </View>
              {step.has_image && (
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: '#f0f2f4', marginBottom: 10 }]}
                  onPress={() => pickAndUpload((url) => updateStep(i, { reference_photo_url: url }), 'quest-photos', `step${i}`)}
                >
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    {step.reference_photo_url ? '✅ Referans Fotoğraf Yüklendi' : '🖼️ Referans Fotoğraf Yükle'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Yaklaşma yarıçapı */}
              <Text style={s.stepLabel}>Yaklaşma Yarıçapı (metre)</Text>
              <TextInput
                style={s.input}
                value={String(step.approach_radius_meters)}
                onChangeText={(v) => updateStep(i, { approach_radius_meters: parseInt(v) || 0 })}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor={colors.textMuted}
              />

              {/* Adım ipucu */}
              <Text style={s.stepLabel}>Adım İpucu (opsiyonel)</Text>
              <TextInput
                style={s.input}
                value={step.hint}
                onChangeText={(v) => updateStep(i, { hint: v })}
                placeholder="Bu adım için ipucu..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ))}

          <TouchableOpacity style={[s.btn, { backgroundColor: '#e8f5e9', marginBottom: 16 }]} onPress={() => setSteps(prev => [...prev, emptyStep()])}>
            <Text style={{ color: '#2e7d32', fontWeight: '800' }}>+ Adım Ekle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Submit ── */}
      <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Görevi Oluştur ✅</Text>}
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  label: { fontWeight: '700', color: colors.text, marginBottom: 6, fontSize: 14, marginTop: 4 },
  stepLabel: { fontWeight: '600', color: colors.text, marginBottom: 4, fontSize: 13 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  diffRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  diffBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f2f4', alignItems: 'center' },
  diffBtnActive: { backgroundColor: colors.primary },
  diffText: { fontWeight: '700', color: colors.textMuted, fontSize: 12 },
  diffTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f2f4', marginRight: 8 },
  catBtnActive: { backgroundColor: colors.primary },
  catText: { fontWeight: '700', color: colors.text, fontSize: 13 },
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  stepCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
});
