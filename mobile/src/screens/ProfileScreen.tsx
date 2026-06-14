import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/uploadPhoto';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';
import { Profile } from '../types';

function LevelBadge({ level }: { level: number }) {
  const color = level >= 10 ? '#a855f7' : level >= 5 ? '#f97316' : colors.primary;
  return (
    <View style={[s.levelBadge, { backgroundColor: color }]}>
      <Text style={s.levelBadgeText}>Lv.{level}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const load = () => {
    if (!uid) return;
    supabase.from('profiles').select('*').eq('id', uid).single().then(({ data }) => {
      setProfile(data as Profile);
      setLoading(false);
    });
  };

  const loadPosts = async () => {
    if (!uid) return;
    setPostsLoading(true);
    const [{ data: postsData }, { data: subsData }] = await Promise.all([
      supabase
        .from('posts')
        .select('id, post_type, content, photo_url, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('submissions')
        .select('id, status, distance_meters, created_at, quests(title, points, cash_reward)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(15),
    ]);
    if (postsData) setMyPosts(postsData);
    if (subsData) setSubmissions(subsData);
    setPostsLoading(false);
  };

  useEffect(() => {
    load();
    loadPosts();
    const unsubscribe = navigation.addListener('focus', () => { load(); loadPosts(); });
    return unsubscribe;
  }, [uid]);

  const changeAvatar = async () => {
    Alert.alert('Profil Fotoğrafı', 'Kaynak seç', [
      { text: 'Kamera', onPress: () => pickPhoto('camera') },
      { text: 'Galeri', onPress: () => pickPhoto('library') },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const pickPhoto = async (source: 'camera' | 'library') => {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    setUploadingPhoto(true);
    try {
      const url = await uploadImage(asset.uri, `avatar_${uid}`);
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', uid);
      load();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const menus: { icon: string; label: string; screen: string; condition?: boolean }[] = [
    { icon: '❤️', label: 'İyilik Hareketi', screen: 'GoodDeedFull' },
    { icon: '🏆', label: 'Liderlik Tablosu', screen: 'Leaderboard' },
    { icon: '🔔', label: 'Bildirimler', screen: 'Notifications' },
    { icon: '➕', label: 'Görev Oluştur', screen: 'CreateQuest', condition: profile?.is_business || profile?.is_admin },
    { icon: '📊', label: 'İşletme İstatistikleri', screen: 'BusinessStats', condition: profile?.is_business },
    { icon: '🛡️', label: 'Admin Paneli', screen: 'Admin', condition: profile?.is_admin },
  ];
  const visibleMenus = menus.filter((m) => m.condition === undefined || m.condition);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      {/* Instagram-style header */}
      <View style={s.header}>
        {/* Avatar */}
        <TouchableOpacity style={s.avatarWrap} onPress={changeAvatar} disabled={uploadingPhoto}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarInitial}>{profile?.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          {uploadingPhoto ? (
            <View style={s.avatarOverlay}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : (
            <View style={s.avatarEditBadge}>
              <Text style={{ fontSize: 10 }}>📷</Text>
            </View>
          )}
          <LevelBadge level={profile?.level ?? 1} />
        </TouchableOpacity>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCol}>
            <Text style={s.statNum}>{profile?.total_points ?? 0}</Text>
            <Text style={s.statLbl}>Puan</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCol}>
            <Text style={s.statNum}>{profile?.total_finds ?? 0}</Text>
            <Text style={s.statLbl}>Buluş</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCol}>
            <Text style={s.statNum}>{profile?.level ?? 1}</Text>
            <Text style={s.statLbl}>Seviye</Text>
          </View>
        </View>
      </View>

      {/* User info block */}
      <View style={s.infoBlock}>
        <Text style={s.fullName}>{profile?.full_name || profile?.username}</Text>
        <Text style={s.handle}>@{profile?.username}</Text>
        {profile?.city ? <Text style={s.city}>📍 {profile.city}</Text> : null}
        {(profile as any)?.bio ? <Text style={s.bio}>{(profile as any).bio}</Text> : null}
      </View>

      {/* Action buttons */}
      <View style={s.actionRow}>
        <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={s.editBtnText}>Profili Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Friends')}>
          <Text style={{ fontSize: 18 }}>👥</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Menu */}
      <View style={s.menuCard}>
        {visibleMenus.map((m, i) => (
          <TouchableOpacity
            key={m.screen}
            style={[s.menuItem, i === visibleMenus.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate(m.screen)}
          >
            <Text style={s.menuIcon}>{m.icon}</Text>
            <Text style={s.menuLabel}>{m.label}</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Email */}
      <View style={s.emailBox}>
        <Text style={s.emailLabel}>E-posta</Text>
        <Text style={s.emailValue}>{session?.user.email}</Text>
      </View>

      <TouchableOpacity style={s.logout} onPress={() => supabase.auth.signOut()}>
        <Text style={s.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>

      {/* Posts Section */}
      <View style={s.postsSection}>
        <Text style={s.postsSectionTitle}>💬 Paylaşımlarım</Text>
        {postsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : myPosts.length === 0 ? (
          <View style={s.postsEmpty}><Text style={s.postsEmptyText}>Henüz paylaşım yok</Text></View>
        ) : (
          myPosts.map((post) => {
            const typeInfo =
              post.post_type === 'good_deed' ? { icon: '💗', color: '#ec4899' }
              : post.post_type === 'quest_complete' ? { icon: '🏆', color: '#f59e0b' }
              : post.post_type === 'announcement' ? { icon: '📢', color: '#3b82f6' }
              : { icon: '💬', color: '#536471' };
            return (
              <View key={post.id} style={s.postCard}>
                {post.photo_url ? <Image source={{ uri: post.photo_url }} style={s.postImage} /> : null}
                <View style={s.postBody}>
                  <View style={[s.typePill, { backgroundColor: typeInfo.color + '20' }]}>
                    <Text style={[s.typePillText, { color: typeInfo.color }]}>{typeInfo.icon}</Text>
                  </View>
                  <Text style={s.postContent} numberOfLines={3}>{post.content}</Text>
                  <Text style={s.postDate}>{new Date(post.created_at).toLocaleDateString('tr-TR')}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Submission history */}
      <View style={s.postsSection}>
        <Text style={s.postsSectionTitle}>🗺️ Görev Geçmişim</Text>
        {submissions.length === 0 ? (
          <View style={s.postsEmpty}><Text style={s.postsEmptyText}>Henüz görev tamamlanmamış</Text></View>
        ) : (
          submissions.map((sub) => {
            const q = Array.isArray(sub.quests) ? sub.quests[0] : sub.quests;
            const statusInfo =
              sub.status === 'approved' || sub.status === 'winner'
                ? { icon: '🏆', color: colors.green, label: 'Kazandı' }
                : sub.status === 'rejected'
                ? { icon: '❌', color: colors.red, label: 'Reddedildi' }
                : { icon: '⏳', color: '#f59e0b', label: 'Bekliyor' };
            return (
              <View key={sub.id} style={s.subRow}>
                <View style={[s.subStatus, { backgroundColor: statusInfo.color + '18' }]}>
                  <Text style={{ fontSize: 20 }}>{statusInfo.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.subTitle} numberOfLines={1}>{q?.title ?? 'Görev'}</Text>
                  <Text style={s.sub}>{statusInfo.label} · {Math.round(sub.distance_meters ?? 0)}m</Text>
                </View>
                {(sub.status === 'approved' || sub.status === 'winner') && q?.cash_reward > 0 && (
                  <Text style={s.subReward}>₺{q.cash_reward}</Text>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    gap: 16,
  },

  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.primary },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.primary,
  },
  avatarInitial: { color: '#fff', fontWeight: '900', fontSize: 34 },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 12, width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  levelBadge: {
    position: 'absolute', top: -4, right: -4,
    borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2,
  },
  levelBadgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },

  statsRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: colors.text },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },

  infoBlock: { paddingHorizontal: 20, paddingBottom: 12 },
  fullName: { fontSize: 18, fontWeight: '900', color: colors.text },
  handle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  city: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  bio: { fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 20 },

  actionRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 12,
  },
  editBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
  },
  editBtnText: { color: colors.text, fontWeight: '800', fontSize: 14 },
  iconBtn: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border,
  },

  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 0, marginBottom: 12 },

  menuCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIcon: { fontSize: 20, marginRight: 12, width: 28 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  menuArrow: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },

  emailBox: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14,
    padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  emailLabel: { fontSize: 12, color: colors.textMuted },
  emailValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },

  logout: {
    backgroundColor: '#fee', marginHorizontal: 16, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fcc',
  },
  logoutText: { color: colors.red, fontWeight: '800', fontSize: 15 },

  postsSection: { marginTop: 16, marginHorizontal: 16, marginBottom: 16 },
  postsSectionTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 10 },
  postsEmpty: { paddingVertical: 20, alignItems: 'center' },
  postsEmptyText: { color: colors.textMuted, fontSize: 14 },
  postCard: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  postImage: { width: '100%', height: 160, resizeMode: 'cover' },
  postBody: { padding: 12 },
  postContent: { fontSize: 14, color: colors.text, lineHeight: 20 },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  postDate: { fontSize: 12, color: colors.textMuted },
  typePill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  typePillText: { fontSize: 13, fontWeight: '800' },
  subRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  subStatus: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  subTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  subReward: { fontSize: 15, fontWeight: '900', color: colors.green },
});
