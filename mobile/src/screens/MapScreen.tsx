import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { colors, difficulties } from '../theme';
import { Quest } from '../types';
import { distanceMeters, formatDistance } from '../lib/distance';

interface NearbyQuest extends Quest { _distance: number | null }

const GPS_TIMEOUT_MS = 8000;

export default function MapScreen({ navigation }: any) {
  const [quests, setQuests] = useState<NearbyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'ok' | 'denied' | 'timeout' | 'pending'>('pending');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const load = async () => {
    const { data: rawQuests } = await supabase.from('quests').select('*').eq('is_active', true).limit(200);
    return (rawQuests as Quest[]) || [];
  };

  const tryGPS = () =>
    new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), GPS_TIMEOUT_MS);
      Location.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') { clearTimeout(timer); resolve(null); return; }
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then((loc) => { clearTimeout(timer); resolve(loc.coords); })
          .catch(() => { clearTimeout(timer); resolve(null); });
      });
    });

  const init = async () => {
    const [rawQuests, coords] = await Promise.all([load(), tryGPS()]);
    if (coords) {
      setUserPos({ lat: coords.latitude, lng: coords.longitude });
      setGpsStatus('ok');
      const withDist = rawQuests
        .map((q) => ({ ...q, _distance: distanceMeters(coords.latitude, coords.longitude, q.latitude, q.longitude) }))
        .sort((a, b) => (a._distance ?? 0) - (b._distance ?? 0));
      setQuests(withDist);
    } else {
      setGpsStatus('timeout');
      setQuests(rawQuests.map((q) => ({ ...q, _distance: null })));
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { init(); }, []);

  const onRefresh = () => { setRefreshing(true); init(); };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.status}>Görevler ve konum yükleniyor...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={quests}
      keyExtractor={(q) => q.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      ListHeaderComponent={
        <View>
          <Text style={s.header}>📍 Görevler</Text>
          {gpsStatus === 'timeout' && (
            <TouchableOpacity style={s.gpsWarn} onPress={onRefresh}>
              <Text style={s.gpsWarnText}>⚠️ Konum alınamadı · Mesafe gösterilmiyor · Yenile</Text>
            </TouchableOpacity>
          )}
          {gpsStatus === 'ok' && userPos && (
            <View style={s.gpsBadge}><Text style={s.gpsBadgeText}>📡 Konum alındı</Text></View>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>🗺️</Text>
          <Text style={s.status}>Henüz görev yok</Text>
        </View>
      }
      renderItem={({ item }) => {
        const diff = difficulties[item.difficulty] ?? difficulties.medium;
        const reachable = item._distance !== null && item._distance <= (item.max_distance_meters || 100);
        return (
          <TouchableOpacity style={s.row} activeOpacity={0.85}
            onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}>
            <View style={[s.pin, { backgroundColor: diff.color }]}>
              <Text style={s.pinText}>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.sub} numberOfLines={1}>{item.region || item.description}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {item._distance !== null ? (
                <>
                  <Text style={[s.dist, reachable && { color: colors.green }]}>{formatDistance(item._distance)}</Text>
                  {reachable && <Text style={s.reach}>Ulaşılabilir ✓</Text>}
                </>
              ) : (
                <Text style={[s.diffBadge, { backgroundColor: diff.color + '22', color: diff.color }]}>{diff.label}</Text>
              )}
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
  gpsWarn: { backgroundColor: '#fff8e1', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#ffe082' },
  gpsWarnText: { color: '#856404', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  gpsBadge: { backgroundColor: '#f0fdf4', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.green, alignSelf: 'flex-start' },
  gpsBadgeText: { color: colors.green, fontSize: 12, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  pin: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pinText: { fontSize: 20 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  dist: { fontSize: 15, fontWeight: '900', color: colors.text },
  reach: { fontSize: 11, color: colors.green, fontWeight: '700', marginTop: 2 },
  diffBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
