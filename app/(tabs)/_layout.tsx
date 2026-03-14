import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useBreakpoint } from '../../lib/hooks';

const NAV_ITEMS = [
  { route: '/', label: 'Dashboard', icon: 'th-large' },
  { route: '/leads', label: 'Leads', icon: 'users' },
  { route: '/projects', label: 'Projects', icon: 'briefcase' },
  { route: '/calendar', label: 'Calendar', icon: 'calendar' },
  { route: '/settings', label: 'Settings', icon: 'cog' },
];

function TopNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isDesktop = bp === 'desktop';

  const isActive = (route: string) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.headerContainer, isMobile && styles.headerContainerMobile]}>

        {/* ── Top Row ── */}
        <View style={[styles.topRow, isMobile && styles.topRowMobile]}>

          {/* Logo */}
          <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.8}>
            <Image
              source={require('../../assets/images/logo-bng.png')}
              style={[styles.logoImage, isMobile && styles.logoImageMobile]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Search — hidden on mobile */}
          {!isMobile && (
            <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
              <FontAwesome name="search" size={15} color={BNG_COLORS.textMuted} style={{ marginRight: 10 }} />
              <Text style={styles.searchText}>Search tasks, leads...</Text>
              <View style={styles.shortcutBadge}>
                <Text style={styles.shortcutText}>⌘F</Text>
              </View>
            </View>
          )}

          {/* Right Actions */}
          <View style={styles.actionsRow}>
            {!isMobile && (
              <>
                <TouchableOpacity style={styles.iconButton}>
                  <FontAwesome name="envelope-o" size={17} color={BNG_COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <View style={styles.notificationDot} />
                  <FontAwesome name="bell-o" size={17} color={BNG_COLORS.textSecondary} />
                </TouchableOpacity>
              </>
            )}

            {/* Avatar always visible */}
            <TouchableOpacity
              style={[styles.profileRow, isMobile && styles.profileRowMobile]}
              onPress={() => router.push('/settings')}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>BR</Text>
              </View>
              {isDesktop && (
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>Brittney Reader</Text>
                  <Text style={styles.profileEmail}>brittany@bng.com</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tab Row ── */}
        <View style={[styles.tabsRow, isMobile && styles.tabsRowMobile]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabsScroll, isMobile && styles.tabsScrollMobile]}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.route);
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[
                    styles.tabItem,
                    isMobile && styles.tabItemMobile,
                    active && styles.tabItemActive,
                  ]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.8}
                >
                  <FontAwesome
                    name={item.icon as any}
                    size={isMobile ? 18 : 15}
                    color={active ? '#FFF' : BNG_COLORS.textSecondary}
                    style={{ marginRight: isMobile ? 0 : 7 }}
                  />
                  {!isMobile && (
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {item.label}
                    </Text>
                  )}
                  {isMobile && active && (
                    <View style={styles.mobileDot} />
                  )}
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
      tabBar={() => null}
      screenOptions={{
        header: () => <TopNavBar />,
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
      android: { elevation: 8 },
    }),
    zIndex: 100,
  },
  headerContainer: {
    backgroundColor: BNG_COLORS.surface,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 0,
  },
  headerContainerMobile: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 28 : 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topRowMobile: {
    marginBottom: 8,
  },
  logoImage: {
    width: 130,
    height: 38,
  },
  logoImageMobile: {
    width: 100,
    height: 30,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.background,
    marginHorizontal: 24,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  searchContainerDesktop: {
    maxWidth: 440,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: BNG_COLORS.textMuted,
  },
  shortcutBadge: {
    backgroundColor: BNG_COLORS.surface,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  shortcutText: {
    fontSize: 11,
    color: BNG_COLORS.textSecondary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BNG_COLORS.surface,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BNG_COLORS.accent,
    zIndex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileRowMobile: {
    gap: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },
  profileInfo: {
    gap: 1,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  profileEmail: {
    fontSize: 11,
    color: BNG_COLORS.textMuted,
  },
  tabsRow: {
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
    paddingTop: 10,
    marginHorizontal: -24,
  },
  tabsRowMobile: {
    paddingTop: 6,
    marginHorizontal: -16,
  },
  tabsScroll: {
    paddingHorizontal: 24,
    gap: 8,
    paddingBottom: 10,
  },
  tabsScrollMobile: {
    paddingHorizontal: 12,
    gap: 4,
    paddingBottom: 8,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: BNG_COLORS.background,
  },
  tabItemMobile: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 52,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: BNG_COLORS.primary,
    ...SHADOWS.glowPrimary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: BNG_COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  mobileDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BNG_COLORS.accent,
  },
});
