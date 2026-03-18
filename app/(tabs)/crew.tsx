import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  SafeAreaView, Platform, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useBreakpoint } from '../../lib/hooks';
import { fetchSubcontractors, deleteSubcontractor } from '../../lib/data';
import { Database } from '../../types/database';

type SubRow = Database['public']['Tables']['subcontractors']['Row'];

// Trade options with display colors
const TRADES: { key: string; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: BNG_COLORS.primary },
  { key: 'electrician', label: 'Electrical', color: '#F59E0B' },
  { key: 'plumber', label: 'Plumbing', color: '#3B82F6' },
  { key: 'tile', label: 'Tile', color: '#8B5CF6' },
  { key: 'hvac', label: 'HVAC', color: '#10B981' },
  { key: 'painter', label: 'Painting', color: '#EC4899' },
  { key: 'demo', label: 'Demo', color: '#EF4444' },
  { key: 'cabinet', label: 'Cabinets', color: '#D97706' },
  { key: 'flooring', label: 'Flooring', color: '#6366F1' },
  { key: 'general', label: 'General', color: BNG_COLORS.textSecondary },
  { key: 'other', label: 'Other', color: '#78716C' },
];

function getTradeColor(trade: string): string {
  return TRADES.find((t) => t.key === trade)?.color ?? BNG_COLORS.textSecondary;
}

function getTradeLabel(trade: string): string {
  return TRADES.find((t) => t.key === trade)?.label ?? trade;
}

// Simple star display
function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FontAwesome
          key={n}
          name={n <= rating ? 'star' : 'star-o'}
          size={12}
          color={n <= rating ? '#F59E0B' : BNG_COLORS.borderLight}
        />
      ))}
    </View>
  );
}

export default function CrewScreen() {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const router = useRouter();
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchSubcontractors();
      setSubs(data);
    } catch { /* Supabase may not be ready */ }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Filter subs by trade
  const filtered = filter === 'all' ? subs : subs.filter((s) => s.trade === filter);

  const handleCall = (phone: string | null) => {
    if (!phone) { Alert.alert('No Phone', 'No phone number on file for this sub.'); return; }
    Linking.openURL(`tel:${phone}`);
  };

  const handleText = (phone: string | null) => {
    if (!phone) { Alert.alert('No Phone', 'No phone number on file for this sub.'); return; }
    Linking.openURL(`sms:${phone}`);
  };

  const handleEmail = (email: string | null) => {
    if (!email) { Alert.alert('No Email', 'No email on file for this sub.'); return; }
    Linking.openURL(`mailto:${email}`);
  };

  const handleDelete = (sub: SubRow) => {
    Alert.alert(
      'Remove Sub?',
      `Remove ${sub.name} from your crew roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubcontractor(sub.id);
              loadData();
            } catch { Alert.alert('Error', 'Could not remove sub.'); }
          },
        },
      ],
    );
  };

  const renderSubCard = ({ item }: { item: SubRow }) => {
    const tradeColor = getTradeColor(item.trade);
    return (
      <View style={[styles.card, isMobile && styles.cardMobile]}>
        {/* Top row: avatar + info */}
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: `${tradeColor}20` }]}>
            <FontAwesome name="wrench" size={18} color={tradeColor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.subName}>{item.name}</Text>
            {(item as any).company_name ? (
              <Text style={styles.subCompany} numberOfLines={1}>{(item as any).company_name}</Text>
            ) : null}
            <View style={styles.tradeRow}>
              <View style={[styles.tradeBadge, { backgroundColor: `${tradeColor}15` }]}>
                <Text style={[styles.tradeBadgeText, { color: tradeColor }]}>
                  {getTradeLabel(item.trade)}
                </Text>
              </View>
              {item.rating > 0 && <Stars rating={item.rating} />}
            </View>
            {item.notes ? (
              <Text style={styles.subNotes} numberOfLines={2}>{item.notes}</Text>
            ) : null}
          </View>
        </View>

        {/* Action buttons: Edit, Call, Text, Email, Delete */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/edit-sub', params: { id: item.id } } as any)}
          >
            <FontAwesome name="pencil" size={15} color={BNG_COLORS.primary} />
            <Text style={[styles.actionText, { color: BNG_COLORS.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(item.phone)}>
            <FontAwesome name="phone" size={15} color={BNG_COLORS.success} />
            <Text style={[styles.actionText, { color: BNG_COLORS.success }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleText(item.phone)}>
            <FontAwesome name="comment" size={15} color={BNG_COLORS.primary} />
            <Text style={[styles.actionText, { color: BNG_COLORS.primary }]}>Text</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleEmail(item.email)}>
            <FontAwesome name="envelope-o" size={15} color={BNG_COLORS.info} />
            <Text style={[styles.actionText, { color: BNG_COLORS.info }]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
            <FontAwesome name="trash-o" size={15} color={BNG_COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View>
          <Text style={styles.title}>My Crew</Text>
          <Text style={styles.subtitle}>
            {subs.length} subcontractor{subs.length !== 1 ? 's' : ''} on file
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-sub' as any)}
        >
          <FontAwesome name="plus" size={14} color="#FFF" />
          <Text style={styles.addButtonText}>Add Sub</Text>
        </TouchableOpacity>
      </View>

      {/* Trade filter chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TRADES}
          keyExtractor={(t) => t.key}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item: t }) => {
            const active = filter === t.key;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  active && { backgroundColor: t.color },
                ]}
                onPress={() => setFilter(t.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  active ? { color: '#FFF' } : { color: BNG_COLORS.textSecondary },
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Sub list */}
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        renderItem={renderSubCard}
        contentContainerStyle={[styles.list, isMobile && styles.listMobile]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome name="users" size={40} color={BNG_COLORS.border} />
            <Text style={styles.emptyTitle}>No subs yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add Sub" to start building your crew roster.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12,
  },
  headerMobile: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '800', color: BNG_COLORS.text },
  subtitle: { fontSize: 13, color: BNG_COLORS.textMuted, marginTop: 2 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BNG_COLORS.primary, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  filterRow: { paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 24, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: BNG_COLORS.surface, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 24, paddingBottom: 100 },
  listMobile: { paddingHorizontal: 16 },
  card: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: BNG_COLORS.border,
    ...SHADOWS.sm,
  },
  cardMobile: { padding: 14 },
  cardTop: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 4 },
  subName: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.text },
  subCompany: { fontSize: 13, color: BNG_COLORS.textMuted, marginBottom: 2 },
  tradeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tradeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  tradeBadgeText: { fontSize: 12, fontWeight: '600' },
  subNotes: { fontSize: 13, color: BNG_COLORS.textMuted, marginTop: 2 },
  actions: {
    flexDirection: 'row', gap: 6, borderTopWidth: 1, borderTopColor: BNG_COLORS.borderLight,
    paddingTop: 12, justifyContent: 'space-around',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  actionText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.textSecondary },
  emptySubtitle: { fontSize: 14, color: BNG_COLORS.textMuted, textAlign: 'center', maxWidth: 260 },
});
