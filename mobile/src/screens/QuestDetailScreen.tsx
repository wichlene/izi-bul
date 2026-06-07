import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors, difficulties } from '../theme';
import { distanceMeters, formatDistance } from '../lib/distance';
import { Quest } from '../types';

interface Step {
  id: string;
  step_number: number;
  step_type: string;
  has_question: boolean;
  has_image: boolean;
  question: string | null;
  photo_url: string | null;
  target_lat: number;
  target_lng: number;
  approach_radius_meters: number;
  hint: string | null;
}

export default function QuestDetailScreen({ route, navigation }: any) {
  const { questId } = route.params;
  const { session } = useAuth();
  const uid = session?.user.id;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [alreadyWon, setAlreadyWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [answer, setAnswer] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ points: number; cash: number } | null>(null);
  const [started, setStarted] = useState(false);
  const watchRef = useRef<any>(null);

  useEffect(() => {
    navigation.setOptions({ title: 'Görev' });
    load();
  }, [questId]);

  const load = useCallback(async () => {
    const [questRes, stepsRes, wonRes] = await Promise.all([
      supabase.from('quests').select('*').eq('id', questId).single(),
      supabase.from('quest_steps').select('*').eq('quest_id', questId).order('step_number'),
      uid ? supabase.from('submissions').select('id').eq('quest_id', questId).eq('user_id', uid).eq('is_winner', true).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (questRes.data) {
      setQuest(questRes.data as Quest);
      navigation.setOptions({ title: questRes.data.title });
    }
    setSteps((stepsRes.data as Step[]) || []);
    setAlreadyWon(!!wonRes?.data);
    setLoading(false);
  }, [questId, uid]);

  const startGPS = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsError('Konum izni gerekli.');
      return;
    }
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      (loc) => {
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setGpsError('');
      },
    );
  }, []);

  useEffect(() => {
    if (started) startGPS();
    return () => { watchRef.current?.remove?.(); };
  }, [started]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin gerekli', 'Fotoğraf erişimi gerekiyor.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() || 'jpg';
    const fileName = `proof_${Date.now()}.${ext}`;
    const formData = new FormData();
    formData.append('file', { uri: asset.uri, name: fileName, type: `image/${ext}` } as any);
    const { data, error } = await supabase.storage.from('quest-photos').upload(fileName, formData);
    if (error) { Alert.alert('Hata', 'Fotoğraf yüklenemedi.'); return; }
    const { data: urlData } = supabase.storage.from('quest-photos').getPublicUrl(data.path);
    setPhotoUrl(urlData.publicUrl);
  };

  const submit = async () => {
    if (!quest || !uid) return;
    if (!coords) { Alert.alert('GPS', 'Konum alınamadı, bekle.'); return; }

    const activeStep = steps.length > 0 ? steps[currentStep] : null;
    const targetLat = activeStep ? activeStep.target_lat : quest.latitude;
    const targetLng = activeStep ? activeStep.target_lng : quest.longitude;
    const maxDist = activeStep ? activeStep.approach_radius_meters : quest.max_distance_meters;
    const dist = distanceMeters(coords.lat, coords.lng, targetLat, targetLng);

    if (dist > maxDist) {
      Alert.alert('Çok uzaksın', `Görev noktasına ${formatDistance(dist)} uzaktasın. Daha yaklaş!`);
      return;
    }

    if (activeStep?.has_question && !answer.trim()) {
      Alert.alert('Cevap gir', 'Soruyu cevapla.');
      return;
    }
    if ((activeStep?.has_image || quest.requires_photo_proof) && !photoUrl) {
      Alert.alert('Fotoğraf gerekli', 'Fotoğraf yükle.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('https://izibul.com/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          quest_id: quest.id,
          latitude: coords.lat,
          longitude: coords.lng,
          photo_url: photoUrl || null,
          answer: answer || null,
          step_id: activeStep?.id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');

      if (steps.length > 0 && currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
        setAnswer('');
        setPhotoUrl('');
        Alert.alert('✅ Adım tamamlandı!', 'Bir sonraki adıma geç.');
      } else {
        setDone({ points: data.points_earned || quest.points, cash: quest.cash_reward });
        setAlreadyWon(true);
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!quest) return <View style={s.center}><Text>Görev bulunamadı.</Text></View>;

  const diff = difficulties[quest.difficulty] ?? difficulties.medium;
  const activeStep = steps.length > 0 ? steps[currentStep] : null;
  const dist = coords ? distanceMeters(coords.lat, coords.lng,
    activeStep ? activeStep.target_lat : quest.latitude,
    activeStep ? activeStep.target_lng : quest.longitude) : null;

  if (done) {
    return (
      <View style={[s.center, { padding: 32 }]}>
        <Text style={{ fontSize: 60 }}>🏆</Text>
        <Text style={s.winTitle}>Tebrikler!</Text>
        <Text style={s.winSub}>+{done.points} puan kazandın!</Text>
        {done.cash > 0 && <Text style={s.winCash}>₺{done.cash} ödül!</Text>}
        <TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}>
          <Text style={s.btnText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {quest.photo_url ? (
        <Image source={{ uri: quest.photo_url }} style={s.heroImg} />
      ) : null}

      <View style={s.row}>
        <View style={[s.badge, { backgroundColor: diff.color }]}>
          <Text style={s.badgeText}>{diff.label}</Text>
        </View>
        <Text style={s.pts}>+{quest.points} puan</Text>
        {quest.cash_reward > 0 && <Text style={s.cash}>₺{quest.cash_reward}</Text>}
      </View>

      <Text style={s.title}>{quest.title}</Text>
      <Text style={s.desc}>{quest.description}</Text>
      {quest.region ? <Text style={s.region}>📍 {quest.region}</Text> : null}

      {alreadyWon && (
        <View style={s.wonBox}>
          <Text style={s.wonText}>✅ Bu görevi zaten tamamladın!</Text>
        </View>
      )}

      {!alreadyWon && !started && (
        <TouchableOpacity style={s.btn} onPress={() => setStarted(true)}>
          <Text style={s.btnText}>Göreve Başla 🚀</Text>
        </TouchableOpacity>
      )}

      {!alreadyWon && started && (
        <View style={s.playBox}>
          {steps.length > 1 && (
            <Text style={s.stepInfo}>Adım {currentStep + 1} / {steps.length}</Text>
          )}

          <View style={s.gpsBox}>
            {gpsError ? (
              <Text style={{ color: colors.red }}>{gpsError}</Text>
            ) : coords ? (
              <Text style={[s.distText, dist !== null && dist <= (activeStep?.approach_radius_meters ?? quest.max_distance_meters) ? { color: colors.green } : {}]}>
                {dist !== null ? `📍 ${formatDistance(dist)} uzakta` : 'Konum alınıyor...'}
              </Text>
            ) : (
              <ActivityIndicator color={colors.primary} />
            )}
          </View>

          {activeStep?.hint || quest.hint ? (
            <View style={s.hintBox}>
              <Text style={s.hintText}>💡 {activeStep?.hint || quest.hint}</Text>
            </View>
          ) : null}

          {activeStep?.has_question && activeStep.question ? (
            <View>
              <Text style={s.label}>❓ {activeStep.question}</Text>
              <TextInput
                style={s.input}
                placeholder="Cevabınızı girin..."
                placeholderTextColor={colors.textMuted}
                value={answer}
                onChangeText={setAnswer}
              />
            </View>
          ) : null}

          {(activeStep?.has_image || quest.requires_photo_proof) && (
            <View>
              <Text style={s.label}>📸 Fotoğraf kanıtı</Text>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={s.photoPreview} />
              ) : null}
              <TouchableOpacity style={s.photoBtn} onPress={pickPhoto}>
                <Text style={s.photoBtnText}>{photoUrl ? 'Fotoğrafı Değiştir' : 'Fotoğraf Seç 📷'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={[s.btn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Tamamla ✅</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImg: { width: '100%', height: 220, borderRadius: 16, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  pts: { color: colors.primary, fontWeight: '800' },
  cash: { color: colors.green, fontWeight: '900' },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 8 },
  desc: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: 8 },
  region: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  wonBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.green },
  wonText: { color: colors.green, fontWeight: '800', textAlign: 'center' },
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  playBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  stepInfo: { color: colors.primary, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  gpsBox: { alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#f7f9fa', borderRadius: 12 },
  distText: { fontSize: 20, fontWeight: '900', color: colors.text },
  hintBox: { backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, marginBottom: 12 },
  hintText: { color: '#92400e', fontSize: 14 },
  label: { fontWeight: '700', color: colors.text, marginBottom: 6, fontSize: 15 },
  input: { backgroundColor: '#f7f9fa', borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  photoBtn: { backgroundColor: '#f7f9fa', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  photoBtnText: { color: colors.primary, fontWeight: '700' },
  photoPreview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  winTitle: { fontSize: 28, fontWeight: '900', color: colors.text, marginTop: 12 },
  winSub: { fontSize: 18, color: colors.primary, fontWeight: '800', marginTop: 8 },
  winCash: { fontSize: 20, color: colors.green, fontWeight: '900', marginTop: 4 },
});
