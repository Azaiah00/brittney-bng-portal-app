import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useBreakpoint, useWindowDimensions } from '../../lib/hooks';

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
  { id: '1', title: 'Doe Kitchen Remodel', date: 'Due: Apr 1, 2026', icon: 'home', color: BNG_COLORS.primary },
  { id: '2', title: 'Smith Bathroom Update', date: 'Due: Apr 15, 2026', icon: 'shower', color: BNG_COLORS.success },
  { id: '3', title: 'Johnson Full Renovation', date: 'Due: May 1, 2026', icon: 'wrench', color: BNG_COLORS.warning },
  { id: '4', title: 'Permit Submission', date: 'Due: Mar 20, 2026', icon: 'file-text', color: BNG_COLORS.accent },
];

const STAT_CARDS = [
  { label: 'Total Projects', value: '24', footer: 'Increased from last month', primary: true },
  { label: 'Ended Projects', value: '10', footer: 'Increased from last month', primary: false },
  { label: 'Running Projects', value: '12', footer: 'Increased from last month', primary: false },
  { label: 'Pending Project', value: '2', footer: 'On Discuss', primary: false },
];

export default function DashboardScreen() {
  const router = useRouter();
  const bp = useBreakpoint();
  const { width } = useWindowDimensions();

  const isMobile = bp === 'mobile';
  const isDesktop = bp === 'desktop';
  const pad = isMobile ? 16 : isDesktop ? 40 : 28;

  // Stats: 2-col grid on mobile, 4-col on tablet+
  const statCardWidth = isMobile ? (width - pad * 2 - 12) / 2 : undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { padding: pad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Header ── */}
      <View style={[styles.heroHeader, isMobile && styles.heroHeaderMobile]}>
        <View style={styles.heroText}>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>Dashboard</Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            Plan, prioritize, and accomplish your tasks.
          </Text>
        </View>
        <View style={[styles.heroActions, isMobile && styles.heroActionsMobile]}>
          <TouchableOpacity style={[styles.primaryButton, isMobile && styles.buttonSm]} activeOpacity={0.8}>
            <FontAwesome name="plus" size={13} color="#FFF" style={{ marginRight: 7 }} />
            <Text style={[styles.primaryButtonText, isMobile && styles.buttonTextSm]}>Add Project</Text>
          </TouchableOpacity>
          {!isMobile && (
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Import Data</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Stats Grid ── */}
      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        {STAT_CARDS.map((stat, i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              stat.primary && styles.statCardPrimary,
              isMobile && { width: statCardWidth },
            ]}
          >
            <View style={styles.statHeader}>
              <Text style={stat.primary ? styles.statTitleLight : styles.statTitle} numberOfLines={1}>
                {stat.label}
              </Text>
              <View style={stat.primary ? styles.trendArrowLight : styles.trendArrow}>
                <FontAwesome name="arrow-up" size={10} color={stat.primary ? BNG_COLORS.primary : BNG_COLORS.text} />
              </View>
            </View>
            <Text style={[stat.primary ? styles.statValueLight : styles.statValue, isMobile && styles.statValueMobile]}>
              {stat.value}
            </Text>
            <View style={styles.statFooterRow}>
              <Text style={stat.primary ? styles.statFooterTextLight : styles.statFooterText} numberOfLines={2}>
                {stat.footer}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Main Grid ── desktop: 3-col, tablet: 2-col, mobile: 1-col ── */}
      <View style={[styles.mainGrid, isDesktop && styles.mainGridDesktop, bp === 'tablet' && styles.mainGridTablet]}>

        {/* ── Left Column ── */}
        <View style={[styles.column, isDesktop && styles.columnLeft]}>
          {/* Analytics Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Project Analytics</Text>
            <View style={styles.chartContainer}>
              {BAR_DATA.map((bar, i) => (
                <View key={i} style={styles.barCol}>
                  {bar.active && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>{bar.percent}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.bar,
                      { height: `${bar.value}%` as any },
                      bar.active ? styles.barActive : styles.barInactive,
                    ]}
                  />
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
                <FontAwesome name="plus" size={10} color={BNG_COLORS.text} style={{ marginRight: 5 }} />
                <Text style={styles.outlineButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.teamList}>
              {TEAM_MEMBERS.map((m) => (
                <View key={m.id} style={styles.teamItem}>
                  <View style={styles.teamAvatar}>
                    <Text style={styles.teamAvatarText}>{m.avatar}</Text>
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName} numberOfLines={1}>{m.name}</Text>
                    <Text style={styles.teamRole} numberOfLines={1}>{m.role}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${m.color}15` }]}>
                    <Text style={[styles.statusText, { color: m.color }]}>{m.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Middle Column ── */}
        <View style={[styles.column, isDesktop && styles.columnMiddle]}>
          {/* Reminders */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reminders</Text>
            <Text style={styles.reminderTitle}>Meeting with Arc Company</Text>
            <Text style={styles.reminderTime}>Time : 02.00 pm – 04.00 pm</Text>
            <TouchableOpacity style={styles.meetingButton} activeOpacity={0.8}>
              <FontAwesome name="video-camera" size={14} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.meetingButtonText}>Start Meeting</Text>
            </TouchableOpacity>
          </View>

          {/* Project Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Project Progress</Text>
            <View style={styles.progressContainer}>
              <View style={styles.donutWrapper}>
                <View style={styles.donutOuter}>
                  <View style={styles.donutInner}>
                    <Text style={styles.donutValue}>41%</Text>
                    <Text style={styles.donutLabel}>Project Ended</Text>
                  </View>
                </View>
              </View>
              <View style={styles.legendRow}>
                {[
                  { color: BNG_COLORS.primaryDark, label: 'Completed' },
                  { color: BNG_COLORS.primary, label: 'In Progress' },
                  { color: BNG_COLORS.border, label: 'Pending' },
                ].map((l) => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text style={styles.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── Right Column ── */}
        <View style={[styles.column, isDesktop && styles.columnRight]}>
          {/* Project List */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Projects</Text>
              <TouchableOpacity style={styles.outlineButton}>
                <FontAwesome name="plus" size={10} color={BNG_COLORS.text} style={{ marginRight: 5 }} />
                <Text style={styles.outlineButtonText}>New</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.projectList}>
              {PROJECT_LIST.map((p) => (
                <View key={p.id} style={styles.projectListItem}>
                  <View style={[styles.projectListIcon, { backgroundColor: `${p.color}15` }]}>
                    <FontAwesome name={p.icon as any} size={14} color={p.color} />
                  </View>
                  <View style={styles.projectListInfo}>
                    <Text style={styles.projectListTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.projectListDate}>{p.date}</Text>
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},

  // Hero
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 12,
  },
  heroHeaderMobile: {
    marginBottom: 20,
  },
  heroText: { flex: 1 },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: BNG_COLORS.text,
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroTitleMobile: { fontSize: 24 },
  heroSubtitle: {
    fontSize: 15,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
  heroSubtitleMobile: { fontSize: 13 },
  heroActions: { flexDirection: 'row', gap: 10, flexShrink: 0 },
  heroActionsMobile: { gap: 8 },
  primaryButton: {
    backgroundColor: BNG_COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 100,
    ...SHADOWS.glowPrimary,
  },
  buttonSm: { paddingHorizontal: 14, paddingVertical: 9 },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  buttonTextSm: { fontSize: 13 },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    backgroundColor: BNG_COLORS.surface,
  },
  secondaryButtonText: { color: BNG_COLORS.text, fontWeight: '700', fontSize: 14 },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  statsGridMobile: {
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.sm,
  },
  statCardPrimary: { backgroundColor: BNG_COLORS.primaryDark },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.text, flex: 1, marginRight: 4 },
  statTitleLight: { fontSize: 13, fontWeight: '600', color: '#FFF', flex: 1, marginRight: 4 },
  trendArrow: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1, borderColor: BNG_COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  trendArrowLight: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 36, fontWeight: '800', color: BNG_COLORS.text, marginBottom: 12, letterSpacing: -1 },
  statValueLight: { fontSize: 36, fontWeight: '800', color: '#FFF', marginBottom: 12, letterSpacing: -1 },
  statValueMobile: { fontSize: 28 },
  statFooterRow: { flexDirection: 'row', alignItems: 'center' },
  statFooterText: { fontSize: 11, color: BNG_COLORS.textMuted, fontWeight: '500', flex: 1 },
  statFooterTextLight: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', flex: 1 },

  // Main Grid
  mainGrid: { flexDirection: 'column', gap: 20 },
  mainGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  mainGridTablet: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },

  // Columns
  column: { gap: 20 },
  columnLeft: { flex: 2 },
  columnMiddle: { flex: 1.5 },
  columnRight: { flex: 1.5 },

  // Cards
  card: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 16 },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  outlineButtonText: { fontSize: 12, fontWeight: '600', color: BNG_COLORS.text },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
    paddingTop: 30,
  },
  barCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '60%', maxWidth: 36, borderRadius: 18, marginBottom: 10 },
  barActive: { backgroundColor: BNG_COLORS.primary },
  barInactive: { backgroundColor: BNG_COLORS.border, opacity: 0.7 },
  barLabel: { fontSize: 12, fontWeight: '600', color: BNG_COLORS.textMuted },
  tooltip: {
    position: 'absolute',
    top: -24,
    backgroundColor: BNG_COLORS.surface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    ...SHADOWS.sm,
  },
  tooltipText: { fontSize: 11, fontWeight: '700', color: BNG_COLORS.primary },

  // Team
  teamList: { gap: 14 },
  teamItem: { flexDirection: 'row', alignItems: 'center' },
  teamAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: BNG_COLORS.background,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  teamAvatarText: { fontSize: 13, fontWeight: '700', color: BNG_COLORS.text },
  teamInfo: { flex: 1, marginRight: 8 },
  teamName: { fontSize: 14, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  teamRole: { fontSize: 12, color: BNG_COLORS.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Reminders
  reminderTitle: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 6, lineHeight: 26 },
  reminderTime: { fontSize: 13, color: BNG_COLORS.textMuted, marginBottom: 20 },
  meetingButton: {
    backgroundColor: BNG_COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  meetingButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Progress Donut
  progressContainer: { alignItems: 'center' },
  donutWrapper: { width: 180, height: 90, overflow: 'hidden', marginBottom: 16, alignItems: 'center' },
  donutOuter: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 28,
    borderColor: BNG_COLORS.border,
    borderTopColor: BNG_COLORS.primaryDark,
    borderRightColor: BNG_COLORS.primary,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center', justifyContent: 'center',
  },
  donutInner: { transform: [{ rotate: '45deg' }], alignItems: 'center', marginTop: -28 },
  donutValue: { fontSize: 32, fontWeight: '800', color: BNG_COLORS.text, letterSpacing: -1 },
  donutLabel: { fontSize: 11, color: BNG_COLORS.textMuted, fontWeight: '600' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: BNG_COLORS.textSecondary, fontWeight: '500' },

  // Projects List
  projectList: { gap: 18 },
  projectListItem: { flexDirection: 'row', alignItems: 'center' },
  projectListIcon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  projectListInfo: { flex: 1 },
  projectListTitle: { fontSize: 14, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  projectListDate: { fontSize: 12, color: BNG_COLORS.textMuted },

  // Tracker
  trackerCard: { backgroundColor: BNG_COLORS.primaryDark, alignItems: 'center', paddingVertical: 28 },
  trackerTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 12 },
  trackerTime: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: 2, marginBottom: 20 },
  trackerControls: { flexDirection: 'row', gap: 14 },
  trackerBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  trackerBtnRed: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: BNG_COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  trackerStopIcon: { width: 14, height: 14, backgroundColor: '#FFF', borderRadius: 2 },
});
