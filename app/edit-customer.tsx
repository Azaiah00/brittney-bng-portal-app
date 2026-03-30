// Edit Customer: load customer by id, same form as Add Customer, save updates and optional delete.

import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS } from '../lib/theme';
import { fetchCustomer, updateCustomer, deleteCustomer } from '../lib/data';
import { LeadSourcePicker } from '../components/LeadSourcePicker';
import { confirmAsync } from '../lib/confirmDialog';

function buildAddress(parts: {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
}): string | null {
  const { addressLine1, addressLine2, city, state, zipCode } = parts;
  const partsArr = [
    addressLine1.trim(),
    addressLine2.trim(),
    [city.trim(), state.trim(), zipCode.trim()].filter(Boolean).join(', '),
  ].filter(Boolean);
  return partsArr.length > 0 ? partsArr.join(', ') : null;
}

export default function EditCustomerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(!!id);
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [projectType, setProjectType] = useState('');
  const [notes, setNotes] = useState('');
  const [leadSourceId, setLeadSourceId] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'completed'>('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const customer = await fetchCustomer(id);
        if (cancelled || !customer) return;
        setCompanyName(customer.company_name ?? '');
        const fn = customer.first_name ?? customer.name.split(' ')[0] ?? '';
        const ln = customer.last_name ?? customer.name.split(' ').slice(1).join(' ') ?? '';
        setFirstName(fn);
        setLastName(ln);
        setPhone(customer.phone ?? '');
        setEmail(customer.email ?? '');
        setAlternateEmail(customer.alternate_email ?? '');
        setAddressLine1(customer.address_line_1 ?? '');
        setAddressLine2(customer.address_line_2 ?? '');
        setCity(customer.city ?? '');
        setState(customer.state ?? '');
        setZipCode(customer.zip_code ?? '');
        setProjectType(customer.project_type ?? '');
        setNotes(customer.notes ?? '');
        setLeadSourceId(customer.lead_source_id);
        setStatus(customer.status);
      } catch {
        if (!cancelled) Alert.alert('Error', 'Could not load customer.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      Alert.alert('Required', 'Please enter both first name and last name.');
      return;
    }
    if (!id) return;
    const fullName = `${fn} ${ln}`.trim();
    const address = buildAddress({ addressLine1, addressLine2, city, state, zipCode });
    setSaving(true);
    try {
      await updateCustomer(id, {
        name: fullName,
        first_name: fn,
        last_name: ln,
        company_name: companyName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        alternate_email: alternateEmail.trim() || null,
        address: address ?? null,
        address_line_1: addressLine1.trim() || null,
        address_line_2: addressLine2.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip_code: zipCode.trim() || null,
        project_type: projectType.trim() || null,
        notes: notes.trim() || null,
        lead_source_id: leadSourceId,
        status,
      });
      router.replace('/leads' as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save customer.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmAsync({
      title: 'Delete Customer?',
      message: 'This cannot be undone. Linked projects will keep the link but the customer record will be removed.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCustomer(id!);
      router.replace('/leads' as any);
    } catch {
      Alert.alert('Error', 'Could not delete customer.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BNG_COLORS.primary} />
      </View>
    );
  }

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
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Company Name (optional)</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconWrap}>
              <FontAwesome name="building" size={16} color={BNG_COLORS.primary} />
            </View>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Company or business name"
              placeholderTextColor={BNG_COLORS.textMuted}
              autoCapitalize="words"
            />
          </View>
        </View>
        <View style={styles.nameRow}>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>First Name *</Text>
            <View style={styles.inputRow}>
              <View style={styles.iconWrap}>
                <FontAwesome name="user" size={16} color={BNG_COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={BNG_COLORS.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>Last Name *</Text>
            <View style={styles.inputRow}>
              <View style={styles.iconWrap}>
                <FontAwesome name="user" size={16} color={BNG_COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={BNG_COLORS.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconWrap}>
              <FontAwesome name="phone" size={16} color={BNG_COLORS.primary} />
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={BNG_COLORS.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconWrap}>
              <FontAwesome name="envelope-o" size={16} color={BNG_COLORS.primary} />
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Primary email"
              placeholderTextColor={BNG_COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Alternate Email (optional)</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconWrap}>
              <FontAwesome name="envelope" size={16} color={BNG_COLORS.primary} />
            </View>
            <TextInput
              style={styles.input}
              value={alternateEmail}
              onChangeText={setAlternateEmail}
              placeholder="Secondary email"
              placeholderTextColor={BNG_COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
        <Text style={styles.sectionLabel}>Address</Text>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Address Line 1</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconWrap}>
              <FontAwesome name="map-marker" size={16} color={BNG_COLORS.primary} />
            </View>
            <TextInput
              style={styles.input}
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="Street address"
              placeholderTextColor={BNG_COLORS.textMuted}
              autoCapitalize="words"
            />
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Address Line 2 (optional)</Text>
          <View style={styles.inputRow}>
            <View style={[styles.iconWrap, { opacity: 0.6 }]}>
              <FontAwesome name="map-marker" size={16} color={BNG_COLORS.primary} />
            </View>
            <TextInput
              style={styles.input}
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Apt, suite, unit, etc."
              placeholderTextColor={BNG_COLORS.textMuted}
              autoCapitalize="words"
            />
          </View>
        </View>
        <View style={styles.addressRow}>
          <View style={[styles.fieldWrap, { flex: 2 }]}>
            <Text style={styles.label}>City</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { paddingLeft: 14 }]}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={BNG_COLORS.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>State</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { paddingLeft: 14 }]}
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor={BNG_COLORS.textMuted}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>Zip</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { paddingLeft: 14 }]}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Zip"
                placeholderTextColor={BNG_COLORS.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Project Type</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconWrap}>
              <FontAwesome name="home" size={16} color={BNG_COLORS.primary} />
            </View>
            <TextInput
              style={styles.input}
              value={projectType}
              onChangeText={setProjectType}
              placeholder="e.g. Kitchen Remodel"
              placeholderTextColor={BNG_COLORS.textMuted}
              autoCapitalize="words"
            />
          </View>
        </View>
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
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[styles.statusChip, status === 'active' && styles.statusChipActive]}
              onPress={() => setStatus('active')}
            >
              <Text style={[styles.statusChipText, status === 'active' && styles.statusChipTextActive]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusChip, status === 'completed' && styles.statusChipActive]}
              onPress={() => setStatus('completed')}
            >
              <Text style={[styles.statusChipText, status === 'completed' && styles.statusChipTextActive]}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <FontAwesome name="check" size={18} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <FontAwesome name="trash-o" size={18} color={BNG_COLORS.accent} style={{ marginRight: 10 }} />
          <Text style={styles.deleteButtonText}>Delete Customer</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BNG_COLORS.background },
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
  sectionLabel: { fontSize: 14, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 12, marginTop: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...Platform.select({ ios: { shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 } }),
  },
  iconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    color: BNG_COLORS.text,
    fontWeight: '500',
  },
  nameRow: { flexDirection: 'row', gap: 12 },
  addressRow: { flexDirection: 'row', gap: 12 },
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
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BNG_COLORS.surface,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  statusChipActive: { backgroundColor: BNG_COLORS.primary, borderColor: BNG_COLORS.primary },
  statusChipText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  statusChipTextActive: { color: '#FFF' },
  saveButton: {
    backgroundColor: BNG_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
    ...Platform.select({
      ios: { shadowColor: BNG_COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BNG_COLORS.accent,
  },
  deleteButtonText: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.accent },
});
