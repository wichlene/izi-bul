import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, ScrollView, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors, difficulties } from '../theme';
import { distanceMeters, formatDistance } from '../lib/distance';
import { Quest } from '../types';
import { uploadImage } from '../lib/uploadPhoto';
import PostActions from '../components/PostActions';

interface Category { id: string; name: string; icon: string }

interface Post {
  id: string;
  post_type: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  quest_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
  profiles: { username?: string; avatar_url?: string | null } | null;
}

type FeedItem =
  | { kind: 'quest'; quest: Quest; distance?: number; created_at: string }
  | { kind: 'post'; post: Post; created_at: string };

function timeAgo(date: string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return `${sec}sn`;
  if (sec < 3600) return `${Math.floor(sec / 60)}dk`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}sa`;
  return `${Math.floor(sec / 86400)}g`;
}

export default function HomeScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;

  const [quests, setQuests] = useState<Quest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Composer state
  const [showComposer, setShowComposer] = useState(false);
  const [compContent, setCompContent] = useState('');
  const [compType, setCompType] = useState<'social' | 'good_deed'>('social');
  const [compPhoto, setCompPhoto] = useState('');
  const [compCoords, setCompCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [compPosting, setCompPosting] = useState(false);
  const [compUploading, setCompUploading] = useState(false);

  // Get user location for distance calc
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const load = useCallback(async () => {
    let adminStatus = false;
    if (uid) {
      const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', uid).single();
      adminStatus = !!(prof as any)?.is_admin;
      setIsAdmin(adminStatus);
    }

    let questQuery = supabase
      .from('quests')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (!adminStatus) questQuery = questQuery.eq('is_active', true);

    const [{ data: questData }, { data: postData }, { data: catData }] = await Promise.all([
      questQuery,
      supabase
        .from('posts')
        .select('id, post_type, content, photo_url, created_at, quest_id, latitude, longitude, profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('categories').select('id, name, icon'),
    ]);

    if (questData) {
      const all = questData as Quest[];
      setQuests(all);
      if (adminStatus) setInactiveCount(all.filter((q) => !q.is_active).length);
    }
    if (postData && postData.length > 0) {
      const ids = postData.map((p: any) => p.id);
      const [{ data: likeRows }, { data: commentCounts }] = await Promise.all([
        supabase.from('post_likes').select('post_id, user_id').in('post_id', ids),
        supabase.from('post_comments').select('post_id').in('post_id', ids),
      ]);
      const likeCounts: Record<string, number> = {};
      const likedByMe = new Set<string>();
      for (const r of likeRows || []) {
        likeCounts[r.post_id] = (likeCounts[r.post_id] || 0) + 1;
        if (r.user_id === uid) likedByMe.add(r.post_id);
      }
      const commentCountMap: Record<string, number> = {};
      for (const r of commentCounts || []) {
        commentCountMap[r.post_id] = (commentCountMap[r.post_id] || 0) + 1;
      }
      setPosts(postData.map((p: any) => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles,
        like_count: likeCounts[p.id] || 0,
        liked_by_me: likedByMe.has(p.id),
        comment_count: commentCountMap[p.id] || 0,
      })) as Post[]);
    } else if (postData) {
      setPosts([]);
    }
    if (catData) setCategories(catData as Category[]);

    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const submitPost = async () => {
    if (!compContent.trim() || !uid) return;
    setCompPosting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: uid,
        post_type: compType,
        content: compContent.trim().slice(0, 500),
        photo_url: compPhoto || null,
        latitude: compCoords?.lat ?? null,
        longitude: compCoords?.lng ?? null,
      });
      if (error) throw new Error(error.message);
      setCompContent(''); setCompPhoto(''); setCompCoords(null); setShowComposer(false);
      load();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Paylaşılamadı');
    } finally {
      setCompPosting(false);
    }
  };

  const pickCompPhoto = () => {
    Alert.alert('Fotoğraf', 'Kaynak seç', [
      { text: '📷 Kamera', onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        const r = await ImagePicker.launchCameraAsync({ quality: 0.6 });
        if (!r.canceled && r.assets[0]) {
          setCompUploading(true);
          try { setCompPhoto(await uploadImage(r.assets[0].uri, 'post')); } catch {}
          finally { setCompUploading(false); }
        }
      }},
      { text: '🖼️ Galeri', onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
        if (!r.canceled && r.assets[0]) {
          setCompUploading(true);
          try { setCompPhoto(await uploadImage(r.assets[0].uri, 'post')); } catch {}
          finally { setCompUploading(false); }
        }
      }},
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const markCompLocation = async () => {
    if (compCoords) { setCompCoords(null); return; }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setCompCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {}
  };

  // Unified feed: quests + posts mixed, newest first
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    for (const q of quests) {
      const distance = userPos ? distanceMeters(userPos.lat, userPos.lng, q.latitude, q.longitude) : undefined;
      items.push({ kind: 'quest', quest: q, distance, created_at: q.created_at });
    }
    for (const p of posts) items.push({ kind: 'post', post: p, created_at: p.created_at });
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [quests, posts, userPos]);

  const filtered = useMemo(() => {
    let items = feed;
    if (filter === 'quests') items = items.filter((i) => i.kind === 'quest');
    else if (filter === 'good_deed') items = items.filter((i) => i.kind === 'post' && i.post.post_type === 'good_deed');
    else if (filter === 'quest_complete') items = items.filter((i) => i.kind === 'post' && i.post.post_type === 'quest_complete');
    else if (filter !== 'all') items = items.filter((i) => i.kind !== 'quest' || i.quest.category_id === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => {
        if (i.kind === 'quest') {
          return i.quest.title.toLowerCase().includes(q)
            || (i.quest.description || '').toLowerCase().includes(q)
            || (i.quest.region || '').toLowerCase().includes(q);
        }
        return (i.post.content || '').toLowerCase().includes(q)
          || (i.post.profiles?.username || '').toLowerCase().includes(q);
      });
    }
    return items;
  }, [feed, filter, search]);

  const chips = [
    { id: 'all', label: 'Tümü', icon: '✨' },
    { id: 'quests', label: 'Görevler', icon: '🗺️' },
    { id: 'good_deed', label: 'İyilik', icon: '💗' },
    { id: 'quest_complete', label: 'Kazandı', icon: '🏆' },
    ...categories.map((c) => ({ id: c.id, label: c.name, icon: c.icon })),
  ];

  function renderQuest(item: Quest, distance?: number) {
    const diff = difficulties[item.difficulty] ?? difficulties.medium;
    const inactive = !item.is_active;
    return (
      <TouchableOpacity
        style={[s.card, inactive && s.cardInactive]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}
      >
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={[s.image, inactive && { opacity: 0.5 }]} />
        ) : (
          <View style={[s.image, s.imagePlaceholder, inactive && { opacity: 0.5 }]}>
            <Text style={{ fontSize: 40 }}>🗺️</Text>
          </View>
        )}
        {item.is_featured && <View style={s.featured}><Text style={s.featuredText}>⭐ Öne Çıkan</Text></View>}
        {inactive && <View style={s.inactiveBadge}><Text style={s.inactiveBadgeText}>⏸ Pasif</Text></View>}
        {distance != null && (
          <View style={s.distBadge}><Text style={s.distText}>📍 {formatDistance(distance)}</Text></View>
        )}
        <View style={[s.cardBody, inactive && { opacity: 0.6 }]}>
          <View style={s.row}>
            <View style={[s.badge, { backgroundColor: diff.color }]}><Text style={s.badgeText}>{diff.label}</Text></View>
            <Text style={s.points}>+{item.points} puan</Text>
            {item.cash_reward > 0 && <Text style={s.cash}>₺{item.cash_reward}</Text>}
          </View>
          <Text style={s.cardTitle}>{item.title}</Text>
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
          {item.region ? <Text style={s.region}>📍 {item.region}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  }

  function renderPost(post: Post) {
    const typeInfo =
      post.post_type === 'good_deed' ? { icon: '💗', text: 'İyilik', color: '#ec4899' }
      : post.post_type === 'quest_complete' ? { icon: '🏆', text: 'Kazandı', color: '#f59e0b' }
      : post.post_type === 'announcement' ? { icon: '📢', text: 'Duyuru', color: '#3b82f6' }
      : { icon: '💬', text: 'Paylaşım', color: '#536471' };
    const prof = post.profiles;
    return (
      <View style={s.postCard}>
        <View style={s.postHead}>
          {prof?.avatar_url
            ? <Image source={{ uri: prof.avatar_url }} style={s.postAvatar} />
            : <View style={s.postAvatarPh}><Text style={{ fontSize: 16 }}>👤</Text></View>}
          <View style={{ flex: 1 }}>
            <View style={s.postNameRow}>
              <Text style={s.postUser}>@{prof?.username || 'kullanıcı'}</Text>
              <View style={[s.typeBadge, { backgroundColor: typeInfo.color + '22' }]}>
                <Text style={[s.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.icon} {typeInfo.text}</Text>
              </View>
              <Text style={s.postTime}>{timeAgo(post.created_at)}</Text>
            </View>
          </View>
        </View>
        <Text style={s.postContent}>{post.content}</Text>
        {post.photo_url ? <Image source={{ uri: post.photo_url }} style={s.postImage} /> : null}
        <PostActions
          postId={post.id}
          initialLikes={post.like_count}
          initialLiked={post.liked_by_me}
          initialCommentCount={post.comment_count}
          latitude={post.latitude}
          longitude={post.longitude}
        />
      </View>
    );
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.kind === 'quest' ? `q-${item.quest.id}` : `p-${item.post.id}`}
      renderItem={({ item }) =>
        item.kind === 'quest' ? renderQuest(item.quest, item.distance) : renderPost(item.post)}
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
        <View style={s.headerWrap}>
          <Text style={s.header}>Keşfet</Text>
          {isAdmin && inactiveCount > 0 && (
            <TouchableOpacity style={s.adminBanner} onPress={() => navigation.navigate('Admin')}>
              <Text style={s.adminBannerText}>⚠️ {inactiveCount} pasif görevin var — Admin Paneli'nde aktifleştir</Text>
            </TouchableOpacity>
          )}
          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Görev, iyilik, bölge ara..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {chips.map((chip) => {
              const active = filter === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  onPress={() => setFilter(chip.id)}
                  style={[s.chip, active && s.chipActive]}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{chip.icon} {chip.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {/* Composer button / form */}
          {!showComposer ? (
            <TouchableOpacity
              style={s.compOpen}
              onPress={() => setShowComposer(true)}
            >
              <Text style={s.compOpenText}>💬 Bir şey paylaş...</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.compBox}>
              <View style={s.compTypes}>
                <TouchableOpacity
                  style={[s.typeBtn, compType === 'social' && s.typeBtnActive]}
                  onPress={() => setCompType('social')}
                >
                  <Text style={[s.typeBtnText, compType === 'social' && s.typeBtnTextActive]}>💬 Paylaşım</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.typeBtn, compType === 'good_deed' && s.typeBtnGood, compType === 'good_deed' && s.typeBtnActiveGood]}
                  onPress={() => setCompType('good_deed')}
                >
                  <Text style={[s.typeBtnText, compType === 'good_deed' && s.typeBtnTextGood]}>💗 İyilik</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={s.compInput}
                value={compContent}
                onChangeText={setCompContent}
                placeholder={compType === 'good_deed' ? 'Bugün ne iyilik yaptın?' : 'Neler keşfediyorsun?'}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              {compPhoto ? <Image source={{ uri: compPhoto }} style={s.compPhoto} /> : null}
              <View style={s.compActions}>
                <TouchableOpacity onPress={pickCompPhoto} disabled={compUploading}>
                  <Text style={s.compActionIcon}>{compUploading ? '⏳' : compPhoto ? '✅📷' : '📷'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={markCompLocation}>
                  <Text style={s.compActionIcon}>{compCoords ? '✅📍' : '📍'}</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => { setShowComposer(false); setCompContent(''); setCompPhoto(''); setCompCoords(null); }}>
                  <Text style={s.compCancel}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.compSubmit, { backgroundColor: compType === 'good_deed' ? '#ec4899' : colors.primary }]}
                  onPress={submitPost}
                  disabled={compPosting || !compContent.trim()}
                >
                  {compPosting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.compSubmitText}>Paylaş</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={s.empty}>Sonuç bulunamadı</Text>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />
      }
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  headerWrap: { backgroundColor: colors.bg, paddingBottom: 6 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f8f8',
    borderRadius: 24, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 44,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },

  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f8f8',
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, marginRight: 7,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  chipTextActive: { color: '#fff' },

  card: { backgroundColor: colors.card, borderRadius: 18, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  cardInactive: { borderColor: '#e0e0e0', opacity: 0.85 },
  image: { width: '100%', height: 180 },
  imagePlaceholder: { backgroundColor: '#f0f2f4', alignItems: 'center', justifyContent: 'center' },
  featured: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  featuredText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  inactiveBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  inactiveBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  distBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,107,43,0.92)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  distText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cardBody: { padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  points: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  cash: { color: colors.green, fontWeight: '900', fontSize: 13 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  region: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  empty: { fontSize: 16, color: colors.textMuted, marginTop: 12 },

  adminBanner: { backgroundColor: '#fff8e1', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#ffe082' },
  adminBannerText: { color: '#856404', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  postCard: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  postHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  postAvatarPh: { width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#f0f2f4', alignItems: 'center', justifyContent: 'center' },
  postNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  postUser: { fontSize: 14, fontWeight: '800', color: colors.text },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  postTime: { fontSize: 12, color: colors.textMuted, marginLeft: 'auto' },
  postContent: { fontSize: 15, color: colors.text, lineHeight: 21 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 10 },

  compOpen: {
    backgroundColor: '#f7f8f8', borderRadius: 24, padding: 12, marginTop: 8, marginBottom: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  compOpenText: { color: colors.textMuted, fontSize: 14 },
  compBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginTop: 8, marginBottom: 4,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  compTypes: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f7f8f8',
    borderWidth: 1, borderColor: colors.border,
  },
  typeBtnActive: { backgroundColor: 'rgba(255,107,43,0.12)', borderColor: colors.primary },
  typeBtnActiveGood: { backgroundColor: 'rgba(236,72,153,0.12)', borderColor: '#ec4899' },
  typeBtnGood: {},
  typeBtnText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  typeBtnTextActive: { color: colors.primary },
  typeBtnTextGood: { color: '#ec4899' },
  compInput: {
    backgroundColor: '#f7f9fa', borderRadius: 10, padding: 10, fontSize: 15, color: colors.text,
    minHeight: 72, textAlignVertical: 'top', marginBottom: 8,
  },
  compPhoto: { width: '100%', height: 140, borderRadius: 10, marginBottom: 8 },
  compActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compActionIcon: { fontSize: 22 },
  compCancel: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
  compSubmit: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  compSubmitText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
