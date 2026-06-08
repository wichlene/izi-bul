import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors, difficulties } from '../theme';
import { Quest } from '../types';

interface LiveUser {
  user_id: string;
  latitude: number;
  longitude: number;
  username?: string;
}

const TURKEY_REGION = {
  latitude: 39.0,
  longitude: 35.0,
  latitudeDelta: 14,
  longitudeDelta: 14,
};

export default function MapScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const mapRef = useRef<MapView>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);

  const load = async () => {
    const [questRes, usersRes] = await Promise.all([
      supabase.from('quests').select('*').eq('is_active', true).limit(200),
      supabase.from('live_locations')
        .select('user_id, latitude, longitude, profiles(username)')
        .limit(200),
    ]);

    if (questRes.data) setQuests(questRes.data as Quest[]);

    if (usersRes.data) {
      setOnlineCount(usersRes.data.length);
      const others: LiveUser[] = usersRes.data
        .filter((u: any) => u.user_id !== uid)
        .map((u: any) => ({
          user_id: u.user_id,
          latitude: u.latitude,
          longitude: u.longitude,
          username: Array.isArray(u.profiles) ? u.profiles[0]?.username : u.profiles?.username,
        }));
      setLiveUsers(others);
    }

    setLoading(false);
    setLastRefresh(Date.now());
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [uid]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.status}>Harita yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={TURKEY_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* Quest markers */}
        {quests.map((q) => {
          const diff = difficulties[q.difficulty] ?? difficulties.medium;
          return (
            <Marker
              key={q.id}
              coordinate={{ latitude: q.latitude, longitude: q.longitude }}
              tracksViewChanges={false}
              onCalloutPress={() => navigation.navigate('QuestDetail', { questId: q.id })}
            >
              <View style={[s.questPin, { backgroundColor: diff.color }]}>
                <Text style={s.questPinIcon}>📍</Text>
              </View>
              <Callout tooltip={false}>
                <View style={s.callout}>
                  <Text style={s.calloutTitle} numberOfLines={2}>{q.title}</Text>
                  <Text style={[s.calloutSub, { color: diff.color }]}>{diff.label}</Text>
                  <Text style={s.calloutSub}>{q.points} puan · Detay ›</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {/* Live user markers */}
        {liveUsers.map((u) => (
          <Marker
            key={u.user_id}
            coordinate={{ latitude: u.latitude, longitude: u.longitude }}
            tracksViewChanges={false}
          >
            <View style={s.userPin}>
              <Text style={s.userPinText}>{(u.username?.[0] || '?').toUpperCase()}</Text>
              <View style={s.userPinDot} />
            </View>
            <Callout tooltip={false}>
              <View style={s.callout}>
                <Text style={s.calloutTitle}>@{u.username || 'kullanıcı'}</Text>
                <Text style={[s.calloutSub, { color: colors.green, fontWeight: '700' }]}>● Çevrimiçi</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Top overlay */}
      <View style={s.overlay}>
        <Text style={s.overlayTitle}>🗺️ Türkiye</Text>
        <Text style={s.overlayStat}>{quests.length} görev</Text>
        <View style={s.onlineRow}>
          <View style={s.onlineDot} />
          <Text style={[s.overlayStat, { color: colors.green }]}>{onlineCount} online</Text>
        </View>
      </View>

      {/* My location button */}
      <TouchableOpacity style={s.myLocBtn} onPress={() => {
        mapRef.current?.animateToRegion(TURKEY_REGION, 500);
      }}>
        <Text style={s.myLocIcon}>🇹🇷</Text>
      </TouchableOpacity>

      {/* Refresh button */}
      <TouchableOpacity style={s.refreshBtn} onPress={load}>
        <Text style={s.refreshIcon}>🔄</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  status: { color: colors.textMuted, marginTop: 12, fontSize: 15 },

  questPin: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 4, elevation: 5,
  },
  questPinIcon: { fontSize: 18 },

  userPin: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: colors.green, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
  },
  userPinText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  userPinDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff',
  },

  callout: { padding: 8, minWidth: 130, maxWidth: 200 },
  calloutTitle: { fontSize: 14, fontWeight: '900', color: colors.text, marginBottom: 2 },
  calloutSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  overlay: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#fff',
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
    borderWidth: 1, borderColor: colors.border,
  },
  overlayTitle: { fontSize: 14, fontWeight: '900', color: colors.text, marginBottom: 4 },
  overlayStat: { fontSize: 12, color: colors.textMuted },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },

  myLocBtn: {
    position: 'absolute', bottom: 76, right: 16,
    backgroundColor: '#fff', borderRadius: 28, width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  myLocIcon: { fontSize: 22 },

  refreshBtn: {
    position: 'absolute', bottom: 20, right: 16,
    backgroundColor: '#fff', borderRadius: 28, width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  refreshIcon: { fontSize: 20 },
});
