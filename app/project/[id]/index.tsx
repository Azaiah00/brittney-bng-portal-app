import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, Image,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../../lib/theme';
import { fetchProject, fetchLogs, createLog, fetchLeads, fetchCustomers } from '../../../lib/data';
import { useAuth } from '../../../lib/auth';
import { getUserDisplayName } from '../../../lib/userDisplay';
import { Database } from '../../../types/database';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type LogRow = Database['public']['Tables']['logs']['Row'];

export default function ProjectTimelineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const myAuthorName = getUserDisplayName(user);
  const router = useRouter();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [contactName, setContactName] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'mine'>('all');

  // Load project, logs, and linked contact name from Supabase
  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [proj, logsData, leads, customers] = await Promise.all([
        fetchProject(id),
        fetchLogs(id),
        fetchLeads(),
        fetchCustomers(),
      ]);
      if (proj) {
        setProject(proj);
        const names: Record<string, string> = {};
        leads.forEach((l) => { names[l.id] = l.name; });
        customers.forEach((c) => { names[c.id] = c.name; });
        const name = proj.lead_id ? names[proj.lead_id] : proj.customer_id ? names[proj.customer_id] : null;
        setContactName(name ?? null);
      }
      setLogs(logsData);
    } catch { /* Supabase may not be ready */ }
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...uris]);
    }
  };

  // Save log to Supabase
  const handleAddLog = async () => {
    if (!newNote.trim() && selectedImages.length === 0) {
      Alert.alert('Error', 'Please add a note or select an image.');
      return;
    }
    if (!id) return;

    setIsSubmitting(true);
    try {
      const newLog = await createLog({
        project_id: id,
        note: newNote.trim(),
        image_urls: selectedImages.length > 0 ? selectedImages : null,
        // Tag each note with whoever is signed in (from Supabase Auth / Google profile).
        author: myAuthorName,
      });
      setLogs(prev => [newLog, ...prev]);
      setNewNote('');
      setSelectedImages([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogs = logFilter === 'all'
    ? logs
    : logs.filter(
        (l) =>
          (l.author || '').trim().toLowerCase() === myAuthorName.trim().toLowerCase()
      );

  const formatBudget = (b: number | null) => {
    if (!b) return 'TBD';
    return b >= 1000 ? `${(b / 1000).toFixed(0)}K` : `$${b}`;
  };

  const renderLogItem = ({ item, index }: { item: LogRow; index: number }) => {
    const isLast = index === filteredLogs.length - 1;
    const date = new Date(item.created_at);

    return (
      <View style={styles.logItem}>
        {!isLast && <View style={styles.timelineLine} />}
        <View style={styles.timelineDotContainer}>
          <View style={styles.timelineDot} />
        </View>

        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={styles.logDate}>{date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
            <Text style={styles.logTime}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <Text style={styles.logNote}>{item.note}</Text>
          <Text style={styles.logAuthor}>— {item.author || 'Unknown'}</Text>

          {item.image_urls && item.image_urls.length > 0 && (
            <View style={styles.imageGrid}>
              {item.image_urls.map((url, imgIndex) => (
                <Image key={imgIndex} source={{ uri: url }} style={styles.logImage} />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: project?.title || 'Project Timeline',
          headerStyle: { backgroundColor: BNG_COLORS.primary },
          headerTintColor: '#fff',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/edit-project', params: { id } } as any)}
                style={[styles.headerButton, { backgroundColor: '#FFF' }]}
                activeOpacity={0.8}
              >
                <FontAwesome name="pencil" size={14} color={BNG_COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.headerButtonText, { color: BNG_COLORS.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/project/${id}/proposal`)}
                style={[styles.headerButton, { backgroundColor: '#FFF' }]}
                activeOpacity={0.8}
              >
                <FontAwesome name="file-text" size={14} color={BNG_COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.headerButtonText, { color: BNG_COLORS.primary }]}>Proposal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/project/${id}/estimator`)}
                style={styles.headerButton}
                activeOpacity={0.8}
              >
                <FontAwesome name="calculator" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.headerButtonText}>Estimate</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Project Info Card -- real data */}
      <View style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <View style={styles.projectIconContainer}>
            <FontAwesome name="home" size={24} color={BNG_COLORS.primary} />
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{project?.title || 'Loading...'}</Text>
            <Text style={styles.projectAddress}>{project?.address || 'No address'}</Text>
            {contactName ? (
              <Text style={styles.projectContact}>Contact: {contactName}</Text>
            ) : null}
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>{project?.progress ?? 0}%</Text>
          </View>
        </View>

        <View style={styles.projectStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{project?.phase || 'Planning'}</Text>
            <Text style={styles.statLabel}>Phase</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{project?.start_date || 'TBD'}</Text>
            <Text style={styles.statLabel}>Started</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatBudget(project?.budget ?? null)}</Text>
            <Text style={styles.statLabel}>Budget</Text>
          </View>
        </View>
      </View>

      {/* Project tools row — quick access to all project sub-pages */}
      <View style={styles.toolsRow}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => router.push(`/project/${id}/estimator`)}
        >
          <FontAwesome name="calculator" size={15} color={BNG_COLORS.primary} />
          <Text style={styles.toolBtnText}>Estimate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => router.push(`/project/${id}/proposal`)}
        >
          <FontAwesome name="file-text" size={15} color={BNG_COLORS.primary} />
          <Text style={styles.toolBtnText}>Proposal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => router.push(`/project/${id}/checklist`)}
        >
          <FontAwesome name="check-square-o" size={15} color={BNG_COLORS.success} />
          <Text style={styles.toolBtnText}>Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => router.push(`/project/${id}/punch-list`)}
        >
          <FontAwesome name="list" size={15} color={BNG_COLORS.accent} />
          <Text style={styles.toolBtnText}>Punch List</Text>
        </TouchableOpacity>
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What's happening on site? Add an update..."
          placeholderTextColor={BNG_COLORS.textMuted}
          value={newNote}
          onChangeText={setNewNote}
          multiline
        />

        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.selectedImageWrapper}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                >
                  <FontAwesome name="times" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage} activeOpacity={0.7}>
            <FontAwesome name="camera" size={18} color={BNG_COLORS.primary} />
            <Text style={styles.iconButtonText}>Add Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleAddLog}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Post Update</Text>
                <FontAwesome name="send" size={14} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle}>Activity Timeline</Text>
        <TouchableOpacity onPress={() => setLogFilter(f => f === 'all' ? 'mine' : 'all')}>
          <Text style={styles.timelineFilter}>{logFilter === 'all' ? 'All Updates' : 'My Updates'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <FontAwesome name="clock-o" size={32} color={BNG_COLORS.textMuted} />
            <Text style={{ color: BNG_COLORS.textMuted, fontSize: 15, marginTop: 8 }}>No updates yet. Post the first one above.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  headerButton: {
    backgroundColor: BNG_COLORS.accent, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  headerButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  projectCard: {
    backgroundColor: BNG_COLORS.surface, margin: 16, padding: 20, borderRadius: 20,
    ...Platform.select({ ios: SHADOWS.md, android: { elevation: 4, borderWidth: 1, borderColor: BNG_COLORS.border } }),
  },
  projectHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  projectIconContainer: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 19, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 4 },
  projectAddress: { fontSize: 14, color: BNG_COLORS.textSecondary, fontWeight: '500' },
  projectContact: { fontSize: 13, color: BNG_COLORS.primary, fontWeight: '600', marginTop: 4 },
  progressCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: BNG_COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  progressText: { fontSize: 15, fontWeight: '800', color: BNG_COLORS.primary },
  projectStats: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 16, borderTopWidth: 1, borderTopColor: BNG_COLORS.border,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 2 },
  statLabel: { fontSize: 12, color: BNG_COLORS.textMuted, fontWeight: '500' },
  statDivider: { width: 1, height: 30, backgroundColor: BNG_COLORS.border },
  inputContainer: {
    backgroundColor: BNG_COLORS.surface, marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 16,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2, borderWidth: 1, borderColor: BNG_COLORS.border } }),
  },
  input: {
    backgroundColor: BNG_COLORS.background, borderRadius: 14, padding: 16, minHeight: 100,
    textAlignVertical: 'top', fontSize: 16, color: BNG_COLORS.text, marginBottom: 12,
  },
  selectedImagesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  selectedImageWrapper: { position: 'relative', marginRight: 10, marginBottom: 10 },
  selectedImage: { width: 64, height: 64, borderRadius: 10 },
  removeImageBtn: {
    position: 'absolute', top: -6, right: -6, backgroundColor: BNG_COLORS.text,
    width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BNG_COLORS.surface,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: BNG_COLORS.background, borderRadius: 10,
  },
  iconButtonText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.text },
  submitButton: {
    backgroundColor: BNG_COLORS.accent, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  timelineHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 12,
  },
  timelineTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text },
  timelineFilter: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.primary },
  listContent: { padding: 20, paddingTop: 8 },
  logItem: { flexDirection: 'row', marginBottom: 24, position: 'relative' },
  timelineLine: {
    position: 'absolute', left: 11, top: 24, bottom: -32, width: 2, backgroundColor: BNG_COLORS.border,
  },
  timelineDotContainer: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: `${BNG_COLORS.primary}20`,
    alignItems: 'center', justifyContent: 'center', marginRight: 14, marginTop: 2, zIndex: 2,
  },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BNG_COLORS.primary },
  logContent: {
    flex: 1, backgroundColor: BNG_COLORS.surface, padding: 18, borderRadius: 16,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2, borderWidth: 1, borderColor: BNG_COLORS.border } }),
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  logDate: { fontSize: 13, fontWeight: '700', color: BNG_COLORS.textSecondary, textTransform: 'uppercase' },
  logTime: { fontSize: 12, fontWeight: '500', color: BNG_COLORS.textMuted },
  logNote: { fontSize: 15, color: BNG_COLORS.text, lineHeight: 22, marginBottom: 6 },
  logAuthor: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.primary },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  logImage: { width: 72, height: 72, borderRadius: 10 },
  toolsRow: {
    flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12, flexWrap: 'wrap',
  },
  toolBtn: {
    flex: 1, minWidth: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: BNG_COLORS.surface, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  toolBtnText: { fontSize: 12, fontWeight: '700', color: BNG_COLORS.text },
});
