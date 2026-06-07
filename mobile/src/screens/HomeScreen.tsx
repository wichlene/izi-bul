import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, difficulties } from '../theme';
import { Quest } from '../types';

export default function HomeScreen() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setQuests(data as Quest[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function renderItem({ item }: { item: Quest }) {
    const diff = difficulties[item.difficulty] ?? difficulties.medium;
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.9}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={s.image} />
        ) : (
          <View style={[s.image, s.imagePlaceholder]}>
            <Text style={{ fontSize: 40 }}>🗺️</Text>
          </View>
        )}
        {item.is_featured && (
          <View style={s.featured}><Text style={s.featuredText}>⭐ Öne Çıkan</Text></View>
        )}
        <View style={s.cardBody}>
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

  return (
    <FlatList
      data={quests}
      keyExtractor={(q) => q.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      ListHeaderComponent={<Text style={s.header}>Keşfet</Text>}
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
  image: { width: '100%', height: 180 },
  imagePlaceholder: { backgroundColor: '#f0f2f4', alignItems: 'center', justifyContent: 'center' },
  featured: {
    position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  featuredText: { color: '#fff', fontSize: 12, fontWeight: '800' },
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
});
