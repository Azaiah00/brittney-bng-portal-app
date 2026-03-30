// Edit Project: load project by id, same form as Add Project, save updates and optional delete.

import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { fetchProject, updateProject, deleteProject, fetchLeads, fetchCustomers } from '../lib/data';
import { DatePickerField } from '../components/DatePickerField';
import { CurrencyInput } from '../components/CurrencyInput';
import { confirmAsync } from '../lib/confirmDialog';

type ContactOption = { id: string; name: string; address?: string | null; type: 'lead' | 'customer' };

const PHASES = ['Planning', 'Contract', 'Demo', 'Rough-in', 'Finish', 'Punch List'];
const STATUSES = ['active', 'pending', 'completed'] as const;

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(!!id);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [phase, setPhase] = useState('Planning');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<'active' | 'pending' | 'completed'>('active');
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [proj, leadsData, customersData] = await Promise.all([
          fetchProject(id),
          fetchLeads(),
          fetchCustomers(),
        ]);
        if (cancelled || !proj) return;
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
        const all = [...leadContacts, ...customerContacts];
        setContacts(all);
        setTitle(proj.title);
        setAddress(proj.address ?? '');
        setBudget(proj.budget != null ? String(proj.budget) : '');
        setPhase(proj.phase ?? 'Planning');
        setStartDate(proj.start_date ?? '');
        setStatus(proj.status);
        if (proj.lead_id) {
          const match = all.find((c) => c.type === 'lead' && c.id === proj.lead_id);
          if (match) setSelectedContact(match);
        } else if (proj.customer_id) {
          const match = all.find((c) => c.type === 'customer' && c.id === proj.customer_id);
          if (match) setSelectedContact(match);
        }
      } catch {
        if (!cancelled) Alert.alert('Error', 'Could not load project.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a project title.');
      return;
    }
    if (!id) return;
    setSaving(true);
    try {
      await updateProject(id, {
        title: title.trim(),
        address: address.trim() || null,
        budget: budget ? parseFloat(budget.replace(/[^0-9.]/g, '')) : null,
        phase,
        start_date: startDate || null,
        lead_id: selectedContact?.type === 'lead' ? selectedContact.id : null,
        customer_id: selectedContact?.type === 'customer' ? selectedContact.id : null,
        status,
      });
      router.replace(`/project/${id}` as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save project.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmAsync({
      title: 'Delete Project?',
      message:
        'Timeline, checklist, punch list, and estimates for this project will be affected. This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteProject(id!);
      router.replace('/' as any);
    } catch {
      Alert.alert('Error', 'Could not delete project.');
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={18} color={BNG_COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Project</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Project Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Smith Kitchen Remodel"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Link to Contact (optional)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowContactPicker(!showContactPicker)}
          >
            <Text style={{ color: selectedContact ? BNG_COLORS.text : BNG_COLORS.textMuted, fontSize: 16 }}>
              {selectedContact
                ? `${selectedContact.name} — ${selectedContact.type === 'lead' ? 'Lead' : 'Customer'}`
                : 'Select a contact...'}
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
            </View>
          )}

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="123 Main St, Richmond VA"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Budget</Text>
          <CurrencyInput
            value={budget}
            onChangeText={setBudget}
            placeholder="$45,000"
            style={styles.input}
          />

          <Text style={styles.label}>Phase</Text>
          <View style={styles.phaseRow}>
            {PHASES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.phaseChip, phase === p && styles.phaseChipActive]}
                onPress={() => setPhase(p)}
              >
                <Text style={[styles.phaseChipText, phase === p && styles.phaseChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Start Date</Text>
          <DatePickerField value={startDate} onChange={setStartDate} />

          <Text style={styles.label}>Status</Text>
          <View style={styles.phaseRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.phaseChip, status === s && styles.phaseChipActive]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.phaseChipText, status === s && styles.phaseChipTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <FontAwesome name="trash-o" size={18} color={BNG_COLORS.accent} style={{ marginRight: 10 }} />
          <Text style={styles.deleteBtnText}>Delete Project</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BNG_COLORS.background },
  scroll: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BNG_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: BNG_COLORS.text },
  card: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 3 } }),
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: BNG_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: BNG_COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: BNG_COLORS.text,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  phaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phaseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BNG_COLORS.background,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  phaseChipActive: { backgroundColor: BNG_COLORS.primary, borderColor: BNG_COLORS.primary },
  phaseChipText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  phaseChipTextActive: { color: '#FFF' },
  pickerList: {
    backgroundColor: BNG_COLORS.background,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: BNG_COLORS.border },
  pickerItemActive: { backgroundColor: `${BNG_COLORS.primary}15` },
  pickerText: { fontSize: 15, color: BNG_COLORS.text, fontWeight: '600' },
  pickerSubtext: { fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 2 },
  saveBtn: {
    backgroundColor: BNG_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    ...Platform.select({ ios: SHADOWS.glowPrimary, android: { elevation: 6 } }),
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BNG_COLORS.accent,
  },
  deleteBtnText: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.accent },
});
