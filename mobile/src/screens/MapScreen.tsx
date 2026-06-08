import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors, difficulties } from '../theme';
import { Quest } from '../types';
import { distanceMeters, formatDistance } from '../lib/distance';

interface LiveUser {
  user_id: string;
  latitude: number;
  longitude: number;
  username?: string;
}

interface NearbyQuest extends Quest { _distance: number | null }

const GPS_TIMEOUT_MS = 8000;

const GRADIENTS = ['#ff6b2b', '#a855f7', '#22c55e', '#f97316', '#ec4899'];

export default function MapScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;

  const [quests, setQuests] = useState<NearbyQuest[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'ok' | 'error' | 'pending'>('pending');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const loadQuests = async () => {
    const { data } = await supabase.from('quests').select('*').eq('is_active', true).limit(200);
    return (data as Quest[]) || [];
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('live_locations')
      .select('user_id, latitude, longitude, profiles(username)')
      .limit(200);
    if (!data) return [];
    return data
      .filter((u: any) => u.user_id !== uid)
      .map((u: any) => ({
        user_id: u.user_id,
        latitude: u.latitude,
        longitude: u.longitude,
        username: Array.isArray(u.profiles) ? u.profiles[0]?.username : u.profiles?.username,
      }));
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
    const [rawQuests, users, coords] = await Promise.all([loadQuests(), loadUsers(), tryGPS()]);

    setLiveUsers(users);

    if (coords) {
      setUserPos({ lat: coords.latitude, lng: coords.longitude });
      setGpsStatus('ok');
      const withDist = rawQuests
        .map((q) => ({ ...q, _distance: distanceMeters(coords.latitude, coords.longitude, q.latitude, q.longitude) }))
        .sort((a, b) => (a._distance ?? 0) - (b._distance ?? 0));
      setQuests(withDist);
    } else {
      setGpsStatus('error');
      setQuests(rawQuests.map((q) => ({ ...q, _distance: null })));
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { init(); }, []);

  // Poll live users every 8s
  useEffect(() => {
    const interval = setInterval(async () => {
      const users = await loadUsers();
      setLiveUsers(users);
    }, 8000);
    return () => clearInterval(interval);
  }, [uid]);

  const onRefresh = () => { setRefreshing(true); init(); };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.status}>Harita yükleniyor...</Text>
      </View>
    );
  }

  const nearbyUsers = userPos
    ? liveUsers
        .map((u) => ({ ...u, _dist: distanceMeters(userPos.lat, userPos.lng, u.latitude, u.longitude) }))
        .sort((a, b) => a._dist - b._dist)
    : liveUsers.map((u) => ({ ...u, _dist: null as null }));

  return (
    <FlatList
      data={quests}
      keyExtractor={(q) => q.id}
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      ListHeaderComponent={
        <View>
          <Text style={s.header}>📍 Harita</Text>

          {/* GPS status */}
          {gpsStatus === 'error' ? (
            <TouchableOpacity style={s.gpsWarn} onPress={onRefresh}>
              <Text style={s.gpsWarnText}>⚠️ Konum alınamadı · Mesafe gösterilmiyor · Yenile</Text>
            </TouchableOpacity>
          ) : gpsStatus === 'ok' && (
            <View style={s.gpsBadge}>
              <View style={s.greenDot} />
              <Text style={s.gpsBadgeText}>Konum alındı · Mesafeye göre sıralandı</Text>
            </View>
          )}

          {/* Online users section */}
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>🟢 Online Oyuncular</Text>
              <View style={s.countBadge}>
                <Text style={s.countText}>{liveUsers.length + 1}</Text>
              </View>
            </View>

            {nearbyUsers.length === 0 ? (
              <View style={s.emptyUsers}>
                <Text style={s.emptyText}>Şu an başka oyuncu online değil</Text>
              </View>
            ) : (
              <View>
                {nearbyUsers.map((u, i) => (
                  <View key={u.user_id} style={s.userRow}>
                    <View style={[s.userAvatar, { backgroundColor: GRADIENTS[i % GRADIENTS.length] }]}>
                      <Text style={s.userAvatarText}>{(u.username?.[0] || '?').toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.userName}>@{u.username || 'kullanıcı'}</Text>
                      {u._dist !== null && (
                        <Text style={s.userDist}>{formatDistance(u._dist)} uzakta</Text>
                      )}
                    </View>
                    <View style={s.onlineDot} />
                  </View>
                ))}
              </View>
            )}
          </View>

          <Text style={s.questsTitle}>📍 Aktif Görevler</Text>
          {gpsStatus === 'ok' && (
            <Text style={s.questsSub}>{quests.length} görev · En yakından sıralandı</Text>
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
          <TouchableOpacity
            style={s.questRow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}
          >
            <View style={[s.questPin, { backgroundColor: diff.color }]}>
              <Text style={s.questPinText}>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.questTitle}>{item.title}</Text>
              <Text style={s.questSub} numberOfLines={1}>{item.region || item.description}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {item._distance !== null ? (
                <>
                  <Text style={[s.dist, reachable && { color: colors.green }]}>
                    {formatDistance(item._distance)}
                  </Text>
                  {reachable && <Text style={s.reachBadge}>Ulaşılabilir ✓</Text>}
                </>
              ) : (
                <Text style={[s.diffBadge, { backgroundColor: diff.color + '22', color: diff.color }]}>
                  {diff.label}
                </Text>
              )}
              <Text style={s.points}>{item.points} puan</Text>
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

  gpsWarn: {
    backgroundColor: '#fff8e1', borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#ffe082',
  },
  gpsWarnText: { color: '#856404', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12,
    marginBottom: 12, borderWidth: 1, borderColor: colors.green, alignSelf: 'flex-start',
  },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  gpsBadgeText: { color: colors.green, fontSize: 12, fontWeight: '700' },

  section: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '900', color: colors.text },
  countBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: { color: colors.green, fontWeight: '900', fontSize: 13 },

  emptyUsers: { padding: 16 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },

  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  userAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  userName: { fontSize: 14, fontWeight: '800', color: colors.text },
  userDist: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green },

  questsTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4, marginLeft: 4 },
  questsSub: { fontSize: 13, color: colors.textMuted, marginBottom: 10, marginLeft: 4 },

  questRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  questPin: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  questPinText: { fontSize: 20 },
  questTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  questSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  dist: { fontSize: 15, fontWeight: '900', color: colors.text },
  reachBadge: { fontSize: 11, color: colors.green, fontWeight: '700', marginTop: 2 },
  diffBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  points: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
