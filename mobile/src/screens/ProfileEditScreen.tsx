import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

export default function ProfileEditScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Profili Düzenle' });
    if (!uid) return;
    supabase.from('profiles').select('full_name, username, city, bio').eq('id', uid).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setCity(data.city || '');
        setBio(data.bio || '');
      }
      setLoading(false);
    });
  }, [uid]);

  const save = async () => {
    if (!username.trim()) { Alert.alert('Hata', 'Kullanıcı adı boş olamaz.'); return; }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      Alert.alert('Hata', 'Kullanıcı adı 3-30 karakter, sadece harf/rakam/_ olmalı.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('https://izibul.com/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ full_name: fullName, username: username.toLowerCase(), city, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız');
      Alert.alert('✅ Kaydedildi', 'Profilin güncellendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={s.label}>Ad Soyad</Text>
      <TextInput style={s.input} value={fullName} onChangeText={setFullName} placeholder="Ad Soyad" placeholderTextColor={colors.textMuted} />

      <Text style={s.label}>Kullanıcı Adı</Text>
      <View style={s.inputWrap}>
        <Text style={s.at}>@</Text>
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          value={username} onChangeText={setUsername}
          placeholder="kullanici_adi" placeholderTextColor={colors.textMuted}
          autoCapitalize="none" autoCorrect={false}
        />
      </View>
      <Text style={s.hint}>3-30 karakter, harf/rakam/_</Text>

      <Text style={s.label}>Şehir</Text>
      <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="İstanbul, Ankara..." placeholderTextColor={colors.textMuted} />

      <Text style={s.label}>Bio</Text>
      <TextInput
        style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
        value={bio} onChangeText={setBio}
        placeholder="Kendini tanıt (max 160 karakter)" placeholderTextColor={colors.textMuted}
        multiline maxLength={160}
      />
      <Text style={s.charCount}>{bio.length}/160</Text>

      <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Kaydet ✅</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700', color: colors.text, marginBottom: 6, fontSize: 14, marginTop: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginBottom: 6 },
  at: { fontSize: 16, color: colors.textMuted, marginRight: 4 },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 12, marginLeft: 2 },
  charCount: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginBottom: 20, marginTop: -8 },
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
