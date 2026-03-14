import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useIsTablet } from '../../lib/hooks';

const { width } = Dimensions.get('window');

// Mock Data
const BAR_DATA = [
  { day: 'S', value: 40, active: false },
  { day: 'M', value: 70, active: false },
  { day: 'T', value: 85, active: true, percent: '76%' },
  { day: 'W', value: 100, active: false },
  { day: 'T', value: 60, active: false },
  { day: 'F', value: 50, active: false },
  { day: 'S', value: 30, active: false },
];

const TEAM_MEMBERS = [
  { id: '1', name: 'Alexandra Deff', role: 'Working on Kitchen Demo', status: 'Completed', color: BNG_COLORS.success, avatar: 'AD' },
  { id: '2', name: 'Edwin Adenike', role: 'Working on Plumbing Rough-in', status: 'In Progress', color: BNG_COLORS.warning, avatar: 'EA' },
  { id: '3', name: 'Isaac Oluwatemilorun', role: 'Working on Electrical Setup', status: 'Pending', color: BNG_COLORS.accent, avatar: 'IO' },
];

const PROJECT_LIST = [
  { id: '1', title: 'Develop API Endpoints', date: 'Due date: Nov 26, 2026', icon: 'code', color: BNG_COLORS.primary },
  { id: '2', title: 'Onboarding Flow', date: 'Due date: Nov 28, 2026', icon: 'users', color: BNG_COLORS.success },
  { id: '3', title: 'Build Dashboard', date: 'Due date: Nov 30, 2026', icon: 'th-large', color: BNG_COLORS.warning },
  { id: '4', title: 'Optimize Page Load', date: 'Due date: Dec 5, 2026', icon: 'bolt', color: BNG_COLORS.accent },
];

