import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, RefreshControl, TextInput, ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface Sub {
  id: string;
  photo_url: string | null;
  distance_meters: number;
  created_at: string;
  profiles: { username: string } | null;
  quests: { title: string } | null;
}

interface AdminQuest {
  id: string;
  title: string;
  is_active: boolean;
  is_featured: boolean;
  total_solved: number;
}

type Tab = 'pending' | 'quests' | 'users' | 'announce';

export default function AdminScreen() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [tab, setTab] = useState<Tab>('pending');
  const [counts, setCounts] = useState({ users: 0, quests: 0, subs: 0, pending: 0 });
  const [pending, setPending] = useState<Sub[]>([]);
  const [quests, setQuests] = useState<AdminQuest[]>([]);
  const [users, setUsers] = useState<{id:string;username:string;full_name:string|null;total_finds:number;is_business:boolean;is_admin:boolean}[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [announcing, setAnnouncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [usersCount, qCount, subCount, pendCount, pend, qs, us] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('quests').select('id', { count: 'exact', head: true }),
      supabase.from('submissions').select('id', { count: 'exact', head: true }),
      supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('submissions')
        .select('id, photo_url, distance_meters, created_at, profiles(username), quests(title)')
        .eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
      supabase.from('quests')
        .select('id, title, is_active, is_featured, total_solved')
        .order('created_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('id, username, full_name, total_finds, is_business, is_admin').order('created_at', { ascending: false }).limit(50),
    ]);
    setCounts({ users: usersCount.count || 0, quests: qCount.count || 0, subs: subCount.count || 0, pending: pendCount.count || 0 });
    setPending((pend.data as any) || []);
    setQuests((qs.data as AdminQuest[]) || []);
    setUsers((us.data as any) || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const api = async (url: string, method: string, body: any) => {
    const res = await fetch(`https://izibul.com${url}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'İşlem başarısız');
    }
  };

  const approve = async (id: string) => {
    setBusy(id);
    try {
      await api('/api/admin/approve', 'POST', { submission_id: id });
      setPending((p) => p.filter((s) => s.id !== id));
      setCounts((c) => ({ ...c, pending: Math.max(0, c.pending - 1) }));
      Alert.alert('✅', 'Onaylandı, kazanan belirlendi.');
    } catch (e: any) { Alert.alert('Hata', e.message); }
    finally { setBusy(null); }
  };

  const toggleFeature = async (q: AdminQuest) => {
    setBusy(q.id);
    try {
      await api('/api/admin/feature', 'POST', { quest_id: q.id, featured: !q.is_featured });
      setQuests((list) => list.map((x) => x.id === q.id ? { ...x, is_featured: !x.is_featured } : x));
    } catch (e: any) { Alert.alert('Hata', e.message); }
    finally { setBusy(null); }
  };

  const toggleActive = async (q: AdminQuest) => {
    setBusy(q.id);
    try {
      await api('/api/admin/quests', 'PATCH', { quest_id: q.id, is_active: !q.is_active });
      setQuests((list) => list.map((x) => x.id === q.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e: any) { Alert.alert('Hata', e.message); }
    finally { setBusy(null); }
  };

  const toggleBusiness = async (userId: string, isBusiness: boolean) => {
    setBusy(userId);
    try {
      await api('/api/admin/users', 'PATCH', { user_id: userId, is_business: !isBusiness });
      setUsers((list) => list.map((u) => u.id === userId ? { ...u, is_business: !isBusiness } : u));
    } catch (e: any) { Alert.alert('Hata', e.message); }
    finally { setBusy(null); }
  };

  const postAnnouncement = async () => {
    if (!announcement.trim()) return;
    setAnnouncing(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: session?.user.id,
        post_type: 'announcement',
        content: announcement.trim(),
      });
      if (error) throw new Error(error.message);
      setAnnouncement('');
      Alert.alert('✅', 'Duyuru yayınlandı.');
    } catch (e: any) { Alert.alert('Hata', e.message); }
    finally { setAnnouncing(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const header = (
    <View>
      <Text style={s.header}>🛡️ Admin Paneli</Text>
      <View style={s.statsGrid}>
        <View style={s.statBox}><Text style={s.statValue}>{counts.users}</Text><Text style={s.statLabel}>Kullanıcı</Text></View>
        <View style={s.statBox}><Text style={s.statValue}>{counts.quests}</Text><Text style={s.statLabel}>Görev</Text></View>
        <View style={s.statBox}><Text style={s.statValue}>{counts.subs}</Text><Text style={s.statLabel}>Gönderim</Text></View>
        <View style={s.statBox}><Text style={[s.statValue, { color: colors.red }]}>{counts.pending}</Text><Text style={s.statLabel}>Bekleyen</Text></View>
      </View>
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'pending' && s.tabActive]} onPress={() => setTab('pending')}>
          <Text style={[s.tabText, tab === 'pending' && s.tabTextActive]}>⏳ Bekleyen ({counts.pending})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'quests' && s.tabActive]} onPress={() => setTab('quests')}>
          <Text style={[s.tabText, tab === 'quests' && s.tabTextActive]}>🗺️ Görevler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'users' && s.tabActive]} onPress={() => setTab('users')}>
          <Text style={[s.tabText, tab === 'users' && s.tabTextActive]}>👥 Kullanıcılar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'announce' && s.tabActive]} onPress={() => setTab('announce')}>
          <Text style={[s.tabText, tab === 'announce' && s.tabTextActive]}>📢 Duyuru</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (tab === 'pending') {
    return (
      <FlatList
        data={pending}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={s.center}><Text style={{ fontSize: 40 }}>✅</Text><Text style={s.empty}>Onay bekleyen yok</Text></View>}
        renderItem={({ item }) => {
          const username = Array.isArray(item.profiles) ? item.profiles[0]?.username : item.profiles?.username;
          const title = Array.isArray(item.quests) ? item.quests[0]?.title : item.quests?.title;
          return (
            <View style={s.card}>
              {item.photo_url ? <Image source={{ uri: item.photo_url }} style={s.proof} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={s.qTitle} numberOfLines={1}>{title}</Text>
                <Text style={s.sub}>@{username} · {Math.round(item.distance_meters)}m</Text>
                <TouchableOpacity style={s.approveBtn} onPress={() => approve(item.id)} disabled={busy === item.id}>
                  {busy === item.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.approveText}>✅ Onayla & Kazanan Yap</Text>}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    );
  }

  if (tab === 'users') {
    return (
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={s.center}><Text style={s.empty}>Kullanıcı yok</Text></View>}
        renderItem={({ item }) => (
          <View style={s.qRow}>
            <View style={s.userAvatar}>
              <Text style={s.userAvatarText}>{item.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.qTitle} numberOfLines={1}>{item.full_name || item.username}</Text>
              <Text style={s.sub}>@{item.username} · {item.total_finds} buluş</Text>
            </View>
            {item.is_admin && <View style={s.adminBadge}><Text style={s.adminBadgeText}>Admin</Text></View>}
            <TouchableOpacity
              style={[s.miniBtn, item.is_business && s.miniBtnOn]}
              onPress={() => toggleBusiness(item.id, item.is_business)}
              disabled={busy === item.id}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: item.is_business ? '#92400e' : colors.textMuted }}>
                {item.is_business ? '🏪' : '👤'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    );
  }

  if (tab === 'announce') {
    return (
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {header}
        <View style={s.announceBox}>
          <Text style={s.announceTitle}>📢 Duyuru Yayınla</Text>
          <TextInput
            style={s.announceInput}
            value={announcement}
            onChangeText={setAnnouncement}
            placeholder="Tüm kullanıcılara duyuru yaz..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.approveBtn, { backgroundColor: '#3b82f6' }]}
            onPress={postAnnouncement}
            disabled={announcing || !announcement.trim()}
          >
            {announcing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.approveText}>📢 Duyuruyu Yayınla</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={quests}
      keyExtractor={(q) => q.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<View style={s.center}><Text style={s.empty}>Görev yok</Text></View>}
      renderItem={({ item }) => (
        <View style={s.qRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.qTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.sub}>{item.total_solved} çözüm · {item.is_active ? 'Aktif' : 'Pasif'}</Text>
          </View>
          <TouchableOpacity style={[s.miniBtn, item.is_featured && s.miniBtnOn]} onPress={() => toggleFeature(item)} disabled={busy === item.id}>
            <Text style={[s.miniText, item.is_featured && s.miniTextOn]}>⭐</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.miniBtn, !item.is_active && s.miniBtnOff]} onPress={() => toggleActive(item)} disabled={busy === item.id}>
            <Text style={[s.miniText, !item.is_active && { color: '#fff' }]}>{item.is_active ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statBox: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f2f4', alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: '700', color: colors.textMuted, fontSize: 12 },
  tabTextActive: { color: '#fff' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  proof: { width: 70, height: 70, borderRadius: 10 },
  qTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  approveBtn: { backgroundColor: colors.green, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  approveText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  miniBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#f0f2f4', alignItems: 'center', justifyContent: 'center' },
  miniBtnOn: { backgroundColor: '#fff3d6' },
  miniBtnOff: { backgroundColor: colors.red },
  miniText: { fontSize: 18 },
  miniTextOn: { fontSize: 18 },
  empty: { color: colors.textMuted, marginTop: 12, fontSize: 15 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  adminBadge: { backgroundColor: 'rgba(168,85,247,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  adminBadgeText: { color: colors.purple, fontSize: 11, fontWeight: '800' },
  announceBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  announceTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 12 },
  announceInput: {
    backgroundColor: '#f7f9fa', borderRadius: 10, padding: 12, fontSize: 15, color: colors.text,
    minHeight: 100, textAlignVertical: 'top', marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
});
