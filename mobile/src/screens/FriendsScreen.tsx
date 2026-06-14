import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, RefreshControl, Image,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface FriendRow {
  id: string;
  friend: { id: string; username: string; avatar_url?: string; total_finds: number };
}
interface ReqRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_user: { id: string; username: string; avatar_url?: string };
}
interface SearchResult {
  id: string;
  username: string;
  avatar_url?: string;
  full_name?: string;
}

export default function FriendsScreen({ navigation }: any) {
  const { session } = useAuth();
  const uid = session?.user.id;

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingReq, setPendingReq] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!uid) return;
    const [reqRes, friendRes, sentRes] = await Promise.all([
      supabase
        .from('friend_requests')
        .select('*, from_user:profiles!friend_requests_from_user_id_fkey(id, username, avatar_url)')
        .eq('to_user_id', uid)
        .eq('status', 'pending'),
      supabase
        .from('friendships')
        .select('*, friend:profiles!friendships_friend_id_fkey(id, username, avatar_url, total_finds)')
        .eq('user_id', uid),
      supabase
        .from('friend_requests')
        .select('to_user_id')
        .eq('from_user_id', uid)
        .eq('status', 'pending'),
    ]);
    setRequests((reqRes.data as ReqRow[]) || []);
    setFriends((friendRes.data as FriendRow[]) || []);
    setPendingReq(new Set((sentRes.data || []).map((r: any) => r.to_user_id)));
    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const searchUsers = async (q: string) => {
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, full_name')
      .ilike('username', `%${q}%`)
      .neq('id', uid)
      .limit(10);
    setSearchResults((data as SearchResult[]) || []);
    setSearching(false);
  };

  const accept = async (reqId: string, fromId: string) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', reqId);
    await supabase.from('friendships').insert([
      { user_id: uid, friend_id: fromId },
      { user_id: fromId, friend_id: uid },
    ]);
    load();
  };

  const reject = async (reqId: string) => {
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', reqId);
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const sendRequest = async (toId: string) => {
    const friendIds = friends.map((f) => f.friend.id);
    if (friendIds.includes(toId)) { Alert.alert('Zaten arkadaşsınız'); return; }
    if (pendingReq.has(toId)) { Alert.alert('İstek zaten gönderildi'); return; }
    await supabase.from('friend_requests').insert({ from_user_id: uid, to_user_id: toId, status: 'pending' });
    setPendingReq((prev) => new Set([...prev, toId]));
    Alert.alert('✅', 'Arkadaşlık isteği gönderildi.');
  };

  const Avatar = ({ uri, name, size = 44 }: { uri?: string; name?: string; size?: number }) => (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri
        ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        : <Text style={[s.avatarText, { fontSize: size * 0.4 }]}>{name?.[0]?.toUpperCase() ?? '?'}</Text>}
    </View>
  );

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      data={friends}
      keyExtractor={(f) => f.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        <View>
          <Text style={s.header}>👥 Arkadaşlar</Text>

          {/* Arkadaş ara */}
          <View style={s.searchBox}>
            <TextInput
              style={s.searchInput}
              value={searchQ}
              onChangeText={(t) => { setSearchQ(t); searchUsers(t); }}
              placeholder="Kullanıcı ara ve arkadaş ekle..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={() => searchUsers(searchQ)}
            />
            {searching && <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: 10 }} />}
          </View>

          {/* Arama sonuçları */}
          {searchResults.length > 0 && (
            <View style={s.searchResults}>
              {searchResults.map((u) => {
                const isFriend = friends.some((f) => f.friend.id === u.id);
                const isPending = pendingReq.has(u.id);
                return (
                  <View key={u.id} style={s.searchRow}>
                    <Avatar uri={u.avatar_url} name={u.username} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.username}>@{u.username}</Text>
                      {u.full_name ? <Text style={s.sub}>{u.full_name}</Text> : null}
                    </View>
                    {isFriend ? (
                      <Text style={s.friendTag}>✅ Arkadaş</Text>
                    ) : (
                      <TouchableOpacity
                        style={[s.addBtn, isPending && s.addBtnPending]}
                        onPress={() => sendRequest(u.id)}
                        disabled={isPending}
                      >
                        <Text style={s.addBtnText}>{isPending ? '⏳ Gönderildi' : '+ Ekle'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Bekleyen istekler */}
          {requests.length > 0 && (
            <View style={s.reqBox}>
              <Text style={s.reqTitle}>⏳ Bekleyen İstekler ({requests.length})</Text>
              {requests.map((r) => (
                <View key={r.id} style={s.reqRow}>
                  <Avatar uri={r.from_user?.avatar_url} name={r.from_user?.username} />
                  <Text style={[s.username, { flex: 1 }]}>@{r.from_user?.username}</Text>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => reject(r.id)}>
                    <Text style={s.rejectText}>✕</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => accept(r.id, r.from_user_id)}>
                    <Text style={s.acceptText}>Kabul</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={s.section}>Arkadaşların ({friends.length})</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>👥</Text>
          <Text style={s.empty}>Henüz arkadaşın yok. Yukarıdan ara!</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={s.friendRow}>
          <Avatar uri={item.friend?.avatar_url} name={item.friend?.username} />
          <View style={{ flex: 1 }}>
            <Text style={s.username}>@{item.friend?.username}</Text>
            <Text style={s.sub}>{item.friend?.total_finds ?? 0} buluş</Text>
          </View>
          <TouchableOpacity
            style={s.msgBtn}
            onPress={() => navigation.navigate('Messages', {
              screen: 'Chat',
              params: { friendId: item.friend.id, friendUsername: item.friend.username },
            })}
          >
            <Text style={s.msgBtnText}>💬</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8, marginLeft: 4 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, marginBottom: 10,
  },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: colors.text },

  searchResults: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  friendTag: { fontSize: 12, color: colors.green, fontWeight: '700' },
  addBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  addBtnPending: { backgroundColor: '#f0f2f4' },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  reqBox: {
    backgroundColor: '#fff7f2', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#ffe0cc', marginBottom: 8,
  },
  reqTitle: { fontSize: 14, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rejectBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#fee',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fcc',
  },
  rejectText: { color: colors.red, fontWeight: '900', fontSize: 14 },
  acceptBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  avatar: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: '#fff', fontWeight: '900' },
  username: { fontSize: 15, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  msgBtn: {
    backgroundColor: colors.primary, width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  msgBtnText: { fontSize: 18 },
  empty: { color: colors.textMuted, marginTop: 12, fontSize: 15, textAlign: 'center' },
});
