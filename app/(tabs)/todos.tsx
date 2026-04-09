import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useBreakpoint, useResponsivePadding } from '../../lib/hooks';
import {
  fetchAllContactTodos,
  fetchLeads,
  fetchCustomers,
  updateContactTodo,
  createContactActivityLog,
  contactRefFromTodo,
  fetchContactTodo,
  groupContactTodosByContact,
  GENERAL_TODO_SECTION_TITLE,
  type ContactRef,
} from '../../lib/data';
import { confirmAsync } from '../../lib/confirmDialog';
import { ContactPickerModal } from '../../components/ContactPickerModal';
import { Database } from '../../types/database';

type TodoRow = Database['public']['Tables']['contact_todos']['Row'];

type TodoFilter = 'all' | 'general' | 'with_contact';

export default function ContactTodosTabScreen() {
  const router = useRouter();
  const hPad = useResponsivePadding();
  const bp = useBreakpoint();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  /** When set, user chose “Choose contact” before complete; picker assigns then runs log flow. */
  const [pendingCompleteTodo, setPendingCompleteTodo] = useState<TodoRow | null>(null);
  const assignPickHandledRef = useRef(false);
  /** RN Web does not run Alert.alert multi-button onPress; use this sheet instead (all platforms). */
  const [addTodoMenuVisible, setAddTodoMenuVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, leads, customers] = await Promise.all([
        fetchAllContactTodos(),
        fetchLeads(),
        fetchCustomers(),
      ]);
      setTodos(all);
      const map: Record<string, string> = {};
      leads.forEach((l) => {
        map[`lead:${l.id}`] = l.name;
      });
      customers.forEach((c) => {
        map[`customer:${c.id}`] = c.name;
      });
      setNames(map);
    } catch {
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const labelFor = (t: TodoRow) => {
    if (t.lead_id) return names[`lead:${t.lead_id}`] || 'Lead';
    if (t.customer_id) return names[`customer:${t.customer_id}`] || 'Customer';
    return GENERAL_TODO_SECTION_TITLE;
  };

  const pickerLeads = useMemo(
    () =>
      Object.entries(names)
        .filter(([k]) => k.startsWith('lead:'))
        .map(([k, name]) => ({ id: k.replace(/^lead:/, ''), name })),
    [names]
  );
  const pickerCustomers = useMemo(
    () =>
      Object.entries(names)
        .filter(([k]) => k.startsWith('customer:'))
        .map(([k, name]) => ({ id: k.replace(/^customer:/, ''), name })),
    [names]
  );

  const afterFilter = useMemo(() => {
    if (filter === 'general') return todos.filter((t) => !t.lead_id && !t.customer_id);
    if (filter === 'with_contact') return todos.filter((t) => !!t.lead_id || !!t.customer_id);
    return todos;
  }, [todos, filter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return afterFilter;
    return afterFilter.filter((t) => {
      const contactName =
        t.lead_id ? names[`lead:${t.lead_id}`] || '' : t.customer_id ? names[`customer:${t.customer_id}`] || '' : '';
      return (
        t.title.toLowerCase().includes(q) ||
        (t.details || '').toLowerCase().includes(q) ||
        contactName.toLowerCase().includes(q) ||
        (!t.lead_id && !t.customer_id && GENERAL_TODO_SECTION_TITLE.toLowerCase().includes(q))
      );
    });
  }, [afterFilter, query, names]);

  // Sections: General first, then contacts A–Z (see groupContactTodosByContact).
  const sections = useMemo(
    () => groupContactTodosByContact(filtered, names),
    [filtered, names]
  );

  const openNewTodoMenu = useCallback(() => {
    setAddTodoMenuVisible(true);
  }, []);

  const closeAddTodoMenu = useCallback(() => {
    setAddTodoMenuVisible(false);
  }, []);

  const goGeneralTodo = useCallback(() => {
    closeAddTodoMenu();
    router.push('/add-contact-todo' as any);
  }, [closeAddTodoMenu, router]);

  const goPickContactForTodo = useCallback(() => {
    closeAddTodoMenu();
    router.push({ pathname: '/pick-contact', params: { for: 'todo' } } as any);
  }, [closeAddTodoMenu, router]);

  const openTodo = (t: TodoRow) => {
    router.push({ pathname: '/edit-contact-todo', params: { todoId: t.id } } as any);
  };

  const finishCompleteLogFlow = useCallback(
    async (t: TodoRow) => {
      const addLog = await confirmAsync({
        title: 'Add completion to activity log?',
        message:
          'Save a permanent log entry on this contact from this to-do when you mark it complete? You can skip and only check it off.',
        confirmText: 'Yes, add to log',
        cancelText: 'Just complete',
      });

      const now = new Date().toISOString();
      try {
        if (addLog) {
          const ref = contactRefFromTodo(t);
          if (!ref) {
            Alert.alert(
              'Cannot add log',
              'Logs are saved per contact—assign a contact first.'
            );
          } else {
            const bodyParts = [
              t.details?.trim(),
              t.due_at ? `Due: ${new Date(t.due_at).toLocaleString()}` : '',
            ].filter(Boolean);
            await createContactActivityLog({
              ...(ref.kind === 'lead'
                ? { lead_id: ref.id, customer_id: null }
                : { lead_id: null, customer_id: ref.id }),
              title: `Completed: ${t.title}`,
              body: bodyParts.join('\n\n') || null,
              occurred_at: now,
              source_todo_id: t.id,
              source_note_id: null,
            });
          }
        }
        await updateContactTodo(t.id, { completed_at: now });
        await load();
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Could not update.');
      }
    },
    [load]
  );

  const markComplete = useCallback(
    async (t: TodoRow) => {
      const hasContact = !!contactRefFromTodo(t);
      if (hasContact) {
        await finishCompleteLogFlow(t);
        return;
      }

      const wantAssign = await confirmAsync({
        title: 'Assign to a contact?',
        message:
          'Assign this to-do to a lead or customer now, or skip and leave it in General.',
        confirmText: 'Choose contact',
        cancelText: 'Skip',
      });

      if (wantAssign) {
        assignPickHandledRef.current = false;
        setPendingCompleteTodo(t);
        setPickerVisible(true);
        return;
      }

      await finishCompleteLogFlow(t);
    },
    [finishCompleteLogFlow]
  );

  const handlePickerSelect = useCallback(
    async (ref: ContactRef) => {
      assignPickHandledRef.current = true;
      const hold = pendingCompleteTodo;
      setPendingCompleteTodo(null);
      setPickerVisible(false);
      if (!hold) {
        assignPickHandledRef.current = false;
        return;
      }
      try {
        await updateContactTodo(hold.id, {
          lead_id: ref.kind === 'lead' ? ref.id : null,
          customer_id: ref.kind === 'customer' ? ref.id : null,
        });
        const fresh = await fetchContactTodo(hold.id);
        await finishCompleteLogFlow(fresh ?? hold);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Could not assign or complete.');
      } finally {
        assignPickHandledRef.current = false;
      }
    },
    [pendingCompleteTodo, finishCompleteLogFlow]
  );

  // Modal X/back: if user skipped picking, continue complete flow unassigned. If they tapped a row,
  // onSelect set assignPickHandledRef first — do not run finish here or clear that ref (picker async does).
  const handlePickerClose = useCallback(() => {
    setPickerVisible(false);
    if (assignPickHandledRef.current) {
      setPendingCompleteTodo(null);
      return;
    }
    if (pendingCompleteTodo) {
      const hold = pendingCompleteTodo;
      setPendingCompleteTodo(null);
      void finishCompleteLogFlow(hold);
    }
  }, [pendingCompleteTodo, finishCompleteLogFlow]);

  const renderItem = ({ item }: { item: TodoRow }) => {
    const done = !!item.completed_at;
    return (
      <TouchableOpacity
        style={[styles.card, done && styles.cardDone]}
        onPress={() => openTodo(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardTop}>
          <TouchableOpacity
            onPress={() => {
              if (!done) markComplete(item);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FontAwesome
              name={done ? 'check-circle' : 'circle-o'}
              size={22}
              color={done ? BNG_COLORS.success : BNG_COLORS.primary}
            />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>{item.title}</Text>
            <Text style={styles.cardContact}>{labelFor(item)}</Text>
            {item.due_at ? (
              <Text style={styles.cardDue}>Due {new Date(item.due_at).toLocaleString()}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const chip = (key: TodoFilter, label: string) => {
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <Text style={[styles.title, bp === 'mobile' && styles.titleMobile]}>To-dos</Text>
        <Text style={styles.sub}>General tasks and per-contact follow-ups (sections A–Z by contact)</Text>
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
          <FontAwesome name="check-square-o" size={48} color={BNG_COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No To-dos</Text>
          <Text style={styles.emptyText}>
            Keep track of upcoming tasks in General or on a contact&apos;s hub.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openNewTodoMenu}>
            <Text style={styles.emptyBtnText}>Add To-do</Text>
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
        <TouchableOpacity style={styles.fab} onPress={openNewTodoMenu}>
          <FontAwesome name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      ) : null}

      <ContactPickerModal
        visible={pickerVisible}
        onClose={handlePickerClose}
        onSelect={(ref) => {
          void handlePickerSelect(ref);
        }}
        title="Assign to-do to contact"
        leads={pickerLeads}
        customers={pickerCustomers}
      />

      <Modal
        visible={addTodoMenuVisible}
        animationType="fade"
        transparent
        onRequestClose={closeAddTodoMenu}
      >
        <TouchableWithoutFeedback onPress={closeAddTodoMenu}>
          <View style={styles.addMenuBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.addMenuSheet, { maxWidth: 480 }]}>
                <Text style={styles.addMenuTitle}>New to-do</Text>
                <Text style={styles.addMenuSubtitle}>
                  Save under General or tie to one contact.
                </Text>
                <TouchableOpacity style={styles.addMenuPrimary} onPress={goGeneralTodo} activeOpacity={0.9}>
                  <Text style={styles.addMenuPrimaryText}>General</Text>
                  <Text style={styles.addMenuHint}>Not linked to one contact yet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addMenuPrimary}
                  onPress={goPickContactForTodo}
                  activeOpacity={0.9}
                >
                  <Text style={styles.addMenuPrimaryText}>For a contact</Text>
                  <Text style={styles.addMenuHint}>Pick lead or customer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addMenuCancel} onPress={closeAddTodoMenu}>
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
  cardDone: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text },
  cardTitleDone: { textDecorationLine: 'line-through', color: BNG_COLORS.textMuted },
  cardContact: { fontSize: 14, color: BNG_COLORS.primary, fontWeight: '600', marginTop: 4 },
  cardDue: { fontSize: 13, color: BNG_COLORS.textMuted, marginTop: 4 },
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
