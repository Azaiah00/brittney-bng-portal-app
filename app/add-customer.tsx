// Add Customer screen: form to create a customer from scratch with lead source.

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { createCustomer } from '../lib/data';
import { LeadSourcePicker } from '../components/LeadSourcePicker';

export default function AddCustomerScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [projectType, setProjectType] = useState('');
  const [notes, setNotes] = useState('');
  const [leadSourceId, setLeadSourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Please enter the customer name.');
      return;
    }

    setSaving(true);
    try {
      await createCustomer({
        name: trimmedName,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        project_type: projectType.trim() || null,
        notes: notes.trim() || null,
        lead_source_id: leadSourceId,
        status: 'active',
      });
      Alert.alert('Customer Added', `"${trimmedName}" has been added.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save customer.');
    } finally {
      setSaving(false);
    }
  };

  const fields: { value: string; setValue: (s: string) => void; label: string; placeholder: string; icon: string }[] = [
    { value: name, setValue: setName, label: 'Name', placeholder: 'Full name', icon: 'user' },
    { value: phone, setValue: setPhone, label: 'Phone', placeholder: 'Phone number', icon: 'phone' },
    { value: email, setValue: setEmail, label: 'Email', placeholder: 'Email address', icon: 'envelope-o' },
    { value: address, setValue: setAddress, label: 'Address', placeholder: 'Property address', icon: 'map-marker' },
    { value: projectType, setValue: setProjectType, label: 'Project Type', placeholder: 'e.g. Kitchen Remodel', icon: 'home' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {fields.map((f) => (
          <View key={f.label} style={styles.fieldWrap}>
            <Text style={styles.label}>{f.label}</Text>
            <View style={styles.inputRow}>
              <View style={styles.iconWrap}>
                <FontAwesome name={f.icon as any} size={16} color={BNG_COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.setValue}
                placeholder={f.placeholder}
                placeholderTextColor={BNG_COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        ))}

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor={BNG_COLORS.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldWrap}>
          <LeadSourcePicker value={leadSourceId} onChange={setLeadSourceId} label="Lead source" />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <FontAwesome name="check" size={18} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Add Customer'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  fieldWrap: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: BNG_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    color: BNG_COLORS.text,
    fontWeight: '500',
  },
  notesInput: {
    minHeight: 88,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  saveButton: {
    backgroundColor: BNG_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
    ...Platform.select({
      ios: SHADOWS.glowPrimary,
      android: { elevation: 6 },
    }),
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
