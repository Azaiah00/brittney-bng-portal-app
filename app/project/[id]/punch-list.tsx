// Per-project Punch List — tracks items that need fixing before closeout.
// Supports photo capture, status chips, and assigned sub name.
// Matches BNG's "first right to repair" warranty clause.

import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, FlatList,
  TextInput, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../../lib/theme';
import {
  fetchPunchItems, createPunchItem, updatePunchItem,
  deletePunchItem, fetchProject, fetchSubcontractors,
} from '../../../lib/data';
import { confirmAsync } from '../../../lib/confirmDialog';
import { Database } from '../../../types/database';

type PunchItemRow = Database['public']['Tables']['punch_items']['Row'];
type ProjectRow = Database['public']['Tables']['projects']['Row'];
type SubRow = Database['public']['Tables']['subcontractors']['Row'];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  open: { label: 'Open', bg: '#FEE2E2', text: '#DC2626', icon: 'exclamation-circle' },
  in_progress: { label: 'In Progress', bg: '#FEF3C7', text: '#D97706', icon: 'wrench' },
  resolved: { label: 'Resolved', bg: '#D1FAE5', text: '#059669', icon: 'check-circle' },
};

export default function PunchListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [items, setItems] = useState<PunchItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  // Subcontractors loaded from crew roster for the "assign to" picker
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [showSubPicker, setShowSubPicker] = useState(false);

  // Form state for adding new items
  const [showForm, setShowForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newAssigned, setNewAssigned] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [proj, punchItems, subsData] = await Promise.all([
        fetchProject(id),
        fetchPunchItems(id),
        fetchSubcontractors(),
      ]);
      setProject(proj);
      setItems(punchItems);
      setSubs(subsData);
    } catch {
      Alert.alert('Error', 'Could not load punch list.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Filtered items
  const filtered = filter === 'all' ? items : items.filter((i) => {
    if (filter === 'open') return i.status !== 'resolved';
    return i.status === 'resolved';
  });

  const openCount = items.filter((i) => i.status === 'open').length;
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const resolvedCount = items.filter((i) => i.status === 'resolved').length;

  // Pick a photo for the new item
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setNewPhoto(result.assets[0].uri);
    }
  };

  // Save new punch item
  const handleAddItem = async () => {
    if (!newDesc.trim()) {
      Alert.alert('Description Required', 'Describe the issue to add it.');
      return;
    }
    if (!id) return;
    setSaving(true);
    try {
      await createPunchItem({
        project_id: id,
        description: newDesc.trim(),
        assigned_to: newAssigned.trim() || null,
        photo_url: newPhoto,
        status: 'open',
      });
      setNewDesc('');
      setNewAssigned('');
      setNewPhoto(null);
      setShowForm(false);
      loadData();
    } catch {
      Alert.alert('Error', 'Could not save punch item.');
    } finally {
      setSaving(false);
    }
  };

  // Cycle status: open → in_progress → resolved
  const cycleStatus = async (item: PunchItemRow) => {
    const next: Record<string, string> = {
      open: 'in_progress',
      in_progress: 'resolved',
      resolved: 'open',
    };
    const newStatus = next[item.status] || 'open';
    try {
      await updatePunchItem(item.id, {
        status: newStatus as any,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
      });
      loadData();
    } catch {
      Alert.alert('Error', 'Could not update status.');
    }
  };

  // Delete a punch item
  const handleDelete = async (item: PunchItemRow) => {
    const ok = await confirmAsync({
      title: 'Delete Item?',
      message: `Remove "${item.description}"?`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deletePunchItem(item.id);
      loadData();
    } catch {
      Alert.alert('Error', 'Could not delete.');
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
    <View style={styles.container}>
      {/* Header stats */}
      <View style={styles.headerCard}>
        <Text style={styles.projectTitle} numberOfLines={1}>
          {project?.title || 'Project'} — Punch List
        </Text>
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: STATUS_CONFIG.open.bg }]}>
            <Text style={[styles.statChipText, { color: STATUS_CONFIG.open.text }]}>
              {openCount} Open
            </Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: STATUS_CONFIG.in_progress.bg }]}>
            <Text style={[styles.statChipText, { color: STATUS_CONFIG.in_progress.text }]}>
              {inProgressCount} In Progress
            </Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: STATUS_CONFIG.resolved.bg }]}>
            <Text style={[styles.statChipText, { color: STATUS_CONFIG.resolved.text }]}>
              {resolvedCount} Resolved
            </Text>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(['all', 'open', 'resolved'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f === 'all' ? 'All' : f === 'open' ? 'Open / Active' : 'Resolved'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add item form (collapsible) */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Punch Item</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Describe the issue..."
            placeholderTextColor={BNG_COLORS.textMuted}
            value={newDesc}
            onChangeText={setNewDesc}
            multiline
          />
          {/* Sub picker — pulls from crew roster */}
          <TouchableOpacity
            style={styles.formInputSmall}
            onPress={() => setShowSubPicker(!showSubPicker)}
          >
            <Text style={{ color: newAssigned ? BNG_COLORS.text : BNG_COLORS.textMuted, fontSize: 14 }}>
              {newAssigned || 'Assign to sub (optional)'}
            </Text>
          </TouchableOpacity>
          {showSubPicker && (
            <View style={styles.subPickerList}>
              <TouchableOpacity
                style={styles.subPickerItem}
                onPress={() => { setNewAssigned(''); setShowSubPicker(false); }}
              >
                <Text style={styles.subPickerText}>-- None --</Text>
              </TouchableOpacity>
              {subs.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.subPickerItem}
                  onPress={() => { setNewAssigned(s.name); setShowSubPicker(false); }}
                >
                  <Text style={styles.subPickerText}>{s.name}</Text>
                  <Text style={styles.subPickerTrade}>{s.trade}</Text>
                </TouchableOpacity>
              ))}
              {subs.length === 0 && (
                <Text style={styles.subPickerEmpty}>No subs in crew roster. Add subs in the Crew tab.</Text>
              )}
            </View>
          )}

          {/* Photo preview */}
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
              <FontAwesome name="camera" size={16} color={BNG_COLORS.primary} />
              <Text style={styles.photoBtnText}>Add Photo</Text>
            </TouchableOpacity>
            {newPhoto && (
              <Image source={{ uri: newPhoto }} style={styles.photoPreview} />
            )}
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAddItem}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Add Item'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Punch items list */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
          return (
            <View style={styles.itemCard}>
              {/* Photo thumbnail if present */}
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.itemPhoto} />
              ) : null}

              <View style={styles.itemBody}>
                {/* Status badge */}
                <View style={styles.itemTopRow}>
                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: cfg.bg }]}
                    onPress={() => cycleStatus(item)}
                  >
                    <FontAwesome name={cfg.icon as any} size={12} color={cfg.text} />
                    <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <FontAwesome name="trash-o" size={14} color={BNG_COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <Text style={styles.itemDesc}>{item.description}</Text>

                {/* Assigned to */}
                {item.assigned_to ? (
                  <View style={styles.assignedRow}>
                    <FontAwesome name="user-o" size={11} color={BNG_COLORS.textMuted} />
                    <Text style={styles.assignedText}>{item.assigned_to}</Text>
                  </View>
                ) : null}

                {/* Resolved date */}
                {item.resolved_at ? (
                  <Text style={styles.resolvedDate}>
                    Resolved {new Date(item.resolved_at).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome name="check-circle-o" size={40} color={BNG_COLORS.border} />
            <Text style={styles.emptyTitle}>
              {filter === 'resolved' ? 'No resolved items' : 'No punch items'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to add an item.
            </Text>
          </View>
        }
      />

      {/* FAB to add item */}
      {!showForm && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
          <FontAwesome name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BNG_COLORS.background },

  // Header
  headerCard: {
    backgroundColor: BNG_COLORS.surface, margin: 16, marginBottom: 8,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: BNG_COLORS.border, ...SHADOWS.sm,
  },
  projectTitle: { fontSize: 18, fontWeight: '800', color: BNG_COLORS.text, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  statChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statChipText: { fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  filterTabActive: { backgroundColor: BNG_COLORS.primary, borderColor: BNG_COLORS.primary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  filterTabTextActive: { color: '#FFF' },

  // Add form
  formCard: {
    backgroundColor: BNG_COLORS.surface, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: BNG_COLORS.border, ...SHADOWS.sm,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 12 },
  formInput: {
    backgroundColor: BNG_COLORS.background, borderRadius: 10, borderWidth: 1,
    borderColor: BNG_COLORS.border, padding: 12, fontSize: 14, color: BNG_COLORS.text,
    minHeight: 70, textAlignVertical: 'top', marginBottom: 10,
  },
  formInputSmall: {
    backgroundColor: BNG_COLORS.background, borderRadius: 10, borderWidth: 1,
    borderColor: BNG_COLORS.border, padding: 12, height: 44, fontSize: 14, color: BNG_COLORS.text,
    marginBottom: 10,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.primary },
  photoPreview: { width: 50, height: 50, borderRadius: 8 },
  formActions: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    flex: 1, backgroundColor: BNG_COLORS.primary, paddingVertical: 12,
    borderRadius: 10, alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10,
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  cancelBtnText: { color: BNG_COLORS.textSecondary, fontWeight: '600', fontSize: 14 },

  // Item list
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  itemCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: BNG_COLORS.border, overflow: 'hidden', ...SHADOWS.sm,
  },
  itemPhoto: { width: '100%', height: 140, backgroundColor: BNG_COLORS.background },
  itemBody: { padding: 16, gap: 8 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  itemDesc: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.text },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assignedText: { fontSize: 13, color: BNG_COLORS.textMuted },
  resolvedDate: { fontSize: 12, color: BNG_COLORS.success, fontWeight: '500' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.textSecondary },
  emptySubtitle: { fontSize: 14, color: BNG_COLORS.textMuted, textAlign: 'center' },

  // Sub picker dropdown (connected to crew roster)
  subPickerList: {
    backgroundColor: BNG_COLORS.background, borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: BNG_COLORS.border, maxHeight: 180, overflow: 'hidden',
  },
  subPickerItem: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: BNG_COLORS.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  subPickerText: { fontSize: 14, color: BNG_COLORS.text, fontWeight: '600' },
  subPickerTrade: { fontSize: 12, color: BNG_COLORS.textMuted, textTransform: 'capitalize' },
  subPickerEmpty: { padding: 12, fontSize: 13, color: BNG_COLORS.textMuted, fontStyle: 'italic' },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: BNG_COLORS.primary, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.glowPrimary,
  },
});
