import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

import { AuthProvider, useAuth } from './src/AuthContext';
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import GoodDeedScreen from './src/screens/GoodDeedScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import QuestDetailScreen from './src/screens/QuestDetailScreen';
import CreateQuestScreen from './src/screens/CreateQuestScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import BusinessStatsScreen from './src/screens/BusinessStatsScreen';
import AdminScreen from './src/screens/AdminScreen';
import LocationSync from './src/components/LocationSync';
import NotificationService from './src/components/NotificationService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const SCREEN_OPTS = {
  headerStyle: { backgroundColor: '#fff' },
  headerTitleStyle: { fontWeight: '900' as const, color: colors.text },
  headerShadowVisible: false,
  headerBackTitle: 'Geri',
};

function TabIcon({ icon, focused, badge }: { icon: string; focused: boolean; badge?: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
      {badge != null && badge > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8, backgroundColor: colors.primary,
          borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTS}>
      <Stack.Screen name="HomeList" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
      <Stack.Screen name="CreateQuest" component={CreateQuestScreen} />
    </Stack.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTS}>
      <Stack.Screen name="MapList" component={MapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
    </Stack.Navigator>
  );
}

function GoodDeedStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTS}>
      <Stack.Screen name="GoodDeedList" component={GoodDeedScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTS}>
      <Stack.Screen name="MessagesList" component={MessagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={SCREEN_OPTS}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={ProfileEditScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} options={{ title: 'Arkadaşlar' }} />
      <Stack.Screen name="GoodDeedFull" component={GoodDeedScreen} options={{ title: 'İyilik Hareketi' }} />
      <Stack.Screen name="GoodDeed" component={GoodDeedScreen} options={{ title: 'İyilik Hareketi' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Bildirimler' }} />
      <Stack.Screen name="CreateQuest" component={CreateQuestScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Liderlik Tablosu' }} />
      <Stack.Screen name="BusinessStats" component={BusinessStatsScreen} options={{ title: 'İstatistikler' }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin Paneli' }} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);

  useEffect(() => {
    if (!uid) return;
    Promise.all([
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('to_user_id', uid).eq('is_read', false),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('is_read', false),
    ]).then(([msg, notif]) => {
      setUnreadMsg(msg.count || 0);
      setUnreadNotif(notif.count || 0);
    });
  }, [uid]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.border, height: 58, paddingBottom: 6 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarShowLabel: true,
      }}>
      <Tab.Screen name="Home" component={HomeStack}
        options={{ title: 'Keşfet', tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tab.Screen name="Map" component={MapStack}
        options={{ title: 'Harita', tabBarIcon: ({ focused }) => <TabIcon icon="📍" focused={focused} /> }} />
      <Tab.Screen name="GoodDeed" component={GoodDeedStack}
        options={{ title: 'İyilik', tabBarIcon: ({ focused }) => <TabIcon icon="❤️" focused={focused} /> }} />
      <Tab.Screen name="Messages" component={MessagesStack}
        options={{ title: 'Mesajlar', tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} badge={unreadMsg} /> }} />
      <Tab.Screen name="Profile" component={ProfileStack}
        options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} badge={unreadNotif} /> }} />
    </Tab.Navigator>
  );
}

const RELEASE_API = 'https://api.github.com/repos/wichlene/izi-bul/releases/tags/mobile-latest';
const CURRENT_BUILD: number = (Constants.expoConfig?.android?.versionCode as number) || 1;

function UpdateBanner() {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => r.json())
      .then((data) => {
        const latestBuild = parseInt(data.body || '0', 10);
        if (latestBuild > CURRENT_BUILD) {
          const asset = data.assets?.find((a: any) => a.name.endsWith('.apk'));
          if (asset?.browser_download_url) setUpdateUrl(asset.browser_download_url);
        }
      })
      .catch(() => {});
  }, []);

  const insets = useSafeAreaInsets();
  if (!updateUrl || dismissed) return null;
  return (
    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingTop: insets.top + 8, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ flex: 1, color: '#fff', fontWeight: '700', fontSize: 13 }}>🆕 Yeni güncelleme mevcut!</Text>
      <TouchableOpacity
        style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
        onPress={() => Linking.openURL(updateUrl)}>
        <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 12 }}>Yükle</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setDismissed(true)}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '300' }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function Root() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <UpdateBanner />
      {session ? (
        <>
          <LocationSync userId={session.user.id} />
          <NotificationService userId={session.user.id} />
          <MainTabs />
        </>
      ) : <AuthScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
