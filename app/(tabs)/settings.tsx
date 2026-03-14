import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
  ScrollView, Platform, Switch, Alert, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { fetchDashboardStats, DashboardStats } from '../../lib/data';

const PROFILE_SECTIONS = [
  {
    title: 'Account',
    items: [
      { id: 'profile', icon: 'user-o', label: 'Edit Profile', hasArrow: true },
      { id: 'notifications', icon: 'bell-o', label: 'Notifications', hasToggle: true },
      { id: 'privacy', icon: 'lock', label: 'Privacy & Security', hasArrow: true },
    ],
  },
  {
    title: 'Business',
    items: [
      { id: 'templates', icon: 'file-text-o', label: 'Estimate Templates', hasArrow: true },
      { id: 'team', icon: 'users', label: 'Team Members', hasArrow: true },
      { id: 'integrations', icon: 'plug', label: 'Integrations', hasArrow: true, badge: '3' },
      { id: 'billing', icon: 'credit-card', label: 'Billing & Subscription', hasArrow: true },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { id: 'theme', icon: 'moon-o', label: 'Dark Mode', hasToggle: true },
      { id: 'language', icon: 'globe', label: 'Language', value: 'English', hasArrow: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'help', icon: 'question-circle-o', label: 'Help Center', hasArrow: true },
      { id: 'contact', icon: 'envelope-o', label: 'Contact Support', hasArrow: true },
      { id: 'about', icon: 'info-circle', label: 'About BNG Remodel', hasArrow: true },
    ],
  },
];

export default function SettingsScreen() {
  const [toggles, setToggles] = React.useState({ notifications: true, theme: false });
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const toggleSwitch = (id: string) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id as keyof typeof toggles] }));
  };

  // Load real stats
  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats().then(setStats).catch(() => {});
    }, [])
  );

  // ── Handlers for each settings item ──
  const handleItemPress = (id: string) => {
    switch (id) {
      case 'profile':
        Alert.alert('Edit Profile', 'Profile editing will be available in a future update.');
        break;
      case 'privacy':
        Alert.alert('Privacy & Security', 'Your data is stored securely in Supabase with row-level security.');
        break;
      case 'templates':
        Alert.alert('Estimate Templates', 'You can create estimates from any project. Templates coming soon.');
        break;
      case 'team':
        Alert.alert('Team Members', 'Team management is coming in a future update.');
        break;
      case 'integrations':
        Alert.alert('Integrations', 'Current integrations:\n\n1. Supabase (Database)\n2. Gemini AI (Smart Features)\n3. Apple Calendar (Sync)');
        break;
      case 'billing':
        Alert.alert('Billing', 'BNG Remodel Pro Plan\nNo charges at this time.');
        break;
      case 'language':
        Alert.alert('Language', 'Currently set to English. More languages coming soon.');
        break;
      case 'help':
        Alert.alert('Help Center', 'Need help? Contact Brittney at brittany@bng.com or call support.');
        break;
      case 'contact':
        Linking.openURL('mailto:brittany@bng.com?subject=BNG App Support');
        break;
      case 'about':
        Alert.alert(
          'About BNG Remodel',
          'BNG Remodel App v1.0.0\n\nBuilt for Brittney Reader\nBNG Remodel, Richmond VA\n\nPowered by Supabase & Gemini AI'
        );
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          Alert.alert('Logged Out', 'Your session has been cleared.');
        },
      },
    ]);
  };

  const renderSettingItem = (item: any, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, !isLast && styles.settingItemBorder]}
      activeOpacity={0.7}
      onPress={() => {
        if (item.hasToggle) {
          toggleSwitch(item.id);
        } else {
          handleItemPress(item.id);
        }
      }}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          <FontAwesome name={item.icon} size={18} color={BNG_COLORS.primary} />
        </View>
        <Text style={styles.settingLabel}>{item.label}</Text>
      </View>
      <View style={styles.settingItemRight}>
        {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        {item.hasToggle && (
          <Switch
            value={toggles[item.id as keyof typeof toggles]}
            onValueChange={() => toggleSwitch(item.id)}
            trackColor={{ false: BNG_COLORS.border, true: `${BNG_COLORS.primary}50` }}
            thumbColor={toggles[item.id as keyof typeof toggles] ? BNG_COLORS.primary : '#fff'}
          />
        )}
        {item.hasArrow && (
          <FontAwesome name="angle-right" size={20} color={BNG_COLORS.textMuted} style={{ marginLeft: 8 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>BR</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Brittney Reader</Text>
            <Text style={styles.profileRole}>Owner &bull; BNG Remodel</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>Pro Plan</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleItemPress('profile')}
          >
            <FontAwesome name="pencil" size={16} color={BNG_COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row -- live from Supabase */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{stats?.activeProjects ?? '-'}</Text>
            <Text style={styles.statBoxLabel}>Active Projects</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{stats?.completedProjects ?? '-'}</Text>
            <Text style={styles.statBoxLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{stats?.totalLeads ?? '-'}</Text>
            <Text style={styles.statBoxLabel}>Total Leads</Text>
          </View>
        </View>

        {/* Sections */}
        {PROFILE_SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item: any, itemIdx: number) =>
                renderSettingItem(item, itemIdx === section.items.length - 1)
              )}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <FontAwesome name="home" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.appName}>BNG Remodel</Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={18} color={BNG_COLORS.accent} style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: BNG_COLORS.text, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 16, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 4 } }),
  },
  avatarLarge: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: BNG_COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '700', letterSpacing: 1 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 4 },
  profileRole: { fontSize: 14, color: BNG_COLORS.textSecondary, marginBottom: 8 },
  profileBadge: {
    backgroundColor: `${BNG_COLORS.accent}15`, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  profileBadgeText: { color: BNG_COLORS.accent, fontSize: 12, fontWeight: '700' },
  editButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: BNG_COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row', backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 16, marginBottom: 24, padding: 16, borderRadius: 16,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: BNG_COLORS.border },
  statBoxValue: { fontSize: 22, fontWeight: '800', color: BNG_COLORS.primary, marginBottom: 2 },
  statBoxLabel: { fontSize: 12, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: BNG_COLORS.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12, marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 20, overflow: 'hidden',
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: BNG_COLORS.border },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  settingLabel: { fontSize: 16, fontWeight: '500', color: BNG_COLORS.text },
  settingItemRight: { flexDirection: 'row', alignItems: 'center' },
  settingValue: { fontSize: 14, color: BNG_COLORS.textMuted, marginRight: 8 },
  badge: {
    backgroundColor: BNG_COLORS.accent, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  versionSection: { marginHorizontal: 16, marginBottom: 24 },
  logoContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: BNG_COLORS.surface, padding: 20, borderRadius: 16,
  },
  logoIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: BNG_COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  appName: { fontSize: 18, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  versionText: { fontSize: 14, color: BNG_COLORS.textMuted },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 8, padding: 16,
    backgroundColor: `${BNG_COLORS.accent}10`, borderRadius: 16,
    borderWidth: 1, borderColor: `${BNG_COLORS.accent}20`,
  },
  logoutText: { color: BNG_COLORS.accent, fontSize: 16, fontWeight: '700' },
  bottomSpacing: { height: 40 },
});
