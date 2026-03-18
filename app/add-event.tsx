import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { createEvent, fetchProjects, fetchLeads, fetchCustomers } from '../lib/data';
import { DatePickerField } from '../components/DatePickerField';

type ProjectOption = { id: string; title: string; contactName: string | null };

const EVENT_TYPES = ['walkthrough', 'meeting', 'review', 'inspection', 'other'] as const;

export default function AddEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventType, setEventType] = useState<typeof EVENT_TYPES[number]>('meeting');
  const [clientName, setClientName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load projects with contact names so we can auto-fill client name
    Promise.all([fetchProjects(), fetchLeads(), fetchCustomers()])
      .then(([projData, leadsData, custData]) => {
        const names: Record<string, string> = {};
        leadsData.forEach((l) => { names[l.id] = l.name; });
        custData.forEach((c) => { names[c.id] = c.name; });
        setProjects(projData.map(p => ({
          id: p.id,
          title: p.title,
          contactName: (p.lead_id ? names[p.lead_id] : p.customer_id ? names[p.customer_id] : null) ?? null,
        })));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an event title.');
      return;
    }
    if (!eventDate.trim()) {
      Alert.alert('Required', 'Please enter a date (YYYY-MM-DD).');
      return;
    }
    setSaving(true);
    try {
      await createEvent({
        title: title.trim(),
        event_date: eventDate.trim(),
        start_time: startTime.trim() || null,
        end_time: endTime.trim() || null,
        event_type: eventType,
        client_name: clientName.trim() || null,
        project_id: selectedProjectId,
      });
      router.replace('/calendar' as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create event.');
      setSaving(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={18} color={BNG_COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Event</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Site Walkthrough"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          {/* Date */}
          <Text style={styles.label}>Date *</Text>
          <DatePickerField
            value={eventDate}
            onChange={setEventDate}
          />

          {/* Time Row */}
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                placeholder="9:00 AM"
                placeholderTextColor={BNG_COLORS.textMuted}
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>End Time</Text>
              <TextInput
                style={styles.input}
                placeholder="10:00 AM"
                placeholderTextColor={BNG_COLORS.textMuted}
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>

          {/* Event Type */}
          <Text style={styles.label}>Event Type</Text>
          <View style={styles.typeRow}>
            {EVENT_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, eventType === t && styles.typeChipActive]}
                onPress={() => setEventType(t)}
              >
                <Text style={[styles.typeChipText, eventType === t && styles.typeChipTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Client Name */}
          <Text style={styles.label}>Client Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={clientName}
            onChangeText={setClientName}
          />

          {/* Link to Project */}
          <Text style={styles.label}>Link to Project (optional)</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowProjectPicker(!showProjectPicker)}
          >
            <Text style={{ color: selectedProject ? BNG_COLORS.text : BNG_COLORS.textMuted, fontSize: 16 }}>
              {selectedProject ? selectedProject.title : 'Select a project...'}
            </Text>
          </TouchableOpacity>
          {showProjectPicker && (
            <View style={styles.pickerList}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => { setSelectedProjectId(null); setShowProjectPicker(false); }}
              >
                <Text style={styles.pickerText}>-- None --</Text>
              </TouchableOpacity>
              {projects.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.pickerItem, selectedProjectId === p.id && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedProjectId(p.id);
                    setShowProjectPicker(false);
                    // Auto-fill client name from the project's linked contact
                    if (p.contactName && !clientName) setClientName(p.contactName);
                  }}
                >
                  <Text style={styles.pickerText}>{p.title}</Text>
                  {p.contactName && (
                    <Text style={{ fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 2 }}>{p.contactName}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
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
              <FontAwesome name="calendar-plus-o" size={18} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.saveBtnText}>Create Event</Text>
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
  timeRow: { flexDirection: 'row' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  typeChipActive: { backgroundColor: BNG_COLORS.primary, borderColor: BNG_COLORS.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  typeChipTextActive: { color: '#FFF' },
  pickerList: {
    backgroundColor: BNG_COLORS.background, borderRadius: 12, marginTop: 4,
    borderWidth: 1, borderColor: BNG_COLORS.border, maxHeight: 200,
  },
  pickerItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: BNG_COLORS.border },
  pickerItemActive: { backgroundColor: `${BNG_COLORS.primary}15` },
  pickerText: { fontSize: 15, color: BNG_COLORS.text },
  saveBtn: {
    backgroundColor: BNG_COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 18, borderRadius: 16,
    ...Platform.select({ ios: SHADOWS.glowPrimary, android: { elevation: 6 } }),
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
