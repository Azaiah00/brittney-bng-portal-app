import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView, Platform, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { saveLeadOffline } from '../lib/offline';
import { parseLeadNotes, ParsedLead } from '../lib/gemini';
import { BNG_COLORS, SHADOWS } from '../lib/theme';

export default function ScratchpadScreen() {
  const [notes, setNotes] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedLead | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const router = useRouter();

  const handleParseWithAI = async () => {
    if (!notes.trim()) {
      Alert.alert('Error', 'Please enter some notes first.');
      return;
    }

    setIsParsing(true);
    setParsedResult(null);
    try {
      const result = await parseLeadNotes(notes);
      setParsedResult(result);
    } catch (error: any) {
      Alert.alert('AI Error', error.message || 'Failed to parse notes. Check your Gemini API key.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveLead = async () => {
    if (!parsedResult) return;

    try {
      await saveLeadOffline({
        name: parsedResult.name || 'Unknown',
        phone: parsedResult.phone || null,
        email: null,
        address: parsedResult.address || null,
        project_type: parsedResult.projectType || null,
        notes: notes || null,
        status: 'new' as const,
      });

      Alert.alert('Lead Saved', `"${parsedResult.name}" has been saved as a new lead.`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save lead.');
    }
  };

  const updateField = (field: keyof ParsedLead, value: string) => {
    if (!parsedResult) return;
    if (field === 'rooms') {
      setParsedResult({ ...parsedResult, rooms: value.split(',').map(s => s.trim()) });
    } else {
      setParsedResult({ ...parsedResult, [field]: value });
    }
  };

  // Input view (before AI parse)
  const renderInputView = () => (
    <>
      {/* Instructions Card */}
      {showInstructions && (
        <View style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <FontAwesome name="lightbulb-o" size={20} color={BNG_COLORS.warning} />
            <Text style={styles.instructionTitle}>How it works</Text>
            <TouchableOpacity onPress={() => setShowInstructions(false)}>
              <FontAwesome name="times" size={16} color={BNG_COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.instructionText}>
            Paste or type your raw job notes, texts, or emails here. AI will automatically pull out the client name, address, phone number, project type, and a summary of the work. Review the results and tap Save.
          </Text>
        </View>
      )}

      {!showInstructions && (
        <TouchableOpacity onPress={() => setShowInstructions(true)} style={styles.showInstructions}>
          <FontAwesome name="question-circle" size={16} color={BNG_COLORS.primary} />
          <Text style={styles.showInstructionsText}>How it works</Text>
        </TouchableOpacity>
      )}

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={12}
          placeholder={"Paste job notes, client texts, or emails here...\n\nExample:\n🛁 Bathroom Remodel – 1209 Howard Ave\nReplace all fixtures, install exhaust system, new LED lighting..."}
          placeholderTextColor={BNG_COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />

        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => Alert.alert('Voice Input', 'Voice-to-text will be available in a future update. For now, type or paste your notes.')}
          >
            <FontAwesome name="microphone" size={18} color={BNG_COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={async () => {
              try {
                const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                if (!result.canceled && result.assets[0]) {
                  Alert.alert('Photo Captured', 'Photo-to-text extraction is coming soon. For now, type the details from the photo into the text area above.');
                }
              } catch {
                Alert.alert('Camera Error', 'Could not open camera. Make sure camera permissions are granted.');
              }
            }}
          >
            <FontAwesome name="camera" size={18} color={BNG_COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.toolbarDivider} />
          <Text style={styles.characterCount}>{notes.length} characters</Text>
        </View>
      </View>

      {/* Extract Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>AI Extracts:</Text>
        <View style={styles.tipsGrid}>
          {[
            { icon: 'user', label: 'Name', color: BNG_COLORS.primary },
            { icon: 'phone', label: 'Phone', color: BNG_COLORS.success },
            { icon: 'map-marker', label: 'Address', color: BNG_COLORS.info },
            { icon: 'home', label: 'Project', color: BNG_COLORS.accent },
            { icon: 'list', label: 'Rooms', color: BNG_COLORS.warning },
            { icon: 'usd', label: 'Budget', color: BNG_COLORS.success },
          ].map((tip) => (
            <View key={tip.label} style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: `${tip.color}15` }]}>  
                <FontAwesome name={tip.icon as any} size={14} color={tip.color} />
              </View>
              <Text style={styles.tipText}>{tip.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Parse Button */}
      <TouchableOpacity
        style={[styles.parseButton, isParsing && styles.buttonDisabled]}
        onPress={handleParseWithAI}
        disabled={isParsing}
        activeOpacity={0.8}
      >
        {isParsing ? (
          <>
            <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.parseButtonText}>Analyzing with AI...</Text>
          </>
        ) : (
          <>
            <FontAwesome name="magic" size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.parseButtonText}>Parse with AI</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  // Review view (after AI parse)
  const renderReviewView = () => {
    if (!parsedResult) return null;

    const fields: { key: keyof ParsedLead; label: string; icon: string; color: string }[] = [
      { key: 'name', label: 'Client Name', icon: 'user', color: BNG_COLORS.primary },
      { key: 'phone', label: 'Phone', icon: 'phone', color: BNG_COLORS.success },
      { key: 'address', label: 'Address', icon: 'map-marker', color: BNG_COLORS.info },
      { key: 'projectType', label: 'Project Type', icon: 'home', color: BNG_COLORS.accent },
      { key: 'rooms', label: 'Rooms / Areas', icon: 'list', color: BNG_COLORS.warning },
      { key: 'estimatedBudgetRange', label: 'Est. Budget', icon: 'usd', color: BNG_COLORS.success },
    ];

    return (
      <>
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <FontAwesome name="check-circle" size={24} color={BNG_COLORS.success} />
          <View style={styles.successBannerContent}>
            <Text style={styles.successTitle}>AI Extraction Complete</Text>
            <Text style={styles.successSubtitle}>Review and edit any field below, then save.</Text>
          </View>
        </View>

        {/* Extracted Fields */}
        <View style={styles.reviewCard}>
          {fields.map((field) => {
            const value = field.key === 'rooms'
              ? (parsedResult.rooms || []).join(', ')
              : String(parsedResult[field.key] || '');

            return (
              <View key={field.key} style={styles.fieldContainer}>
                <View style={styles.fieldHeader}>
                  <View style={[styles.fieldIcon, { backgroundColor: `${field.color}15` }]}>
                    <FontAwesome name={field.icon as any} size={14} color={field.color} />
                  </View>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                </View>
                <TextInput
                  style={styles.fieldInput}
                  value={value}
                  onChangeText={(text) => updateField(field.key, text)}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  placeholderTextColor={BNG_COLORS.textMuted}
                />
              </View>
            );
          })}
        </View>

        {/* Scope Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Scope Summary</Text>
          <TextInput
            style={styles.summaryInput}
            value={parsedResult.scopeSummary}
            onChangeText={(text) => updateField('scopeSummary', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveLead} activeOpacity={0.8}>
          <FontAwesome name="check" size={18} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.saveButtonText}>Save as New Lead</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setParsedResult(null)}
          activeOpacity={0.8}
        >
          <FontAwesome name="refresh" size={16} color={BNG_COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.retryButtonText}>Edit Notes & Re-Parse</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={20} color={BNG_COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <FontAwesome name="magic" size={20} color={BNG_COLORS.accent} style={{ marginRight: 8 }} />
            <Text style={styles.title}>Smart Scratchpad</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {parsedResult ? renderReviewView() : renderInputView()}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  placeholder: { width: 44 },
  instructionCard: {
    backgroundColor: `${BNG_COLORS.warning}10`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${BNG_COLORS.warning}25`,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  instructionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  instructionText: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    lineHeight: 21,
  },
  showInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  showInstructionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.primary,
  },
  inputContainer: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: SHADOWS.md,
      android: { elevation: 3 },
    }),
  },
  textArea: {
    padding: 20,
    fontSize: 16,
    color: BNG_COLORS.text,
    minHeight: 200,
    lineHeight: 24,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
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
    fontSize: 13,
    fontWeight: '700',
    color: BNG_COLORS.textMuted,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tipItem: {
    alignItems: 'center',
    width: 60,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    fontWeight: '600',
    color: BNG_COLORS.textSecondary,
  },
  parseButton: {
    backgroundColor: BNG_COLORS.accent,
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: SHADOWS.glowAccent,
      android: { elevation: 6 },
    }),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  parseButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.successBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  successBannerContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BNG_COLORS.success,
    marginBottom: 2,
  },
  successSubtitle: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
  },
  reviewCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: SHADOWS.md,
      android: { elevation: 3 },
    }),
  },
  fieldContainer: {
    marginBottom: 18,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BNG_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: BNG_COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: BNG_COLORS.text,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  summaryCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: { elevation: 2 },
    }),
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 12,
  },
  summaryInput: {
    backgroundColor: BNG_COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: BNG_COLORS.text,
    lineHeight: 22,
    minHeight: 100,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  saveButton: {
    backgroundColor: BNG_COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: SHADOWS.glowPrimary,
      android: { elevation: 6 },
    }),
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BNG_COLORS.surface,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: BNG_COLORS.primary,
  },
  bottomSpacing: {
    height: 40,
  },
});
