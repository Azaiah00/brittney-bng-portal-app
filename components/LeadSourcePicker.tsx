import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { fetchLeadSources, createLeadSource } from '../lib/data';
import { Database } from '../types/database';

type LeadSourceRow = Database['public']['Tables']['lead_sources']['Row'];

interface LeadSourcePickerProps {
  value: string | null;
  onChange: (leadSourceId: string | null) => void;
  label?: string;
}

export function LeadSourcePicker({ value, onChange, label = 'Lead Source' }: LeadSourcePickerProps) {
  const [sources, setSources] = useState<LeadSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSources = async () => {
    try {
      const data = await fetchLeadSources();
      setSources(data);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const selectedSource = sources.find((s) => s.id === value);
  const displayText = selectedSource ? selectedSource.name : 'Select source...';

  const handleAddNew = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Required', 'Enter a source name.');
      return;
    }
    setSaving(true);
    try {
      const created = await createLeadSource(name);
      setSources((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(created.id);
      setNewName('');
      setAddingNew(false);
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create source.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {displayText}
        </Text>
        <FontAwesome name="chevron-down" size={14} color={BNG_COLORS.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lead Source</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={20} color={BNG_COLORS.text} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={BNG_COLORS.primary} style={{ padding: 24 }} />
            ) : (
              <FlatList
                data={sources}
                keyExtractor={(item) => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.option, value === item.id && styles.optionSelected]}
                    onPress={() => {
                      onChange(item.id);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item.name}</Text>
                    {value === item.id && (
                      <FontAwesome name="check" size={14} color={BNG_COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ListFooterComponent={
                  addingNew ? (
                    <View style={styles.addRow}>
                      <TextInput
                        style={styles.addInput}
                        placeholder="New source name"
                        placeholderTextColor={BNG_COLORS.textMuted}
                        value={newName}
                        onChangeText={setNewName}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.addBtn, saving && { opacity: 0.6 }]}
                        onPress={handleAddNew}
                        disabled={saving}
                      >
                        {saving ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={styles.addBtnText}>Save</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                          setAddingNew(false);
                          setNewName('');
                        }}
                        disabled={saving}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addSourceButton}
                      onPress={() => setAddingNew(true)}
                    >
                      <FontAwesome name="plus" size={16} color={BNG_COLORS.primary} />
                      <Text style={styles.addSourceText}>Add new source</Text>
                    </TouchableOpacity>
                  )
                }
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: BNG_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BNG_COLORS.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  triggerText: { fontSize: 16, color: BNG_COLORS.text, fontWeight: '500' },
  triggerPlaceholder: { color: BNG_COLORS.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    maxHeight: '70%',
    ...Platform.select({ ios: SHADOWS.lg, android: { elevation: 8 } }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BNG_COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.text },
  list: { maxHeight: 320 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BNG_COLORS.border,
  },
  optionSelected: { backgroundColor: `${BNG_COLORS.primary}10` },
  optionText: { fontSize: 16, color: BNG_COLORS.text },
  addSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
  },
  addSourceText: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.primary },
  addRow: { padding: 16, gap: 10 },
  addInput: {
    backgroundColor: BNG_COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: BNG_COLORS.text,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: BNG_COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  cancelBtn: { padding: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: BNG_COLORS.textMuted },
});
