import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import {
  fetchContactNote,
  createContactNote,
  updateContactNote,
  deleteContactNote,
  createContactActivityLog,
  fetchLeads,
  fetchCustomers,
  GENERAL_TODO_SECTION_TITLE,
  contactRefFromNote,
  type ContactRef,
  type ContactNoteRow,
} from '../lib/data';
import { confirmAsync } from '../lib/confirmDialog';
import { ContactPickerModal } from '../components/ContactPickerModal';

type PickerPurpose = null | 'assign' | 'post_log';

export default function ContactNoteEditorScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { type, id, noteId } = useLocalSearchParams<{ type?: string; id?: string; noteId?: string }>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(!!noteId);
  const [saving, setSaving] = useState(false);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState<string | null>(null);
  const [pickerPurpose, setPickerPurpose] = useState<PickerPurpose>(null);
  const [pendingLogNoteId, setPendingLogNoteId] = useState<string | null>(null);
  const [pickerLeads, setPickerLeads] = useState<{ id: string; name: string }[]>([]);
  const [pickerCustomers, setPickerCustomers] = useState<{ id: string; name: string }[]>([]);
  const logPickHandledRef = useRef(false);

  const isNew = !noteId;

  // New note: optional contact from URL (pick-contact). Otherwise General until user assigns.
  useEffect(() => {
    if (noteId) return;
    if (type === 'lead' && id) {
      setAssignLeadId(id);
      setAssignCustomerId(null);
    } else if (type === 'customer' && id) {
      setAssignLeadId(null);
      setAssignCustomerId(id);
    } else {
      setAssignLeadId(null);
      setAssignCustomerId(null);
    }
  }, [noteId, type, id]);

  useEffect(() => {
    if (!noteId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const n = await fetchContactNote(noteId);
        if (cancelled) return;
        if (!n) {
          Alert.alert('Error', 'Note not found.');
          router.back();
          return;
        }
        setTitle(n.title);
        setBody(n.body ?? '');
        setAssignLeadId(n.lead_id ?? null);
        setAssignCustomerId(n.customer_id ?? null);
      } catch {
        Alert.alert('Error', 'Could not load note.');
        router.back();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [leads, customers] = await Promise.all([fetchLeads(), fetchCustomers()]);
        if (cancelled) return;
        setPickerLeads(leads.map((l) => ({ id: l.id, name: l.name })));
        setPickerCustomers(customers.map((c) => ({ id: c.id, name: c.name })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveRefForCreate = useCallback((): ContactRef | null => {
    if (assignLeadId) return { kind: 'lead', id: assignLeadId };
    if (assignCustomerId) return { kind: 'customer', id: assignCustomerId };
    return null;
  }, [assignLeadId, assignCustomerId]);

  const assignmentLabel = (() => {
    if (assignLeadId) {
      const row = pickerLeads.find((l) => l.id === assignLeadId);
      return row?.name || 'Lead';
    }
    if (assignCustomerId) {
      const row = pickerCustomers.find((c) => c.id === assignCustomerId);
      return row?.name || 'Customer';
    }
    return GENERAL_TODO_SECTION_TITLE;
  })();

  const isGeneral = !assignLeadId && !assignCustomerId;

  useEffect(() => {
    navigation.setOptions({
      title: isNew
        ? isGeneral && !type
          ? 'New note'
          : 'New note for contact'
        : 'Edit note',
    });
  }, [isNew, isGeneral, type, navigation]);

  const openAssignPicker = useCallback(() => {
    setPickerPurpose('assign');
  }, []);

  const handleClearAssignment = async () => {
    if (!assignLeadId && !assignCustomerId) return;
    const ok = await confirmAsync({
      title: 'Clear contact assignment?',
      message: 'This note will move to General until you assign a contact again.',
      confirmText: 'Clear',
      destructive: true,
    });
    if (!ok) return;
    try {
      if (noteId) {
        await updateContactNote(noteId, { lead_id: null, customer_id: null });
      }
      setAssignLeadId(null);
      setAssignCustomerId(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not clear assignment.');
    }
  };

  const handlePickerSelect = async (ref: ContactRef) => {
    if (pickerPurpose === 'assign') {
      if (noteId) {
        try {
          await updateContactNote(noteId, {
            lead_id: ref.kind === 'lead' ? ref.id : null,
            customer_id: ref.kind === 'customer' ? ref.id : null,
          });
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'Could not update assignment.');
          setPickerPurpose(null);
          return;
        }
      }
      setAssignLeadId(ref.kind === 'lead' ? ref.id : null);
      setAssignCustomerId(ref.kind === 'customer' ? ref.id : null);
      setPickerPurpose(null);
      return;
    }

    if (pickerPurpose === 'post_log' && pendingLogNoteId) {
      logPickHandledRef.current = true;
      const nid = pendingLogNoteId;
      setPendingLogNoteId(null);
      setPickerPurpose(null);
      try {
        await updateContactNote(nid, {
          lead_id: ref.kind === 'lead' ? ref.id : null,
          customer_id: ref.kind === 'customer' ? ref.id : null,
        });
        const row = await fetchContactNote(nid);
        if (row) {
          const r = contactRefFromNote(row);
          if (r) {
            await createContactActivityLog({
              ...(r.kind === 'lead'
                ? { lead_id: r.id, customer_id: null }
                : { lead_id: null, customer_id: r.id }),
              title: `Note: ${row.title || 'Note'}`,
              body: row.body ?? null,
              occurred_at: new Date().toISOString(),
              source_todo_id: null,
              source_note_id: nid,
            });
          }
        }
        router.back();
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Could not save log.');
      } finally {
        logPickHandledRef.current = false;
      }
    }
  };

  const handlePickerClose = () => {
    // If user picked a row, onSelect set logPickHandledRef true — do not treat as cancel or clear ref here.
    if (pickerPurpose === 'post_log' && pendingLogNoteId && !logPickHandledRef.current) {
      Alert.alert(
        'Cannot add log',
        'Logs are saved per contact — assign a contact first, or skip adding a log.'
      );
      setPendingLogNoteId(null);
      router.back();
    }
    setPickerPurpose(null);
  };

  const handleSave = async () => {
    setSaving(true);
    let createdRow: ContactNoteRow | null = null;
    try {
      if (noteId) {
        await updateContactNote(noteId, {
          title: title.trim() || 'Note',
          body: body.trim() || null,
          lead_id: assignLeadId,
          customer_id: assignCustomerId,
        });
      } else {
        createdRow = await createContactNote(effectiveRefForCreate(), {
          title: title.trim() || 'Note',
          body: body.trim() || null,
        });
        setAssignLeadId(createdRow.lead_id ?? null);
        setAssignCustomerId(createdRow.customer_id ?? null);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save.');
      setSaving(false);
      return;
    }
    setSaving(false);

    if (!noteId && createdRow) {
      const addLog = await confirmAsync({
        title: 'Add to activity log?',
        message:
          'Save a permanent log entry on this contact from this note? You can skip and keep the note only.',
        confirmText: 'Yes, add to log',
        cancelText: 'Not now',
      });
      if (!addLog) {
        router.back();
        return;
      }
      const r = contactRefFromNote(createdRow);
      if (r) {
        try {
          await createContactActivityLog({
            ...(r.kind === 'lead'
              ? { lead_id: r.id, customer_id: null }
              : { lead_id: null, customer_id: r.id }),
            title: `Note: ${createdRow.title || 'Note'}`,
            body: createdRow.body ?? null,
            occurred_at: new Date().toISOString(),
            source_todo_id: null,
            source_note_id: createdRow.id,
          });
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'Could not create log.');
        }
        router.back();
        return;
      }
      logPickHandledRef.current = false;
      setPendingLogNoteId(createdRow.id);
      setPickerPurpose('post_log');
      return;
    }

    router.back();
  };

  const handleShare = async () => {
    const text = `${title.trim()}\n\n${body.trim()}`;
    try {
      await Share.share({ message: text, title: title.trim() || 'Note' });
    } catch {
      /* user dismissed */
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;
    const ok = await confirmAsync({
      title: 'Delete note?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteContactNote(noteId);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not delete.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={BNG_COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {isNew && isGeneral && !type ? (
          <Text style={styles.hint}>
            This note starts in &quot;{GENERAL_TODO_SECTION_TITLE}&quot;. Assign a contact anytime, or pick one when you add
            it to the activity log.
          </Text>
        ) : (
          <Text style={styles.hint}>Simple note — like Apple Notes. AI scratchpad is separate.</Text>
        )}

        <Text style={styles.label}>Assigned to</Text>
        <Text style={styles.assignmentValue}>{assignmentLabel}</Text>
        <View style={styles.assignRow}>
          <TouchableOpacity style={styles.assignBtn} onPress={openAssignPicker}>
            <Text style={styles.assignBtnText}>
              {assignLeadId || assignCustomerId ? 'Change contact' : 'Assign to contact'}
            </Text>
          </TouchableOpacity>
          {assignLeadId || assignCustomerId ? (
            <TouchableOpacity style={styles.clearAssignBtn} onPress={handleClearAssignment}>
              <Text style={styles.clearAssignBtnText}>Clear assignment</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={BNG_COLORS.textMuted}
        />

        <Text style={styles.label}>Body</Text>
        <TextInput
          style={styles.bodyInput}
          value={body}
          onChangeText={setBody}
          placeholder="Start typing…"
          placeholderTextColor={BNG_COLORS.textMuted}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.row}>
          {noteId ? (
            <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
              <FontAwesome name="trash-o" size={20} color={BNG_COLORS.accent} />
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <FontAwesome name="share-alt" size={20} color={BNG_COLORS.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>

      <ContactPickerModal
        visible={pickerPurpose !== null}
        onClose={handlePickerClose}
        onSelect={(ref) => {
          void handlePickerSelect(ref);
        }}
        title={pickerPurpose === 'post_log' ? 'Choose contact for log' : 'Assign note to contact'}
        leads={pickerLeads}
        customers={pickerCustomers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9F9F9' },
  scroll: { padding: 20, paddingBottom: 48 },
  hint: {
    fontSize: 13,
    color: BNG_COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: BNG_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  assignmentValue: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 10 },
  assignRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  assignBtn: {
    backgroundColor: BNG_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 8,
  },
  assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  clearAssignBtn: { paddingVertical: 10, paddingHorizontal: 12, justifyContent: 'center' },
  clearAssignBtnText: { color: BNG_COLORS.accent, fontWeight: '600', fontSize: 15 },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: BNG_COLORS.text,
    paddingVertical: 8,
    marginBottom: 16,
  },
  bodyInput: {
    minHeight: Platform.OS === 'web' ? 320 : 240,
    fontSize: 17,
    lineHeight: 26,
    color: BNG_COLORS.text,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 },
  iconBtn: { padding: 12 },
  saveBtn: {
    backgroundColor: BNG_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
