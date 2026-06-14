import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Image, ActivityIndicator, Linking,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url?: string } | null;
}

interface Props {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
  initialCommentCount?: number;
  latitude?: number | null;
  longitude?: number | null;
}

function timeAgo(d: string) {
  const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}dk`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}sa`;
  return `${Math.floor(sec / 86400)}g`;
}

export default function PostActions({
  postId, initialLikes, initialLiked, initialCommentCount = 0, latitude, longitude,
}: Props) {
  const { session } = useAuth();
  const uid = session?.user.id;

  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const toggleLike = async () => {
    if (!uid) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    if (next) {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: uid });
    } else {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', uid);
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      const { data } = await supabase
        .from('post_comments')
        .select('id, content, created_at, profiles(username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(50);
      const list = (data || []) as Comment[];
      setComments(list);
      setCommentCount(list.length);
      setCommentsLoaded(true);
    }
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !uid || commentBusy) return;
    setCommentBusy(true);
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: uid, content: commentInput.trim().slice(0, 280) })
      .select('id, content, created_at, profiles(username, avatar_url)')
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setCommentCount((n) => n + 1);
      setCommentInput('');
    }
    setCommentBusy(false);
  };

  return (
    <View>
      {/* Aksiyon satırı */}
      <View style={s.row}>
        <TouchableOpacity style={s.action} onPress={toggleComments}>
          <Text style={[s.actionIcon, showComments && { color: colors.primary }]}>💬</Text>
          <Text style={[s.actionCount, showComments && { color: colors.primary }]}>{commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.action} onPress={toggleLike}>
          <Text style={s.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={[s.actionCount, liked && { color: '#ef4444' }]}>{likes}</Text>
        </TouchableOpacity>

        {latitude != null && longitude != null && (
          <TouchableOpacity
            style={[s.action, s.locBtn]}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${latitude},${longitude}`)}
          >
            <Text style={s.locText}>📍 Konum</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Yorum bölümü */}
      {showComments && (
        <View style={s.commentsBox}>
          {!commentsLoaded && (
            <ActivityIndicator color={colors.primary} style={{ padding: 12 }} />
          )}
          {commentsLoaded && comments.length === 0 && (
            <Text style={s.noComments}>İlk yorumu sen yap!</Text>
          )}
          {comments.map((c) => {
            const prof = Array.isArray(c.profiles) ? (c.profiles as any)[0] : c.profiles;
            return (
              <View key={c.id} style={s.comment}>
                <View style={s.commentAvatar}>
                  {prof?.avatar_url
                    ? <Image source={{ uri: prof.avatar_url }} style={s.commentAvatarImg} />
                    : <Text style={s.commentAvatarLetter}>{prof?.username?.[0]?.toUpperCase() ?? '?'}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.commentMeta}>
                    <Text style={s.commentUser}>@{prof?.username ?? '?'}</Text>
                    <Text style={s.commentTime}>{timeAgo(c.created_at)}</Text>
                  </View>
                  <Text style={s.commentContent}>{c.content}</Text>
                </View>
              </View>
            );
          })}
          {/* Yorum input */}
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder="Yorum ekle..."
              placeholderTextColor={colors.textMuted}
              maxLength={280}
              returnKeyType="send"
              onSubmitEditing={submitComment}
            />
            <TouchableOpacity
              onPress={submitComment}
              disabled={commentBusy || !commentInput.trim()}
            >
              {commentBusy
                ? <ActivityIndicator color={colors.primary} size="small" />
                : <Text style={[s.sendBtn, !commentInput.trim() && { opacity: 0.3 }]}>➤</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 18 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 18 },
  actionCount: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  locBtn: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  locText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },

  commentsBox: {
    marginTop: 10, backgroundColor: '#f7f8f8',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  noComments: { padding: 12, fontSize: 13, color: colors.textMuted },
  comment: {
    flexDirection: 'row', gap: 10, padding: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  commentAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  commentAvatarImg: { width: 28, height: 28 },
  commentAvatarLetter: { color: '#fff', fontSize: 11, fontWeight: '900' },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  commentUser: { fontSize: 12, fontWeight: '800', color: colors.text },
  commentTime: { fontSize: 11, color: colors.textMuted },
  commentContent: { fontSize: 13, color: colors.text, lineHeight: 18 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: { flex: 1, fontSize: 14, color: colors.text },
  sendBtn: { fontSize: 20, color: colors.primary, fontWeight: '900' },
});
