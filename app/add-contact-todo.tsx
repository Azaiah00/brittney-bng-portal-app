import React, { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Switch, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { DatePickerField } from '../components/DatePickerField';
import { createContactTodo, updateContactTodo, type ContactRef, GENERAL_TODO_SECTION_TITLE } from '../lib/data';
import { createDeviceCalendarEvent } from '../lib/calendar';
import { localDateTimeToIso, addOneHourIso } from '../lib/contactDueDate';

export default function AddContactTodoScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [addToCalendar, setAddToCalendar] = useState(Platform.OS !== 'web');
  const [saving, setSaving] = useState(false);

  // Contact-specific when type+id are set; otherwise organization-wide general to-do.
  const ref: ContactRef | null =
    type === 'lead' && id ? { kind: 'lead', id } : type === 'customer' && id ? { kind: 'customer', id } : null;
  const isGeneral = !ref;

  // Header: general org to-do vs tied to the contact you picked.
  useEffect(() => {
    navigation.setOptions({
      title: isGeneral ? 'New to-do' : 'New to-do for contact',
    });
  }, [isGeneral, navigation]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }

    setSaving(true);
    try {
      const due_at =
        dueDate.length >= 10 ? localDateTimeToIso(dueDate, dueTime) : null;

      const row = ref
        ? {
            ...(ref.kind === 'lead'
              ? { lead_id: ref.id, customer_id: null as null }
              : { lead_id: null as null, customer_id: ref.id }),
            title: title.trim(),
            details: details.trim() || null,
            due_at,
            completed_at: null,
            device_calendar_event_id: null as string | null,
          }
        : {
            lead_id: null as null,
            customer_id: null as null,
            title: title.trim(),
            details: details.trim() || null,
            due_at,
            completed_at: null,
            device_calendar_event_id: null as string | null,
          };

      const todo = await createContactTodo(row);

      let calId: string | null = null;
      if (Platform.OS !== 'web' && addToCalendar && due_at) {
        calId = await createDeviceCalendarEvent(
          title.trim(),
          due_at,
          addOneHourIso(due_at),
          details.trim() || ''
        );
        if (calId) {
          await updateContactTodo(todo.id, { device_calendar_event_id: calId });
        }
      }

      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save to-do.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {isGeneral ? (
          <Text style={styles.scopeHint}>
            This to-do is saved under "{GENERAL_TODO_SECTION_TITLE}" — not tied to one contact. You can assign it when
            you mark it complete.
          </Text>
        ) : (
          <Text style={styles.scopeHint}>This to-do is linked to one contact and appears on their hub.</Text>
        )}

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Follow up call, site visit…"
          placeholderTextColor={BNG_COLORS.textMuted}
        />

        <Text style={styles.label}>Details</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={details}
          onChangeText={setDetails}
          placeholder="Optional notes"
          placeholderTextColor={BNG_COLORS.textMuted}
          multiline
        />

        <DatePickerField label="Due date (optional)" value={dueDate} onChange={setDueDate} />

        <Text style={styles.label}>Due time</Text>
        <TextInput
          style={styles.input}
          value={dueTime}
          onChangeText={setDueTime}
          placeholder="09:00"
          placeholderTextColor={BNG_COLORS.textMuted}
        />

        {Platform.OS !== 'web' && dueDate.length >= 10 ? (
          <View style={styles.switchRow}>
            <FontAwesome name="calendar" size={18} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Add to device calendar</Text>
              <Text style={styles.switchHint}>Saves to Apple Calendar on iPhone</Text>
            </View>
            <Switch value={addToCalendar} onValueChange={setAddToCalendar} />
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save To-Do</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BNG_COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  // Explains general vs contact-linked so users know where the task will appear.
  scopeHint: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
    padding: 12,
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
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
});
