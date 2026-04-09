// Modal list to pick a lead or customer (assign to-do, etc.).
import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import type { ContactRef } from '../lib/data';

export type ContactPickerRow = { id: string; name: string; kind: 'lead' | 'customer' };

export type ContactPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Called when user picks a row. */
  onSelect: (ref: ContactRef) => void;
  title?: string;
  leads: { id: string; name: string }[];
  customers: { id: string; name: string }[];
};

export function ContactPickerModal({
  visible,
  onClose,
  onSelect,
  title = 'Choose contact',
  leads,
  customers,
}: ContactPickerModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const rows: ContactPickerRow[] = useMemo(() => {
    const r: ContactPickerRow[] = [
      ...leads.map((l) => ({ id: l.id, name: l.name, kind: 'lead' as const })),
      ...customers.map((c) => ({ id: c.id, name: c.name, kind: 'customer' as const })),
    ].sort((a, b) => a.name.localeCompare(b.name));
    const q = query.trim().toLowerCase();
    return q ? r.filter((x) => x.name.toLowerCase().includes(q)) : r;
  }, [leads, customers, query]);

  const pick = (row: ContactPickerRow) => {
    onSelect(row.kind === 'lead' ? { kind: 'lead', id: row.id } : { kind: 'customer', id: row.id });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboard}
            >
              <View style={styles.sheet}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{title}</Text>
                  <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <FontAwesome name="times" size={22} color={BNG_COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.searchWrap}>
                  <FontAwesome name="search" size={16} color={BNG_COLORS.textMuted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.search}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search contacts"
                    placeholderTextColor={BNG_COLORS.textMuted}
                    autoCorrect={false}
                  />
                </View>
                <FlatList
                  data={rows}
                  keyExtractor={(item) => `${item.kind}-${item.id}`}
                  style={styles.list}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} onPress={() => pick(item)} activeOpacity={0.85}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.kind}>{item.kind === 'lead' ? 'Lead' : 'Customer'}</Text>
                      </View>
                      <FontAwesome name="chevron-right" size={14} color={BNG_COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.empty}>No contacts match.</Text>
                  }
                />
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  keyboard: { width: '100%' },
  sheet: {
    maxHeight: '80%',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    paddingBottom: 16,
    ...SHADOWS.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BNG_COLORS.border,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: BNG_COLORS.text },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: BNG_COLORS.background,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  search: { flex: 1, fontSize: 16, color: BNG_COLORS.text },
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BNG_COLORS.borderLight,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BNG_COLORS.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.primary },
  name: { fontSize: 16, fontWeight: '600', color: BNG_COLORS.text },
  kind: { fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: BNG_COLORS.textMuted, padding: 24 },
});
