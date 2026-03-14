import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useResponsivePadding } from '../../lib/hooks';

// Mock data for projects
const MOCK_PROJECTS = [
  { 
    id: '1', 
    title: 'Doe Kitchen Remodel', 
    status: 'in-progress', 
    start_date: '2026-04-01',
    budget: '$45,000',
    address: '123 Oak St, Richmond',
    progress: 35,
    phase: 'Demo'
  },
  { 
    id: '2', 
    title: 'Smith Bathroom Update', 
    status: 'in-progress', 
    start_date: '2026-04-15',
    budget: '$18,500',
    address: '456 Pine Ave, Richmond',
    progress: 10,
    phase: 'Planning'
  },
  { 
    id: '3', 
    title: 'Johnson Full Renovation', 
    status: 'pending', 
    start_date: '2026-05-01',
    budget: '$125,000',
    address: '789 Maple Dr, Richmond',
    progress: 0,
    phase: 'Contract'
  },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  'in-progress': { bg: `${BNG_COLORS.success}15`, text: BNG_COLORS.success, icon: 'play' },
  'pending': { bg: `${BNG_COLORS.warning}15`, text: BNG_COLORS.warning, icon: 'clock-o' },
  'completed': { bg: `${BNG_COLORS.info}15`, text: BNG_COLORS.info, icon: 'check' },
};

export default function ProjectsScreen() {
  const router = useRouter();
  const pad = useResponsivePadding();
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  const filteredProjects = filter === 'all' 
    ? MOCK_PROJECTS 
    : MOCK_PROJECTS.filter(p => p.status === 'in-progress');

  const renderProjectItem = ({ item }: { item: typeof MOCK_PROJECTS[0] }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    
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
            <Text style={styles.projectAddress}>{item.address}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <FontAwesome name={status.icon} size={12} color={status.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: status.text }]}>
              {item.status === 'in-progress' ? 'Active' : item.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.phaseText}>{item.phase} Phase</Text>
            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
          </View>
        </View>

        <View style={styles.projectFooter}>
          <View style={styles.footerItem}>
            <FontAwesome name="calendar" size={14} color={BNG_COLORS.textMuted} />
            <Text style={styles.footerText}>{item.start_date}</Text>
          </View>
          <View style={styles.footerItem}>
            <FontAwesome name="usd" size={14} color={BNG_COLORS.textMuted} />
            <Text style={styles.footerText}>{item.budget}</Text>
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
        <TouchableOpacity style={styles.filterButton}>
          <FontAwesome name="sliders" size={20} color={BNG_COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All Projects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
            Active Only
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredProjects}
        keyExtractor={item => item.id}
        renderItem={renderProjectItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BNG_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: BNG_COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BNG_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BNG_COLORS.surface,
  },
  filterTabActive: {
    backgroundColor: BNG_COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  projectCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: SHADOWS.md,
      android: {
        elevation: 4,
        borderWidth: 1,
        borderColor: BNG_COLORS.border,
      },
    }),
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  projectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 4,
  },
  projectAddress: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  phaseText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.textSecondary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: BNG_COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: BNG_COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BNG_COLORS.primary,
    borderRadius: 4,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
});
