import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  SafeAreaView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useResponsivePadding } from '../../lib/hooks';
import { fetchProjects, fetchLeads, fetchCustomers } from '../../lib/data';
import { Database } from '../../types/database';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  active: { bg: `${BNG_COLORS.success}15`, text: BNG_COLORS.success, icon: 'play' },
  pending: { bg: `${BNG_COLORS.warning}15`, text: BNG_COLORS.warning, icon: 'clock-o' },
  completed: { bg: `${BNG_COLORS.info}15`, text: BNG_COLORS.info, icon: 'check' },
};

export default function ProjectsScreen() {
  const router = useRouter();
  const pad = useResponsivePadding();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [contactNames, setContactNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const [data, leads, customers] = await Promise.all([
        fetchProjects(),
        fetchLeads(),
        fetchCustomers(),
      ]);
      setProjects(data);
      const names: Record<string, string> = {};
      leads.forEach((l) => { names[l.id] = l.name; });
      customers.forEach((c) => { names[c.id] = c.name; });
      setContactNames(names);
    } catch { /* Supabase may not be ready */ }
  }, []);

  useFocusEffect(useCallback(() => { loadProjects(); }, [loadProjects]));

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.status === filter);

  const formatBudget = (budget: number | null) => {
    if (!budget) return 'TBD';
    if (budget >= 1000) return `$${(budget / 1000).toFixed(0)}K`;
    return `$${budget}`;
  };

  const getContactName = (item: ProjectRow) => {
    if (item.lead_id && contactNames[item.lead_id]) return contactNames[item.lead_id];
    if (item.customer_id && contactNames[item.customer_id]) return contactNames[item.customer_id];
    return null;
  };

  const renderProjectItem = ({ item }: { item: ProjectRow }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const contactName = getContactName(item);

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => router.push(`/project/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.projectHeader}>
          <View style={styles.projectIconContainer}>
            <FontAwesome name="home" size={24} color={BNG_COLORS.primary} />
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{item.title}</Text>
            <Text style={styles.projectAddress}>{item.address || 'No address'}</Text>
            {contactName ? (
              <Text style={styles.projectContact}>Contact: {contactName}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <FontAwesome name={status.icon as any} size={12} color={status.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: status.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.phaseText}>{item.phase || 'Planning'} Phase</Text>
            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
          </View>
        </View>

        <View style={styles.projectFooter}>
          <View style={styles.footerItem}>
            <FontAwesome name="calendar" size={14} color={BNG_COLORS.textMuted} />
            <Text style={styles.footerText}>{item.start_date || 'No date'}</Text>
          </View>
          <View style={styles.footerItem}>
            <FontAwesome name="usd" size={14} color={BNG_COLORS.textMuted} />
            <Text style={styles.footerText}>{formatBudget(item.budget)}</Text>
          </View>
          <FontAwesome name="arrow-right" size={16} color={BNG_COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: pad }]}>
        <View>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.subtitle}>Track your ongoing renovations</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-project')}
          >
            <FontAwesome name="plus" size={16} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterMenu(!showFilterMenu)}
          >
            <FontAwesome name="sliders" size={20} color={BNG_COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter dropdown */}
      {showFilterMenu && (
        <View style={styles.filterDropdown}>
          {(['all', 'active', 'completed', 'pending'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterDropdownItem, filter === f && styles.filterDropdownItemActive]}
              onPress={() => { setFilter(f); setShowFilterMenu(false); }}
            >
              <Text style={[styles.filterDropdownText, filter === f && { color: '#FFF' }]}>
                {f === 'all' ? 'All Projects' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.filterTabs}>
        {(['all', 'active'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All Projects' : 'Active Only'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredProjects}
        keyExtractor={item => item.id}
        renderItem={renderProjectItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <FontAwesome name="briefcase" size={40} color={BNG_COLORS.textMuted} />
            <Text style={{ color: BNG_COLORS.textMuted, fontSize: 16, marginTop: 12 }}>No projects found</Text>
            <TouchableOpacity
              style={{ marginTop: 16, backgroundColor: BNG_COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
              onPress={() => router.push('/add-project')}
            >
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Add First Project</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingTop: 16, paddingBottom: 16,
  },
  title: { fontSize: 32, fontWeight: '800', color: BNG_COLORS.text, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 16, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  addButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: BNG_COLORS.primary,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  filterButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: BNG_COLORS.surface,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  filterDropdown: {
    position: 'absolute', top: 80, right: 16, zIndex: 100,
    backgroundColor: BNG_COLORS.surface, borderRadius: 12, padding: 4,
    ...Platform.select({ ios: SHADOWS.lg, android: { elevation: 8 } }),
  },
  filterDropdownItem: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  filterDropdownItemActive: { backgroundColor: BNG_COLORS.primary },
  filterDropdownText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.text },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: BNG_COLORS.surface },
  filterTabActive: { backgroundColor: BNG_COLORS.primary },
  filterTabText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.textSecondary },
  filterTabTextActive: { color: '#FFF' },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  projectCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 4, borderWidth: 1, borderColor: BNG_COLORS.border } }),
  },
  projectHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  projectIconContainer: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 4 },
  projectAddress: { fontSize: 14, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  projectContact: { fontSize: 13, color: BNG_COLORS.primary, fontWeight: '600', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  progressSection: { marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  phaseText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.textSecondary },
  progressText: { fontSize: 14, fontWeight: '700', color: BNG_COLORS.primary },
  progressBarBg: { height: 8, backgroundColor: BNG_COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: BNG_COLORS.primary, borderRadius: 4 },
  projectFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 16, borderTopWidth: 1, borderTopColor: BNG_COLORS.border,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 14, color: BNG_COLORS.textSecondary, fontWeight: '500' },
});
