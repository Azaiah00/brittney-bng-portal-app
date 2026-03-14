import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  SafeAreaView, Platform, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useIsTablet, useBreakpoint } from '../../lib/hooks';
import { fetchLeads, updateLeadStatus } from '../../lib/data';
import { Database } from '../../types/database';

type LeadRow = Database['public']['Tables']['leads']['Row'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: `${BNG_COLORS.primary}15`, text: BNG_COLORS.primary },
  contacted: { bg: `${BNG_COLORS.info}15`, text: BNG_COLORS.info },
  quoted: { bg: `${BNG_COLORS.success}15`, text: BNG_COLORS.success },
  converted: { bg: `${BNG_COLORS.warning}15`, text: BNG_COLORS.warning },
};

export default function LeadsScreen() {
  const isTablet = useIsTablet();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new'>('all');

  // Load leads from Supabase each time screen gains focus
  const loadLeads = useCallback(async () => {
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch { /* Supabase may not be ready */ }
  }, []);

  useFocusEffect(useCallback(() => { loadLeads(); }, [loadLeads]));

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.status === 'new');

  // ── Contact actions via deep links ──
  const handleCall = (phone: string | null) => {
    if (!phone) { Alert.alert('No Phone', 'This lead has no phone number.'); return; }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string | null) => {
    if (!email) { Alert.alert('No Email', 'This lead has no email address.'); return; }
    Linking.openURL(`mailto:${email}`);
  };

  const handleText = (phone: string | null) => {
    if (!phone) { Alert.alert('No Phone', 'This lead has no phone number.'); return; }
    Linking.openURL(`sms:${phone}`);
  };

  // ── Status update ──
  const handleStatusChange = async (id: string, newStatus: LeadRow['status']) => {
    try {
      await updateLeadStatus(id, newStatus);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const renderLeadItem = ({ item }: { item: LeadRow }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.new;
    const isSelected = selectedLeadId === item.id;
    const dateStr = new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

    return (
      <TouchableOpacity
        style={[styles.leadItem, isSelected && styles.selectedLeadItem]}
        onPress={() => setSelectedLeadId(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.leadHeader}>
          <View style={styles.leadAvatar}>
            <Text style={styles.leadAvatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName}>{item.name}</Text>
            <Text style={styles.leadProject}>{item.project_type || 'General Inquiry'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.leadFooter}>
          <View style={styles.dateContainer}>
            <FontAwesome name="clock-o" size={14} color={BNG_COLORS.textMuted} />
            <Text style={styles.leadDate}>{dateStr}</Text>
          </View>
          <View style={styles.leadActions}>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleCall(item.phone)}>
              <FontAwesome name="phone" size={14} color={BNG_COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleEmail(item.email)}>
              <FontAwesome name="envelope-o" size={14} color={BNG_COLORS.info} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderList = () => (
    <View style={[styles.listContainer, isTablet && styles.listContainerTablet]}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Leads</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'new' && styles.filterButtonActive]}
            onPress={() => setFilter('new')}
          >
            <Text style={[styles.filterText, filter === 'new' && styles.filterTextActive]}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredLeads}
        keyExtractor={item => item.id}
        renderItem={renderLeadItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <FontAwesome name="users" size={40} color={BNG_COLORS.textMuted} />
            <Text style={{ color: BNG_COLORS.textMuted, fontSize: 16, marginTop: 12 }}>No leads yet</Text>
            <Text style={{ color: BNG_COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
              Use the AI Scratchpad to add your first lead.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/scratchpad')}
        activeOpacity={0.8}
      >
        <FontAwesome name="plus" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  const renderDetails = () => (
    <View style={styles.detailsContainer}>
      {selectedLead ? (
        <View style={styles.detailsContent}>
          <View style={styles.detailsHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedLeadId(null)}
            >
              <FontAwesome name="arrow-left" size={18} color={BNG_COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailsAvatarLarge}>
              <Text style={styles.detailsAvatarTextLarge}>{selectedLead.name.charAt(0)}</Text>
            </View>
            <Text style={styles.detailsName}>{selectedLead.name}</Text>
            <Text style={styles.detailsProject}>{selectedLead.project_type || 'General Inquiry'}</Text>

            {/* Status selector */}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(['new', 'contacted', 'quoted', 'converted'] as const).map(s => {
                const sc = STATUS_COLORS[s];
                const active = selectedLead.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, active && { backgroundColor: sc.bg, borderColor: sc.text }]}
                    onPress={() => handleStatusChange(selectedLead.id, s)}
                  >
                    <Text style={[styles.statusChipText, active && { color: sc.text }]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactCardTitle}>Contact Info</Text>

            <View style={styles.contactRow}>
              <View style={styles.contactIconContainer}>
                <FontAwesome name="phone" size={16} color={BNG_COLORS.primary} />
              </View>
              <View>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{selectedLead.phone || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.contactRow}>
              <View style={styles.contactIconContainer}>
                <FontAwesome name="envelope-o" size={16} color={BNG_COLORS.primary} />
              </View>
              <View>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{selectedLead.email || 'Not provided'}</Text>
              </View>
            </View>

            {selectedLead.address && (
              <>
                <View style={styles.divider} />
                <View style={styles.contactRow}>
                  <View style={styles.contactIconContainer}>
                    <FontAwesome name="map-marker" size={16} color={BNG_COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.contactLabel}>Address</Text>
                    <Text style={styles.contactValue}>{selectedLead.address}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => router.push('/add-project')}
            >
              <FontAwesome name="file-text-o" size={18} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.primaryActionText}>Create Project</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleCall(selectedLead.phone)}>
                <FontAwesome name="phone" size={18} color={BNG_COLORS.success} />
                <Text style={styles.secondaryActionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleEmail(selectedLead.email)}>
                <FontAwesome name="envelope" size={18} color={BNG_COLORS.info} />
                <Text style={styles.secondaryActionText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleText(selectedLead.phone)}>
                <FontAwesome name="comment" size={18} color={BNG_COLORS.accent} />
                <Text style={styles.secondaryActionText}>Text</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconContainer}>
            <FontAwesome name="inbox" size={48} color={BNG_COLORS.textMuted} />
          </View>
          <Text style={styles.emptyStateTitle}>No Lead Selected</Text>
          <Text style={styles.emptyStateText}>Choose a lead to view details and take action</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isTablet ? (
        <View style={styles.splitPane}>
          {renderList()}
          <View style={styles.splitDivider} />
          {renderDetails()}
        </View>
      ) : (
        selectedLeadId ? renderDetails() : renderList()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  splitPane: { flex: 1, flexDirection: 'row' },
  splitDivider: { width: 1, backgroundColor: BNG_COLORS.border },
  listContainer: { flex: 1, backgroundColor: BNG_COLORS.background },
  listContainerTablet: { flex: 0.4, maxWidth: 400 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
  },
  listTitle: { fontSize: 28, fontWeight: '800', color: BNG_COLORS.text, letterSpacing: -0.5 },
  filterContainer: {
    flexDirection: 'row', backgroundColor: BNG_COLORS.surface,
    borderRadius: 10, padding: 4, ...SHADOWS.sm,
  },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  filterButtonActive: { backgroundColor: BNG_COLORS.primary },
  filterText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.textSecondary },
  filterTextActive: { color: '#FFF' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: BNG_COLORS.accent, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: BNG_COLORS.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  detailsContainer: { flex: 1, backgroundColor: BNG_COLORS.background },
  detailsContent: { flex: 1, padding: 20 },
  detailsHeader: { marginBottom: 16 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: BNG_COLORS.surface,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  listContent: { padding: 16, paddingBottom: 100 },
  leadItem: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, marginBottom: 12, padding: 16,
    borderWidth: 2, borderColor: 'transparent',
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  selectedLeadItem: { borderColor: BNG_COLORS.primary },
  leadHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  leadAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: BNG_COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  leadAvatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  leadInfo: { flex: 1 },
  leadName: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 4 },
  leadProject: { fontSize: 14, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  leadFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: BNG_COLORS.border,
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  leadDate: { fontSize: 13, color: BNG_COLORS.textMuted, marginLeft: 6, fontWeight: '500' },
  leadActions: { flexDirection: 'row', gap: 8 },
  actionIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: BNG_COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  detailsCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 20, padding: 24, alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 3 } }),
  },
  detailsAvatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: BNG_COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  detailsAvatarTextLarge: { color: '#FFF', fontSize: 32, fontWeight: '700' },
  detailsName: { fontSize: 24, fontWeight: '800', color: BNG_COLORS.text, marginBottom: 4 },
  detailsProject: { fontSize: 16, color: BNG_COLORS.textSecondary, marginBottom: 12 },
  statusChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  statusChipText: { fontSize: 12, fontWeight: '600', color: BNG_COLORS.textSecondary },
  contactCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  contactCardTitle: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactIconContainer: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  contactLabel: { fontSize: 12, color: BNG_COLORS.textMuted, marginBottom: 2 },
  contactValue: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.text },
  divider: { height: 1, backgroundColor: BNG_COLORS.border, marginVertical: 12 },
  actionsCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, padding: 20,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  primaryAction: {
    backgroundColor: BNG_COLORS.accent, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: BNG_COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  primaryActionText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  secondaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: BNG_COLORS.background, paddingVertical: 12, borderRadius: 10, gap: 8,
  },
  secondaryActionText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.text },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyStateIconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: BNG_COLORS.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...SHADOWS.md,
  },
  emptyStateTitle: { fontSize: 22, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 8 },
  emptyStateText: { fontSize: 16, color: BNG_COLORS.textSecondary, textAlign: 'center' },
});
