import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface Row {
  id: string;
  username: string;
  full_name: string | null;
  total_points: number;
  total_finds: number;
  level: number;
}

const medal = (rank: number) =>
  rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;

export default function LeaderboardScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, total_points, total_finds, level')
      .order('total_points', { ascending: false })
      .order('total_finds', { ascending: false })
      .limit(100);
    setRows((data as Row[]) || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      ListHeaderComponent={<Text style={s.header}>🏆 Liderlik Tablosu</Text>}
      ListEmptyComponent={<View style={s.center}><Text style={s.empty}>Henüz sıralama yok</Text></View>}
      renderItem={({ item, index }) => {
        const rank = index + 1;
        const me = item.id === uid;
        return (
          <View style={[s.row, rank <= 3 && s.top3, me && s.me]}>
            <Text style={[s.rank, rank <= 3 && s.rankTop]}>{medal(rank)}</Text>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.username} numberOfLines={1}>
                {item.full_name || item.username}{me ? ' (Sen)' : ''}
              </Text>
              <Text style={s.sub}>@{item.username} · Lv {item.level} · {item.total_finds} buluş</Text>
            </View>
            <Text style={s.points}>{item.total_points}</Text>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff',
    borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  top3: { backgroundColor: '#fffdf5', borderColor: '#ffe9b0' },
  me: { borderColor: colors.primary, borderWidth: 2 },
  rank: { width: 32, textAlign: 'center', fontSize: 15, fontWeight: '900', color: colors.textMuted },
  rankTop: { fontSize: 20 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  username: { fontSize: 15, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  points: { fontSize: 18, fontWeight: '900', color: colors.primary },
  empty: { color: colors.textMuted, marginTop: 12, fontSize: 15 },
});
