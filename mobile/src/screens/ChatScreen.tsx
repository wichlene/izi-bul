import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { colors } from '../theme';

interface Msg {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function ChatScreen({ route, navigation }: any) {
  const { friendId, friendUsername } = route.params;
  const { session } = useAuth();
  const uid = session?.user.id;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: `@${friendUsername}` });
  }, [friendUsername]);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_user_id.eq.${uid},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${uid})`)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((data as Msg[]) || []);
    setLoading(false);
    // Mark as read
    supabase.from('messages').update({ is_read: true })
      .eq('from_user_id', friendId).eq('to_user_id', uid).eq('is_read', false)
      .then(() => {});
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [uid, friendId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`chat_${uid}_${friendId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Msg;
        if ((msg.from_user_id === uid && msg.to_user_id === friendId) ||
            (msg.from_user_id === friendId && msg.to_user_id === uid)) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, uid, friendId]);

  const send = async () => {
    if (!text.trim() || !uid) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      from_user_id: uid,
      to_user_id: friendId,
      content: text.trim(),
    });
    if (!error) setText('');
    setSending(false);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={s.empty}>Henüz mesaj yok. İlk mesajı gönder!</Text>}
        renderItem={({ item }) => {
          const mine = item.from_user_id === uid;
          return (
            <View style={[s.bubble, mine ? s.myBubble : s.theirBubble]}>
              <Text style={[s.bubbleText, mine && s.myText]}>{item.content}</Text>
              <Text style={[s.time, mine && { color: 'rgba(255,255,255,0.7)' }]}>
                {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Mesaj yaz..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          onSubmitEditing={send}
        />
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={sending || !text.trim()}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendText}>➤</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 12, marginBottom: 6 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#f0f2f4' },
  bubbleText: { fontSize: 15, color: colors.text },
  myText: { color: '#fff' },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#f0f2f4', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 18 },
});
