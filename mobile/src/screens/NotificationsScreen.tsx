import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface Notif {
  id: string;
  type: string;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

function notifIcon(type: string) {
  switch (type) {
    case 'friend_request': return '👤';
    case 'friend_accept': return '🤝';
    case 'submission_approved': return '🏆';
    case 'submission_rejected': return '❌';
    case 'message': return '💬';
    case 'like': return '❤️';
    case 'comment': return '💬';
    default: return '🔔';
  }
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifs((data as Notif[]) || []);
    setLoading(false);
    setRefreshing(false);
    // Mark all read
    supabase.from('notifications').update({ is_read: true }).eq('user_id', uid).eq('is_read', false).then(() => {});
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      data={notifs}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      ListHeaderComponent={<Text style={s.header}>🔔 Bildirimler</Text>}
      ListEmptyComponent={
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>🔔</Text>
          <Text style={s.empty}>Henüz bildirim yok</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[s.row, !item.is_read && s.unread]}>
          <View style={s.icon}>
            <Text style={{ fontSize: 22 }}>{notifIcon(item.type)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={2}>{item.title}</Text>
            {item.body ? <Text style={s.body} numberOfLines={2}>{item.body}</Text> : null}
            <Text style={s.time}>{timeAgo(item.created_at)}</Text>
          </View>
          {!item.is_read && <View style={s.dot} />}
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  unread: { backgroundColor: '#fff7f2', borderColor: '#ffe0cc' },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f2f4', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 20 },
  body: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  time: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  empty: { color: colors.textMuted, marginTop: 12, fontSize: 16 },
});
