import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useIsTablet, useBreakpoint } from '../../lib/hooks';

// Mock data for leads
const MOCK_LEADS = [
  { id: '1', name: 'John Doe', project_type: 'Kitchen Remodel', status: 'new', date: 'Today, 10:30 AM', phone: '(555) 123-4567', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', project_type: 'Bathroom Update', status: 'contacted', date: 'Yesterday', phone: '(555) 234-5678', email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', project_type: 'Full House Renovation', status: 'quoted', date: 'Mar 10', phone: '(555) 345-6789', email: 'bob@example.com' },
  { id: '4', name: 'Sarah Wilson', project_type: 'Basement Finish', status: 'new', date: 'Mar 9', phone: '(555) 456-7890', email: 'sarah@example.com' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: `${BNG_COLORS.primary}15`, text: BNG_COLORS.primary },
  contacted: { bg: `${BNG_COLORS.info}15`, text: BNG_COLORS.info },
  quoted: { bg: `${BNG_COLORS.success}15`, text: BNG_COLORS.success },
};

export default function LeadsScreen() {
  const isTablet = useIsTablet();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const router = useRouter();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new'>('all');

  const selectedLead = MOCK_LEADS.find(l => l.id === selectedLeadId);
  const filteredLeads = filter === 'all' ? MOCK_LEADS : MOCK_LEADS.filter(l => l.status === 'new');

  const renderLeadItem = ({ item }: { item: typeof MOCK_LEADS[0] }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.new;
    const isSelected = selectedLeadId === item.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.leadItem, 
          isSelected && styles.selectedLeadItem
        ]}
        onPress={() => setSelectedLeadId(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.leadHeader}>
          <View style={styles.leadAvatar}>
            <Text style={styles.leadAvatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName}>{item.name}</Text>
            <Text style={styles.leadProject}>{item.project_type}</Text>
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
            <Text style={styles.leadDate}>{item.date}</Text>
          </View>
          <View style={styles.leadActions}>
            <TouchableOpacity style={styles.actionIcon}>
              <FontAwesome name="phone" size={14} color={BNG_COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon}>
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
            <Text style={styles.detailsProject}>{selectedLead.project_type}</Text>
            
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedLead.status]?.bg || STATUS_COLORS.new.bg }]}>
              <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[selectedLead.status]?.text || STATUS_COLORS.new.text }]}>
                {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
              </Text>
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
                <Text style={styles.contactValue}>{selectedLead.phone}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.contactRow}>
              <View style={styles.contactIconContainer}>
                <FontAwesome name="envelope-o" size={16} color={BNG_COLORS.primary} />
              </View>
              <View>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{selectedLead.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.primaryAction}>
              <FontAwesome name="file-text-o" size={18} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.primaryActionText}>Create Estimate</Text>
            </TouchableOpacity>
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryAction}>
                <FontAwesome name="phone" size={18} color={BNG_COLORS.success} />
                <Text style={styles.secondaryActionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction}>
                <FontAwesome name="envelope" size={18} color={BNG_COLORS.info} />
                <Text style={styles.secondaryActionText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction}>
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
          <View style={styles.divider} />
          {renderDetails()}
        </View>
      ) : (
        selectedLeadId ? renderDetails() : renderList()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BNG_COLORS.background,
  },
  splitPane: {
    flex: 1,
    flexDirection: 'row',
  },
  listContainer: {
    flex: 1,
    backgroundColor: BNG_COLORS.background,
  },
  listContainerTablet: {
    flex: 0.4,
    maxWidth: 400,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  listTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: BNG_COLORS.text,
    letterSpacing: -0.5,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 10,
    padding: 4,
    ...SHADOWS.sm,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: BNG_COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BNG_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BNG_COLORS.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  divider: {
    width: 1,
    backgroundColor: BNG_COLORS.border,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: BNG_COLORS.background,
  },
  detailsContent: {
    flex: 1,
    padding: 20,
  },
  detailsHeader: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BNG_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  leadItem: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  selectedLeadItem: {
    borderColor: BNG_COLORS.primary,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BNG_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leadAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 17,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 4,
  },
  leadProject: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadDate: {
    fontSize: 13,
    color: BNG_COLORS.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
  leadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BNG_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: SHADOWS.md,
      android: {
        elevation: 3,
      },
    }),
  },
  detailsAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BNG_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailsAvatarTextLarge: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
  },
  detailsName: {
    fontSize: 24,
    fontWeight: '800',
    color: BNG_COLORS.text,
    marginBottom: 4,
  },
  detailsProject: {
    fontSize: 16,
    color: BNG_COLORS.textSecondary,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  contactCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactLabel: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: BNG_COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: BNG_COLORS.border,
    marginVertical: 12,
  },
  actionsCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  primaryAction: {
    backgroundColor: BNG_COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: BNG_COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BNG_COLORS.background,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BNG_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...SHADOWS.md,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: BNG_COLORS.textSecondary,
    textAlign: 'center',
  },
});
