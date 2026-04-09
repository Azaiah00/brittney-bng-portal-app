import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { DatePickerField } from '../components/DatePickerField';
import { createContactActivityLog, type ContactRef } from '../lib/data';
import { localDateTimeToIso } from '../lib/contactDueDate';

export default function AddContactLogScreen() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [occurredDate, setOccurredDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [occurredTime, setOccurredTime] = useState('12:00');
  const [saving, setSaving] = useState(false);

  const ref: ContactRef | null =
    type === 'lead' && id ? { kind: 'lead', id } : type === 'customer' && id ? { kind: 'customer', id } : null;

  const handleSave = async () => {
    if (!ref) {
      Alert.alert('Error', 'Missing contact.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    setSaving(true);
    try {
      const occurred_at = localDateTimeToIso(occurredDate, occurredTime);
      await createContactActivityLog({
        ...(ref.kind === 'lead'
          ? { lead_id: ref.id, customer_id: null }
          : { lead_id: null, customer_id: ref.id }),
        title: title.trim(),
        body: body.trim() || null,
        occurred_at,
        source_todo_id: null,
        source_note_id: null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save log.');
    } finally {
      setSaving(false);
    }
  };

  if (!ref) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 24, color: BNG_COLORS.accent }}>Invalid contact.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Meeting, call, email…"
          placeholderTextColor={BNG_COLORS.textMuted}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={body}
          onChangeText={setBody}
          placeholder="What was discussed, next steps…"
          placeholderTextColor={BNG_COLORS.textMuted}
          multiline
        />

        <DatePickerField label="When" value={occurredDate} onChange={setOccurredDate} />
        <Text style={styles.label}>Time</Text>
        <TextInput style={styles.input} value={occurredTime} onChangeText={setOccurredTime} />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save log</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BNG_COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
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
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: BNG_COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
