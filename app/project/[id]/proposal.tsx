import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../../lib/theme';
import { generateProposal, GeneratedProposal } from '../../../lib/gemini';
import { fetchProject } from '../../../lib/data';

export default function ProposalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Input state
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [projectType, setProjectType] = useState('');
  const [scopeText, setScopeText] = useState('');
  const [estimateTotal, setEstimateTotal] = useState('');

  // Pre-fill from Supabase project data
  useEffect(() => {
    if (!id) return;
    fetchProject(id).then(p => {
      if (!p) return;
      if (p.title && !clientName) setClientName(p.title);
      if (p.address && !address) setAddress(p.address);
      if (p.phase && !projectType) setProjectType(p.title);
      if (p.budget && !estimateTotal) setEstimateTotal(`$${p.budget.toLocaleString()}`);
    }).catch(() => {});
  }, [id]);

  // Result state
  const [proposal, setProposal] = useState<GeneratedProposal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleGenerate = async () => {
    if (!scopeText.trim()) {
      Alert.alert('Error', 'Please paste the scope of work.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateProposal({
        clientName: clientName || 'Valued Client',
        address: address || 'TBD',
        projectType: projectType || 'Home Remodel',
        scopeText,
        estimateTotal: estimateTotal || undefined,
      });
      setProposal(result);
    } catch (error: any) {
      Alert.alert('AI Error', error.message || 'Failed to generate proposal.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!proposal) return;

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const scopeHTML = proposal.scopeOfWork.map(section => `
      <div class="scope-section">
        <h3>${section.section}</h3>
        <ul>
          ${section.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const exclusionsHTML = proposal.exclusions.map(e => `<li>${e}</li>`).join('');

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 48px;
              color: #1E293B;
              line-height: 1.6;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 32px;
              border-bottom: 3px solid #1E3A8A;
              margin-bottom: 40px;
            }
            .logo-section { }
            .logo {
              font-size: 28px;
              font-weight: 800;
              color: #1E3A8A;
              letter-spacing: -1px;
            }
            .logo span { color: #C53030; }
            .logo-subtitle {
              font-size: 13px;
              color: #64748B;
              margin-top: 4px;
            }
            .doc-info { text-align: right; }
            .doc-type {
              font-size: 24px;
              font-weight: 700;
              color: #1E3A8A;
              margin-bottom: 8px;
            }
            .doc-date { font-size: 14px; color: #64748B; }
            .client-box {
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 36px;
            }
            .client-label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #94A3B8;
              margin-bottom: 8px;
            }
            .client-name {
              font-size: 22px;
              font-weight: 700;
              color: #0F172A;
              margin-bottom: 4px;
            }
            .client-address { font-size: 15px; color: #64748B; }
            .intro {
              font-size: 15px;
              color: #475569;
              line-height: 1.7;
              margin-bottom: 36px;
              padding: 20px;
              background: #F8FAFC;
              border-left: 4px solid #1E3A8A;
              border-radius: 0 8px 8px 0;
            }
            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: #1E3A8A;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid #E2E8F0;
            }
            .scope-section { margin-bottom: 24px; }
            .scope-section h3 {
              font-size: 16px;
              font-weight: 700;
              color: #0F172A;
              margin-bottom: 12px;
              padding-left: 12px;
              border-left: 3px solid #C53030;
            }
            .scope-section ul {
              padding-left: 24px;
              margin-bottom: 16px;
            }
            .scope-section li {
              margin-bottom: 8px;
              color: #475569;
              font-size: 14px;
            }
            .info-block {
              margin-bottom: 32px;
            }
            .info-block p, .info-block li {
              font-size: 14px;
              color: #475569;
              margin-bottom: 6px;
            }
            .info-block ul { padding-left: 24px; }
            .signature-section {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              gap: 48px;
            }
            .signature-box { flex: 1; }
            .signature-line {
              border-bottom: 1px solid #94A3B8;
              height: 50px;
              margin-bottom: 8px;
            }
            .signature-label { font-size: 12px; color: #64748B; }
            .footer {
              text-align: center;
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #E2E8F0;
              color: #94A3B8;
              font-size: 13px;
            }
            .footer strong { color: #1E3A8A; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <div class="logo">BNG <span>Remodel</span></div>
              <div class="logo-subtitle">Licensed & Insured General Contractor</div>
            </div>
            <div class="doc-info">
              <div class="doc-type">Project Proposal</div>
              <div class="doc-date">${today}</div>
            </div>
          </div>

          <div class="client-box">
            <div class="client-label">Prepared For</div>
            <div class="client-name">${clientName || 'Valued Client'}</div>
            <div class="client-address">${address || ''}</div>
          </div>

          <div class="intro">${proposal.companyIntro}</div>

          <div class="section-title">Scope of Work</div>
          ${scopeHTML}

          <div class="info-block">
            <div class="section-title">Project Timeline</div>
            <p>${proposal.timeline}</p>
          </div>

          ${estimateTotal ? `
          <div class="info-block">
            <div class="section-title">Project Investment</div>
            <p style="font-size: 22px; font-weight: 800; color: #1E3A8A;">Total: ${estimateTotal}</p>
          </div>
          ` : ''}

          <div class="info-block">
            <div class="section-title">Payment Terms</div>
            <p>${proposal.paymentTerms}</p>
          </div>

          <div class="info-block">
            <div class="section-title">Exclusions</div>
            <ul>${exclusionsHTML}</ul>
          </div>

          <div class="info-block">
            <div class="section-title">Warranty</div>
            <p>${proposal.warranty}</p>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Brittney Reader, BNG Remodel — Date</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Client Signature — Date</div>
            </div>
          </div>

          <div class="footer">
            <strong>BNG Remodel</strong> — Richmond, Virginia<br>
            Thank you for the opportunity to serve you!
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Proposal PDF',
        });
      } else {
        Alert.alert('Success', `PDF generated at: ${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF.');
      console.error(error);
    }
  };

  // ---------- Input Form View ----------
  const renderInputForm = () => (
    <>
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
            Paste the full job description or scope of work. AI will create a professional proposal with sections for scope, timeline, pricing, payment terms, and warranty. Edit any section, then tap 'Export PDF' to share with your client.
          </Text>
        </View>
      )}
      {!showInstructions && (
        <TouchableOpacity onPress={() => setShowInstructions(true)} style={styles.showHelp}>
          <FontAwesome name="question-circle" size={14} color={BNG_COLORS.primary} />
          <Text style={styles.showHelpText}>How it works</Text>
        </TouchableOpacity>
      )}

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Project Details</Text>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldCol, { marginRight: 12 }]}>
            <Text style={styles.fieldLabel}>Client Name</Text>
            <TextInput style={styles.fieldInput} value={clientName} onChangeText={setClientName}
              placeholder="e.g. John Doe" placeholderTextColor={BNG_COLORS.textMuted} />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Project Type</Text>
            <TextInput style={styles.fieldInput} value={projectType} onChangeText={setProjectType}
              placeholder="e.g. Bathroom Remodel" placeholderTextColor={BNG_COLORS.textMuted} />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Property Address</Text>
        <TextInput style={styles.fieldInput} value={address} onChangeText={setAddress}
          placeholder="e.g. 1209 Howard Ave, Richmond VA" placeholderTextColor={BNG_COLORS.textMuted} />

        <Text style={styles.fieldLabel}>Estimate Total (optional)</Text>
        <TextInput style={styles.fieldInput} value={estimateTotal} onChangeText={setEstimateTotal}
          placeholder="e.g. $28,500" placeholderTextColor={BNG_COLORS.textMuted} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Scope of Work</Text>
        <TextInput
          style={styles.scopeInput}
          value={scopeText}
          onChangeText={setScopeText}
          placeholder={"Paste the full job description or scope of work here...\n\nExample:\n🛁 Bathroom Remodel – 1209 Howard Avenue\nReplace all fixtures and finishes\nInstall exhaust system with light..."}
          placeholderTextColor={BNG_COLORS.textMuted}
          multiline
          numberOfLines={12}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.generateButton, isGenerating && { opacity: 0.7 }]}
        onPress={handleGenerate}
        disabled={isGenerating}
        activeOpacity={0.8}
      >
        {isGenerating ? (
          <>
            <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.generateButtonText}>Generating Proposal...</Text>
          </>
        ) : (
          <>
            <FontAwesome name="file-text" size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.generateButtonText}>Generate Proposal</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  // ---------- Proposal Preview View ----------
  const renderProposalPreview = () => {
    if (!proposal) return null;

    return (
      <>
        <View style={styles.successBanner}>
          <FontAwesome name="check-circle" size={24} color={BNG_COLORS.success} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.successTitle}>Proposal Ready</Text>
            <Text style={styles.successSubtitle}>Review, edit any section, then export to PDF.</Text>
          </View>
        </View>

        {/* Company Intro */}
        <View style={styles.previewCard}>
          <Text style={styles.previewSectionTitle}>Introduction</Text>
          <TextInput
            style={styles.previewTextInput}
            value={proposal.companyIntro}
            onChangeText={(t) => setProposal({ ...proposal, companyIntro: t })}
            multiline
          />
        </View>

        {/* Scope of Work */}
        {proposal.scopeOfWork.map((section, idx) => (
          <View key={idx} style={styles.previewCard}>
            <View style={styles.scopeHeader}>
              <View style={styles.scopeAccent} />
              <TextInput
                style={styles.scopeSectionTitle}
                value={section.section}
                onChangeText={(t) => {
                  const updated = [...proposal.scopeOfWork];
                  updated[idx] = { ...updated[idx], section: t };
                  setProposal({ ...proposal, scopeOfWork: updated });
                }}
              />
            </View>
            {section.items.map((item, iIdx) => (
              <View key={iIdx} style={styles.scopeItemRow}>
                <Text style={styles.bullet}>•</Text>
                <TextInput
                  style={styles.scopeItemInput}
                  value={item}
                  onChangeText={(t) => {
                    const updated = [...proposal.scopeOfWork];
                    const items = [...updated[idx].items];
                    items[iIdx] = t;
                    updated[idx] = { ...updated[idx], items };
                    setProposal({ ...proposal, scopeOfWork: updated });
                  }}
                  multiline
                />
              </View>
            ))}
          </View>
        ))}

        {/* Timeline */}
        <View style={styles.previewCard}>
          <Text style={styles.previewSectionTitle}>Timeline</Text>
          <TextInput
            style={styles.previewTextInput}
            value={proposal.timeline}
            onChangeText={(t) => setProposal({ ...proposal, timeline: t })}
            multiline
          />
        </View>

        {/* Payment Terms */}
        <View style={styles.previewCard}>
          <Text style={styles.previewSectionTitle}>Payment Terms</Text>
          <TextInput
            style={styles.previewTextInput}
            value={proposal.paymentTerms}
            onChangeText={(t) => setProposal({ ...proposal, paymentTerms: t })}
            multiline
          />
        </View>

        {/* Exclusions */}
        <View style={styles.previewCard}>
          <Text style={styles.previewSectionTitle}>Exclusions</Text>
          {proposal.exclusions.map((exc, idx) => (
            <View key={idx} style={styles.scopeItemRow}>
              <Text style={styles.bullet}>•</Text>
              <TextInput
                style={styles.scopeItemInput}
                value={exc}
                onChangeText={(t) => {
                  const updated = [...proposal.exclusions];
                  updated[idx] = t;
                  setProposal({ ...proposal, exclusions: updated });
                }}
              />
            </View>
          ))}
        </View>

        {/* Warranty */}
        <View style={styles.previewCard}>
          <Text style={styles.previewSectionTitle}>Warranty</Text>
          <TextInput
            style={styles.previewTextInput}
            value={proposal.warranty}
            onChangeText={(t) => setProposal({ ...proposal, warranty: t })}
            multiline
          />
        </View>

        {/* Export PDF */}
        <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF} activeOpacity={0.8}>
          <FontAwesome name="file-pdf-o" size={20} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </TouchableOpacity>

        {/* Edit & Re-generate */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => setProposal(null)}
          activeOpacity={0.8}
        >
          <FontAwesome name="pencil" size={16} color={BNG_COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.retryButtonText}>Edit Details & Re-Generate</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AI Proposal',
          headerStyle: { backgroundColor: BNG_COLORS.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {proposal ? renderProposalPreview() : renderInputForm()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BNG_COLORS.background,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
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
  showHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  showHelpText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.primary,
  },
  formCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: SHADOWS.md,
      android: { elevation: 3 },
    }),
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BNG_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldInput: {
    backgroundColor: BNG_COLORS.background,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: BNG_COLORS.text,
    marginBottom: 14,
  },
  scopeInput: {
    backgroundColor: BNG_COLORS.background,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: BNG_COLORS.text,
    minHeight: 200,
    lineHeight: 22,
  },
  generateButton: {
    backgroundColor: BNG_COLORS.accent,
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: SHADOWS.glowAccent,
      android: { elevation: 6 },
    }),
  },
  generateButtonText: {
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
  previewCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: { elevation: 2 },
    }),
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewTextInput: {
    fontSize: 15,
    color: BNG_COLORS.text,
    lineHeight: 22,
    backgroundColor: BNG_COLORS.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
  },
  scopeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scopeAccent: {
    width: 4,
    height: 24,
    backgroundColor: BNG_COLORS.accent,
    borderRadius: 2,
    marginRight: 10,
  },
  scopeSectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  scopeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 14,
  },
  bullet: {
    fontSize: 18,
    color: BNG_COLORS.textMuted,
    marginRight: 8,
    marginTop: 2,
  },
  scopeItemInput: {
    flex: 1,
    fontSize: 14,
    color: BNG_COLORS.text,
    lineHeight: 20,
    padding: 0,
  },
  exportButton: {
    backgroundColor: BNG_COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: SHADOWS.glowPrimary,
      android: { elevation: 6 },
    }),
  },
  exportButtonText: {
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
    marginTop: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: BNG_COLORS.primary,
  },
  bottomSpacing: { height: 40 },
});
