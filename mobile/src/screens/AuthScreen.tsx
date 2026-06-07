import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

export default function AuthScreen() {
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
          email,
          password,
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.logo}>
          <Text style={s.logoText}>İzi</Text>
        </View>
        <Text style={s.title}>İzi Bul</Text>
        <Text style={s.subtitle}>
          {mode === 'login' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
        </Text>

        {mode === 'signup' && (
          <TextInput
            style={s.input}
            placeholder="Kullanıcı adı"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        )}
        <TextInput
          style={s.input}
          placeholder="E-posta"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder="Şifre"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={s.button} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>
              {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={s.switch}>
            {mode === 'login'
              ? 'Hesabın yok mu? Kayıt ol'
              : 'Zaten hesabın var mı? Giriş yap'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  logo: {
    width: 72, height: 72, borderRadius: 20, alignSelf: 'center',
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  title: { fontSize: 30, fontWeight: '900', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 28, marginTop: 4 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: colors.text, marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  switch: { color: colors.primary, textAlign: 'center', marginTop: 20, fontSize: 15, fontWeight: '600' },
});
