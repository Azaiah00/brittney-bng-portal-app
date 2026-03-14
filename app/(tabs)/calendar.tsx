import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { requestCalendarPermissions } from '../../lib/calendar';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';

// Mock events for the calendar
const MOCK_EVENTS = [
  { id: '1', title: 'Site Walkthrough', client: 'Doe Kitchen', time: '9:00 AM', duration: '1 hr', type: 'walkthrough' },
  { id: '2', title: 'Team Meeting', client: 'Internal', time: '11:00 AM', duration: '30 min', type: 'meeting' },
  { id: '3', title: 'Client Review', client: 'Smith Bathroom', time: '2:00 PM', duration: '1 hr', type: 'review' },
  { id: '4', title: 'Permit Inspection', client: 'Johnson Reno', time: '4:00 PM', duration: '1 hr', type: 'inspection' },
];

const EVENT_COLORS: Record<string, string> = {
  walkthrough: BNG_COLORS.primary,
  meeting: BNG_COLORS.accent,
  review: BNG_COLORS.success,
  inspection: BNG_COLORS.warning,
};

export default function CalendarScreen() {
  const [isSynced, setIsSynced] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'web') return;
  };

  const handleSync = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Calendar sync is only available on iOS/iPadOS.');
      return;
    }

    const granted = await requestCalendarPermissions();
    if (granted) {
      setIsSynced(true);
      Alert.alert('Success', 'Calendar permissions granted. Projects will now sync automatically.');
    } else {
      Alert.alert('Permission Denied', 'Please enable calendar access in Settings.');
    }
  };

  // Generate days for the week view
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [18, 19, 20, 21, 22, 23, 24];
  const selectedIndex = 3; // Today

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
            <FontAwesome name={isSynced ? "check-circle" : "calendar-plus-o"} size={32} color={isSynced ? BNG_COLORS.success : BNG_COLORS.accent} />
          </View>
          <View style={styles.syncContent}>
            <Text style={styles.syncCardTitle}>Apple Calendar</Text>
            <Text style={styles.syncCardText}>
              {isSynced 
                ? 'Your projects are automatically syncing with Apple Calendar.'
                : 'Enable sync to automatically create events for project dates.'}
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
            <Text style={styles.weekTitle}>March 2026</Text>
            <View style={styles.weekNav}>
              <TouchableOpacity style={styles.navButton}>
                <FontAwesome name="chevron-left" size={14} color={BNG_COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton}>
                <FontAwesome name="chevron-right" size={14} color={BNG_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.daysContainer}>
            {weekDays.map((day, index) => (
              <TouchableOpacity 
                key={day} 
                style={[styles.dayItem, index === selectedIndex && styles.dayItemActive]}
                onPress={() => {}}
              >
                <Text style={[styles.dayName, index === selectedIndex && styles.dayTextActive]}>{day}</Text>
                <Text style={[styles.dayNumber, index === selectedIndex && styles.dayTextActive]}>{dates[index]}</Text>
                {index === 1 && <View style={styles.eventDot} />}
                {index === 3 && <View style={[styles.eventDot, { backgroundColor: BNG_COLORS.accent }]} />}
                {index === 5 && <View style={styles.eventDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Events */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Add Event</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.eventsCard}>
            {MOCK_EVENTS.map((event, index) => (
              <View key={event.id}>
                <View style={styles.eventItem}>
                  <View style={styles.eventTimeColumn}>
                    <Text style={styles.eventTime}>{event.time}</Text>
                    <Text style={styles.eventDuration}>{event.duration}</Text>
                  </View>
                  <View style={[styles.eventLine, { backgroundColor: EVENT_COLORS[event.type] }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventClient}>{event.client}</Text>
                    <View style={[styles.eventTypeBadge, { backgroundColor: `${EVENT_COLORS[event.type]}15` }]}>
                      <Text style={[styles.eventTypeText, { color: EVENT_COLORS[event.type] }]}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                {index < MOCK_EVENTS.length - 1 && <View style={styles.eventDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Section */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Milestones</Text>
          </View>
          
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneIconContainer}>
              <FontAwesome name="flag-checkered" size={20} color={BNG_COLORS.accent} />
            </View>
            <View style={styles.milestoneContent}>
              <Text style={styles.milestoneTitle}>Kitchen Demo Complete</Text>
              <Text style={styles.milestoneProject}>Doe Kitchen Remodel</Text>
              <Text style={styles.milestoneDate}>Due: Apr 15, 2026</Text>
            </View>
            <View style={[styles.milestoneBadge, { backgroundColor: `${BNG_COLORS.accent}15` }]}>
              <Text style={[styles.milestoneBadgeText, { color: BNG_COLORS.accent }]}>3 days</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    paddingHorizontal: 16,
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
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.successBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  syncBadgeError: {
    backgroundColor: `${BNG_COLORS.accent}15`,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BNG_COLORS.success,
    marginRight: 6,
  },
  syncDotError: {
    backgroundColor: BNG_COLORS.accent,
  },
  syncText: {
    color: BNG_COLORS.success,
    fontWeight: '700',
    fontSize: 13,
  },
  syncTextError: {
    color: BNG_COLORS.accent,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  syncIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: BNG_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  syncContent: {
    flex: 1,
  },
  syncCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 4,
  },
  syncCardText: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    lineHeight: 20,
  },
  syncButton: {
    backgroundColor: BNG_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  syncButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  weekCard: {
    backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: SHADOWS.md,
      android: {
        elevation: 3,
      },
    }),
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  weekNav: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BNG_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    minWidth: 44,
  },
  dayItemActive: {
    backgroundColor: BNG_COLORS.primary,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: BNG_COLORS.textMuted,
    marginBottom: 6,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 4,
  },
  dayTextActive: {
    color: '#FFF',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BNG_COLORS.primary,
  },
  eventsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.primary,
  },
  eventsCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: SHADOWS.md,
      android: {
        elevation: 3,
      },
    }),
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventTimeColumn: {
    width: 60,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 2,
  },
  eventDuration: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
  },
  eventLine: {
    width: 3,
    height: 60,
    borderRadius: 2,
    marginRight: 16,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 2,
  },
  eventClient: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    marginBottom: 6,
  },
  eventTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  eventDivider: {
    height: 1,
    backgroundColor: BNG_COLORS.border,
    marginVertical: 16,
  },
  upcomingSection: {
    paddingHorizontal: 16,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  milestoneIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${BNG_COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 2,
  },
  milestoneProject: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
    fontWeight: '500',
  },
  milestoneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  milestoneBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 40,
  },
});
