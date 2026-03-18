// Message Generator — BTB-Hub-inspired email/SMS composer.
// Two modes: Reply to inbound message, or Compose new.
// Preset topic pills so Brittney never starts from a blank page.

import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { useBreakpoint } from '../lib/hooks';
import { generateMessage, GeneratedMessage } from '../lib/gemini';

// Preset topics tailored to remodeling workflow
const PRESETS = [
  { label: 'Payment reminder', topic: 'Send a polite payment reminder based on BNG\'s 30/40/30 payment schedule' },
  { label: 'Schedule update', topic: 'Notify client about a schedule change or delay on their remodel project' },
  { label: 'Selections due', topic: 'Remind client that material selections (tile, cabinets, fixtures) are due soon, referencing the $500/day delay clause' },
  { label: 'Change order', topic: 'Confirm a change order that adjusts the scope or price of the project' },
  { label: 'Sub work order', topic: 'Send a work order or schedule confirmation to a subcontractor' },
  { label: 'Final walkthrough', topic: 'Schedule the final walkthrough and punch list review with the client' },
  { label: 'Project complete', topic: 'Thank the client for choosing BNG Remodel and confirm the project is complete' },
  { label: 'Warranty follow-up', topic: 'Follow up with a past client about the 1-year workmanship warranty' },
];

