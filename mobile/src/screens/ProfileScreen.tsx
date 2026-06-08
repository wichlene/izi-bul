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

  const load = () => {
    if (!uid) return;
    supabase.from('profiles').select('*').eq('id', uid).single().then(({ data }) => {
      setProfile(data as Profile);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [uid]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const menus: { icon: string; label: string; screen: string; condition?: boolean }[] = [
    { icon: '✏️', label: 'Profili Düzenle', screen: 'EditProfile' },
    { icon: '👥', label: 'Arkadaşlar', screen: 'Friends' },
    { icon: '❤️', label: 'İyilik Hareketi', screen: 'GoodDeedFull' },
    { icon: '🏆', label: 'Liderlik Tablosu', screen: 'Leaderboard' },
    { icon: '🔔', label: 'Bildirimler', screen: 'Notifications' },
    { icon: '➕', label: 'Görev Oluştur', screen: 'CreateQuest', condition: profile?.is_business || profile?.is_admin },
    { icon: '📊', label: 'İşletme İstatistikleri', screen: 'BusinessStats', condition: profile?.is_business },
    { icon: '🛡️', label: 'Admin Paneli', screen: 'Admin', condition: profile?.is_admin },
  ];

  const visibleMenus = menus.filter((m) => m.condition === undefined || m.condition);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Profil başlığı */}
      <View style={s.head}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{profile?.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.name}>{profile?.full_name || profile?.username}</Text>
          <Text style={s.handle}>@{profile?.username}</Text>
          {profile?.city ? <Text style={s.city}>📍 {profile.city}</Text> : null}
          {(profile as any)?.bio ? <Text style={s.bio}>{(profile as any).bio}</Text> : null}
        </View>
      </View>

      {/* İstatistikler */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{profile?.total_points ?? 0}</Text>
          <Text style={s.statLabel}>Puan</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>{profile?.total_finds ?? 0}</Text>
          <Text style={s.statLabel}>Buluş</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>{profile?.level ?? 1}</Text>
          <Text style={s.statLabel}>Seviye</Text>
        </View>
      </View>

      {/* E-posta */}
      <View style={s.infoBox}>
        <Text style={s.infoLabel}>E-posta</Text>
        <Text style={s.infoValue}>{session?.user.email}</Text>
      </View>

      {/* Menü */}
      <View style={s.menuSection}>
        {visibleMenus.map((m, i) => (
          <TouchableOpacity
            key={m.screen}
            style={[s.menuItem, i === visibleMenus.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate(m.screen)}>
            <Text style={s.menuIcon}>{m.icon}</Text>
            <Text style={s.menuLabel}>{m.label}</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logout} onPress={() => supabase.auth.signOut()}>
        <Text style={s.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 78, height: 78, borderRadius: 39, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 32 },
  name: { fontSize: 20, fontWeight: '900', color: colors.text },
  handle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  city: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  bio: { fontSize: 13, color: colors.text, marginTop: 6, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  infoBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  infoLabel: { fontSize: 12, color: colors.textMuted },
  infoValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4 },
  menuSection: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIcon: { fontSize: 20, marginRight: 12, width: 28 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  menuArrow: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  logout: {
    backgroundColor: '#fee', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#fcc',
  },
  logoutText: { color: colors.red, fontWeight: '800', fontSize: 15 },
});
