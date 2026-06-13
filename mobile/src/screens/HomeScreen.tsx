import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors, difficulties } from '../theme';
import { distanceMeters, formatDistance } from '../lib/distance';
import { Quest } from '../types';

interface Category { id: string; name: string; icon: string }

interface Post {
  id: string;
  post_type: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  quest_id?: string | null;
  latitude?: number | null;
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
        .select('id, post_type, content, photo_url, created_at, quest_id, latitude, profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('categories').select('id, name, icon'),
    ]);

    if (questData) {
      const all = questData as Quest[];
      setQuests(all);
      if (adminStatus) setInactiveCount(all.filter((q) => !q.is_active).length);
    }
    if (postData) {
      setPosts(postData.map((p: any) => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles,
      })) as Post[]);
    }
    if (catData) setCategories(catData as Category[]);

    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

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
});
