import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors, difficulties } from '../theme';
import { Quest } from '../types';

interface GoodDeedPost {
  id: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  profiles: { username: string } | null;
}

export default function HomeScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;

  const [quests, setQuests] = useState<Quest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [goodDeedPosts, setGoodDeedPosts] = useState<GoodDeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    // Check admin status
    let adminStatus = false;
    if (uid) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', uid)
        .single();
      adminStatus = !!(prof as any)?.is_admin;
      setIsAdmin(adminStatus);
    }

    // Fetch quests
    let questQuery = supabase
      .from('quests')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (!adminStatus) {
      questQuery = questQuery.eq('is_active', true);
    }

    const { data: questData, error } = await questQuery;
    if (!error && questData) {
      const allQuests = questData as Quest[];
      setQuests(allQuests);
      if (adminStatus) {
        setInactiveCount(allQuests.filter((q) => !q.is_active).length);
      }
    }

    // Fetch recent good deed posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, content, photo_url, created_at, profiles(username)')
      .eq('post_type', 'good_deed')
      .order('created_at', { ascending: false })
      .limit(5);
    if (postsData) {
      setGoodDeedPosts(
        postsData.map((p: any) => ({
          ...p,
          profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles,
        })) as GoodDeedPost[]
      );
    }

    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  function renderQuestItem({ item }: { item: Quest }) {
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
        {item.is_featured && (
          <View style={s.featured}><Text style={s.featuredText}>⭐ Öne Çıkan</Text></View>
        )}
        {inactive && (
          <View style={s.inactiveBadge}><Text style={s.inactiveBadgeText}>⏸ Pasif</Text></View>
        )}
        <View style={[s.cardBody, inactive && { opacity: 0.6 }]}>
          <View style={s.row}>
            <View style={[s.badge, { backgroundColor: diff.color }]}>
              <Text style={s.badgeText}>{diff.label}</Text>
            </View>
            <Text style={s.points}>+{item.points} puan</Text>
            {item.cash_reward > 0 && (
              <Text style={s.cash}>₺{item.cash_reward}</Text>
            )}
          </View>
          <Text style={s.cardTitle}>{item.title}</Text>
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
          {item.region ? <Text style={s.region}>📍 {item.region}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const ListHeader = (
    <View>
      <Text style={s.header}>Keşfet</Text>
      {isAdmin && inactiveCount > 0 && (
        <TouchableOpacity style={s.adminBanner} onPress={() => navigation.navigate('Admin')}>
          <Text style={s.adminBannerText}>
            ⚠️ {inactiveCount} pasif görevin var — Admin Paneli'nde aktifleştir
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const GoodDeedSection = (
    <View style={s.goodDeedSection}>
      <Text style={s.goodDeedTitle}>❤️ İyilik Hareketi</Text>
      {goodDeedPosts.length === 0 ? (
        <Text style={s.goodDeedEmpty}>Henüz paylaşım yok</Text>
      ) : (
        goodDeedPosts.map((post) => (
          <View key={post.id} style={s.postCard}>
            {post.photo_url ? (
              <Image source={{ uri: post.photo_url }} style={s.postImage} />
            ) : null}
            <View style={s.postBody}>
              <Text style={s.postUser}>@{post.profiles?.username ?? 'kullanıcı'}</Text>
              <Text style={s.postContent} numberOfLines={3}>{post.content}</Text>
              <Text style={s.postDate}>{new Date(post.created_at).toLocaleDateString('tr-TR')}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <FlatList
      data={quests}
      keyExtractor={(q) => q.id}
      renderItem={renderQuestItem}
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={GoodDeedSection}
      ListEmptyComponent={
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={s.empty}>Henüz görev yok</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 18, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  cardInactive: { borderColor: '#e0e0e0', opacity: 0.85 },
  image: { width: '100%', height: 180 },
  imagePlaceholder: { backgroundColor: '#f0f2f4', alignItems: 'center', justifyContent: 'center' },
  featured: {
    position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  featuredText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  inactiveBadge: {
    position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  inactiveBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
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

  adminBanner: {
    backgroundColor: '#fff8e1', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#ffe082',
  },
  adminBannerText: { color: '#856404', fontSize: 13, fontWeight: '700', textAlign: 'center' },

  goodDeedSection: { marginTop: 8 },
  goodDeedTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 10, marginLeft: 4 },
  goodDeedEmpty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  postCard: {
    backgroundColor: colors.card, borderRadius: 14, marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  postImage: { width: '100%', height: 160, resizeMode: 'cover' },
  postBody: { padding: 12 },
  postUser: { fontSize: 13, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  postContent: { fontSize: 14, color: colors.text, lineHeight: 20 },
  postDate: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
});
