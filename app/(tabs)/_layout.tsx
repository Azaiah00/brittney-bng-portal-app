import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Platform, Image } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';

// Custom Top Navigation Bar
function TopNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { route: '/', label: 'Dashboard', icon: 'th-large' },
    { route: '/leads', label: 'Leads', icon: 'users' },
    { route: '/projects', label: 'Projects', icon: 'briefcase' },
    { route: '/calendar', label: 'Calendar', icon: 'calendar' },
    { route: '/settings', label: 'Settings', icon: 'cog' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        {/* Top Row: Logo, Search, Profile */}
        <View style={styles.topRow}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo-bng.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={16} color={BNG_COLORS.textMuted} style={styles.searchIcon} />
            <Text style={styles.searchText}>Search tasks, leads...</Text>
            <View style={styles.shortcutBadge}>
              <Text style={styles.shortcutText}>⌘F</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="envelope-o" size={18} color={BNG_COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <View style={styles.notificationDot} />
              <FontAwesome name="bell-o" size={18} color={BNG_COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>BW</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Brittney Reader</Text>
                <Text style={styles.profileEmail}>brittany@bng.com</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Row: Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.tabsScroll}
          >
            {navItems.map((item) => {
              // Exact match for index, prefix match for others
              const isActive = item.route === '/' 
                ? pathname === '/' 
                : pathname.startsWith(item.route);

              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.8}
                >
                  <FontAwesome
                    name={item.icon as any}
                    size={16}
                    color={isActive ? '#FFF' : BNG_COLORS.textSecondary}
                    style={styles.tabIcon}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => null} // Hide the default bottom tab bar entirely
      screenOptions={{
        header: () => <TopNavBar />, // Use our custom top navigation bar
        sceneStyle: { backgroundColor: BNG_COLORS.background },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="leads" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BNG_COLORS.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    zIndex: 100,
  },
  headerContainer: {
    backgroundColor: BNG_COLORS.surface,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 40,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.background,
    marginHorizontal: 32,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: BNG_COLORS.textMuted,
  },
  shortcutBadge: {
    backgroundColor: BNG_COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  shortcutText: {
    fontSize: 12,
    color: BNG_COLORS.textSecondary,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BNG_COLORS.surface,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BNG_COLORS.accent,
    zIndex: 1,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE68A', // Warm yellow background for avatar
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 14,
  },
  profileInfo: {
    display: Platform.OS === 'web' || Platform.isPad ? 'flex' : 'none',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  profileEmail: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
  },
  tabsContainer: {
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
    paddingTop: 16,
    marginHorizontal: -24, // Bleed to edges
  },
  tabsScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100, // Pill shape
    backgroundColor: BNG_COLORS.background,
  },
  tabItemActive: {
    backgroundColor: BNG_COLORS.primary,
    ...SHADOWS.glowPrimary,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
});
