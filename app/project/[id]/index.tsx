import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../../lib/theme';

// Mock data for logs
const MOCK_LOGS = [
  { id: '1', note: 'Demolition completed. Found some water damage behind the sink that needs repair.', image_urls: [], created_at: '2026-04-02T10:00:00Z', author: 'You' },
  { id: '2', note: 'Plumbing rough-in done. All pipes installed and pressure tested successfully.', image_urls: [], created_at: '2026-04-04T14:30:00Z', author: 'Mike (Plumber)' },
  { id: '3', note: 'Electrical work started. Outlets and switches mapped out.', image_urls: [], created_at: '2026-04-05T09:00:00Z', author: 'You' },
];

export default function ProjectTimelineScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [newNote, setNewNote] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddLog = async () => {
    if (!newNote.trim() && selectedImages.length === 0) {
      Alert.alert('Error', 'Please add a note or select an image.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newLog = {
        id: Math.random().toString(),
        note: newNote,
        image_urls: selectedImages,
        created_at: new Date().toISOString(),
        author: 'You',
      };

      setLogs([newLog, ...logs]);
      setNewNote('');
      setSelectedImages([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLogItem = ({ item, index }: { item: typeof MOCK_LOGS[0], index: number }) => {
    const isLast = index === logs.length - 1;
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
          <Text style={styles.logAuthor}>— {item.author}</Text>
          
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
          title: 'Project Timeline',
          headerStyle: { backgroundColor: BNG_COLORS.primary },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push(`/project/${id}/estimator`)}
              style={styles.headerButton}
              activeOpacity={0.8}
            >
              <FontAwesome name="calculator" size={14} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.headerButtonText}>Estimate</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      {/* Project Info Card */}
      <View style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <View style={styles.projectIconContainer}>
            <FontAwesome name="home" size={24} color={BNG_COLORS.primary} />
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>Doe Kitchen Remodel</Text>
            <Text style={styles.projectAddress}>123 Oak St, Richmond, VA</Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>35%</Text>
          </View>
        </View>
        
        <View style={styles.projectStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Demo</Text>
            <Text style={styles.statLabel}>Phase</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Apr 1</Text>
            <Text style={styles.statLabel}>Started</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>45K</Text>
            <Text style={styles.statLabel}>Budget</Text>
          </View>
        </View>
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
        <TouchableOpacity>
          <Text style={styles.timelineFilter}>All Updates</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BNG_COLORS.background,
  },
  headerButton: {
    backgroundColor: BNG_COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  projectCard: {
    backgroundColor: BNG_COLORS.surface,
    margin: 16,
    padding: 20,
    borderRadius: 20,
    ...Platform.select({
      ios: SHADOWS.md,
      android: {
        elevation: 4,
        borderWidth: 1,
        borderColor: BNG_COLORS.border,
      },
    }),
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  projectIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 4,
  },
  projectAddress: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: BNG_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 15,
    fontWeight: '800',
    color: BNG_COLORS.primary,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: BNG_COLORS.border,
  },
  inputContainer: {
    backgroundColor: BNG_COLORS.surface,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
        borderWidth: 1,
        borderColor: BNG_COLORS.border,
      },
    }),
  },
  input: {
    backgroundColor: BNG_COLORS.background,
    borderRadius: 14,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: BNG_COLORS.text,
    marginBottom: 12,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: BNG_COLORS.text,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BNG_COLORS.surface,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: BNG_COLORS.background,
    borderRadius: 10,
  },
  iconButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.text,
  },
  submitButton: {
    backgroundColor: BNG_COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  timelineFilter: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.primary,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -32,
    width: 2,
    backgroundColor: BNG_COLORS.border,
  },
  timelineDotContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${BNG_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
    zIndex: 2,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BNG_COLORS.primary,
  },
  logContent: {
    flex: 1,
    backgroundColor: BNG_COLORS.surface,
    padding: 18,
    borderRadius: 16,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
        borderWidth: 1,
        borderColor: BNG_COLORS.border,
      },
    }),
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '700',
    color: BNG_COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  logTime: {
    fontSize: 12,
    fontWeight: '500',
    color: BNG_COLORS.textMuted,
  },
  logNote: {
    fontSize: 15,
    color: BNG_COLORS.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  logAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: BNG_COLORS.primary,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  logImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
});
