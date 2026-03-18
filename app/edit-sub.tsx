// Edit Subcontractor: load sub by id, same form as Add Sub, save updates and optional delete.

import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { fetchSubcontractor, updateSubcontractor, deleteSubcontractor } from '../lib/data';

const TRADE_OPTIONS = [
  { key: 'electrician', label: 'Electrical' },
  { key: 'plumber', label: 'Plumbing' },
  { key: 'tile', label: 'Tile' },
  { key: 'hvac', label: 'HVAC' },
  { key: 'painter', label: 'Painting' },
  { key: 'demo', label: 'Demo' },
  { key: 'cabinet', label: 'Cabinets' },
  { key: 'flooring', label: 'Flooring' },
  { key: 'general', label: 'General' },
  { key: 'other', label: 'Other' },
];

export default function EditSubScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(!!id);
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('general');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const sub = await fetchSubcontractor(id);
        if (cancelled || !sub) return;
        setCompanyName((sub as any).company_name ?? '');
        setName(sub.name);
        setTrade(sub.trade);
        setPhone(sub.phone ?? '');
        setEmail(sub.email ?? '');
        setNotes(sub.notes ?? '');
        setRating(sub.rating ?? 0);
      } catch {
        if (!cancelled) Alert.alert('Error', 'Could not load subcontractor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Enter the sub\'s name.');
      return;
    }
    if (!id) return;
    setSaving(true);
    try {
      await updateSubcontractor(id, {
        company_name: companyName.trim() || null,
        name: name.trim(),
        trade,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
        rating,
      });
      router.replace('/crew' as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save sub.');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Remove Sub?', 'This will remove them from your crew roster. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubcontractor(id!);
            router.replace('/crew' as any);
          } catch {
            Alert.alert('Error', 'Could not remove sub.');
          }
        },
      },
    ]);
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
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={16} color={BNG_COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Edit Subcontractor</Text>
        <Text style={styles.subheading}>Update details for this sub.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Company Name</Text>
          <View style={styles.inputRow}>
            <FontAwesome name="building" size={16} color={BNG_COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Sub's company or business name"
              placeholderTextColor={BNG_COLORS.textMuted}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

          <Text style={styles.label}>Name *</Text>
          <View style={styles.inputRow}>
            <FontAwesome name="user" size={16} color={BNG_COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Sub's full name"
              placeholderTextColor={BNG_COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.label}>Trade</Text>
          <View style={styles.chipRow}>
            {TRADE_OPTIONS.map((t) => {
              const active = trade === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setTrade(t.key)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputRow}>
            <FontAwesome name="phone" size={16} color={BNG_COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="(555) 555-1234"
              placeholderTextColor={BNG_COLORS.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <FontAwesome name="envelope-o" size={16} color={BNG_COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="sub@example.com"
              placeholderTextColor={BNG_COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Rating</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n === rating ? 0 : n)}>
                <FontAwesome
                  name={n <= rating ? 'star' : 'star-o'}
                  size={28}
                  color={n <= rating ? '#F59E0B' : BNG_COLORS.border}
                />
              </TouchableOpacity>
            ))}
            {rating > 0 && <Text style={styles.ratingLabel}>{rating}/5</Text>}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Specialties, availability, comments..."
            placeholderTextColor={BNG_COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <FontAwesome name="check" size={16} color="#FFF" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <FontAwesome name="trash-o" size={16} color={BNG_COLORS.accent} />
          <Text style={styles.deleteBtnText}>Remove from Crew</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  content: { padding: 24, paddingBottom: 60 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BNG_COLORS.background },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.primary },
  heading: { fontSize: 24, fontWeight: '800', color: BNG_COLORS.text },
  subheading: { fontSize: 14, color: BNG_COLORS.textMuted, marginTop: 4, marginBottom: 20 },
  card: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...SHADOWS.sm,
  },
  label: { fontSize: 13, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 6, marginTop: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 10, width: 20, textAlign: 'center' },
  input: { flex: 1, height: 44, fontSize: 15, color: BNG_COLORS.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BNG_COLORS.background,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  chipActive: { backgroundColor: BNG_COLORS.primary, borderColor: BNG_COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  chipTextActive: { color: '#FFF' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.textSecondary, marginLeft: 4 },
  textArea: {
    backgroundColor: BNG_COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    padding: 12,
    fontSize: 15,
    color: BNG_COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: BNG_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    ...SHADOWS.glowPrimary,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.accent,
  },
  deleteBtnText: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.accent },
});
