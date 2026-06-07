import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { colors, difficulties } from '../theme';
import { Quest } from '../types';
import { distanceMeters, formatDistance } from '../lib/distance';

interface NearbyQuest extends Quest {
  _distance: number;
}

export default function MapScreen() {
  const [quests, setQuests] = useState<NearbyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Konum alınıyor...');

  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('Konum izni verilmedi. Yakındaki görevler gösterilemiyor.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { data } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .limit(200);

      if (data) {
        const withDist = (data as Quest[])
          .map((q) => ({
            ...q,
            _distance: distanceMeters(
              loc.coords.latitude, loc.coords.longitude,
              q.latitude, q.longitude,
            ),
          }))
          .sort((a, b) => a._distance - b._distance);
        setQuests(withDist);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.status}>{status}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={quests}
      keyExtractor={(q) => q.id}
      contentContainerStyle={{ padding: 12 }}
      ListHeaderComponent={<Text style={s.header}>Yakındaki Görevler</Text>}
      ListEmptyComponent={<Text style={s.status}>{status}</Text>}
      renderItem={({ item }) => {
        const diff = difficulties[item.difficulty] ?? difficulties.medium;
        const reachable = item._distance <= (item.max_distance_meters || 100);
        return (
          <TouchableOpacity style={s.row} activeOpacity={0.85}>
            <View style={[s.pin, { backgroundColor: diff.color }]}>
              <Text style={s.pinText}>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.sub} numberOfLines={1}>{item.region || item.description}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.dist, reachable && { color: colors.green }]}>
                {formatDistance(item._distance)}
              </Text>
              {reachable && <Text style={s.reach}>Ulaşılabilir</Text>}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  status: { color: colors.textMuted, marginTop: 14, textAlign: 'center', fontSize: 15 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 14, padding: 12, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  pin: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pinText: { fontSize: 20 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  dist: { fontSize: 15, fontWeight: '900', color: colors.text },
  reach: { fontSize: 11, color: colors.green, fontWeight: '700', marginTop: 2 },
});
