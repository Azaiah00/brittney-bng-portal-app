import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
  Alert, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { requestCalendarPermissions } from '../../lib/calendar';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { fetchEvents, fetchProjects } from '../../lib/data';
import { Database } from '../../types/database';

type EventRow = Database['public']['Tables']['events']['Row'];

const EVENT_COLORS: Record<string, string> = {
  walkthrough: BNG_COLORS.primary,
  meeting: BNG_COLORS.accent,
  review: BNG_COLORS.success,
  inspection: BNG_COLORS.warning,
  other: BNG_COLORS.info,
};

// Helper: get the Monday of the week containing a given date
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

// Format: "March 2026"
function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Format date as YYYY-MM-DD for Supabase queries
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function CalendarScreen() {
  const router = useRouter();
  const [isSynced, setIsSynced] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [milestones, setMilestones] = useState<{ title: string; project: string; date: string }[]>([]);

  // Calculate the week dates dynamically
  const today = new Date();
  const baseMonday = getMonday(today);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDates = weekDays.map((_, i) => {
    const d = new Date(baseMonday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const selectedDate = weekDates[selectedDayIndex];
  const selectedDateStr = toDateStr(selectedDate);

  // Load events for the visible week
  const loadData = useCallback(async () => {
    try {
      const startStr = toDateStr(weekDates[0]);
      const endStr = toDateStr(weekDates[6]);
      const evts = await fetchEvents(startStr, endStr);
      setEvents(evts);

      // Milestones from projects with upcoming walkthrough dates
      const projects = await fetchProjects();
      const upcoming = projects
        .filter(p => p.walkthrough_date || p.start_date)
        .map(p => ({
          title: p.walkthrough_date ? 'Walkthrough' : 'Start Date',
          project: p.title,
          date: (p.walkthrough_date || p.start_date)!,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
      setMilestones(upcoming);
    } catch { /* Supabase may not be ready */ }
  }, [weekOffset]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Filter events for selected day
  const dayEvents = events.filter(e => e.event_date === selectedDateStr);

  const handleSync = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Calendar sync is only available on iOS/iPadOS.');
      return;
    }
    const granted = await requestCalendarPermissions();
    if (granted) {
      setIsSynced(true);
      Alert.alert('Success', 'Calendar permissions granted.');
    } else {
      Alert.alert('Permission Denied', 'Please enable calendar access in Settings.');
    }
  };

  // Check if a date is today
  const isToday = (d: Date) => toDateStr(d) === toDateStr(today);

  // Check if any event falls on a date
  const hasEvent = (d: Date) => events.some(e => e.event_date === toDateStr(d));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Calendar</Text>
            <Text style={styles.subtitle}>Manage your schedule</Text>
          </View>
          <View style={[styles.syncBadge, !isSynced && styles.syncBadgeError]}>
            <View style={[styles.syncDot, !isSynced && styles.syncDotError]} />
            <Text style={[styles.syncText, !isSynced && styles.syncTextError]}>
              {isSynced ? 'Synced' : 'Not Synced'}
            </Text>
          </View>
        </View>

        {/* Calendar Sync Card */}
        <View style={styles.syncCard}>
          <View style={styles.syncIconContainer}>
            <FontAwesome name={isSynced ? 'check-circle' : 'calendar-plus-o'} size={32} color={isSynced ? BNG_COLORS.success : BNG_COLORS.accent} />
          </View>
          <View style={styles.syncContent}>
            <Text style={styles.syncCardTitle}>Apple Calendar</Text>
            <Text style={styles.syncCardText}>
              {isSynced ? 'Syncing with Apple Calendar.' : 'Enable sync for automatic event creation.'}
            </Text>
          </View>
          {!isSynced && (
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
              <Text style={styles.syncButtonText}>Enable</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Week View */}
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>{formatMonthYear(selectedDate)}</Text>
            <View style={styles.weekNav}>
              <TouchableOpacity style={styles.navButton} onPress={() => setWeekOffset(w => w - 1)}>
                <FontAwesome name="chevron-left" size={14} color={BNG_COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, { marginHorizontal: 4 }]}
                onPress={() => { setWeekOffset(0); setSelectedDayIndex(today.getDay() === 0 ? 6 : today.getDay() - 1); }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: BNG_COLORS.primary }}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={() => setWeekOffset(w => w + 1)}>
                <FontAwesome name="chevron-right" size={14} color={BNG_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.daysContainer}>
            {weekDays.map((day, index) => {
              const isSelected = index === selectedDayIndex;
              const isTodayDate = isToday(weekDates[index]);
              return (
                <TouchableOpacity
                  key={day + index}
                  style={[styles.dayItem, isSelected && styles.dayItemActive]}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <Text style={[styles.dayName, isSelected && styles.dayTextActive]}>{day}</Text>
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.dayTextActive,
                    isTodayDate && !isSelected && { color: BNG_COLORS.accent },
                  ]}>
                    {weekDates[index].getDate()}
                  </Text>
                  {hasEvent(weekDates[index]) && (
                    <View style={[styles.eventDot, isSelected && { backgroundColor: '#FFF' }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Day's Events */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isToday(selectedDate) ? "Today's Schedule" : `${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
            </Text>
            <TouchableOpacity onPress={() => router.push('/add-event')}>
              <Text style={styles.sectionAction}>+ Add Event</Text>
            </TouchableOpacity>
          </View>

          {dayEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome name="calendar-o" size={32} color={BNG_COLORS.textMuted} />
              <Text style={styles.emptyText}>No events for this day</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/add-event')}
              >
                <Text style={styles.emptyButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.eventsCard}>
              {dayEvents.map((event, index) => (
                <View key={event.id}>
                  <View style={styles.eventItem}>
                    <View style={styles.eventTimeColumn}>
                      <Text style={styles.eventTime}>{event.start_time || '--'}</Text>
                      {event.end_time && <Text style={styles.eventDuration}>{event.end_time}</Text>}
                    </View>
                    <View style={[styles.eventLine, { backgroundColor: EVENT_COLORS[event.event_type] || BNG_COLORS.primary }]} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventClient}>{event.client_name || 'No client'}</Text>
                      <View style={[styles.eventTypeBadge, { backgroundColor: `${EVENT_COLORS[event.event_type] || BNG_COLORS.primary}15` }]}>
                        <Text style={[styles.eventTypeText, { color: EVENT_COLORS[event.event_type] || BNG_COLORS.primary }]}>
                          {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {index < dayEvents.length - 1 && <View style={styles.eventDivider} />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Upcoming Milestones */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Milestones</Text>
          </View>

          {milestones.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming milestones</Text>
            </View>
          ) : (
            milestones.map((m, i) => (
              <View key={i} style={styles.milestoneCard}>
                <View style={styles.milestoneIconContainer}>
                  <FontAwesome name="flag-checkered" size={20} color={BNG_COLORS.accent} />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneTitle}>{m.title}</Text>
                  <Text style={styles.milestoneProject}>{m.project}</Text>
                  <Text style={styles.milestoneDate}>{m.date}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
  },
  title: { fontSize: 32, fontWeight: '800', color: BNG_COLORS.text, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 16, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BNG_COLORS.successBg,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  syncBadgeError: { backgroundColor: `${BNG_COLORS.accent}15` },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BNG_COLORS.success, marginRight: 6 },
  syncDotError: { backgroundColor: BNG_COLORS.accent },
  syncText: { color: BNG_COLORS.success, fontWeight: '700', fontSize: 13 },
  syncTextError: { color: BNG_COLORS.accent },
  syncCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 16, padding: 20, borderRadius: 16, marginBottom: 20,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  syncIconContainer: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: BNG_COLORS.background,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  syncContent: { flex: 1 },
  syncCardTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 4 },
  syncCardText: { fontSize: 14, color: BNG_COLORS.textSecondary, lineHeight: 20 },
  syncButton: { backgroundColor: BNG_COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  syncButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  weekCard: {
    backgroundColor: BNG_COLORS.surface, marginHorizontal: 16, padding: 20, borderRadius: 20, marginBottom: 20,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 3 } }),
  },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  weekTitle: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.text },
  weekNav: { flexDirection: 'row', gap: 4 },
  navButton: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: BNG_COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  daysContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', padding: 8, borderRadius: 14, minWidth: 44 },
  dayItemActive: { backgroundColor: BNG_COLORS.primary },
  dayName: { fontSize: 12, fontWeight: '500', color: BNG_COLORS.textMuted, marginBottom: 6 },
  dayNumber: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 4 },
  dayTextActive: { color: '#FFF' },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: BNG_COLORS.primary },
  eventsSection: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.text },
  sectionAction: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.primary },
  eventsCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 20, padding: 20,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 3 } }),
  },
  emptyCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, padding: 32, alignItems: 'center',
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  emptyText: { color: BNG_COLORS.textMuted, fontSize: 15, marginTop: 8 },
  emptyButton: {
    marginTop: 16, backgroundColor: BNG_COLORS.primary, paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 10,
  },
  emptyButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  eventItem: { flexDirection: 'row', alignItems: 'flex-start' },
  eventTimeColumn: { width: 60, alignItems: 'flex-end', marginRight: 16 },
  eventTime: { fontSize: 14, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  eventDuration: { fontSize: 12, color: BNG_COLORS.textMuted },
  eventLine: { width: 3, height: 60, borderRadius: 2, marginRight: 16 },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  eventClient: { fontSize: 14, color: BNG_COLORS.textSecondary, marginBottom: 6 },
  eventTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  eventTypeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  eventDivider: { height: 1, backgroundColor: BNG_COLORS.border, marginVertical: 16 },
  upcomingSection: { paddingHorizontal: 16 },
  milestoneCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BNG_COLORS.surface,
    borderRadius: 16, padding: 16, marginBottom: 10,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  milestoneIconContainer: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: `${BNG_COLORS.accent}15`,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  milestoneContent: { flex: 1 },
  milestoneTitle: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  milestoneProject: { fontSize: 14, color: BNG_COLORS.textSecondary, marginBottom: 2 },
  milestoneDate: { fontSize: 12, color: BNG_COLORS.textMuted, fontWeight: '500' },
  bottomSpacing: { height: 40 },
});
