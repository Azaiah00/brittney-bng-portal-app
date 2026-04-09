import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../../lib/theme';
import { useBreakpoint, useResponsivePadding } from '../../../lib/hooks';
import {
  type ContactRef,
  fetchLead,
  fetchCustomer,
  fetchContactNotes,
  fetchContactMedia,
  fetchContactTodos,
  fetchContactActivityLogs,
  createContactMediaRow,
} from '../../../lib/data';
import { supabase } from '../../../lib/supabase';

export default function ContactHubScreen() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const bp = useBreakpoint();
  const horizontalPad = useResponsivePadding();
  const isDesktop = bp === 'desktop';
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Awaited<ReturnType<typeof fetchContactNotes>>>([]);
  const [media, setMedia] = useState<Awaited<ReturnType<typeof fetchContactMedia>>>([]);
  const [todos, setTodos] = useState<Awaited<ReturnType<typeof fetchContactTodos>>>([]);
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof fetchContactActivityLogs>>>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  const ref: ContactRef | null =
    type === 'lead' && id ? { kind: 'lead', id } : type === 'customer' && id ? { kind: 'customer', id } : null;

  const load = useCallback(async () => {
    if (!ref) return;
    setLoading(true);
    try {
      const contact = ref.kind === 'lead' ? await fetchLead(ref.id) : await fetchCustomer(ref.id);
      setName(contact?.name ?? 'Contact');
      const [n, m, t, l] = await Promise.all([
        fetchContactNotes(ref),
        fetchContactMedia(ref),
        fetchContactTodos(ref),
        fetchContactActivityLogs(ref),
      ]);
      setNotes(n);
      setMedia(m);
      setTodos(t);
      setLogs(l);
      const urls: Record<string, string> = {};
      for (const row of m) {
        const { data } = await supabase.storage.from('contact-media').createSignedUrl(row.storage_path, 3600);
        if (data?.signedUrl) urls[row.id] = data.signedUrl;
      }
      setThumbUrls(urls);
    } catch {
      Alert.alert('Error', 'Could not load contact hub.');
    } finally {
      setLoading(false);
    }
  }, [ref?.kind, ref?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openPicker = async () => {
    if (!ref) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Photo access is needed to attach images.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (r.canceled || !r.assets?.[0]) return;
    const asset = r.assets[0];
    const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
    const path = `${ref.kind}/${ref.id}/${Date.now()}.${ext}`;
    try {
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      const mime = asset.mimeType || 'image/jpeg';
      const { error: upErr } = await supabase.storage.from('contact-media').upload(path, blob, {
        contentType: mime,
        upsert: false,
      });
      if (upErr) throw upErr;
      await createContactMediaRow({
        ...(ref.kind === 'lead'
          ? { lead_id: ref.id, customer_id: null }
          : { lead_id: null, customer_id: ref.id }),
        storage_path: path,
        mime_type: mime,
        caption: null,
      });
      await load();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Try again.');
    }
  };

  if (!ref) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.err}>Invalid contact link.</Text>
      </SafeAreaView>
    );
  }

  const openTodos = todos.filter((t) => !t.completed_at).length;
  const editPath =
    ref.kind === 'lead'
      ? ({ pathname: '/edit-lead' as const, params: { id: ref.id } })
      : ({ pathname: '/edit-customer' as const, params: { id: ref.id } });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: horizontalPad },
          isDesktop && styles.scrollDesktop,
        ]}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={BNG_COLORS.primary} />
        ) : (
          <>
            <Text style={[styles.title, bp === 'mobile' && styles.titleMobile]}>{name}</Text>
            <Text style={styles.sub}>{ref.kind === 'lead' ? 'Lead' : 'Customer'} · Notes, media, to-dos, logs</Text>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push(editPath as any)}>
              <FontAwesome name="pencil" size={16} color={BNG_COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.outlineBtnText}>Edit contact fields</Text>
            </TouchableOpacity>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/contact-note-editor',
                      params: { type: ref.kind, id: ref.id },
                    } as any)
                  }
                >
                  <Text style={styles.link}>+ New</Text>
                </TouchableOpacity>
              </View>
              {notes.length === 0 ? (
                <Text style={styles.muted}>No notes yet. Create one for meeting prep and follow-ups.</Text>
              ) : (
                notes.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={styles.noteCard}
                    onPress={() =>
                      router.push({
                        pathname: '/contact-note-editor',
                        params: { type: ref.kind, id: ref.id, noteId: n.id },
                      } as any)
                    }
                  >
                    <Text style={styles.noteTitle} numberOfLines={1}>{n.title || 'Note'}</Text>
                    <Text style={styles.notePreview} numberOfLines={2}>{n.body || ' '}</Text>
                    <Text style={styles.noteDate}>
                      {new Date(n.updated_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Media</Text>
                <TouchableOpacity onPress={openPicker}>
                  <Text style={styles.link}>+ Photo</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mediaRow}>
                {media.length === 0 ? (
                  <Text style={styles.muted}>Add job site or inspiration photos.</Text>
                ) : (
                  media.map((m) => (
                    <View key={m.id} style={styles.thumbWrap}>
                      {thumbUrls[m.id] ? (
                        <Image source={{ uri: thumbUrls[m.id] }} style={styles.thumb} />
                      ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]} />
                      )}
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>To-dos</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: '/add-contact-todo', params: { type: ref.kind, id: ref.id } } as any)
                  }
                >
                  <Text style={styles.link}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.muted}>{openTodos} open</Text>
              {todos.slice(0, 5).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.rowItem}
                  onPress={() => router.push({ pathname: '/edit-contact-todo', params: { todoId: t.id } } as any)}
                >
                  <FontAwesome
                    name={t.completed_at ? 'check-circle' : 'circle-o'}
                    size={18}
                    color={t.completed_at ? BNG_COLORS.success : BNG_COLORS.textMuted}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle}>{t.title}</Text>
                    {t.due_at ? (
                      <Text style={styles.rowSub}>Due {new Date(t.due_at).toLocaleString()}</Text>
                    ) : null}
                  </View>
                  <FontAwesome name="chevron-right" size={12} color={BNG_COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Activity log</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: '/add-contact-log', params: { type: ref.kind, id: ref.id } } as any)
                  }
                >
                  <Text style={styles.link}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {logs.length === 0 ? (
                <Text style={styles.muted}>Record calls and meetings here.</Text>
              ) : (
                logs.slice(0, 6).map((l) => (
                  <View key={l.id} style={styles.logCard}>
                    <Text style={styles.rowTitle}>{l.title}</Text>
                    <Text style={styles.rowSub}>
                      {new Date(l.occurred_at).toLocaleString()}
                      {l.source_todo_id ? ' · from to-do' : l.source_note_id ? ' · from note' : ''}
                    </Text>
                    {l.body ? <Text style={styles.logBody} numberOfLines={3}>{l.body}</Text> : null}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BNG_COLORS.background },
  scroll: { paddingTop: 12, paddingBottom: 48 },
  scrollDesktop: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  err: { padding: 24, color: BNG_COLORS.accent },
  title: { fontSize: 26, fontWeight: '800', color: BNG_COLORS.text },
  titleMobile: { fontSize: 22 },
  sub: { fontSize: 15, color: BNG_COLORS.textSecondary, marginTop: 4, marginBottom: 16 },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.primary,
    marginBottom: 24,
  },
  outlineBtnText: { fontWeight: '600', color: BNG_COLORS.primary, fontSize: 15 },
  section: { marginBottom: 28 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.text },
  link: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.primary },
  muted: { fontSize: 14, color: BNG_COLORS.textMuted, lineHeight: 20 },
  noteCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...SHADOWS.sm,
  },
  noteTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text },
  notePreview: { fontSize: 15, color: BNG_COLORS.textSecondary, marginTop: 6, lineHeight: 22 },
  noteDate: { fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 8 },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: { width: 88, height: 88 },
  thumb: { width: 88, height: 88, borderRadius: 12 },
  thumbPlaceholder: { backgroundColor: BNG_COLORS.border },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: BNG_COLORS.text, flexShrink: 1 },
  rowSub: { fontSize: 13, color: BNG_COLORS.textMuted, marginTop: 2 },
  logCard: {
    backgroundColor: BNG_COLORS.surface,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  logBody: { fontSize: 14, color: BNG_COLORS.textSecondary, marginTop: 8, lineHeight: 20 },
});
