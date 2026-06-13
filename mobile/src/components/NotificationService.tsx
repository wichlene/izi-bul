import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Uygulama açıkken bildirimleri göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationService({ userId }: { userId: string }) {
  useEffect(() => {
    // Android bildirim kanalları
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('izibul', {
        name: 'İzi Bul',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B2B',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
      Notifications.setNotificationChannelAsync('messages', {
        name: 'Mesajlar',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 100, 100],
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Bildirim izni iste
    Notifications.requestPermissionsAsync();

    // Realtime: notifications tablosunu dinle
    const notifChannel = supabase
      .channel(`notifs-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as any;
          Notifications.scheduleNotificationAsync({
            content: {
              title: n.title || 'İzi Bul',
              body: n.body || '',
              sound: 'default',
              data: { type: n.type, link: n.link },
            },
            trigger: null,
          });
        }
      )
      .subscribe();

    // Realtime: messages tablosunu dinle
    const msgChannel = supabase
      .channel(`msgs-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `to_user_id=eq.${userId}` },
        (payload) => {
          const m = payload.new as any;
          Notifications.scheduleNotificationAsync({
            content: {
              title: '💬 Yeni Mesaj',
              body: m.content || 'Yeni bir mesaj aldın',
              sound: 'default',
              data: { type: 'message', from_user_id: m.from_user_id },
            },
            trigger: null,
          });
        }
      )
      .subscribe();

    // Realtime: friend_requests tablosunu dinle
    const friendChannel = supabase
      .channel(`friends-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friend_requests', filter: `to_user_id=eq.${userId}` },
        () => {
          Notifications.scheduleNotificationAsync({
            content: {
              title: '👥 Yeni Arkadaşlık İsteği',
              body: 'Birisi sana arkadaşlık isteği gönderdi',
              sound: 'default',
              data: { type: 'friend_request' },
            },
            trigger: null,
          });
        }
      )
      .subscribe();

    return () => {
      notifChannel.unsubscribe();
      msgChannel.unsubscribe();
      friendChannel.unsubscribe();
    };
  }, [userId]);

  return null;
}
