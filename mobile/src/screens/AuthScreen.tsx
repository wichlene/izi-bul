import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) {
      Alert.alert('Eksik bilgi', 'E-posta ve şifre gerekli.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!username) {
          Alert.alert('Eksik bilgi', 'Kullanıcı adı gerekli.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username } },
        });
        if (error) throw error;
        Alert.alert('Kayıt başarılı', 'E-postanı kontrol et ve giriş yap.');
        setMode('login');
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Bir şeyler ters gitti.');
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      Alert.alert('E-posta gir', 'Şifreni sıfırlamak için önce e-posta adresini gir.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) Alert.alert('Hata', error.message);
    else Alert.alert('📧 Gönderildi', 'Şifre sıfırlama e-postası gönderildi. Gelen kutunu kontrol et.');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5f6fa' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logo}>
            <Text style={s.logoEmoji}>🗺️</Text>
          </View>
          <Text style={s.appName}>İzi Bul</Text>
          <Text style={s.tagline}>Türkiye'yi keşfet, görevleri tamamla</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            {mode === 'login' ? 'Hoş geldin 👋' : 'Hesap oluştur'}
          </Text>

          {mode === 'signup' && (
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Kullanıcı Adı</Text>
              <TextInput
                style={s.input}
                placeholder="kullanici_adi"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          )}

          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>E-posta</Text>
            <TextInput
              style={s.input}
              placeholder="ornek@email.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={s.inputWrap}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.inputLabel}>Şifre</Text>
              {mode === 'login' && (
                <TouchableOpacity onPress={forgotPassword} disabled={loading}>
                  <Text style={s.forgotText}>Şifremi unuttum</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={[s.button, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.buttonText}>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ marginTop: 16 }}>
            <Text style={s.switchText}>
              {mode === 'login'
                ? 'Hesabın yok mu? '
                : 'Zaten hesabın var mı? '}
              <Text style={{ color: colors.primary, fontWeight: '800' }}>
                {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>İzi Bul • Konum tabanlı keşif oyunu</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: 34, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 20 },

  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#f7f9fa', borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: colors.text,
  },

  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '700' },

  button: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  switchText: { textAlign: 'center', fontSize: 15, color: colors.textMuted },
  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 32, opacity: 0.6 },
});
