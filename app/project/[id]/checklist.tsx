// Per-project Job Checklist — tracks the standard remodel workflow.
// Auto-creates from a default template on first visit.
// Each item is a checkbox with optional date and note.

import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, FlatList,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../../lib/theme';
import { fetchChecklist, createChecklist, updateChecklist, fetchProject, updateProject } from '../../../lib/data';
import { confirmAsync } from '../../../lib/confirmDialog';
import { Database } from '../../../types/database';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

// Each checklist item stored in the JSONB `items` column
interface ChecklistItem {
  label: string;
  done: boolean;
  completed_date: string | null;
  note: string;
}

// Copy template so we never mutate the shared default
function copyDefaultItems(): ChecklistItem[] {
  return DEFAULT_ITEMS.map((i) => ({ ...i }));
}

// Default template — the rhythm of every BNG remodel
const DEFAULT_ITEMS: ChecklistItem[] = [
  { label: 'Contract signed', done: false, completed_date: null, note: '' },
  { label: 'Deposit received (30%)', done: false, completed_date: null, note: '' },
  { label: 'Permits pulled', done: false, completed_date: null, note: '' },
  { label: 'Materials ordered / selections finalized', done: false, completed_date: null, note: '' },
  { label: 'Demo complete', done: false, completed_date: null, note: '' },
  { label: 'Rough-in complete (electrical, plumbing)', done: false, completed_date: null, note: '' },
  { label: 'Inspection passed', done: false, completed_date: null, note: '' },
  { label: 'Finish work complete', done: false, completed_date: null, note: '' },
  { label: 'Progress payment received (40%)', done: false, completed_date: null, note: '' },
  { label: 'Final walkthrough & punch list', done: false, completed_date: null, note: '' },
  { label: 'Final payment received (30%)', done: false, completed_date: null, note: '' },
  { label: 'Project closed / warranty start', done: false, completed_date: null, note: '' },
];

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Load or create checklist on focus. We always set items in state so the
  // screen never shows "0 of 0" empty — even if DB create/update fails.
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const template = copyDefaultItems();
    try {
      const [proj, existing] = await Promise.all([
        fetchProject(id),
        fetchChecklist(id),
      ]);
      setProject(proj);

      if (existing) {
        setChecklistId(existing.id);
        const raw = existing.items as unknown;
        let loaded: ChecklistItem[] = Array.isArray(raw) ? (raw as ChecklistItem[]) : [];
        const looksValid =
          loaded.length > 0 &&
          loaded.every((x) => x && typeof (x as ChecklistItem).label === 'string');
        if (!looksValid) {
          loaded = copyDefaultItems();
          setItems(loaded);
          try {
            await updateChecklist(existing.id, { items: loaded as any });
          } catch {
            // Keep showing template; user can use checklist even if sync failed
          }
        } else {
          setItems(loaded);
        }
      } else {
        // Show template immediately so user never sees empty list
        setItems(template);
        try {
          const created = await createChecklist({
            project_id: id,
            items: template as any,
          });
          setChecklistId(created.id);
        } catch {
          Alert.alert(
            'Could not save checklist',
            'You can still use it here. It will save when possible.',
          );
        }
      }
    } catch {
      // Fetch failed (e.g. network): still show template so screen isn’t blank
      setItems(template);
      Alert.alert('Error', 'Could not load checklist. Showing default steps.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Auto-save whenever an item changes, and sync progress to the project
  const saveItems = async (updated: ChecklistItem[]) => {
    setItems(updated);
    if (!checklistId || !id) return;
    try {
      const done = updated.filter((i) => i.done).length;
      const total = updated.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      await Promise.all([
        updateChecklist(checklistId, { items: updated as any }),
        updateProject(id, { progress: pct }),
      ]);
    } catch { /* silent — will retry on next toggle */ }
  };

  const toggleItem = (index: number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      done: !updated[index].done,
      completed_date: !updated[index].done ? new Date().toISOString().slice(0, 10) : null,
    };
    saveItems(updated);
  };

  const updateNote = (index: number, note: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], note };
    saveItems(updated);
  };

  const handleReset = async () => {
    const ok = await confirmAsync({
      title: 'Reset Checklist?',
      message: 'This will clear all progress and start fresh.',
      confirmText: 'Reset',
      destructive: true,
    });
    if (!ok) return;
    saveItems(copyDefaultItems());
  };

  // Progress stats
  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BNG_COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Short explanation: what this screen is for */}
      <Text style={styles.subtitle}>
        Track your remodel steps. Check off as you go. Use “Reset to template” to reload the default list.
      </Text>

      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {project?.title || 'Project'}
            </Text>
            <Text style={styles.progressLabel}>
              {doneCount} of {totalCount} complete
            </Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <FontAwesome name="refresh" size={12} color={BNG_COLORS.textMuted} />
          <Text style={styles.resetText}>Reset to template</Text>
        </TouchableOpacity>
      </View>

      {/* Checklist items */}
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const expanded = expandedIndex === index;
          return (
            <View style={[styles.itemCard, item.done && styles.itemCardDone]}>
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => toggleItem(index)}
                activeOpacity={0.7}
              >
                <FontAwesome
                  name={item.done ? 'check-circle' : 'circle-o'}
                  size={22}
                  color={item.done ? BNG_COLORS.success : BNG_COLORS.border}
                />
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemLabel, item.done && styles.itemLabelDone]}>
                    {item.label}
                  </Text>
                  {item.completed_date && (
                    <Text style={styles.itemDate}>Completed {item.completed_date}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setExpandedIndex(expanded ? null : index)}>
                  <FontAwesome
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={BNG_COLORS.textMuted}
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Expandable note */}
              {expanded && (
                <View style={styles.noteSection}>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add a note..."
                    placeholderTextColor={BNG_COLORS.textMuted}
                    value={item.note}
                    onChangeText={(text) => updateNote(index, text)}
                    multiline
                  />
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BNG_COLORS.background },

  subtitle: {
    fontSize: 13, color: BNG_COLORS.textMuted, marginHorizontal: 16, marginTop: 12, marginBottom: 4,
  },

  // Header card with progress
  headerCard: {
    backgroundColor: BNG_COLORS.surface, margin: 16, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: BNG_COLORS.border, ...SHADOWS.sm,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  projectTitle: { fontSize: 18, fontWeight: '800', color: BNG_COLORS.text },
  progressLabel: { fontSize: 13, color: BNG_COLORS.textMuted, marginTop: 2 },
  progressCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: `${BNG_COLORS.success}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  progressPct: { fontSize: 15, fontWeight: '800', color: BNG_COLORS.success },
  progressBarBg: {
    height: 8, backgroundColor: BNG_COLORS.background, borderRadius: 4, overflow: 'hidden',
  },
  progressBarFill: { height: 8, backgroundColor: BNG_COLORS.success, borderRadius: 4 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-end' },
  resetText: { fontSize: 12, color: BNG_COLORS.textMuted, fontWeight: '600' },

  // Checklist items
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  itemCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: BNG_COLORS.border, overflow: 'hidden',
  },
  itemCardDone: { borderColor: `${BNG_COLORS.success}40` },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemLabel: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.text },
  itemLabelDone: { textDecorationLine: 'line-through', color: BNG_COLORS.textMuted },
  itemDate: { fontSize: 12, color: BNG_COLORS.success, fontWeight: '500' },
  noteSection: {
    borderTopWidth: 1, borderTopColor: BNG_COLORS.borderLight, padding: 12,
    backgroundColor: BNG_COLORS.background,
  },
  noteInput: {
    fontSize: 14, color: BNG_COLORS.text, minHeight: 40, textAlignVertical: 'top',
  },
});
