import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { saveLeadOffline } from '../lib/offline';
import { BNG_COLORS, SHADOWS } from '../lib/theme';

export default function ScratchpadScreen() {
  const [notes, setNotes] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const router = useRouter();

  const handleParseWithAI = async () => {
    if (!notes.trim()) {
      Alert.alert('Error', 'Please enter some notes first.');
      return;
    }

    setIsParsing(true);
    try {
      // Mock AI parsing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI parsing result
      const parsedLead = {
        name: 'Extracted Name',
        phone: '555-0199',
        address: '123 Mock St',
        project_type: 'Kitchen Remodel',
        status: 'new' as const,
      };

      // Save offline (which will sync when online)
      await saveLeadOffline(parsedLead);
      
      Alert.alert('Success', 'Lead parsed and saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to parse notes.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color={BNG_COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <FontAwesome name="magic" size={20} color={BNG_COLORS.accent} style={{ marginRight: 8 }} />
            <Text style={styles.title}>AI Scratchpad</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <FontAwesome name="lightbulb-o" size={24} color={BNG_COLORS.warning} />
          </View>
          <Text style={styles.infoText}>
            Type or dictate lead details. AI will automatically extract name, phone, address, and project type.
          </Text>
        </View>
        
        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={10}
            placeholder="Example: Met with John Doe at 123 Main St today. He wants a full kitchen remodel and his number is 555-1234. Budget around $50k."
            placeholderTextColor={BNG_COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
          
          {/* Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolButton}>
              <FontAwesome name="microphone" size={20} color={BNG_COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolButton}>
              <FontAwesome name="camera" size={20} color={BNG_COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.toolbarDivider} />
            <Text style={styles.characterCount}>
              {notes.length} characters
            </Text>
          </View>
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>AI Extracts:</Text>
          <View style={styles.tipsGrid}>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: `${BNG_COLORS.primary}15` }]}>
                <FontAwesome name="user" size={14} color={BNG_COLORS.primary} />
              </View>
              <Text style={styles.tipText}>Name</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: `${BNG_COLORS.success}15` }]}>
                <FontAwesome name="phone" size={14} color={BNG_COLORS.success} />
              </View>
              <Text style={styles.tipText}>Phone</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: `${BNG_COLORS.info}15` }]}>
                <FontAwesome name="map-marker" size={14} color={BNG_COLORS.info} />
              </View>
              <Text style={styles.tipText}>Address</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: `${BNG_COLORS.accent}15` }]}>
                <FontAwesome name="home" size={14} color={BNG_COLORS.accent} />
              </View>
              <Text style={styles.tipText}>Project</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.button, isParsing && styles.buttonDisabled]} 
          onPress={handleParseWithAI}
          disabled={isParsing}
          activeOpacity={0.8}
        >
          {isParsing ? (
            <>
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Processing...</Text>
            </>
          ) : (
            <>
              <FontAwesome name="magic" size={20} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Parse with AI</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BNG_COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BNG_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: BNG_COLORS.text,
  },
  placeholder: {
    width: 44,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${BNG_COLORS.warning}10`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${BNG_COLORS.warning}20`,
  },
  infoIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: SHADOWS.md,
      android: {
        elevation: 3,
        borderWidth: 1,
        borderColor: BNG_COLORS.border,
      },
    }),
  },
  textArea: {
    padding: 20,
    fontSize: 17,
    color: BNG_COLORS.text,
    minHeight: 180,
    lineHeight: 24,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
    backgroundColor: BNG_COLORS.surface,
  },
  toolButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BNG_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: BNG_COLORS.border,
    marginHorizontal: 12,
  },
  characterCount: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: BNG_COLORS.textMuted,
    fontWeight: '500',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BNG_COLORS.textMuted,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipItem: {
    alignItems: 'center',
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '600',
    color: BNG_COLORS.textSecondary,
  },
  button: {
    backgroundColor: BNG_COLORS.accent,
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BNG_COLORS.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
