import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Platform, Image, FlatList, Alert,
} from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useBreakpoint } from '../../lib/hooks';
import { fetchLeads, fetchProjects } from '../../lib/data';

const NAV_ITEMS = [
  { route: '/', label: 'Dashboard', icon: 'th-large' },
  { route: '/leads', label: 'Leads', icon: 'users' },
  { route: '/projects', label: 'Projects', icon: 'briefcase' },
  { route: '/calendar', label: 'Calendar', icon: 'calendar' },
  { route: '/settings', label: 'Settings', icon: 'cog' },
];

type SearchResult = { id: string; title: string; type: 'lead' | 'project'; route: string };

function TopNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isDesktop = bp === 'desktop';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const isActive = (route: string) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route);

  // Live search across leads and projects
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }

    const timer = setTimeout(async () => {
      try {
        const [leads, projects] = await Promise.all([fetchLeads(), fetchProjects()]);
        const q = searchQuery.toLowerCase();
        const results: SearchResult[] = [];

        leads.forEach(l => {
          if (l.name.toLowerCase().includes(q) || (l.project_type || '').toLowerCase().includes(q)) {
            results.push({ id: l.id, title: `${l.name} — ${l.project_type || 'Lead'}`, type: 'lead', route: '/leads' });
          }
        });
        projects.forEach(p => {
          if (p.title.toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q)) {
            results.push({ id: p.id, title: `${p.title}`, type: 'project', route: `/project/${p.id}` });
          }
        });

        setSearchResults(results.slice(0, 8));
      } catch { setSearchResults([]); }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSelect = (item: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    router.push(item.route as any);
  };

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

          {/* Search -- functional TextInput on tablet+ */}
          {!isMobile && (
            <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
              <FontAwesome name="search" size={15} color={BNG_COLORS.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search leads, projects..."
                placeholderTextColor={BNG_COLORS.textMuted}
                value={searchQuery}
                onChangeText={(t) => { setSearchQuery(t); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <FontAwesome name="times-circle" size={16} color={BNG_COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Right Actions */}
          <View style={styles.actionsRow}>
            {!isMobile && (
              <>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => Alert.alert('Messages', 'No new messages. This feature is coming soon.')}
                >
                  <FontAwesome name="envelope-o" size={17} color={BNG_COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => Alert.alert('Notifications', 'No new notifications.')}
                >
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
                  <Text style={styles.profileEmail}>services@bngremodel.com</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Results Dropdown */}
        {showSearch && searchResults.length > 0 && !isMobile && (
          <View style={styles.searchDropdown}>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={`${item.type}-${item.id}`}
                style={styles.searchResultItem}
                onPress={() => handleSearchSelect(item)}
              >
                <FontAwesome
                  name={item.type === 'lead' ? 'user' : 'briefcase'}
                  size={14}
                  color={BNG_COLORS.primary}
                  style={{ marginRight: 10, width: 20 }}
                />
                <Text style={styles.searchResultText} numberOfLines={1}>{item.title}</Text>
                <View style={styles.searchResultBadge}>
                  <Text style={styles.searchResultBadgeText}>{item.type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
                  style={[styles.tabItem, isMobile && styles.tabItemMobile, active && styles.tabItemActive]}
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
                  {isMobile && active && <View style={styles.mobileDot} />}
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
    zIndex: 100,
  },
  headerContainer: {
    backgroundColor: BNG_COLORS.surface, paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 36 : 12, paddingBottom: 0,
  },
  headerContainerMobile: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 28 : 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  topRowMobile: { marginBottom: 8 },
  logoImage: { width: 130, height: 38 },
  logoImageMobile: { width: 100, height: 30 },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: BNG_COLORS.background,
    marginHorizontal: 24, paddingHorizontal: 14, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  searchContainerDesktop: { maxWidth: 440 },
  searchInput: { flex: 1, fontSize: 14, color: BNG_COLORS.text, height: 40 },
  searchDropdown: {
    position: 'absolute', top: 60, left: 180, right: 180, zIndex: 200,
    backgroundColor: BNG_COLORS.surface, borderRadius: 12, padding: 4,
    ...Platform.select({ ios: SHADOWS.lg, android: { elevation: 10 } }),
    borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8,
  },
  searchResultText: { flex: 1, fontSize: 14, fontWeight: '500', color: BNG_COLORS.text },
  searchResultBadge: {
    backgroundColor: `${BNG_COLORS.primary}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  searchResultBadgeText: { fontSize: 11, fontWeight: '600', color: BNG_COLORS.primary, textTransform: 'capitalize' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: BNG_COLORS.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: BNG_COLORS.surface,
  },
  notificationDot: {
    position: 'absolute', top: 9, right: 11, width: 6, height: 6,
    borderRadius: 3, backgroundColor: BNG_COLORS.accent, zIndex: 1,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileRowMobile: { gap: 0 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FDE68A',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#92400E', fontWeight: '700', fontSize: 13 },
  profileInfo: { gap: 1 },
  profileName: { fontSize: 13, fontWeight: '700', color: BNG_COLORS.text },
  profileEmail: { fontSize: 11, color: BNG_COLORS.textMuted },
  tabsRow: {
    borderTopWidth: 1, borderTopColor: BNG_COLORS.border, paddingTop: 10, marginHorizontal: -24,
  },
  tabsRowMobile: { paddingTop: 6, marginHorizontal: -16 },
  tabsScroll: { paddingHorizontal: 24, gap: 8, paddingBottom: 10 },
  tabsScrollMobile: {
    paddingHorizontal: 12, gap: 4, paddingBottom: 8, justifyContent: 'space-between', flexGrow: 1,
  },
  tabItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 100, backgroundColor: BNG_COLORS.background,
  },
  tabItemMobile: {
    paddingHorizontal: 0, paddingVertical: 0, width: 52, height: 44,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
  },
  tabItemActive: { backgroundColor: BNG_COLORS.primary, ...SHADOWS.glowPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  tabTextActive: { color: '#FFF' },
  mobileDot: {
    position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: BNG_COLORS.accent,
  },
});
