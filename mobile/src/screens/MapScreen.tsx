import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
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
}

export default function MapScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const cameraRef = useRef<CameraRef>(null);
  const insets = useSafeAreaInsets();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [myCoords, setMyCoords] = useState<[number, number] | null>(null);

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
  };

  // Get user location for auto-zoom
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setMyCoords([loc.coords.longitude, loc.coords.latitude]);
      }
    })();
  }, []);

  // Zoom to user location when map is ready
  useEffect(() => {
    if (mapReady && myCoords) {
      cameraRef.current?.setCamera({
        centerCoordinate: myCoords,
        zoomLevel: 14,
        animationDuration: 800,
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
      cameraRef.current?.setCamera({
        centerCoordinate: myCoords,
        zoomLevel: 14,
        animationDuration: 500,
      });
    }
  };

  const goToTurkey = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: [35.0, 39.0],
      zoomLevel: 5,
      animationDuration: 500,
    });
  };

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
      <MapLibreGL.MapView
        style={{ flex: 1 }}
        mapStyle={STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={() => setMapReady(true)}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={5}
          centerCoordinate={[35.0, 39.0]}
          animationDuration={0}
        />

        <MapLibreGL.UserLocation
          visible
          showsUserHeadingIndicator={false}
        />

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
                activeOpacity={0.8}
              >
                <View style={[s.questPin, { backgroundColor: diff.color }]}>
                  <Text style={s.questPinIcon}>📍</Text>
                </View>
              </TouchableOpacity>
            </MapLibreGL.MarkerView>
          );
        })}

        {/* Live user markers */}
        {liveUsers.map((u) => (
          <MapLibreGL.MarkerView
            key={u.user_id}
            coordinate={[u.longitude, u.latitude]}
            allowOverlap
          >
            <View style={s.userPin}>
              <Text style={s.userPinText}>{(u.username?.[0] || '?').toUpperCase()}</Text>
              <View style={s.userPinDot} />
            </View>
          </MapLibreGL.MarkerView>
        ))}
      </MapLibreGL.MapView>

      {/* Stats overlay — respects status bar */}
      <View style={[s.overlay, { top: insets.top + 8 }]}>
        <Text style={s.overlayTitle}>🗺️ Harita</Text>
        <Text style={s.overlayStat}>{quests.length} görev</Text>
        <View style={s.onlineRow}>
          <View style={s.onlineDot} />
          <Text style={[s.overlayStat, { color: colors.green }]}>{onlineCount} online</Text>
        </View>
      </View>

      {/* My location button */}
      <TouchableOpacity style={[s.myLocBtn, { bottom: 132 }]} onPress={goToMyLocation}>
        <Text style={s.myLocIcon}>📍</Text>
      </TouchableOpacity>

      {/* Turkey overview button */}
      <TouchableOpacity style={[s.myLocBtn, { bottom: 76 }]} onPress={goToTurkey}>
        <Text style={s.myLocIcon}>🇹🇷</Text>
      </TouchableOpacity>

      {/* Refresh button */}
      <TouchableOpacity style={[s.myLocBtn, { bottom: 20 }]} onPress={load}>
        <Text style={s.myLocIcon}>🔄</Text>
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

  overlay: {
    position: 'absolute', left: 12,
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
    position: 'absolute', right: 16,
    backgroundColor: '#fff', borderRadius: 28, width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  myLocIcon: { fontSize: 22 },
});