export default function MessageGeneratorScreen() {
  const router = useRouter();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const isDesktop = bp === 'desktop';

  const [mode, setMode] = useState<'reply' | 'compose'>('reply');
  const [context, setContext] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedMessage | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!context.trim() && !selectedTopic) {
      Alert.alert('Need Input', 'Paste a message or describe a scenario, then pick a topic or just hit Generate.');
      return;
    }
    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const msg = await generateMessage({
        topic: selectedTopic || 'General professional communication for a remodeling company',
        context: context.trim(),
        mode,
      });
      setResult(msg);
    } catch (err: any) {
      Alert.alert('AI Error', err.message || 'Could not generate message.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = result.subject
      ? `Subject: ${result.subject}\n\n${result.body}`
      : result.body;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setContext('');
    setSelectedTopic('');
    setResult(null);
    setCopied(false);
  };

  // On tablet/desktop, show input and output side by side
  const useSideBySide = isDesktop || (!isMobile);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back + title */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={16} color={BNG_COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <FontAwesome name="envelope" size={22} color={BNG_COLORS.primary} />
          <View>
            <Text style={styles.heading}>Message Generator</Text>
            <Text style={styles.subheading}>Craft on-brand replies in seconds</Text>
          </View>
        </View>

        {/* Main content: input + output */}
        <View style={[styles.mainRow, useSideBySide && styles.mainRowSide]}>

          {/* ── LEFT: Input panel ── */}
          <View style={[styles.panel, useSideBySide && styles.panelHalf]}>
            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'reply' && styles.modeBtnActive]}
                onPress={() => setMode('reply')}
              >
                <Text style={[styles.modeBtnText, mode === 'reply' && styles.modeBtnTextActive]}>
                  Reply to Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'compose' && styles.modeBtnActive]}
                onPress={() => setMode('compose')}
              >
                <Text style={[styles.modeBtnText, mode === 'compose' && styles.modeBtnTextActive]}>
                  Compose New
                </Text>
              </TouchableOpacity>
            </View>

            {/* Text input */}
            <TextInput
              style={styles.textArea}
              placeholder={
                mode === 'reply'
                  ? 'Paste inbound customer email here...'
                  : 'Describe the situation or what you need to say...'
              }
              placeholderTextColor={BNG_COLORS.textMuted}
              value={context}
              onChangeText={setContext}
              multiline
              numberOfLines={6}
            />

            {/* Summary toggle */}
            <TouchableOpacity
              style={styles.summaryToggle}
              onPress={() => setShowSummary(!showSummary)}
            >
              <FontAwesome
                name={showSummary ? 'check-square-o' : 'square-o'}
                size={16}
                color={BNG_COLORS.textMuted}
              />
              <Text style={styles.summaryToggleText}>Show internal summary</Text>
            </TouchableOpacity>

            {/* Preset topic pills */}
            <Text style={styles.presetLabel}>PRESET TOPIC</Text>
            <View style={styles.presetRow}>
              {PRESETS.map((p) => {
                const active = selectedTopic === p.topic;
                return (
                  <TouchableOpacity
                    key={p.label}
                    style={[styles.preset, active && styles.presetActive]}
                    onPress={() => setSelectedTopic(active ? '' : p.topic)}
                  >
                    <Text style={[styles.presetText, active && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Generate button */}
            <TouchableOpacity
              style={[styles.generateBtn, loading && { opacity: 0.6 }]}
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <FontAwesome name="magic" size={16} color="#FFF" />
              )}
              <Text style={styles.generateBtnText}>
                {loading ? 'Generating...' : 'Generate'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── RIGHT: Output panel ── */}
          <View style={[styles.panel, styles.outputPanel, useSideBySide && styles.panelHalf]}>
            {result ? (
              <>
                {/* Subject line */}
                {result.subject ? (
                  <View style={styles.subjectRow}>
                    <Text style={styles.subjectLabel}>Subject:</Text>
                    <Text style={styles.subjectText}>{result.subject}</Text>
                  </View>
                ) : null}

                {/* Body */}
                <ScrollView style={styles.outputScroll} nestedScrollEnabled>
                  <Text style={styles.outputBody}>{result.body}</Text>
                </ScrollView>

                {/* Internal summary */}
                {showSummary && result.summary ? (
                  <View style={styles.summaryBox}>
                    <FontAwesome name="info-circle" size={13} color={BNG_COLORS.info} />
                    <Text style={styles.summaryText}>{result.summary}</Text>
                  </View>
                ) : null}

                {/* Action buttons */}
                <View style={styles.outputActions}>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                    <FontAwesome name={copied ? 'check' : 'clipboard'} size={14} color="#FFF" />
                    <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <FontAwesome name="refresh" size={14} color={BNG_COLORS.textSecondary} />
                    <Text style={styles.resetBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyOutput}>
                <FontAwesome name="envelope-open-o" size={36} color={BNG_COLORS.border} />
                <Text style={styles.emptyOutputText}>
                  {loading
                    ? 'Generating your message...'
                    : 'Paste an email or describe a scenario above and click Generate.'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  scrollContent: { padding: 24, paddingBottom: 60 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.primary },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '800', color: BNG_COLORS.text },
  subheading: { fontSize: 13, color: BNG_COLORS.textMuted },

  // Layout: stacked on mobile, side-by-side on tablet+
  mainRow: { gap: 20 },
  mainRowSide: { flexDirection: 'row' },
  panel: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: BNG_COLORS.border, ...SHADOWS.sm,
  },
  panelHalf: { flex: 1 },
  outputPanel: { minHeight: 300 },

  // Mode toggle (Reply / Compose)
  modeToggle: {
    flexDirection: 'row', backgroundColor: BNG_COLORS.background,
    borderRadius: 10, padding: 3, marginBottom: 16,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeBtnActive: { backgroundColor: BNG_COLORS.primary },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  modeBtnTextActive: { color: '#FFF' },

  // Text input
  textArea: {
    backgroundColor: BNG_COLORS.background, borderRadius: 10, borderWidth: 1,
    borderColor: BNG_COLORS.border, padding: 14, fontSize: 14, color: BNG_COLORS.text,
    minHeight: 120, textAlignVertical: 'top',
  },

  // Summary toggle
  summaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  summaryToggleText: { fontSize: 13, color: BNG_COLORS.textMuted },

  // Presets
  presetLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1, color: BNG_COLORS.textMuted,
    marginTop: 20, marginBottom: 10,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  presetActive: { backgroundColor: BNG_COLORS.primary, borderColor: BNG_COLORS.primary },
  presetText: { fontSize: 13, fontWeight: '600', color: BNG_COLORS.textSecondary },
  presetTextActive: { color: '#FFF' },

  // Generate button
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: BNG_COLORS.primary, paddingVertical: 14, borderRadius: 12,
    marginTop: 20, ...SHADOWS.glowPrimary,
  },
  generateBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Output panel
  subjectRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  subjectLabel: { fontSize: 13, fontWeight: '700', color: BNG_COLORS.textMuted },
  subjectText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.text, flex: 1 },
  outputScroll: { maxHeight: 300 },
  outputBody: { fontSize: 14, color: BNG_COLORS.text, lineHeight: 22 },
  summaryBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: BNG_COLORS.infoBg, padding: 12, borderRadius: 10, marginTop: 14,
  },
  summaryText: { fontSize: 13, color: BNG_COLORS.info, flex: 1 },
  outputActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BNG_COLORS.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  copyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BNG_COLORS.background, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  resetBtnText: { color: BNG_COLORS.textSecondary, fontWeight: '600', fontSize: 14 },

  // Empty output state
  emptyOutput: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 14 },
  emptyOutputText: { fontSize: 14, color: BNG_COLORS.textMuted, textAlign: 'center', maxWidth: 280 },
});
