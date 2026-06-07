import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface Friend { id: string; username: string }
interface ConvMeta { lastMsg: string; lastTime: string; unread: number }

export default function MessagesScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [friends, setFriends] = useState<Friend[]>([]);
  const [convMap, setConvMap] = useState<Record<string, ConvMeta>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const [friendRes, msgRes] = await Promise.all([
      supabase.from('friendships')
        .select('friend:profiles!friendships_friend_id_fkey(id, username)')
        .eq('user_id', uid),
      supabase.from('messages')
        .select('from_user_id, to_user_id, content, created_at, is_read')
        .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
        .order('created_at', { ascending: false })
        .limit(300),
    ]);

    const friendList = (friendRes.data || []).map((f: any) => f.friend as Friend);
    const map: Record<string, ConvMeta> = {};
    for (const msg of (msgRes.data || []) as any[]) {
      const partnerId = msg.from_user_id === uid ? msg.to_user_id : msg.from_user_id;
      if (!map[partnerId]) map[partnerId] = { lastMsg: msg.content, lastTime: msg.created_at, unread: 0 };
      if (!msg.is_read && msg.to_user_id === uid) map[partnerId].unread++;
    }

    const sorted = [...friendList].sort((a, b) => {
      const ta = map[a.id]?.lastTime || '';
      const tb = map[b.id]?.lastTime || '';
      return tb.localeCompare(ta);
    });

    setFriends(sorted);
    setConvMap(map);
    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}dk`;
    if (s < 86400) return `${Math.floor(s / 3600)}sa`;
    return `${Math.floor(s / 86400)}g`;
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      data={friends}
      keyExtractor={(f) => f.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      ListHeaderComponent={<Text style={s.header}>Mesajlar</Text>}
      ListEmptyComponent={
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>💬</Text>
          <Text style={s.empty}>Henüz arkadaşın yok. Arkadaş ekle!</Text>
        </View>
      }
      renderItem={({ item }) => {
        const meta = convMap[item.id];
        return (
          <TouchableOpacity
            style={[s.row, meta?.unread > 0 && s.unread]}
            onPress={() => navigation.navigate('Chat', { friendId: item.id, friendUsername: item.username })}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.username?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.username}>@{item.username}</Text>
              {meta?.lastMsg ? (
                <Text style={s.lastMsg} numberOfLines={1}>{meta.lastMsg}</Text>
              ) : (
                <Text style={s.lastMsg}>Mesaj gönder</Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {meta?.lastTime ? <Text style={s.time}>{timeAgo(meta.lastTime)}</Text> : null}
              {meta?.unread > 0 && (
                <View style={s.badge}><Text style={s.badgeText}>{meta.unread}</Text></View>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  unread: { backgroundColor: '#fff7f2', borderColor: '#ffe0cc' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  username: { fontSize: 16, fontWeight: '800', color: colors.text },
  lastMsg: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  time: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  badge: { backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  empty: { color: colors.textMuted, marginTop: 12, fontSize: 15, textAlign: 'center' },
});
