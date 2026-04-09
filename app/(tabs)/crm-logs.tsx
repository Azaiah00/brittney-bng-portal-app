import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { fetchAllContactActivityLogs, fetchLeads, fetchCustomers } from '../../lib/data';
import { Database } from '../../types/database';

type LogRow = Database['public']['Tables']['contact_activity_logs']['Row'];

export default function ContactCrmLogsTabScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, leads, customers] = await Promise.all([
        fetchAllContactActivityLogs(),
        fetchLeads(),
        fetchCustomers(),
      ]);
      setLogs(all);
      const map: Record<string, string> = {};
      leads.forEach((l) => { map[`lead:${l.id}`] = l.name; });
      customers.forEach((c) => { map[`customer:${c.id}`] = c.name; });
      setNames(map);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const labelFor = (l: LogRow) => {
    if (l.lead_id) return names[`lead:${l.lead_id}`] || 'Lead';
    if (l.customer_id) return names[`customer:${l.customer_id}`] || 'Customer';
    return '—';
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const nm = labelFor(l).toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        (l.body || '').toLowerCase().includes(q) ||
        nm.includes(q)
      );
    });
  }, [logs, query, names]);

  const openContact = (l: LogRow) => {
    if (l.lead_id) router.push(`/contact/lead/${l.lead_id}` as any);
    else if (l.customer_id) router.push(`/contact/customer/${l.customer_id}` as any);
  };

  const renderItem = ({ item }: { item: LogRow }) => (
    <TouchableOpacity style={styles.card} onPress={() => openContact(item)} activeOpacity={0.9}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardContact}>{labelFor(item)}</Text>
      <Text style={styles.cardDate}>{new Date(item.occurred_at).toLocaleString()}</Text>
      {item.source_todo_id ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>From to-do</Text>
        </View>
      ) : null}
      {item.source_note_id ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>From note</Text>
        </View>
      ) : null}
      {item.body ? <Text style={styles.cardBody} numberOfLines={4}>{item.body}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Logs</Text>
        <Text style={styles.sub}>Conversations and meetings with contacts</Text>
      </View>

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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={BNG_COLORS.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <FontAwesome name="file-text-o" size={48} color={BNG_COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Logs</Text>
          <Text style={styles.emptyText}>Keep a detailed record of conversations and meetings.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push({ pathname: '/pick-contact', params: { for: 'log' } } as any)}
          >
            <Text style={styles.emptyBtnText}>Add log</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}

      {filtered.length > 0 || loading ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push({ pathname: '/pick-contact', params: { for: 'log' } } as any)}
        >
          <FontAwesome name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BNG_COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: BNG_COLORS.text },
  sub: { fontSize: 15, color: BNG_COLORS.textSecondary, marginTop: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  search: { flex: 1, height: 44, fontSize: 16, color: BNG_COLORS.text },
  card: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text },
  cardContact: { fontSize: 14, color: BNG_COLORS.primary, fontWeight: '600', marginTop: 6 },
  cardDate: { fontSize: 13, color: BNG_COLORS.textMuted, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: `${BNG_COLORS.info}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: BNG_COLORS.info },
  cardBody: { fontSize: 15, color: BNG_COLORS.textSecondary, marginTop: 10, lineHeight: 22 },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: BNG_COLORS.primary, marginTop: 16 },
  emptyText: { fontSize: 15, color: BNG_COLORS.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: BNG_COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BNG_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
});
