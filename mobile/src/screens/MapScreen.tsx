import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert,
} from 'react-native';
import MapLibreGL, { type CameraRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors, difficulties } from '../theme';
import { Quest } from '../types';

MapLibreGL.setAccessToken(null);

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

interface LiveUser {
  user_id: string;
  latitude: number;
  longitude: number;
  username?: string;
  avatar_url?: string;
}

export default function MapScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const cameraRef = useRef<CameraRef>(null);
  const insets = useSafeAreaInsets();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [myCoords, setMyCoords] = useState<[number, number] | null>(null);

  const load = async () => {
    // 30-minute window: anyone active in last 30 min shows on map
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const [questRes, usersRes, totalRes] = await Promise.all([
      supabase.from('quests').select('*').eq('is_active', true).limit(200),
      supabase
        .from('live_locations')
        .select('user_id, latitude, longitude, updated_at, profiles(username, avatar_url)')
        .gte('updated_at', cutoff)
        .limit(200),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ]);

    if (questRes.data) setQuests(questRes.data as Quest[]);

    if (usersRes.data) {
      setOnlineCount(usersRes.data.length);
      // Show all OTHER users as markers (own position = native blue dot)
      const others: LiveUser[] = usersRes.data
        .filter((u: any) => u.user_id !== uid)
        .map((u: any) => ({
          user_id: u.user_id,
          latitude: u.latitude,
          longitude: u.longitude,
          username: Array.isArray(u.profiles) ? u.profiles[0]?.username : u.profiles?.username,
          avatar_url: Array.isArray(u.profiles) ? u.profiles[0]?.avatar_url : u.profiles?.avatar_url,
        }));
      setLiveUsers(others);
    }

    if (totalRes.count != null) setTotalPlayers(totalRes.count);
    setLoading(false);
  };

  const onUserTap = (u: LiveUser) => {
    Alert.alert(
      `@${u.username || 'kullanıcı'}`,
      'Bu kişiyle ne yapmak istersin?',
      [
        {
          text: '💬 Mesaj Gönder',
          onPress: () =>
            navigation.navigate('Messages', {
              screen: 'Chat',
              params: { friendId: u.user_id, friendUsername: u.username || 'kullanıcı' },
            }),
        },
        { text: 'Kapat', style: 'cancel' },
      ],
    );
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setMyCoords([loc.coords.longitude, loc.coords.latitude]);
      }
    })();
  }, []);

  useEffect(() => {
    if (mapReady && myCoords) {
      cameraRef.current?.setCamera({
        centerCoordinate: myCoords,
        zoomLevel: 13,
        animationDuration: 1000,
      });
    }
  }, [mapReady, myCoords]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [uid]);

  const goToMyLocation = () => {
    if (myCoords) {
      cameraRef.current?.setCamera({ centerCoordinate: myCoords, zoomLevel: 14, animationDuration: 500 });
    }
  };

  const goToTurkey = () => {
    cameraRef.current?.setCamera({ centerCoordinate: [35.0, 39.0], zoomLevel: 5, animationDuration: 500 });
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadText}>Harita yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapLibreGL.MapView
        style={{ flex: 1 }}
        mapStyle={STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        zoomEnabled
        scrollEnabled
        pitchEnabled={false}
        rotateEnabled={false}
        onDidFinishLoadingMap={() => setMapReady(true)}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{ zoomLevel: 5, centerCoordinate: [35.0, 39.0] }}
        />

        {/* Native blue dot for current user */}
        <MapLibreGL.UserLocation visible showsUserHeadingIndicator={false} />

        {/* Quest markers */}
        {quests.map((q) => {
          const diff = difficulties[q.difficulty] ?? difficulties.medium;
          return (
            <MapLibreGL.MarkerView
              key={q.id}
              coordinate={[q.longitude, q.latitude]}
              allowOverlap
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('QuestDetail', { questId: q.id })}
                activeOpacity={0.85}
              >
                <View style={[s.questPin, { backgroundColor: diff.color }]}>
                  <Text style={s.questPinIcon}>🗺️</Text>
                </View>
              </TouchableOpacity>
            </MapLibreGL.MarkerView>
          );
        })}

        {/* Other players markers */}
        {liveUsers.map((u) => (
          <MapLibreGL.MarkerView
            key={u.user_id}
            coordinate={[u.longitude, u.latitude]}
            allowOverlap
          >
            <TouchableOpacity onPress={() => onUserTap(u)} activeOpacity={0.85}>
              <View style={s.userPin}>
                {u.avatar_url ? (
                  <Image source={{ uri: u.avatar_url }} style={s.userPinAvatar} />
                ) : (
                  <Text style={s.userPinIcon}>👤</Text>
                )}
                <View style={s.onlineBadge} />
              </View>
              {u.username ? (
                <View style={s.userLabel}>
                  <Text style={s.userLabelText} numberOfLines={1}>@{u.username}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </MapLibreGL.MarkerView>
        ))}
      </MapLibreGL.MapView>

      {/* Google Maps-style top stats bar */}
      <View style={[s.topBar, { top: insets.top + 8 }]}>
        <View style={s.statsRow}>
          <View style={s.statCol}>
            <View style={s.onlineDotRow}>
              <View style={s.onlineDot} />
              <Text style={s.statLabel}>Online</Text>
            </View>
            <Text style={s.statValue}>{onlineCount}</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statCol}>
            <Text style={s.statLabel}>👥 Toplam</Text>
            <Text style={s.statValue}>{totalPlayers}</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statCol}>
            <Text style={s.statLabel}>🗺️ Görev</Text>
            <Text style={s.statValue}>{quests.length}</Text>
          </View>
        </View>
      </View>

      {/* Right side controls */}
      <View style={[s.controls, { bottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={s.ctrlBtn} onPress={goToMyLocation}>
          <Text style={s.ctrlIcon}>📍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ctrlBtn} onPress={goToTurkey}>
          <Text style={s.ctrlIcon}>🇹🇷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ctrlBtn} onPress={load}>
          <Text style={s.ctrlIcon}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadText: { color: colors.textMuted, marginTop: 12, fontSize: 15 },

  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  statSep: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  onlineDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },

  controls: {
    position: 'absolute',
    right: 14,
    alignItems: 'center',
    gap: 10,
  },
  ctrlBtn: {
    backgroundColor: '#fff',
    borderRadius: 28,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctrlIcon: { fontSize: 22 },

  questPin: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  questPinIcon: { fontSize: 18 },

  userPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 7,
  },
  userPinAvatar: { width: 44, height: 44, borderRadius: 22 },
  userPinIcon: { fontSize: 26 },
  onlineBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userLabel: {
    marginTop: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'center',
    maxWidth: 90,
  },
  userLabelText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
