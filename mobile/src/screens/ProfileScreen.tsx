import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';
import { Profile } from '../types';

export default function ProfileScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!uid) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
      setProfile(data as Profile);
      setLoading(false);
    })();
  }, [uid]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const stats = [
    { label: 'Puan', value: profile?.total_points ?? 0 },
    { label: 'Buluş', value: profile?.total_finds ?? 0 },
    { label: 'Seviye', value: profile?.level ?? 1 },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={s.head}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{profile?.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={s.name}>{profile?.full_name || profile?.username}</Text>
        <Text style={s.handle}>@{profile?.username}</Text>
        {profile?.city ? <Text style={s.city}>📍 {profile.city}</Text> : null}
      </View>

      <View style={s.statsRow}>
        {stats.map((st) => (
          <View key={st.label} style={s.statBox}>
            <Text style={s.statValue}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.infoBox}>
        <Text style={s.infoLabel}>E-posta</Text>
        <Text style={s.infoValue}>{session?.user.email}</Text>
      </View>

      <View style={s.menuSection}>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('GoodDeed')}>
          <Text style={s.menuIcon}>❤️</Text>
          <Text style={s.menuLabel}>İyilik Hareketi</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('Notifications')}>
          <Text style={s.menuIcon}>🔔</Text>
          <Text style={s.menuLabel}>Bildirimler</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('CreateQuest')}>
          <Text style={s.menuIcon}>➕</Text>
          <Text style={s.menuLabel}>Görev Oluştur</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.logout} onPress={() => supabase.auth.signOut()}>
        <Text style={s.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 38 },
  name: { fontSize: 22, fontWeight: '900', color: colors.text },
  handle: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
  city: { fontSize: 14, color: colors.textMuted, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  infoBox: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: colors.border,
  },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  menuSection: {
    backgroundColor: colors.card, borderRadius: 14, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  menuArrow: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  logout: {
    backgroundColor: '#fee', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#fcc',
  },
  logoutText: { color: colors.red, fontWeight: '800', fontSize: 16 },
});
