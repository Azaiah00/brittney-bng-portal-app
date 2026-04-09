import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Switch, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { DatePickerField } from '../components/DatePickerField';
import {
  fetchContactTodo,
  fetchLeads,
  fetchCustomers,
  updateContactTodo,
  deleteContactTodo,
  GENERAL_TODO_SECTION_TITLE,
  type ContactRef,
} from '../lib/data';
import { ContactPickerModal } from '../components/ContactPickerModal';
import {
  createDeviceCalendarEvent,
  updateDeviceCalendarEvent,
  removeDeviceCalendarEvent,
} from '../lib/calendar';
import { localDateTimeToIso, addOneHourIso } from '../lib/contactDueDate';
import { confirmAsync } from '../lib/confirmDialog';

function isoToDateAndTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '09:00' };
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const date = `${y}-${mo}-${day}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

export default function EditContactTodoScreen() {
  const router = useRouter();
  const { todoId } = useLocalSearchParams<{ todoId: string }>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [deviceEventId, setDeviceEventId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Current CRM assignment (nullable = general to-do).
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerLeads, setPickerLeads] = useState<{ id: string; name: string }[]>([]);
  const [pickerCustomers, setPickerCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!todoId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const t = await fetchContactTodo(todoId);
        if (cancelled || !t) return;
        setTitle(t.title);
        setDetails(t.details ?? '');
        const { date, time } = isoToDateAndTime(t.due_at);
        setDueDate(date);
        setDueTime(time);
        setDeviceEventId(t.device_calendar_event_id ?? null);
        setAddToCalendar(Platform.OS !== 'web' && !!t.device_calendar_event_id);
        setAssignLeadId(t.lead_id ?? null);
        setAssignCustomerId(t.customer_id ?? null);
      } catch {
        Alert.alert('Error', 'Could not load to-do.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [todoId]);

  // Lists for assign picker (loaded once; names stay fresh enough for this screen).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [leads, customers] = await Promise.all([fetchLeads(), fetchCustomers()]);
        if (cancelled) return;
        setPickerLeads(leads.map((l) => ({ id: l.id, name: l.name })));
        setPickerCustomers(customers.map((c) => ({ id: c.id, name: c.name })));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

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

  const openAssignPicker = useCallback(() => {
    setPickerVisible(true);
  }, []);

  const applyAssignment = async (ref: ContactRef) => {
    if (!todoId) return;
    try {
      await updateContactTodo(todoId, {
        lead_id: ref.kind === 'lead' ? ref.id : null,
        customer_id: ref.kind === 'customer' ? ref.id : null,
      });
      setAssignLeadId(ref.kind === 'lead' ? ref.id : null);
      setAssignCustomerId(ref.kind === 'customer' ? ref.id : null);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not update assignment.');
    }
  };

  const handleClearAssignment = async () => {
    if (!assignLeadId && !assignCustomerId) return;
    const ok = await confirmAsync({
      title: 'Clear contact assignment?',
      message: 'This to-do will move to General until you assign a contact again.',
      confirmText: 'Clear',
      destructive: true,
    });
    if (!ok || !todoId) return;
    try {
      if (Platform.OS !== 'web' && deviceEventId) {
        await removeDeviceCalendarEvent(deviceEventId);
      }
      await updateContactTodo(todoId, {
        lead_id: null,
        customer_id: null,
        device_calendar_event_id: null,
      });
      setAssignLeadId(null);
      setAssignCustomerId(null);
      setDeviceEventId(null);
      setAddToCalendar(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not clear assignment.');
    }
  };

  const handleSave = async () => {
    if (!todoId || !title.trim()) {
      Alert.alert('Required', 'Title is required.');
      return;
    }
    setSaving(true);
    try {
      const due_at =
        dueDate.length >= 10 ? localDateTimeToIso(dueDate, dueTime) : null;

      let nextCalId = deviceEventId;
      if (Platform.OS !== 'web' && due_at) {
        if (addToCalendar) {
          if (deviceEventId) {
            const upd = await updateDeviceCalendarEvent(
              deviceEventId,
              title.trim(),
              due_at,
              addOneHourIso(due_at),
              details.trim() || ''
            );
            nextCalId = upd ?? deviceEventId;
          } else {
            const id = await createDeviceCalendarEvent(
              title.trim(),
              due_at,
              addOneHourIso(due_at),
              details.trim() || ''
            );
            nextCalId = id;
          }
        } else if (deviceEventId) {
          await removeDeviceCalendarEvent(deviceEventId);
          nextCalId = null;
        }
      } else if (Platform.OS !== 'web' && deviceEventId && !due_at) {
        await removeDeviceCalendarEvent(deviceEventId);
        nextCalId = null;
      }

      await updateContactTodo(todoId, {
        title: title.trim(),
        details: details.trim() || null,
        due_at,
        device_calendar_event_id: nextCalId,
        lead_id: assignLeadId,
        customer_id: assignCustomerId,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmAsync({
      title: 'Delete to-do?',
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok || !todoId) return;
    try {
      if (deviceEventId) await removeDeviceCalendarEvent(deviceEventId);
      await deleteContactTodo(todoId);
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
        <Text style={styles.label}>Assigned to</Text>
        <Text style={styles.assignmentValue}>{assignmentLabel}</Text>
        <View style={styles.assignRow}>
          <TouchableOpacity style={styles.assignBtn} onPress={openAssignPicker}>
            <Text style={styles.assignBtnText}>
              {assignLeadId || assignCustomerId ? 'Change contact' : 'Assign to contact'}
            </Text>
          </TouchableOpacity>
          {(assignLeadId || assignCustomerId) ? (
            <TouchableOpacity style={styles.clearAssignBtn} onPress={handleClearAssignment}>
              <Text style={styles.clearAssignBtnText}>Clear assignment</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={BNG_COLORS.textMuted}
        />

        <Text style={styles.label}>Details</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={details}
          onChangeText={setDetails}
          multiline
          placeholderTextColor={BNG_COLORS.textMuted}
        />

        <DatePickerField label="Due date (optional)" value={dueDate} onChange={setDueDate} />

        <Text style={styles.label}>Due time</Text>
        <TextInput style={styles.input} value={dueTime} onChangeText={setDueTime} />

        {Platform.OS !== 'web' && dueDate.length >= 10 ? (
          <View style={styles.switchRow}>
            <FontAwesome name="calendar" size={18} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>On device calendar</Text>
              <Text style={styles.switchHint}>Apple Calendar on iPhone</Text>
            </View>
            <Switch value={addToCalendar} onValueChange={setAddToCalendar} />
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete to-do</Text>
        </TouchableOpacity>
      </ScrollView>

      <ContactPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(ref) => {
          void applyAssignment(ref);
        }}
        title="Assign to-do to contact"
        leads={pickerLeads}
        customers={pickerCustomers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BNG_COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
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
  label: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.textSecondary, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BNG_COLORS.text,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...SHADOWS.sm,
  },
  switchLabel: { fontSize: 16, fontWeight: '600', color: BNG_COLORS.text },
  switchHint: { fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 2 },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: BNG_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtn: { marginTop: 16, padding: 16, alignItems: 'center' },
  deleteBtnText: { color: BNG_COLORS.accent, fontWeight: '600', fontSize: 15 },
});
