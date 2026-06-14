import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Image, Alert, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/uploadPhoto';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';
import PostActions from '../components/PostActions';

interface Post {
  id: string;
  content: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  user_id: string;
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
  profiles: { username: string; avatar_url?: string } | null;
}

function timeAgo(date: string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}dk`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}sa`;
  return `${Math.floor(sec / 86400)}g`;
}

export default function GoodDeedScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data: postRows } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .eq('post_type', 'good_deed')
      .order('created_at', { ascending: false })
      .limit(50);

    const list = (postRows || []) as Post[];

    if (list.length) {
      const ids = list.map((p) => p.id);
      const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
        supabase.from('post_likes').select('post_id, user_id').in('post_id', ids),
        supabase.from('post_comments').select('post_id').in('post_id', ids),
      ]);
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      const commentCounts: Record<string, number> = {};
      for (const r of likeRows || []) {
        counts[r.post_id] = (counts[r.post_id] || 0) + 1;
        if (r.user_id === uid) mine.add(r.post_id);
      }
      for (const r of commentRows || []) {
        commentCounts[r.post_id] = (commentCounts[r.post_id] || 0) + 1;
      }
      list.forEach((p) => {
        p.like_count = counts[p.id] || 0;
        p.liked_by_me = mine.has(p.id);
        p.comment_count = commentCounts[p.id] || 0;
      });
    }

    setPosts(list);
    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const pickPhoto = () => {
    Alert.alert('Fotoğraf Ekle', 'Kaynak seç', [
      {
        text: '📷 Kamera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('İzin gerekli', 'Kamera izni ver.'); return; }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
          if (!result.canceled && result.assets[0]) doUpload(result.assets[0].uri);
        },
      },
      {
        text: '🖼️ Galeri',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('İzin gerekli', 'Galeri izni ver.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
          if (!result.canceled && result.assets[0]) doUpload(result.assets[0].uri);
        },
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const doUpload = async (uri: string) => {
    setUploading(true);
    try {
      const url = await uploadImage(uri, 'deed');
      setPhoto(url);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  const markLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin gerekli', 'Konum izni ver.'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert('✅', 'Konum işaretlendi.');
  };

  const submit = async () => {
    if (!content.trim()) { Alert.alert('Boş gönderi', 'Bir şeyler yaz.'); return; }
    if (!uid) { Alert.alert('Hata', 'Giriş yapmalısın.'); return; }
    setPosting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: uid,
        post_type: 'good_deed',
        content: content.trim().slice(0, 500),
        photo_url: photo || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });
      if (error) throw new Error(error.message);
      setContent(''); setPhoto(''); setCoords(null); setShowForm(false);
      load();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Paylaşılamadı.');
    } finally {
      setPosting(false);
    }
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
          {!showForm && (
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
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#f0f2f4' }]} onPress={pickPhoto} disabled={uploading}>
                  {uploading
                    ? <ActivityIndicator color={colors.primary} />
                    : <Text style={{ color: colors.text, fontWeight: '700' }}>{photo ? '✅ Fotoğraf' : '📷 Fotoğraf'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: coords ? '#e8f5e9' : '#f0f2f4' }]} onPress={markLocation}>
                  <Text style={{ color: coords ? '#2e7d32' : colors.text, fontWeight: '700' }}>{coords ? '✅ Konum' : '📍 Konum'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.btn} onPress={submit} disabled={posting}>
                {posting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Paylaş</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowForm(false); setContent(''); setPhoto(''); setCoords(null); }}>
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 10 }}>İptal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={<View style={s.center}><Text style={{ fontSize: 40 }}>❤️</Text><Text style={s.empty}>Henüz paylaşım yok</Text></View>}
      renderItem={({ item }) => {
        const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        const username = prof?.username;
        return (
          <View style={s.card}>
            <View style={s.cardHead}>
              {prof?.avatar_url
                ? <Image source={{ uri: prof.avatar_url }} style={s.avatarImg} />
                : <View style={s.avatar}><Text style={s.avatarText}>{username?.[0]?.toUpperCase() ?? '?'}</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={s.username}>@{username}</Text>
                <Text style={s.time}>{timeAgo(item.created_at)}{item.latitude ? ' · 📍' : ''}</Text>
              </View>
            </View>
            <Text style={s.cardContent}>{item.content}</Text>
            {item.photo_url ? <Image source={{ uri: item.photo_url }} style={s.cardImg} /> : null}
            <PostActions
              postId={item.id}
              initialLikes={item.like_count}
              initialLiked={item.liked_by_me}
              initialCommentCount={item.comment_count}
              latitude={item.latitude}
              longitude={item.longitude}
            />
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
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
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
