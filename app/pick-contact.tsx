// Choose a lead or customer before adding a to-do or log from global tabs.
import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { fetchLeads, fetchCustomers } from '../lib/data';
import { Database } from '../types/database';

type LeadRow = Database['public']['Tables']['leads']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type Row = { id: string; name: string; kind: 'lead' | 'customer' };

export default function PickContactScreen() {
  const router = useRouter();
  const { for: forWhat } = useLocalSearchParams<{ for?: string }>();
  const purpose =
    forWhat === 'log' ? 'log' : forWhat === 'note' ? 'note' : 'todo';
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    try {
      const [leads, customers] = await Promise.all([fetchLeads(), fetchCustomers()]);
      const r: Row[] = [
        ...leads.map((l) => ({ id: l.id, name: l.name, kind: 'lead' as const })),
        ...customers.map((c) => ({ id: c.id, name: c.name, kind: 'customer' as const })),
      ].sort((a, b) => a.name.localeCompare(b.name));
      setRows(r);
    } catch { setRows([]); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;

  const onPick = (r: Row) => {
    if (purpose === 'log') {
      router.replace({ pathname: '/add-contact-log', params: { type: r.kind, id: r.id } } as any);
    } else if (purpose === 'note') {
      router.replace({
        pathname: '/contact-note-editor',
        params: { type: r.kind, id: r.id },
      } as any);
    } else {
      router.replace({ pathname: '/add-contact-todo', params: { type: r.kind, id: r.id } } as any);
    }
  };

  const renderItem = ({ item }: { item: Row }) => (
    <TouchableOpacity style={styles.item} onPress={() => onPick(item)} activeOpacity={0.85}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.kind}>{item.kind === 'lead' ? 'Lead' : 'Customer'}</Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={BNG_COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Choose contact</Text>
      <View style={styles.searchWrap}>
        <FontAwesome name="search" size={16} color={BNG_COLORS.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={BNG_COLORS.textMuted}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No contacts match.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BNG_COLORS.background },
  title: { fontSize: 22, fontWeight: '800', color: BNG_COLORS.text, paddingHorizontal: 20, paddingTop: 12 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  search: { flex: 1, height: 44, fontSize: 16, color: BNG_COLORS.text },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: `${BNG_COLORS.primary}18`,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.primary },
  name: { fontSize: 16, fontWeight: '600', color: BNG_COLORS.text },
  kind: { fontSize: 13, color: BNG_COLORS.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: BNG_COLORS.textMuted, marginTop: 40, paddingHorizontal: 24 },
});
