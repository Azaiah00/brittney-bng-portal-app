import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  SafeAreaView, Platform, Linking, Alert, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../lib/theme';
import { useIsTablet, useBreakpoint, useResponsivePadding } from '../../lib/hooks';
import {
  fetchLeads,
  fetchCustomers,
  fetchLeadSources,
  updateLeadStatus,
  updateLead,
  convertLeadToCustomer,
  deleteLead,
  deleteCustomer,
  fetchSubcontractors,
  fetchProjects,
  fetchContactNotes,
  fetchContactMedia,
  type ContactRef,
} from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { confirmAsync } from '../../lib/confirmDialog';
import { Database } from '../../types/database';

type LeadRow = Database['public']['Tables']['leads']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type ContactNoteRow = Database['public']['Tables']['contact_notes']['Row'];
type ContactMediaRow = Database['public']['Tables']['contact_media']['Row'];
type SubRow = Database['public']['Tables']['subcontractors']['Row'];
type ProjectRow = Database['public']['Tables']['projects']['Row'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: `${BNG_COLORS.primary}15`, text: BNG_COLORS.primary },
  contacted: { bg: `${BNG_COLORS.info}15`, text: BNG_COLORS.info },
  quoted: { bg: `${BNG_COLORS.success}15`, text: BNG_COLORS.success },
  converted: { bg: `${BNG_COLORS.warning}15`, text: BNG_COLORS.warning },
};

