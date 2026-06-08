import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors, difficulties } from '../theme';

interface QStat {
  id: string;
  title: string;
  difficulty: string;
  is_active: boolean;
  is_featured: boolean;
  cash_reward: number;
  total_attempts: number;
  total_solved: number;
  created_at: string;
}

export default function BusinessStatsScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [quests, setQuests] = useState<QStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from('quests')
      .select('id, title, difficulty, is_active, is_featured, cash_reward, total_attempts, total_solved, created_at')
      .eq('created_by', uid)
      .order('created_at', { ascending: false });
    setQuests((data as QStat[]) || []);
    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const totalAttempts = quests.reduce((a, q) => a + (q.total_attempts || 0), 0);
  const totalSolved = quests.reduce((a, q) => a + (q.total_solved || 0), 0);
  const activeCount = quests.filter((q) => q.is_active).length;
  const successRate = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0;

  return (
    <FlatList
      data={quests}
      keyExtractor={(q) => q.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      ListHeaderComponent={
        <View>
          <Text style={s.header}>📊 İşletme İstatistikleri</Text>
          <View style={s.statsGrid}>
            <View style={s.statBox}><Text style={s.statValue}>{quests.length}</Text><Text style={s.statLabel}>Görev</Text></View>
            <View style={s.statBox}><Text style={s.statValue}>{activeCount}</Text><Text style={s.statLabel}>Aktif</Text></View>
            <View style={s.statBox}><Text style={s.statValue}>{totalAttempts}</Text><Text style={s.statLabel}>Deneme</Text></View>
            <View style={s.statBox}><Text style={s.statValue}>{totalSolved}</Text><Text style={s.statLabel}>Çözüldü</Text></View>
          </View>
          <View style={s.rateBox}>
            <Text style={s.rateLabel}>Başarı Oranı</Text>
            <Text style={s.rateValue}>%{successRate}</Text>
          </View>
          <Text style={s.listTitle}>Görevlerim</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>📊</Text>
          <Text style={s.empty}>Henüz görev oluşturmadın</Text>
        </View>
      }
      renderItem={({ item }) => {
        const diff = difficulties[item.difficulty] ?? difficulties.medium;
        return (
          <View style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.qTitle} numberOfLines={1}>{item.title}</Text>
              <View style={s.qMeta}>
                <View style={[s.badge, { backgroundColor: diff.color }]}><Text style={s.badgeText}>{diff.label}</Text></View>
                {item.is_featured && <Text style={s.featured}>⭐ Öne çıkan</Text>}
                {!item.is_active && <Text style={s.inactive}>Pasif</Text>}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.qSolved}>{item.total_solved} çözüm</Text>
              <Text style={s.qAttempts}>{item.total_attempts} deneme</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  statBox: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  rateBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary, borderRadius: 14, padding: 16, marginBottom: 14,
  },
  rateLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  rateValue: { color: '#fff', fontWeight: '900', fontSize: 24 },
  listTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 8, marginLeft: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  qTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  featured: { fontSize: 12, color: '#b8860b', fontWeight: '700' },
  inactive: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  qSolved: { fontSize: 15, fontWeight: '900', color: colors.green },
  qAttempts: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: { color: colors.textMuted, marginTop: 12, fontSize: 15 },
});
