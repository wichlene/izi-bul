import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface Msg {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  from_user?: { username: string };
}

export default function MessagesScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from('messages')
      .select('*, from_user:profiles!messages_from_user_id_fkey(username)')
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
      .order('created_at', { ascending: false })
      .limit(50);
    setMessages((data as Msg[]) || []);
    setLoading(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={messages}
      keyExtractor={(m) => m.id}
      contentContainerStyle={{ padding: 12 }}
      ListHeaderComponent={<Text style={s.header}>Mesajlar</Text>}
      ListEmptyComponent={
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>💬</Text>
          <Text style={s.empty}>Henüz mesajın yok</Text>
        </View>
      }
      renderItem={({ item }) => {
        const incoming = item.to_user_id === uid;
        return (
          <View style={[s.row, !item.is_read && incoming && s.unread]}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {item.from_user?.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.username}>
                {incoming ? `@${item.from_user?.username ?? 'kullanıcı'}` : 'Sen'}
              </Text>
              <Text style={s.content} numberOfLines={1}>{item.content}</Text>
            </View>
            {!item.is_read && incoming && <View style={s.dot} />}
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  unread: { backgroundColor: '#fff7f2', borderColor: '#ffe0cc' },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  username: { fontSize: 15, fontWeight: '800', color: colors.text },
  content: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  empty: { fontSize: 16, color: colors.textMuted, marginTop: 12 },
});