export default function LeadsScreen() {
  const isTablet = useIsTablet();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isDesktop = bp === 'desktop';
  const horizontalPad = useResponsivePadding();
  const router = useRouter();
  const { tab: tabFromUrl } = useLocalSearchParams<{ tab?: string }>();
  const [viewMode, setViewMode] = useState<'leads' | 'customers' | 'subs'>('leads');
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [sourceMap, setSourceMap] = useState<Record<string, string>>({});
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  // Inline CRM preview on the contact detail pane (notes + media thumbnails).
  const [previewNotes, setPreviewNotes] = useState<ContactNoteRow[]>([]);
  const [previewMedia, setPreviewMedia] = useState<ContactMediaRow[]>([]);
  const [previewMediaUrls, setPreviewMediaUrls] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [leadData, customerData, sources, subsData, projData] = await Promise.all([
        fetchLeads(),
        fetchCustomers(),
        fetchLeadSources(),
        fetchSubcontractors(),
        fetchProjects(),
      ]);
      setLeads(leadData);
      setCustomers(customerData);
      setSubs(subsData);
      setProjects(projData);
      const map: Record<string, string> = {};
      sources.forEach((s) => { map[s.id] = s.name; });
      setSourceMap(map);
    } catch { /* Supabase may not be ready */ }
  }, []);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const getSourceName = (id: string | null) => (id ? sourceMap[id] || '—' : '—');

  // Load Apple-style notes and media for whoever is selected (detail pane).
  const loadContactCrmPreview = useCallback(async (ref: ContactRef) => {
    setPreviewLoading(true);
    try {
      const [notes, media] = await Promise.all([
        fetchContactNotes(ref),
        fetchContactMedia(ref),
      ]);
      setPreviewNotes(notes.slice(0, 6));
      const mediaSlice = media.slice(0, 12);
      setPreviewMedia(mediaSlice);
      const urls: Record<string, string> = {};
      for (const m of mediaSlice) {
        const { data } = await supabase.storage
          .from('contact-media')
          .createSignedUrl(m.storage_path, 3600);
        if (data?.signedUrl) urls[m.id] = data.signedUrl;
      }
      setPreviewMediaUrls(urls);
    } catch {
      setPreviewNotes([]);
      setPreviewMedia([]);
      setPreviewMediaUrls({});
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLeadId && viewMode === 'leads') {
      loadContactCrmPreview({ kind: 'lead', id: selectedLeadId });
    } else if (selectedCustomerId && viewMode === 'customers') {
      loadContactCrmPreview({ kind: 'customer', id: selectedCustomerId });
    } else {
      setPreviewNotes([]);
      setPreviewMedia([]);
      setPreviewMediaUrls({});
      setPreviewLoading(false);
    }
  }, [selectedLeadId, selectedCustomerId, viewMode, loadContactCrmPreview]);

  // Dashboard "New leads" card passes ?tab=leads. Also refresh notes/media when returning from modals.
  useFocusEffect(
    useCallback(() => {
      loadData();
      const t = tabFromUrl;
      if (t === 'leads' || t === 'customers' || t === 'subs') {
        setViewMode(t);
        setSelectedLeadId(null);
        setSelectedCustomerId(null);
        return;
      }
      if (selectedLeadId && viewMode === 'leads') {
        loadContactCrmPreview({ kind: 'lead', id: selectedLeadId });
      } else if (selectedCustomerId && viewMode === 'customers') {
        loadContactCrmPreview({ kind: 'customer', id: selectedCustomerId });
      }
    }, [
      loadData,
      tabFromUrl,
      selectedLeadId,
      selectedCustomerId,
      viewMode,
      loadContactCrmPreview,
    ]),
  );

  // ── Contact actions via deep links ──
  const handleCall = (phone: string | null) => {
    if (!phone) { Alert.alert('No Phone', 'This lead has no phone number.'); return; }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string | null) => {
    if (!email) { Alert.alert('No Email', 'This lead has no email address.'); return; }
    Linking.openURL(`mailto:${email}`);
  };

  const handleText = (phone: string | null) => {
    if (!phone) { Alert.alert('No Phone', 'This lead has no phone number.'); return; }
    Linking.openURL(`sms:${phone}`);
  };

  // ── Status update ──
  const handleStatusChange = async (id: string, newStatus: LeadRow['status']) => {
    try {
      await updateLeadStatus(id, newStatus);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  // ── Convert lead to customer ──
  const handleConvertToCustomer = async (leadId: string) => {
    try {
      await convertLeadToCustomer(leadId);
      await loadData();
      setSelectedLeadId(null);
      setViewMode('customers');
    } catch {
      Alert.alert('Error', 'Failed to convert lead to customer.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const ok = await confirmAsync({
      title: 'Delete Lead?',
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteLead(leadId);
      await loadData();
      setSelectedLeadId(null);
    } catch {
      Alert.alert('Error', 'Could not delete lead.');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const ok = await confirmAsync({
      title: 'Delete Customer?',
      message: 'This cannot be undone. Linked projects will keep the link but the customer record will be removed.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteCustomer(customerId);
      await loadData();
      setSelectedCustomerId(null);
    } catch {
      Alert.alert('Error', 'Could not delete customer.');
    }
  };

  const renderLeadItem = ({ item }: { item: LeadRow }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.new;
    const isSelected = selectedLeadId === item.id;
    const dateStr = new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
    const sourceName = getSourceName(item.lead_source_id);

    return (
      <TouchableOpacity
        style={[styles.leadItem, isSelected && styles.selectedLeadItem]}
        onPress={() => { setSelectedLeadId(item.id); setSelectedCustomerId(null); }}
        activeOpacity={0.8}
      >
        <View style={styles.leadHeader}>
          <View style={styles.leadAvatar}>
            <Text style={styles.leadAvatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName}>{item.name}</Text>
            <Text style={styles.leadProject}>{item.project_type || 'General Inquiry'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.sourceBadgeRow}>
          <Text style={styles.sourceBadgeText} numberOfLines={1}>{sourceName}</Text>
        </View>
        <View style={styles.leadFooter}>
          <View style={styles.dateContainer}>
            <FontAwesome name="clock-o" size={14} color={BNG_COLORS.textMuted} />
            <Text style={styles.leadDate}>{dateStr}</Text>
          </View>
          <View style={styles.leadActions}>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleCall(item.phone)}>
              <FontAwesome name="phone" size={14} color={BNG_COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleEmail(item.email)}>
              <FontAwesome name="envelope-o" size={14} color={BNG_COLORS.info} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCustomerItem = ({ item }: { item: CustomerRow }) => {
    const isSelected = selectedCustomerId === item.id;
    const dateStr = new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
    const sourceName = getSourceName(item.lead_source_id);

    return (
      <TouchableOpacity
        style={[styles.leadItem, isSelected && styles.selectedLeadItem]}
        onPress={() => { setSelectedCustomerId(item.id); setSelectedLeadId(null); }}
        activeOpacity={0.8}
      >
        <View style={styles.leadHeader}>
          <View style={styles.leadAvatar}>
            <Text style={styles.leadAvatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName}>{item.name}</Text>
            <Text style={styles.leadProject}>{item.project_type || 'General Inquiry'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${BNG_COLORS.success}15` }]}>
            <Text style={[styles.badgeText, { color: BNG_COLORS.success }]}>Customer</Text>
          </View>
        </View>
        <View style={styles.sourceBadgeRow}>
          <Text style={styles.sourceBadgeText} numberOfLines={1}>{sourceName}</Text>
        </View>
        <View style={styles.leadFooter}>
          <View style={styles.dateContainer}>
            <FontAwesome name="clock-o" size={14} color={BNG_COLORS.textMuted} />
            <Text style={styles.leadDate}>{dateStr}</Text>
          </View>
          <View style={styles.leadActions}>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleCall(item.phone)}>
              <FontAwesome name="phone" size={14} color={BNG_COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleEmail(item.email)}>
              <FontAwesome name="envelope-o" size={14} color={BNG_COLORS.info} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderList = () => (
    <View style={[styles.listContainer, isTablet && styles.listContainerTablet]}>
      <View style={[styles.listHeader, isMobile && styles.listHeaderMobile]}>
        <Text style={[styles.listTitle, isMobile && styles.listTitleMobile]}>Contacts</Text>
        {isMobile ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            bounces={false}
            style={styles.filterScrollMobile}
            contentContainerStyle={[
              styles.filterScrollContentMobile,
              { paddingRight: horizontalPad },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.filterContainer, styles.filterContainerScrollable]}>
              <TouchableOpacity
                style={[styles.filterButton, styles.filterButtonMobileScroll, viewMode === 'leads' && styles.filterButtonActive]}
                onPress={() => setViewMode('leads')}
              >
                <Text style={[styles.filterText, viewMode === 'leads' && styles.filterTextActive]}>Leads</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, styles.filterButtonMobileScroll, viewMode === 'customers' && styles.filterButtonActive]}
                onPress={() => setViewMode('customers')}
              >
                <Text style={[styles.filterText, viewMode === 'customers' && styles.filterTextActive]}>Customers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, styles.filterButtonMobileScroll, viewMode === 'subs' && styles.filterButtonActive]}
                onPress={() => setViewMode('subs')}
              >
                <Text style={[styles.filterText, viewMode === 'subs' && styles.filterTextActive]}>Subs</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, viewMode === 'leads' && styles.filterButtonActive]}
              onPress={() => setViewMode('leads')}
            >
              <Text style={[styles.filterText, viewMode === 'leads' && styles.filterTextActive]}>Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, viewMode === 'customers' && styles.filterButtonActive]}
              onPress={() => setViewMode('customers')}
            >
              <Text style={[styles.filterText, viewMode === 'customers' && styles.filterTextActive]}>Customers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, viewMode === 'subs' && styles.filterButtonActive]}
              onPress={() => setViewMode('subs')}
            >
              <Text style={[styles.filterText, viewMode === 'subs' && styles.filterTextActive]}>Subs</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Optional: Parse with AI (Scratchpad) — when in Leads view */}
      {viewMode === 'leads' && (
        <TouchableOpacity
          style={styles.scratchpadLink}
          onPress={() => router.push('/scratchpad')}
          activeOpacity={0.8}
        >
          <FontAwesome name="magic" size={14} color={BNG_COLORS.accent} style={{ marginRight: 6 }} />
          <Text style={styles.scratchpadLinkText}>Parse notes with AI (optional)</Text>
        </TouchableOpacity>
      )}

      {viewMode === 'leads' ? (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={renderLeadItem}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPad }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <FontAwesome name="users" size={40} color={BNG_COLORS.textMuted} />
              <Text style={{ color: BNG_COLORS.textMuted, fontSize: 16, marginTop: 12 }}>No leads yet</Text>
              <Text style={{ color: BNG_COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
                Tap + to add a lead, or use Parse with AI to extract from notes.
              </Text>
            </View>
          }
        />
      ) : viewMode === 'customers' ? (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPad }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <FontAwesome name="user" size={40} color={BNG_COLORS.textMuted} />
              <Text style={{ color: BNG_COLORS.textMuted, fontSize: 16, marginTop: 12 }}>No customers yet</Text>
              <Text style={{ color: BNG_COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
                Convert a lead or add a customer with the + button.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={subs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.leadItem}
              onPress={() => {
                if (item.phone) Linking.openURL(`tel:${item.phone}`);
                else Alert.alert('No Phone', 'This sub has no phone number.');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.leadHeader}>
                <View style={[styles.leadAvatar, { backgroundColor: '#D97706' }]}>
                  <FontAwesome name="wrench" size={18} color="#FFF" />
                </View>
                <View style={styles.leadInfo}>
                  <Text style={styles.leadName}>{item.name}</Text>
                  <Text style={styles.leadProject}>{item.trade}</Text>
                </View>
                {item.rating > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.badgeText, { color: '#D97706' }]}>{'★'.repeat(item.rating)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.leadFooter}>
                <Text style={styles.leadDate}>{item.phone || 'No phone'}</Text>
                <View style={styles.leadActions}>
                  <TouchableOpacity style={styles.actionIcon} onPress={() => handleCall(item.phone)}>
                    <FontAwesome name="phone" size={14} color={BNG_COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon} onPress={() => handleText(item.phone)}>
                    <FontAwesome name="comment" size={14} color={BNG_COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon} onPress={() => handleEmail(item.email)}>
                    <FontAwesome name="envelope-o" size={14} color={BNG_COLORS.info} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <FontAwesome name="wrench" size={40} color={BNG_COLORS.textMuted} />
              <Text style={{ color: BNG_COLORS.textMuted, fontSize: 16, marginTop: 12 }}>No subs yet</Text>
              <Text style={{ color: BNG_COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
                Add subcontractors in the Crew tab.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (viewMode === 'leads') router.push('/add-lead');
          else if (viewMode === 'customers') router.push('/add-customer');
          else router.push('/add-sub' as any);
        }}
        activeOpacity={0.8}
      >
        <FontAwesome name="plus" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  const showLeadDetail = viewMode === 'leads' && selectedLead;
  const showCustomerDetail = viewMode === 'customers' && selectedCustomer;
  const showDetail = showLeadDetail || showCustomerDetail;

  // Format address from structured parts when address string is empty
  const formatAddress = (c: LeadRow | CustomerRow): string | null => {
    if (c.address?.trim()) return c.address;
    const parts = [
      (c as any).address_line_1?.trim(),
      (c as any).address_line_2?.trim(),
      [(c as any).city?.trim(), (c as any).state?.trim(), (c as any).zip_code?.trim()]
        .filter(Boolean)
        .join(', '),
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const renderContactCard = (
    phone: string | null,
    email: string | null,
    address: string | null,
    opts?: { alternateEmail?: string | null; companyName?: string | null }
  ) => (
    <View style={styles.contactCard}>
      <Text style={styles.contactCardTitle}>Contact Info</Text>
      {opts?.companyName ? (
        <>
          <View style={styles.contactRow}>
            <View style={styles.contactIconContainer}>
              <FontAwesome name="building" size={16} color={BNG_COLORS.primary} />
            </View>
            <View style={styles.contactValueCol}>
              <Text style={styles.contactLabel}>Company</Text>
              <Text style={styles.contactValue}>{opts.companyName}</Text>
            </View>
          </View>
          <View style={styles.divider} />
        </>
      ) : null}
      <View style={styles.contactRow}>
        <View style={styles.contactIconContainer}>
          <FontAwesome name="phone" size={16} color={BNG_COLORS.primary} />
        </View>
        <View style={styles.contactValueCol}>
          <Text style={styles.contactLabel}>Phone</Text>
          <Text style={styles.contactValue}>{phone || 'Not provided'}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.contactRow}>
        <View style={styles.contactIconContainer}>
          <FontAwesome name="envelope-o" size={16} color={BNG_COLORS.primary} />
        </View>
        <View style={styles.contactValueCol}>
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>{email || 'Not provided'}</Text>
        </View>
      </View>
      {opts?.alternateEmail ? (
        <>
          <View style={styles.divider} />
          <View style={styles.contactRow}>
            <View style={styles.contactIconContainer}>
              <FontAwesome name="envelope" size={16} color={BNG_COLORS.primary} />
            </View>
            <View style={styles.contactValueCol}>
              <Text style={styles.contactLabel}>Alternate Email</Text>
              <Text style={styles.contactValue}>{opts.alternateEmail}</Text>
            </View>
          </View>
        </>
      ) : null}
      {address ? (
        <>
          <View style={styles.divider} />
          <View style={styles.contactRow}>
            <View style={styles.contactIconContainer}>
              <FontAwesome name="map-marker" size={16} color={BNG_COLORS.primary} />
            </View>
            <View style={styles.contactValueCol}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactValue}>{address}</Text>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );

  // Notes + photos shown inline on the contact detail pane (same data as contact hub).
  const renderCrmNotesMediaBlock = (kind: 'lead' | 'customer', contactId: string) => (
    <View style={styles.crmInlineCard}>
      <View style={styles.crmInlineHeader}>
        <Text style={styles.crmInlineTitle}>Notes</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/contact-note-editor',
              params: { type: kind, id: contactId },
            } as any)
          }
        >
          <Text style={styles.crmInlineLink}>+ New</Text>
        </TouchableOpacity>
      </View>
      {previewLoading ? (
        <ActivityIndicator size="small" color={BNG_COLORS.primary} style={{ marginVertical: 8 }} />
      ) : previewNotes.length === 0 ? (
        <Text style={styles.crmInlineMuted}>No notes yet. Tap New or open the full hub below.</Text>
      ) : (
        previewNotes.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={styles.notePreviewRow}
            onPress={() =>
              router.push({
                pathname: '/contact-note-editor',
                params: { type: kind, id: contactId, noteId: n.id },
              } as any)
            }
          >
            <Text style={styles.notePreviewTitle} numberOfLines={1}>
              {n.title?.trim() || 'Note'}
            </Text>
            <Text style={styles.notePreviewBody} numberOfLines={2}>
              {n.body?.trim() || ' '}
            </Text>
            <Text style={styles.notePreviewDate}>
              {new Date(n.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <View style={[styles.crmInlineHeader, { marginTop: 18 }]}>
        <Text style={styles.crmInlineTitle}>Photos</Text>
        <TouchableOpacity onPress={() => router.push(`/contact/${kind}/${contactId}` as any)}>
          <Text style={styles.crmInlineLink}>Manage</Text>
        </TouchableOpacity>
      </View>
      {previewLoading ? null : previewMedia.length === 0 ? (
        <Text style={styles.crmInlineMuted}>No photos yet. Add from the contact hub.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaStrip}>
          {previewMedia.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => router.push(`/contact/${kind}/${contactId}` as any)}
              style={styles.mediaThumbWrap}
            >
              {previewMediaUrls[m.id] ? (
                <Image source={{ uri: previewMediaUrls[m.id] }} style={styles.mediaThumb} />
              ) : (
                <View style={[styles.mediaThumb, styles.mediaThumbPlaceholder]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderDetails = () => (
    <View style={styles.detailsContainer}>
      {showLeadDetail ? (
        <ScrollView
          style={styles.detailsScroll}
          contentContainerStyle={[
            styles.detailsScrollContent,
            { paddingHorizontal: horizontalPad },
            isDesktop && styles.detailsScrollContentDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View style={styles.detailsHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedLeadId(null)}>
              <FontAwesome name="arrow-left" size={18} color={BNG_COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailsAvatarLarge}>
              <Text style={styles.detailsAvatarTextLarge}>{selectedLead!.name.charAt(0)}</Text>
            </View>
            <Text style={styles.detailsName}>{selectedLead!.name}</Text>
            <Text style={styles.detailsProject}>{selectedLead!.project_type || 'General Inquiry'}</Text>
            <Text style={styles.detailSourceLabel}>Source: {getSourceName(selectedLead!.lead_source_id)}</Text>

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(['new', 'contacted', 'quoted', 'converted'] as const).map((s) => {
                const sc = STATUS_COLORS[s];
                const active = selectedLead!.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, active && { backgroundColor: sc.bg, borderColor: sc.text }]}
                    onPress={() => handleStatusChange(selectedLead!.id, s)}
                  >
                    <Text style={[styles.statusChipText, active && { color: sc.text }]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {renderContactCard(
            selectedLead!.phone,
            selectedLead!.email,
            formatAddress(selectedLead!),
            { alternateEmail: (selectedLead! as any).alternate_email, companyName: (selectedLead! as any).company_name }
          )}

          {renderCrmNotesMediaBlock('lead', selectedLead!.id)}

          <TouchableOpacity
            style={[styles.secondaryAction, { marginBottom: 12, backgroundColor: `${BNG_COLORS.info}14` }]}
            onPress={() => router.push(`/contact/lead/${selectedLead!.id}` as any)}
          >
            <FontAwesome name="book" size={18} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={styles.secondaryActionText}>Open hub: to-dos, logs, and more</Text>
          </TouchableOpacity>

          {/* Linked Projects — shows projects tied to this contact */}
          {(() => {
            const linked = projects.filter((p) => p.lead_id === selectedLead!.id);
            if (linked.length === 0) return null;
            return (
              <View style={styles.contactCard}>
                <Text style={styles.contactCardTitle}>Linked Projects</Text>
                {linked.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BNG_COLORS.border }}
                    onPress={() => router.push(`/project/${p.id}` as any)}
                  >
                    <FontAwesome name="briefcase" size={14} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: BNG_COLORS.text }}>{p.title}</Text>
                      <Text style={{ fontSize: 12, color: BNG_COLORS.textMuted }}>{p.status} • {p.progress}%</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={12} color={BNG_COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}

          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={[styles.secondaryAction, { marginBottom: 12 }]}
              onPress={() => router.push({ pathname: '/edit-lead', params: { id: selectedLead!.id } } as any)}
            >
              <FontAwesome name="pencil" size={18} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={styles.secondaryActionText}>Edit Lead</Text>
            </TouchableOpacity>
            {selectedLead!.status !== 'converted' && (
              <TouchableOpacity
                style={[styles.primaryAction, { marginBottom: 16, backgroundColor: BNG_COLORS.success }]}
                onPress={() => handleConvertToCustomer(selectedLead!.id)}
              >
                <FontAwesome name="user-plus" size={18} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.primaryActionText}>Convert to Customer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => router.push({ pathname: '/add-project', params: { contactId: selectedLead!.id, contactType: 'lead' } } as any)}
            >
              <FontAwesome name="file-text-o" size={18} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.primaryActionText}>Create Project</Text>
            </TouchableOpacity>
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleCall(selectedLead!.phone)}>
                <FontAwesome name="phone" size={18} color={BNG_COLORS.success} />
                <Text style={styles.secondaryActionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleEmail(selectedLead!.email)}>
                <FontAwesome name="envelope" size={18} color={BNG_COLORS.info} />
                <Text style={styles.secondaryActionText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleText(selectedLead!.phone)}>
                <FontAwesome name="comment" size={18} color={BNG_COLORS.accent} />
                <Text style={styles.secondaryActionText}>Text</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.secondaryAction, { marginTop: 16, borderWidth: 1, borderColor: BNG_COLORS.accent }]}
              onPress={() => handleDeleteLead(selectedLead!.id)}
            >
              <FontAwesome name="trash-o" size={18} color={BNG_COLORS.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.secondaryActionText, { color: BNG_COLORS.accent }]}>Delete Lead</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : showCustomerDetail ? (
        <ScrollView
          style={styles.detailsScroll}
          contentContainerStyle={[
            styles.detailsScrollContent,
            { paddingHorizontal: horizontalPad },
            isDesktop && styles.detailsScrollContentDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View style={styles.detailsHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCustomerId(null)}>
              <FontAwesome name="arrow-left" size={18} color={BNG_COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailsAvatarLarge}>
              <Text style={styles.detailsAvatarTextLarge}>{selectedCustomer!.name.charAt(0)}</Text>
            </View>
            <Text style={styles.detailsName}>{selectedCustomer!.name}</Text>
            <Text style={styles.detailsProject}>{selectedCustomer!.project_type || 'General Inquiry'}</Text>
            <Text style={styles.detailSourceLabel}>Source: {getSourceName(selectedCustomer!.lead_source_id)}</Text>
          </View>

          {renderContactCard(
            selectedCustomer!.phone,
            selectedCustomer!.email,
            formatAddress(selectedCustomer!),
            {
              alternateEmail: selectedCustomer!.alternate_email ?? null,
              companyName: selectedCustomer!.company_name ?? null,
            }
          )}

          {renderCrmNotesMediaBlock('customer', selectedCustomer!.id)}

          <TouchableOpacity
            style={[styles.secondaryAction, { marginBottom: 12, backgroundColor: `${BNG_COLORS.info}14` }]}
            onPress={() => router.push(`/contact/customer/${selectedCustomer!.id}` as any)}
          >
            <FontAwesome name="book" size={18} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={styles.secondaryActionText}>Open hub: to-dos, logs, and more</Text>
          </TouchableOpacity>

          {/* Linked Projects — shows projects tied to this customer */}
          {(() => {
            const linked = projects.filter((p) => p.customer_id === selectedCustomer!.id);
            if (linked.length === 0) return null;
            return (
              <View style={styles.contactCard}>
                <Text style={styles.contactCardTitle}>Linked Projects</Text>
                {linked.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BNG_COLORS.border }}
                    onPress={() => router.push(`/project/${p.id}` as any)}
                  >
                    <FontAwesome name="briefcase" size={14} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: BNG_COLORS.text }}>{p.title}</Text>
                      <Text style={{ fontSize: 12, color: BNG_COLORS.textMuted }}>{p.status} • {p.progress}%</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={12} color={BNG_COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}

          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={[styles.secondaryAction, { marginBottom: 12 }]}
              onPress={() => router.push({ pathname: '/edit-customer', params: { id: selectedCustomer!.id } } as any)}
            >
              <FontAwesome name="pencil" size={18} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={styles.secondaryActionText}>Edit Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryAction} onPress={() => router.push({ pathname: '/add-project', params: { contactId: selectedCustomer!.id, contactType: 'customer' } } as any)}>
              <FontAwesome name="file-text-o" size={18} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.primaryActionText}>Create Project</Text>
            </TouchableOpacity>
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleCall(selectedCustomer!.phone)}>
                <FontAwesome name="phone" size={18} color={BNG_COLORS.success} />
                <Text style={styles.secondaryActionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleEmail(selectedCustomer!.email)}>
                <FontAwesome name="envelope" size={18} color={BNG_COLORS.info} />
                <Text style={styles.secondaryActionText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handleText(selectedCustomer!.phone)}>
                <FontAwesome name="comment" size={18} color={BNG_COLORS.accent} />
                <Text style={styles.secondaryActionText}>Text</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.secondaryAction, { marginTop: 16, borderWidth: 1, borderColor: BNG_COLORS.accent }]}
              onPress={() => handleDeleteCustomer(selectedCustomer!.id)}
            >
              <FontAwesome name="trash-o" size={18} color={BNG_COLORS.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.secondaryActionText, { color: BNG_COLORS.accent }]}>Delete Customer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIconContainer}>
            <FontAwesome name="inbox" size={48} color={BNG_COLORS.textMuted} />
          </View>
          <Text style={styles.emptyStateTitle}>No Contact Selected</Text>
          <Text style={styles.emptyStateText}>Choose a lead or customer to view details</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isTablet ? (
        <View style={styles.splitPane}>
          {renderList()}
          <View style={styles.splitDivider} />
          {renderDetails()}
        </View>
      ) : (
        showDetail ? renderDetails() : renderList()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  splitPane: { flex: 1, flexDirection: 'row', minHeight: 0 },
  splitDivider: { width: 1, backgroundColor: BNG_COLORS.border },
  listContainer: { flex: 1, backgroundColor: BNG_COLORS.background, minWidth: 0 },
  listContainerTablet: { flex: 0.38, maxWidth: 420, minWidth: 260 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
  },
  listHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  listTitle: { fontSize: 28, fontWeight: '800', color: BNG_COLORS.text, letterSpacing: -0.5 },
  listTitleMobile: { fontSize: 22 },
  scratchpadLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    marginLeft: 16,
  },
  scratchpadLinkText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.accent },
  filterContainer: {
    flexDirection: 'row', backgroundColor: BNG_COLORS.surface,
    borderRadius: 10, padding: 4, ...SHADOWS.sm,
  },
  // Mobile: pill is as wide as its labels — user swipes horizontally if it’s wider than the screen.
  filterScrollMobile: { width: '100%', flexGrow: 0 },
  filterScrollContentMobile: { flexGrow: 0, alignItems: 'center' },
  filterContainerScrollable: { flexDirection: 'row', flexGrow: 0 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  filterButtonMobileScroll: { paddingHorizontal: 14, paddingVertical: 10, flexShrink: 0 },
  filterButtonActive: { backgroundColor: BNG_COLORS.primary },
  filterText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.textSecondary },
  filterTextActive: { color: '#FFF' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: BNG_COLORS.accent, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: BNG_COLORS.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  detailsContainer: { flex: 1, backgroundColor: BNG_COLORS.background, minWidth: 0 },
  detailsScroll: { flex: 1 },
  detailsScrollContent: { paddingTop: 16, paddingBottom: 56 },
  detailsScrollContentDesktop: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  crmInlineCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  crmInlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  crmInlineTitle: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.text },
  crmInlineLink: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.primary },
  crmInlineMuted: { fontSize: 14, color: BNG_COLORS.textMuted, lineHeight: 20 },
  notePreviewRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BNG_COLORS.border,
  },
  notePreviewTitle: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.text },
  notePreviewBody: { fontSize: 14, color: BNG_COLORS.textSecondary, marginTop: 4, lineHeight: 20 },
  notePreviewDate: { fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 4 },
  mediaStrip: { marginTop: 4, marginHorizontal: -4 },
  mediaThumbWrap: { marginRight: 10 },
  mediaThumb: { width: 72, height: 72, borderRadius: 10 },
  mediaThumbPlaceholder: { backgroundColor: BNG_COLORS.border },
  detailsHeader: { marginBottom: 16 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: BNG_COLORS.surface,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
  },
  listContent: { padding: 16, paddingBottom: 100 },
  leadItem: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, marginBottom: 12, padding: 16,
    borderWidth: 2, borderColor: 'transparent',
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  selectedLeadItem: { borderColor: BNG_COLORS.primary },
  leadHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  leadAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: BNG_COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  leadAvatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  leadInfo: { flex: 1 },
  leadName: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 4 },
  leadProject: { fontSize: 14, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sourceBadgeRow: { marginBottom: 8 },
  sourceBadgeText: { fontSize: 12, color: BNG_COLORS.textMuted, fontWeight: '500' },
  leadFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: BNG_COLORS.border,
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  leadDate: { fontSize: 13, color: BNG_COLORS.textMuted, marginLeft: 6, fontWeight: '500' },
  leadActions: { flexDirection: 'row', gap: 8 },
  actionIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: BNG_COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  detailsCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 20, padding: 24, alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 3 } }),
  },
  detailsAvatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: BNG_COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  detailsAvatarTextLarge: { color: '#FFF', fontSize: 32, fontWeight: '700' },
  detailsName: { fontSize: 24, fontWeight: '800', color: BNG_COLORS.text, marginBottom: 4 },
  detailsProject: { fontSize: 16, color: BNG_COLORS.textSecondary, marginBottom: 12 },
  detailSourceLabel: { fontSize: 14, color: BNG_COLORS.textMuted, marginTop: 4 },
  statusChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  statusChipText: { fontSize: 12, fontWeight: '600', color: BNG_COLORS.textSecondary },
  contactCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  contactCardTitle: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start' },
  contactValueCol: { flex: 1, minWidth: 0 },
  contactIconContainer: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  contactLabel: { fontSize: 12, color: BNG_COLORS.textMuted, marginBottom: 2 },
  contactValue: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.text, flexShrink: 1 },
  divider: { height: 1, backgroundColor: BNG_COLORS.border, marginVertical: 12 },
  actionsCard: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, padding: 20,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  primaryAction: {
    backgroundColor: BNG_COLORS.accent, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: BNG_COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  primaryActionText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  secondaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: BNG_COLORS.background, paddingVertical: 12, borderRadius: 10, gap: 8,
  },
  secondaryActionText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.text, flexShrink: 1, textAlign: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyStateIconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: BNG_COLORS.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...SHADOWS.md,
  },
  emptyStateTitle: { fontSize: 22, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 8 },
  emptyStateText: { fontSize: 16, color: BNG_COLORS.textSecondary, textAlign: 'center' },
});
