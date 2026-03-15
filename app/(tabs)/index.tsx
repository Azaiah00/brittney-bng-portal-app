import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useBreakpoint, useWindowDimensions } from '../../lib/hooks';
import { fetchDashboardStats, fetchProjects, DashboardStats } from '../../lib/data';
import { syncOfflineLeads } from '../../lib/offline';

type ProjectItem = { id: string; title: string; status: string; phase: string | null; start_date: string | null; created_at: string };

export default function DashboardScreen() {
  const router = useRouter();
  const bp = useBreakpoint();
  const { width } = useWindowDimensions();
  const isMobile = bp === 'mobile';
  const isDesktop = bp === 'desktop';
  const pad = isMobile ? 16 : isDesktop ? 40 : 28;

  // ── Live data ──
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0, activeProjects: 0, completedProjects: 0, pendingProjects: 0,
    totalLeads: 0, newLeads: 0, totalCustomers: 0,
  });
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([fetchDashboardStats(), fetchProjects()]);
      setStats(s);
      setProjects(p);
    } catch { /* Supabase may not be ready yet */ }
  }, []);

  // Reload when screen gains focus
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Sync any offline leads on mount
  useEffect(() => { syncOfflineLeads().catch(() => {}); }, []);

  // ── Time Tracker state ──
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRunning) return;
    setTimerRunning(true);
    intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const stopTimer = () => {
    pauseTimer();
    if (timerSeconds > 0) {
      const formatted = formatTime(timerSeconds);
      Alert.alert('Time Logged', `You tracked ${formatted}. Great work!`);
    }
    setTimerSeconds(0);
  };

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── Derived stat cards ──
  const statCards = [
    { label: 'Total Projects', value: String(stats.totalProjects), footer: `${stats.totalCustomers} customers, ${stats.totalLeads} leads`, primary: true },
    { label: 'Active Projects', value: String(stats.activeProjects), footer: 'Currently in progress', primary: false },
    { label: 'Completed', value: String(stats.completedProjects), footer: 'Finished projects', primary: false },
    { label: 'New Leads', value: String(stats.newLeads), footer: 'Waiting for follow-up', primary: false },
  ];

  // ── Project Analytics: real activity this week (projects created per day) ──
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const getWeekBounds = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    return { start: sunday };
  };
  const { start: weekStart } = getWeekBounds();
  const dayCounts = weekDays.map((_, i) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const dayStr = dayStart.toISOString().slice(0, 10);
    const count = projects.filter((p) => {
      const created = (p.created_at || '').slice(0, 10);
      return created === dayStr;
    }).length;
    return { day: weekDays[i], count };
  });
  const maxCount = Math.max(1, ...dayCounts.map((d) => d.count));
  const barData = dayCounts.map((d, i) => ({
    day: d.day,
    value: maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0,
    active: d.count > 0 && d.count === maxCount,
    percent: String(d.count),
  }));

  const statCardWidth = isMobile ? (width - pad * 2 - 12) / 2 : undefined;

  // Icon mapping for project types
  const getProjectIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('kitchen')) return 'cutlery';
    if (t.includes('bath')) return 'shower';
    if (t.includes('renovation') || t.includes('remodel')) return 'wrench';
    return 'home';
  };

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
          <TouchableOpacity
            style={[styles.primaryButton, isMobile && styles.buttonSm]}
            activeOpacity={0.8}
            onPress={() => router.push('/add-project')}
          >
            <FontAwesome name="plus" size={13} color="#FFF" style={{ marginRight: 7 }} />
            <Text style={[styles.primaryButtonText, isMobile && styles.buttonTextSm]}>Add Project</Text>
          </TouchableOpacity>
          {!isMobile && (
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={() => router.push('/scratchpad')}
            >
              <Text style={styles.secondaryButtonText}>Import Lead</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Stats Grid ── */}
      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        {statCards.map((stat, i) => (
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

      {/* ── Main Grid ── */}
      <View style={[styles.mainGrid, isDesktop && styles.mainGridDesktop, bp === 'tablet' && styles.mainGridTablet]}>

        {/* ── Left Column ── */}
        <View style={[styles.column, isDesktop && styles.columnLeft]}>
          {/* Analytics Chart - projects created per day this week */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Project Analytics</Text>
            <Text style={styles.chartSubtitle}>Projects created this week</Text>
            <View style={styles.chartContainer}>
              {barData.map((bar, i) => (
                <View key={i} style={styles.barCol}>
                  {bar.active && bar.percent !== '0' && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>{bar.percent}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.bar,
                      { height: `${bar.value > 0 ? Math.max(bar.value, 8) : 4}%` as any },
                      bar.active && bar.value > 0 ? styles.barActive : styles.barInactive,
                    ]}
                  />
                  <Text style={styles.barLabel}>{bar.day}</Text>
                </View>
              ))}
            </View>
            {maxCount === 0 && (
              <Text style={styles.chartEmpty}>No projects created this week yet.</Text>
            )}
          </View>

          {/* Recent Activity -- shows latest projects */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Recent Activity</Text>
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => router.push('/projects')}
              >
                <Text style={styles.outlineButtonText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.teamList}>
              {projects.length === 0 && (
                <Text style={{ color: BNG_COLORS.textMuted, fontSize: 14, textAlign: 'center', padding: 20 }}>
                  No projects yet. Tap "Add Project" to get started.
                </Text>
              )}
              {projects.slice(0, 3).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.teamItem}
                  onPress={() => router.push(`/project/${p.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.teamAvatar}>
                    <Text style={styles.teamAvatarText}>{p.title.charAt(0)}</Text>
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.teamRole} numberOfLines={1}>{p.phase || 'Planning'} Phase</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: p.status === 'active' ? `${BNG_COLORS.success}15` :
                      p.status === 'completed' ? `${BNG_COLORS.info}15` : `${BNG_COLORS.warning}15`
                  }]}>
                    <Text style={[styles.statusText, {
                      color: p.status === 'active' ? BNG_COLORS.success :
                        p.status === 'completed' ? BNG_COLORS.info : BNG_COLORS.warning
                    }]}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Middle Column ── */}
        <View style={[styles.column, isDesktop && styles.columnMiddle]}>
          {/* Quick Actions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.meetingButton}
              activeOpacity={0.8}
              onPress={() => router.push('/scratchpad')}
            >
              <FontAwesome name="magic" size={14} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.meetingButtonText}>AI Scratchpad</Text>
            </TouchableOpacity>
            <View style={{ height: 10 }} />
            <TouchableOpacity
              style={[styles.meetingButton, { backgroundColor: BNG_COLORS.accent }]}
              activeOpacity={0.8}
              onPress={() => router.push('/add-event')}
            >
              <FontAwesome name="calendar-plus-o" size={14} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.meetingButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>

          {/* Project Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Project Progress</Text>
            <View style={styles.progressContainer}>
              <View style={styles.donutWrapper}>
                <View style={styles.donutOuter}>
                  <View style={styles.donutInner}>
                    <Text style={styles.donutValue}>
                      {stats.totalProjects > 0
                        ? `${Math.round((stats.completedProjects / stats.totalProjects) * 100)}%`
                        : '0%'}
                    </Text>
                    <Text style={styles.donutLabel}>Completed</Text>
                  </View>
                </View>
              </View>
              <View style={styles.legendRow}>
                {[
                  { color: BNG_COLORS.primaryDark, label: `Completed (${stats.completedProjects})` },
                  { color: BNG_COLORS.primary, label: `Active (${stats.activeProjects})` },
                  { color: BNG_COLORS.border, label: `Pending (${stats.pendingProjects})` },
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
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => router.push('/add-project')}
              >
                <FontAwesome name="plus" size={10} color={BNG_COLORS.text} style={{ marginRight: 5 }} />
                <Text style={styles.outlineButtonText}>New</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.projectList}>
              {projects.length === 0 && (
                <Text style={{ color: BNG_COLORS.textMuted, fontSize: 14, textAlign: 'center', padding: 16 }}>
                  No projects yet.
                </Text>
              )}
              {projects.slice(0, 5).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.projectListItem}
                  onPress={() => router.push(`/project/${p.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.projectListIcon, { backgroundColor: `${BNG_COLORS.primary}15` }]}>
                    <FontAwesome name={getProjectIcon(p.title) as any} size={14} color={BNG_COLORS.primary} />
                  </View>
                  <View style={styles.projectListInfo}>
                    <Text style={styles.projectListTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.projectListDate}>
                      {p.start_date ? `Start: ${p.start_date}` : p.status}
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={12} color={BNG_COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Tracker -- fully functional */}
          <View style={[styles.card, styles.trackerCard]}>
            <Text style={styles.trackerTitle}>Time Tracker</Text>
            <Text style={styles.trackerTime}>{formatTime(timerSeconds)}</Text>
            <View style={styles.trackerControls}>
              {!timerRunning ? (
                <TouchableOpacity style={styles.trackerBtn} onPress={startTimer}>
                  <FontAwesome name="play" size={16} color={BNG_COLORS.primary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.trackerBtn} onPress={pauseTimer}>
                  <FontAwesome name="pause" size={16} color={BNG_COLORS.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.trackerBtnRed} onPress={stopTimer}>
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
  heroHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 28, flexWrap: 'wrap', gap: 12,
  },
  heroHeaderMobile: { marginBottom: 20 },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: BNG_COLORS.text, letterSpacing: -1, marginBottom: 6 },
  heroTitleMobile: { fontSize: 24 },
  heroSubtitle: { fontSize: 15, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  heroSubtitleMobile: { fontSize: 13 },
  heroActions: { flexDirection: 'row', gap: 10, flexShrink: 0 },
  heroActionsMobile: { gap: 8 },
  primaryButton: {
    backgroundColor: BNG_COLORS.primaryDark, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 100, ...SHADOWS.glowPrimary,
  },
  buttonSm: { paddingHorizontal: 14, paddingVertical: 9 },
  primaryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  buttonTextSm: { fontSize: 13 },
  secondaryButton: {
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 100,
    borderWidth: 1, borderColor: BNG_COLORS.border, backgroundColor: BNG_COLORS.surface,
  },
  secondaryButtonText: { color: BNG_COLORS.text, fontWeight: '700', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 28 },
  statsGridMobile: { gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: 180, backgroundColor: BNG_COLORS.surface,
    borderRadius: 20, padding: 20, ...SHADOWS.sm,
  },
  statCardPrimary: { backgroundColor: BNG_COLORS.primaryDark },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statTitle: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.text, flex: 1, marginRight: 4 },
  statTitleLight: { fontSize: 13, fontWeight: '600', color: '#FFF', flex: 1, marginRight: 4 },
  trendArrow: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: BNG_COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  trendArrowLight: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 36, fontWeight: '800', color: BNG_COLORS.text, marginBottom: 12, letterSpacing: -1 },
  statValueLight: { fontSize: 36, fontWeight: '800', color: '#FFF', marginBottom: 12, letterSpacing: -1 },
  statValueMobile: { fontSize: 28 },
  statFooterRow: { flexDirection: 'row', alignItems: 'center' },
  statFooterText: { fontSize: 11, color: BNG_COLORS.textMuted, fontWeight: '500', flex: 1 },
  statFooterTextLight: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', flex: 1 },
  mainGrid: { flexDirection: 'column', gap: 20 },
  mainGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  mainGridTablet: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  column: { gap: 20 },
  columnLeft: { flex: 2 },
  columnMiddle: { flex: 1.5 },
  columnRight: { flex: 1.5 },
  card: { backgroundColor: BNG_COLORS.surface, borderRadius: 20, padding: 20, ...SHADOWS.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 16 },
  chartSubtitle: { fontSize: 12, color: BNG_COLORS.textMuted, marginBottom: 8, fontWeight: '500' },
  chartEmpty: { fontSize: 13, color: BNG_COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  outlineButton: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 100, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  outlineButtonText: { fontSize: 12, fontWeight: '600', color: BNG_COLORS.text },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, paddingTop: 30 },
  barCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '60%', maxWidth: 36, borderRadius: 18, marginBottom: 10 },
  barActive: { backgroundColor: BNG_COLORS.primary },
  barInactive: { backgroundColor: BNG_COLORS.border, opacity: 0.7 },
  barLabel: { fontSize: 12, fontWeight: '600', color: BNG_COLORS.textMuted },
  tooltip: {
    position: 'absolute', top: -24, backgroundColor: BNG_COLORS.surface,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, ...SHADOWS.sm,
  },
  tooltipText: { fontSize: 11, fontWeight: '700', color: BNG_COLORS.primary },
  teamList: { gap: 14 },
  teamItem: { flexDirection: 'row', alignItems: 'center' },
  teamAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: BNG_COLORS.background,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  teamAvatarText: { fontSize: 13, fontWeight: '700', color: BNG_COLORS.text },
  teamInfo: { flex: 1, marginRight: 8 },
  teamName: { fontSize: 14, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  teamRole: { fontSize: 12, color: BNG_COLORS.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 11, fontWeight: '700' },
  meetingButton: {
    backgroundColor: BNG_COLORS.primaryDark, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 13, borderRadius: 12,
  },
  meetingButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  progressContainer: { alignItems: 'center' },
  donutWrapper: { width: 180, height: 90, overflow: 'hidden', marginBottom: 16, alignItems: 'center' },
  donutOuter: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 28, borderColor: BNG_COLORS.border,
    borderTopColor: BNG_COLORS.primaryDark, borderRightColor: BNG_COLORS.primary,
    transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center',
  },
  donutInner: { transform: [{ rotate: '45deg' }], alignItems: 'center', marginTop: -28 },
  donutValue: { fontSize: 32, fontWeight: '800', color: BNG_COLORS.text, letterSpacing: -1 },
  donutLabel: { fontSize: 11, color: BNG_COLORS.textMuted, fontWeight: '600' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  projectList: { gap: 18 },
  projectListItem: { flexDirection: 'row', alignItems: 'center' },
  projectListIcon: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  projectListInfo: { flex: 1 },
  projectListTitle: { fontSize: 14, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  projectListDate: { fontSize: 12, color: BNG_COLORS.textMuted },
  trackerCard: { backgroundColor: BNG_COLORS.primaryDark, alignItems: 'center', paddingVertical: 28 },
  trackerTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 12 },
  trackerTime: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: 2, marginBottom: 20 },
  trackerControls: { flexDirection: 'row', gap: 14 },
  trackerBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  trackerBtnRed: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: BNG_COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  trackerStopIcon: { width: 14, height: 14, backgroundColor: '#FFF', borderRadius: 2 },
});
