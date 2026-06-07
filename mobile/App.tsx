import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 21, opacity: focused ? 1 : 0.55 }}>
      {icon}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card, borderBottomColor: colors.border },
        headerTitleStyle: { fontWeight: '900', color: colors.text },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 58, paddingBottom: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}>
      <Tab.Screen name="Keşfet" component={HomeScreen}
        options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tab.Screen name="Harita" component={MapScreen}
        options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon icon="📍" focused={focused} /> }} />
      <Tab.Screen name="Arkadaşlar" component={FriendsScreen}
        options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} /> }} />
      <Tab.Screen name="Mesajlar" component={MessagesScreen}
        options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} /> }} />
      <Tab.Screen name="Profil" component={ProfileScreen}
        options={{ headerShown: false, tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
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
