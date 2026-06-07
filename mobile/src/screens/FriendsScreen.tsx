import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface FriendRow { id: string; friend: { id: string; username: string; total_finds: number } }
interface ReqRow { id: string; from_user_id: string; to_user_id: string; from_user: { id: string; username: string } }

export default function FriendsScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    const [reqRes, friendRes] = await Promise.all([
      supabase.from('friend_requests')
        .select('*, from_user:profiles!friend_requests_from_user_id_fkey(id, username)')
        .eq('to_user_id', uid).eq('status', 'pending'),
      supabase.from('friendships')
        .select('*, friend:profiles!friendships_friend_id_fkey(id, username, total_finds)')
        .eq('user_id', uid),
    ]);
    setRequests((reqRes.data as ReqRow[]) || []);
    setFriends((friendRes.data as FriendRow[]) || []);
    setLoading(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  async function accept(reqId: string, fromId: string) {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', reqId);
    await supabase.from('friendships').insert([
      { user_id: uid, friend_id: fromId },
      { user_id: fromId, friend_id: uid },
    ]);
    Alert.alert('Eklendi', 'Arkadaş eklendi.');
    load();
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={friends}
      keyExtractor={(f) => f.id}
      contentContainerStyle={{ padding: 12 }}
      ListHeaderComponent={
        <View>
          <Text style={s.header}>Arkadaşlar</Text>
          {requests.length > 0 && (
            <View style={s.reqBox}>
              <Text style={s.reqTitle}>Bekleyen İstekler ({requests.length})</Text>
              {requests.map((r) => (
                <View key={r.id} style={s.reqRow}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{r.from_user?.username?.[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={s.username}>@{r.from_user?.username}</Text>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => accept(r.id, r.from_user_id)}>
                    <Text style={s.acceptText}>Kabul Et</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <Text style={s.section}>Arkadaşların ({friends.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text style={s.empty}>Henüz arkadaşın yok.</Text>}
      renderItem={({ item }) => (
        <View style={s.friendRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{item.friend?.username?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.username}>@{item.friend?.username}</Text>
            <Text style={s.sub}>{item.friend?.total_finds ?? 0} buluş</Text>
          </View>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8, marginLeft: 4 },
  reqBox: { backgroundColor: '#fff7f2', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#ffe0cc' },
  reqTitle: { fontSize: 14, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  username: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  acceptBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
});