export default function DashboardScreen() {
  const router = useRouter();
  const isTablet = useIsTablet();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View>
          <Text style={styles.heroTitle}>Dashboard</Text>
          <Text style={styles.heroSubtitle}>Plan, prioritize, and accomplish your tasks with ease.</Text>
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <FontAwesome name="plus" size={14} color="#FFF" style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>Add Project</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>Import Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Primary Stat Card */}
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitleLight}>Total Projects</Text>
            <View style={styles.trendArrowLight}>
              <FontAwesome name="arrow-up" size={12} color={BNG_COLORS.primary} />
            </View>
          </View>
          <Text style={styles.statValueLight}>24</Text>
          <View style={styles.statFooter}>
            <View style={styles.badgeLight}>
              <FontAwesome name="line-chart" size={10} color="#FFF" />
            </View>
            <Text style={styles.statFooterTextLight}>Increased from last month</Text>
          </View>
        </View>

        {/* Secondary Stat Cards */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Ended Projects</Text>
            <View style={styles.trendArrow}>
              <FontAwesome name="arrow-up" size={12} color={BNG_COLORS.text} />
            </View>
          </View>
          <Text style={styles.statValue}>10</Text>
          <View style={styles.statFooter}>
            <View style={styles.badge}>
              <FontAwesome name="line-chart" size={10} color={BNG_COLORS.textSecondary} />
            </View>
            <Text style={styles.statFooterText}>Increased from last month</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Running Projects</Text>
            <View style={styles.trendArrow}>
              <FontAwesome name="arrow-up" size={12} color={BNG_COLORS.text} />
            </View>
          </View>
          <Text style={styles.statValue}>12</Text>
          <View style={styles.statFooter}>
            <View style={styles.badge}>
              <FontAwesome name="line-chart" size={10} color={BNG_COLORS.textSecondary} />
            </View>
            <Text style={styles.statFooterText}>Increased from last month</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statTitle}>Pending Project</Text>
            <View style={styles.trendArrow}>
              <FontAwesome name="arrow-right" size={12} color={BNG_COLORS.text} />
            </View>
          </View>
          <Text style={styles.statValue}>2</Text>
          <View style={styles.statFooter}>
            <Text style={styles.statFooterText}>On Discuss</Text>
          </View>
        </View>
      </View>

      {/* Main Content Grid */}
      <View style={styles.mainGrid}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          
          {/* Project Analytics Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Project Analytics</Text>
            <View style={styles.chartContainer}>
              {BAR_DATA.map((bar, i) => (
                <View key={i} style={styles.barCol}>
                  {bar.active && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>{bar.percent}</Text>
                      <View style={styles.tooltipArrow} />
                    </View>
                  )}
                  <View style={[
                    styles.bar, 
                    { height: `${bar.value}%` },
                    bar.active ? styles.barActive : styles.barInactive
                  ]} />
                  <Text style={styles.barLabel}>{bar.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Team Collaboration */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Team Collaboration</Text>
              <TouchableOpacity style={styles.outlineButton}>
                <FontAwesome name="plus" size={10} color={BNG_COLORS.text} style={{ marginRight: 6 }} />
                <Text style={styles.outlineButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.teamList}>
              {TEAM_MEMBERS.map((member, i) => (
                <View key={member.id} style={styles.teamItem}>
                  <View style={styles.teamAvatar}>
                    <Text style={styles.teamAvatarText}>{member.avatar}</Text>
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{member.name}</Text>
                    <Text style={styles.teamRole}>{member.role}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${member.color}15` }]}>
                    <Text style={[styles.statusText, { color: member.color }]}>{member.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Middle Column */}
        <View style={styles.middleColumn}>
          
          {/* Reminders */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reminders</Text>
            <Text style={styles.reminderTitle}>Meeting with Arc Company</Text>
            <Text style={styles.reminderTime}>Time : 02.00 pm - 04.00 pm</Text>
            <TouchableOpacity style={styles.meetingButton}>
              <FontAwesome name="video-camera" size={14} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.meetingButtonText}>Start Meeting</Text>
            </TouchableOpacity>
          </View>

          {/* Project Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Project Progress</Text>
            <View style={styles.progressContainer}>
              {/* Fake Donut Chart via CSS */}
              <View style={styles.donutWrapper}>
                <View style={styles.donutOuter}>
                  <View style={styles.donutInner}>
                    <Text style={styles.donutValue}>41%</Text>
                    <Text style={styles.donutLabel}>Project Ended</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: BNG_COLORS.primary }]} />
                  <Text style={styles.legendText}>Completed</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: BNG_COLORS.primaryDark }]} />
                  <Text style={styles.legendText}>In Progress</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: BNG_COLORS.border }]} />
                  <Text style={styles.legendText}>Pending</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column */}
        <View style={styles.rightColumn}>
          
          {/* Project List */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Project</Text>
              <TouchableOpacity style={styles.outlineButton}>
                <FontAwesome name="plus" size={10} color={BNG_COLORS.text} style={{ marginRight: 6 }} />
                <Text style={styles.outlineButtonText}>New</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.projectList}>
              {PROJECT_LIST.map((proj) => (
                <View key={proj.id} style={styles.projectListItem}>
                  <View style={[styles.projectListIcon, { backgroundColor: `${proj.color}15` }]}>
                    <FontAwesome name={proj.icon as any} size={14} color={proj.color} />
                  </View>
                  <View style={styles.projectListInfo}>
                    <Text style={styles.projectListTitle}>{proj.title}</Text>
                    <Text style={styles.projectListDate}>{proj.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Time Tracker */}
          <View style={[styles.card, styles.trackerCard]}>
            <Text style={styles.trackerTitle}>Time Tracker</Text>
            <Text style={styles.trackerTime}>01:24:08</Text>
            <View style={styles.trackerControls}>
              <TouchableOpacity style={styles.trackerBtn}>
                <FontAwesome name="pause" size={16} color={BNG_COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.trackerBtnRed}>
                <View style={styles.trackerStopIcon} />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
      
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: BNG_COLORS.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: BNG_COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    ...SHADOWS.glowPrimary,
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: BNG_COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  secondaryButtonText: {
    color: BNG_COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.sm,
  },
  statCardPrimary: {
    backgroundColor: BNG_COLORS.primaryDark,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BNG_COLORS.text,
  },
  statTitleLight: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  trendArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendArrowLight: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 40,
    fontWeight: '800',
    color: BNG_COLORS.text,
    marginBottom: 16,
    letterSpacing: -1,
  },
  statValueLight: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: -1,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: BNG_COLORS.background,
    padding: 4,
    borderRadius: 4,
  },
  badgeLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    borderRadius: 4,
  },
  statFooterText: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
    fontWeight: '500',
  },
  statFooterTextLight: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  mainGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 24,
  },
  leftColumn: {
    flex: 2,
    gap: 24,
  },
  middleColumn: {
    flex: 1.5,
    gap: 24,
  },
  rightColumn: {
    flex: 1.5,
    gap: 24,
  },
  card: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 16,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  outlineButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BNG_COLORS.text,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingTop: 30,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '60%',
    maxWidth: 40,
    borderRadius: 20,
    marginBottom: 12,
  },
  barActive: {
    backgroundColor: BNG_COLORS.primary,
  },
  barInactive: {
    backgroundColor: BNG_COLORS.border,
    // Add subtle diagonal stripes effect via opacity if possible, or just solid
    opacity: 0.6,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BNG_COLORS.textMuted,
  },
  tooltip: {
    position: 'absolute',
    top: -30,
    backgroundColor: BNG_COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    ...SHADOWS.sm,
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '700',
    color: BNG_COLORS.primary,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    backgroundColor: BNG_COLORS.surface,
    transform: [{ rotate: '45deg' }],
  },
  teamList: {
    gap: 16,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BNG_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reminderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  reminderTime: {
    fontSize: 13,
    color: BNG_COLORS.textMuted,
    marginBottom: 24,
  },
  meetingButton: {
    backgroundColor: BNG_COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  meetingButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'center',
  },
  donutWrapper: {
    width: 200,
    height: 100,
    overflow: 'hidden',
    marginBottom: 20,
    alignItems: 'center',
  },
  donutOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 30,
    borderColor: BNG_COLORS.border,
    borderTopColor: BNG_COLORS.primaryDark,
    borderRightColor: BNG_COLORS.primary,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    transform: [{ rotate: '45deg' }], // reset rotation for text
    alignItems: 'center',
    marginTop: -30,
  },
  donutValue: {
    fontSize: 36,
    fontWeight: '800',
    color: BNG_COLORS.text,
    letterSpacing: -1,
  },
  donutLabel: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
  projectList: {
    gap: 20,
  },
  projectListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectListIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectListInfo: {
    flex: 1,
  },
  projectListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 2,
  },
  projectListDate: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
  },
  trackerCard: {
    backgroundColor: BNG_COLORS.primaryDark,
    alignItems: 'center',
    paddingVertical: 32,
  },
  trackerTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 16,
  },
  trackerTime: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
    marginBottom: 24,
  },
  trackerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  trackerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerBtnRed: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BNG_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerStopIcon: {
    width: 14,
    height: 14,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  bottomSpacing: {
    height: 40,
  },
});
