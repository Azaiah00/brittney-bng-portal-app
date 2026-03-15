import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { createProject, fetchLeads, fetchCustomers } from '../lib/data';

// Unified contact: lead or customer, for linking projects to who they belong to
type ContactOption = { id: string; name: string; address?: string | null; type: 'lead' | 'customer' };

export default function AddProjectScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [phase, setPhase] = useState('Planning');
  const [startDate, setStartDate] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchLeads(), fetchCustomers()])
      .then(([leadsData, customersData]) => {
        const leadContacts: ContactOption[] = leadsData.map((l) => ({
          id: l.id,
          name: l.name,
          address: l.address ?? null,
          type: 'lead',
        }));
        const customerContacts: ContactOption[] = customersData.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address ?? null,
          type: 'customer',
        }));
        setContacts([...leadContacts, ...customerContacts]);
      })
      .catch(() => {});
  }, []);

  const PHASES = ['Planning', 'Contract', 'Demo', 'Rough-in', 'Finish', 'Punch List'];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a project title.');
      return;
    }
    setSaving(true);
    try {
      await createProject({
        title: title.trim(),
        address: address.trim() || null,
        budget: budget ? parseFloat(budget.replace(/[^0-9.]/g, '')) : null,
        phase,
        start_date: startDate || null,
        lead_id: selectedContact?.type === 'lead' ? selectedContact.id : null,
        customer_id: selectedContact?.type === 'customer' ? selectedContact.id : null,
        status: 'active',
        progress: 0,
      });
      Alert.alert('Project Created', `"${title}" has been added.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={18} color={BNG_COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Project</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Form */}
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.label}>Project Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Smith Kitchen Remodel"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          {/* Link to Contact (lead or customer) — connects project to who it's for */}
          <Text style={styles.label}>Link to Contact (optional)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowContactPicker(!showContactPicker)}
          >
            <Text style={{ color: selectedContact ? BNG_COLORS.text : BNG_COLORS.textMuted, fontSize: 16 }}>
              {selectedContact
                ? `${selectedContact.name} — ${selectedContact.type === 'lead' ? 'Lead' : 'Customer'}`
                : 'Select a contact (lead or customer)...'}
            </Text>
          </TouchableOpacity>
          {showContactPicker && (
            <View style={styles.pickerList}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => { setSelectedContact(null); setShowContactPicker(false); }}
              >
                <Text style={styles.pickerText}>— None —</Text>
              </TouchableOpacity>
              {contacts.map((c) => (
                <TouchableOpacity
                  key={`${c.type}-${c.id}`}
                  style={[
                    styles.pickerItem,
                    selectedContact?.type === c.type && selectedContact?.id === c.id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedContact(c);
                    if (c.address && !address) setAddress(c.address);
                    setShowContactPicker(false);
                  }}
                >
                  <Text style={styles.pickerText}>{c.name}</Text>
                  <Text style={styles.pickerSubtext}>{c.type === 'lead' ? 'Lead' : 'Customer'}</Text>
                </TouchableOpacity>
              ))}
              {contacts.length === 0 && (
                <Text style={styles.pickerEmpty}>
                  No contacts yet. Add leads (Scratchpad) or customers (Contacts tab).
                </Text>
              )}
            </View>
          )}

          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="123 Main St, Richmond VA"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={address}
            onChangeText={setAddress}
          />

          {/* Budget */}
          <Text style={styles.label}>Budget</Text>
          <TextInput
            style={styles.input}
            placeholder="$45,000"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />

          {/* Phase */}
          <Text style={styles.label}>Starting Phase</Text>
          <View style={styles.phaseRow}>
            {PHASES.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.phaseChip, phase === p && styles.phaseChipActive]}
                onPress={() => setPhase(p)}
              >
                <Text style={[styles.phaseChipText, phase === p && styles.phaseChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Date */}
          <Text style={styles.label}>Start Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={startDate}
            onChangeText={setStartDate}
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <FontAwesome name="check" size={18} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.saveBtnText}>Create Project</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  scroll: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: BNG_COLORS.surface,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: BNG_COLORS.text },
  card: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 24,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 3 } }),
  },
  label: {
    fontSize: 13, fontWeight: '700', color: BNG_COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16,
  },
  input: {
    backgroundColor: BNG_COLORS.background, borderRadius: 12, padding: 14,
    fontSize: 16, color: BNG_COLORS.text, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  phaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phaseChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  phaseChipActive: { backgroundColor: BNG_COLORS.primary, borderColor: BNG_COLORS.primary },
  phaseChipText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  phaseChipTextActive: { color: '#FFF' },
  pickerList: {
    backgroundColor: BNG_COLORS.background, borderRadius: 12, marginTop: 4,
    borderWidth: 1, borderColor: BNG_COLORS.border, maxHeight: 200, overflow: 'hidden',
  },
  pickerItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: BNG_COLORS.border },
  pickerItemActive: { backgroundColor: `${BNG_COLORS.primary}15` },
  pickerText: { fontSize: 15, color: BNG_COLORS.text, fontWeight: '600' },
  pickerSubtext: { fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 2 },
  pickerEmpty: { padding: 14, fontSize: 14, color: BNG_COLORS.textMuted, fontStyle: 'italic' },
  saveBtn: {
    backgroundColor: BNG_COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 18, borderRadius: 16,
    ...Platform.select({ ios: SHADOWS.glowPrimary, android: { elevation: 6 } }),
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
