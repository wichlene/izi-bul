import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Image, Alert, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface Post {
  id: string;
  content: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  like_count?: number;
  liked_by_me?: boolean;
  comment_count?: number;
  profiles: { username: string } | null;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

export default function GoodDeedScreen() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('https://izibul.com/api/posts?type=good_deed', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() || 'jpg';
    const fileName = `deed_${Date.now()}.${ext}`;
    const form = new FormData();
    form.append('file', { uri: asset.uri, name: fileName, type: `image/${ext}` } as any);
    const { data, error } = await supabase.storage.from('posts').upload(fileName, form);
    if (error) { Alert.alert('Hata', 'Fotoğraf yüklenemedi.'); return; }
    const { data: u } = supabase.storage.from('posts').getPublicUrl(data.path);
    setPhoto(u.publicUrl);
  };

  const post = async () => {
    if (!content.trim()) { Alert.alert('Boş gönderi', 'Bir şeyler yaz.'); return; }
    setPosting(true);
    let coords = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }
    } catch {}
    try {
      const res = await fetch('https://izibul.com/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ content, photo_url: photo || null, post_type: 'good_deed', latitude: coords?.lat, longitude: coords?.lng }),
      });
      if (!res.ok) throw new Error('Gönderi paylaşılamadı');
      setContent('');
      setPhoto('');
      setShowForm(false);
      load();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setPosting(false);
    }
  };

  const like = async (postId: string, liked: boolean) => {
    if (!session) return;
    await fetch('https://izibul.com/api/posts/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ post_id: postId, action: liked ? 'unlike' : 'like' }),
    });
    setPosts((prev) => prev.map((p) => p.id === postId
      ? { ...p, liked_by_me: !liked, like_count: (p.like_count || 0) + (liked ? -1 : 1) }
      : p));
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      ListHeaderComponent={
        <View>
          <Text style={s.header}>❤️ İyilik Hareketi</Text>
          {session && !showForm && (
            <TouchableOpacity style={s.newBtn} onPress={() => setShowForm(true)}>
              <Text style={s.newBtnText}>+ İyilik paylaş</Text>
            </TouchableOpacity>
          )}
          {showForm && (
            <View style={s.form}>
              <TextInput
                style={s.input}
                placeholder="Bugün ne iyilik yaptın?"
                placeholderTextColor={colors.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={3}
              />
              {photo ? <Image source={{ uri: photo }} style={s.photoPreview} /> : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#f0f2f4' }]} onPress={pickPhoto}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>📷 Fotoğraf</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={post} disabled={posting}>
                  {posting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Paylaş</Text>}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>İptal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={<View style={s.center}><Text style={{ fontSize: 40 }}>❤️</Text><Text style={s.empty}>Henüz paylaşım yok</Text></View>}
      renderItem={({ item }) => {
        const username = Array.isArray(item.profiles) ? item.profiles[0]?.username : item.profiles?.username;
        return (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{username?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.username}>@{username}</Text>
                <Text style={s.time}>{timeAgo(item.created_at)}</Text>
              </View>
            </View>
            <Text style={s.cardContent}>{item.content}</Text>
            {item.photo_url ? <Image source={{ uri: item.photo_url }} style={s.cardImg} /> : null}
            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => like(item.id, !!item.liked_by_me)}>
                <Text style={[s.actionText, item.liked_by_me && { color: colors.red }]}>
                  {item.liked_by_me ? '❤️' : '🤍'} {item.like_count || 0}
                </Text>
              </TouchableOpacity>
              <View style={s.actionBtn}>
                <Text style={s.actionText}>💬 {item.comment_count || 0}</Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { fontSize: 26, fontWeight: '900', color: colors.text, marginVertical: 8, marginLeft: 4 },
  newBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  newBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  form: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  input: { backgroundColor: '#f7f9fa', borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, marginBottom: 10, minHeight: 80, textAlignVertical: 'top' },
  photoPreview: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10 },
  btn: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  username: { fontWeight: '800', color: colors.text, fontSize: 15 },
  time: { fontSize: 12, color: colors.textMuted },
  cardContent: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 10 },
  cardImg: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 15, color: colors.textMuted, fontWeight: '700' },
  empty: { color: colors.textMuted, marginTop: 12, fontSize: 16 },
});
