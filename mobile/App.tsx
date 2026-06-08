import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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
import GoodDeedScreen from './src/screens/GoodDeedScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import QuestDetailScreen from './src/screens/QuestDetailScreen';
import CreateQuestScreen from './src/screens/CreateQuestScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import BusinessStatsScreen from './src/screens/BusinessStatsScreen';
import AdminScreen from './src/screens/AdminScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ icon, focused, badge }: { icon: string; focused: boolean; badge?: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.55 }}>{icon}</Text>
      {badge != null && badge > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: colors.primary, borderRadius: 8,
          minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontWeight: '900', color: colors.text }, headerShadowVisible: false, headerBackTitle: 'Geri' }}>
      <Stack.Screen name="HomeList" component={HomeScreen} options={{ title: 'Keşfet', headerShown: false }} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
      <Stack.Screen name="CreateQuest" component={CreateQuestScreen} />
    </Stack.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontWeight: '900', color: colors.text }, headerShadowVisible: false, headerBackTitle: 'Geri' }}>
      <Stack.Screen name="MapList" component={MapScreen} options={{ title: 'Harita', headerShown: false }} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontWeight: '900', color: colors.text }, headerShadowVisible: false, headerBackTitle: 'Geri' }}>
      <Stack.Screen name="MessagesList" component={MessagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function FriendsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontWeight: '900', color: colors.text }, headerShadowVisible: false, headerBackTitle: 'Geri' }}>
      <Stack.Screen name="FriendsList" component={FriendsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ProfileStack({ navigation }: any) {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontWeight: '900', color: colors.text }, headerShadowVisible: false, headerBackTitle: 'Geri' }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GoodDeed" component={GoodDeedScreen} options={{ title: 'İyilik Hareketi' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Bildirimler' }} />
      <Stack.Screen name="CreateQuest" component={CreateQuestScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Liderlik' }} />
      <Stack.Screen name="BusinessStats" component={BusinessStatsScreen} options={{ title: 'İstatistikler' }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [pendingFriends, setPendingFriends] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);

  useEffect(() => {
    if (!uid) return;
    // load badge counts
    Promise.all([
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('to_user_id', uid).eq('is_read', false),
      supabase.from('friend_requests').select('id', { count: 'exact', head: true }).eq('to_user_id', uid).eq('status', 'pending'),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('is_read', false),
    ]).then(([msg, fr, notif]) => {
      setUnreadMsg(msg.count || 0);
      setPendingFriends(fr.count || 0);
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
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarShowLabel: true,
      }}>
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Keşfet', tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tab.Screen name="Map" component={MapStack} options={{ title: 'Harita', tabBarIcon: ({ focused }) => <TabIcon icon="📍" focused={focused} /> }} />
      <Tab.Screen name="Friends" component={FriendsStack} options={{ title: 'Arkadaşlar', tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} badge={pendingFriends} /> }} />
      <Tab.Screen name="Messages" component={MessagesStack} options={{ title: 'Mesajlar', tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} badge={unreadMsg} /> }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} badge={unreadNotif} /> }} />
    </Tab.Navigator>
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
      {session ? <MainTabs /> : <AuthScreen />}
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
