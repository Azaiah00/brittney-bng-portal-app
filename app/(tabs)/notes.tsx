import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useBreakpoint, useResponsivePadding } from '../../lib/hooks';
import {
  fetchAllContactNotes,
  fetchLeads,
  fetchCustomers,
  groupContactNotesByContact,
  GENERAL_TODO_SECTION_TITLE,
  type ContactNoteRow,
} from '../../lib/data';

type NoteFilter = 'all' | 'general' | 'with_contact';

export default function ContactNotesTabScreen() {
  const router = useRouter();
  const hPad = useResponsivePadding();
  const bp = useBreakpoint();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [notes, setNotes] = useState<ContactNoteRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, leads, customers] = await Promise.all([
        fetchAllContactNotes(),
        fetchLeads(),
        fetchCustomers(),
      ]);
      setNotes(all);
      const map: Record<string, string> = {};
      leads.forEach((l) => {
        map[`lead:${l.id}`] = l.name;
      });
      customers.forEach((c) => {
        map[`customer:${c.id}`] = c.name;
      });
      setNames(map);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const labelFor = (n: ContactNoteRow) => {
    if (n.lead_id) return names[`lead:${n.lead_id}`] || 'Lead';
    if (n.customer_id) return names[`customer:${n.customer_id}`] || 'Customer';
    return GENERAL_TODO_SECTION_TITLE;
  };

  const afterFilter = useMemo(() => {
    if (filter === 'general') return notes.filter((n) => !n.lead_id && !n.customer_id);
    if (filter === 'with_contact') return notes.filter((n) => !!n.lead_id || !!n.customer_id);
    return notes;
  }, [notes, filter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return afterFilter;
    return afterFilter.filter((n) => {
      const contactName =
        n.lead_id ? names[`lead:${n.lead_id}`] || '' : n.customer_id ? names[`customer:${n.customer_id}`] || '' : '';
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q) ||
        contactName.toLowerCase().includes(q) ||
        (!n.lead_id && !n.customer_id && GENERAL_TODO_SECTION_TITLE.toLowerCase().includes(q))
      );
    });
  }, [afterFilter, query, names]);

  const sections = useMemo(() => groupContactNotesByContact(filtered, names), [filtered, names]);

  const openNote = (n: ContactNoteRow) => {
    router.push({ pathname: '/contact-note-editor', params: { noteId: n.id } } as any);
  };

  const chip = (key: NoteFilter, label: string) => {
    const on = filter === key;
    return (
      <TouchableOpacity
        key={key}
        style={[styles.chip, on && styles.chipOn]}
        onPress={() => setFilter(key)}
        activeOpacity={0.85}
      >
        <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: ContactNoteRow }) => (
    <TouchableOpacity style={styles.card} onPress={() => openNote(item)} activeOpacity={0.9}>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title || 'Note'}
      </Text>
      <Text style={styles.cardContact}>{labelFor(item)}</Text>
      <Text style={styles.cardPreview} numberOfLines={2}>
        {item.body || ' '}
      </Text>
      <Text style={styles.cardDate}>
        Updated {new Date(item.updated_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <Text style={[styles.title, bp === 'mobile' && styles.titleMobile]}>Notes</Text>
        <Text style={styles.sub}>
          General and per-contact notes (sections A–Z by contact). Same data as on each contact.
        </Text>
      </View>

      <View style={[styles.searchWrap, { marginHorizontal: hPad }]}>
        <FontAwesome name="search" size={16} color={BNG_COLORS.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={BNG_COLORS.textMuted}
        />
      </View>

      <View style={[styles.chipsRow, { paddingHorizontal: hPad }]}>
        {chip('all', 'All')}
        {chip('general', 'General')}
        {chip('with_contact', 'With contact')}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={BNG_COLORS.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <FontAwesome name="sticky-note-o" size={48} color={BNG_COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No notes</Text>
          <Text style={styles.emptyText}>
            Capture meeting prep and follow-ups in General or on a contact&apos;s hub.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setAddMenuVisible(true)}>
            <Text style={styles.emptyBtnText}>Add note</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: 100 }}
        />
      )}

      {filtered.length > 0 || loading ? (
        <TouchableOpacity style={styles.fab} onPress={() => setAddMenuVisible(true)}>
          <FontAwesome name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      ) : null}

      <Modal visible={addMenuVisible} animationType="fade" transparent onRequestClose={() => setAddMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setAddMenuVisible(false)}>
          <View style={styles.addMenuBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.addMenuSheet, { maxWidth: 480 }]}>
                <Text style={styles.addMenuTitle}>New note</Text>
                <Text style={styles.addMenuSubtitle}>Start in General or tie to one contact.</Text>
                <TouchableOpacity
                  style={styles.addMenuPrimary}
                  onPress={() => {
                    setAddMenuVisible(false);
                    router.push('/contact-note-editor' as any);
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addMenuPrimaryText}>General</Text>
                  <Text style={styles.addMenuHint}>Not linked to one contact yet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addMenuPrimary}
                  onPress={() => {
                    setAddMenuVisible(false);
                    router.push({ pathname: '/pick-contact', params: { for: 'note' } } as any);
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addMenuPrimaryText}>For a contact</Text>
                  <Text style={styles.addMenuHint}>Pick lead or customer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addMenuCancel} onPress={() => setAddMenuVisible(false)}>
                  <Text style={styles.addMenuCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BNG_COLORS.background },
  header: { paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: BNG_COLORS.text },
  titleMobile: { fontSize: 24 },
  sub: { fontSize: 15, color: BNG_COLORS.textSecondary, marginTop: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  search: { flex: 1, height: 44, fontSize: 16, color: BNG_COLORS.text },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: BNG_COLORS.surface,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOn: {
    backgroundColor: `${BNG_COLORS.primary}22`,
    borderColor: BNG_COLORS.primary,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.textSecondary },
  chipTextOn: { color: BNG_COLORS.primary },
  sectionHeader: {
    backgroundColor: BNG_COLORS.background,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: BNG_COLORS.textMuted, letterSpacing: 0.5 },
  card: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text },
  cardContact: { fontSize: 14, color: BNG_COLORS.primary, fontWeight: '600', marginTop: 6 },
  cardPreview: { fontSize: 15, color: BNG_COLORS.textSecondary, marginTop: 8, lineHeight: 22 },
  cardDate: { fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 8 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: BNG_COLORS.info, marginTop: 16 },
  emptyText: { fontSize: 15, color: BNG_COLORS.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: BNG_COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BNG_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  addMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  addMenuSheet: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.lg,
  },
  addMenuTitle: { fontSize: 20, fontWeight: '800', color: BNG_COLORS.text, marginBottom: 6 },
  addMenuSubtitle: { fontSize: 14, color: BNG_COLORS.textSecondary, marginBottom: 18, lineHeight: 20 },
  addMenuPrimary: {
    backgroundColor: BNG_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  addMenuPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  addMenuHint: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  addMenuCancel: { alignItems: 'center', paddingVertical: 14 },
  addMenuCancelText: { fontSize: 16, fontWeight: '600', color: BNG_COLORS.textMuted },
});
