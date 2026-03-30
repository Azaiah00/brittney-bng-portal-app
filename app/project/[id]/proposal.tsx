// Proposal / Contract Generator
// Two modes: Manual (default) and AI Assist (optional).
// Both produce a professional proposal + BNG standard contract appended as PDF.

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../../lib/theme';
import {
  fetchProject, fetchEstimates, fetchLeads, fetchCustomers,
  saveProposal, fetchProposals, sendForSignature, checkSignatureStatus,
} from '../../../lib/data';
import { generateContractProposal, ContractLineItem } from '../../../lib/gemini';
import { BNG_CONTRACT_HTML } from '../../../lib/contract-template';
import { DatePickerField } from '../../../components/DatePickerField';
import { CurrencyInput } from '../../../components/CurrencyInput';
import { useAuth } from '../../../lib/auth';
import { getUserDisplayName } from '../../../lib/userDisplay';

// ── Line item type used in local state ──
interface LineItem {
  id: string;
  service: string;
  quantity: number;
  unitPrice: number;
}

const TAX_RATE = 0.06;
const newId = () => Math.random().toString(36).slice(2, 9);

export default function ProposalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const contractorSignerName = getUserDisplayName(user);

  // ── Mode: manual (default) or ai ──
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');

  // ── Form state ──
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [projectType, setProjectType] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: newId(), service: '', quantity: 1, unitPrice: 0 },
  ]);
  const [includeTax, setIncludeTax] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [specialConditions, setSpecialConditions] = useState('');

  // ── AI state ──
  const [aiScopeText, setAiScopeText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Preview / saving state ──
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── E-Signature state ──
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureStatus, setSignatureStatus] = useState<string>('none');
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // ── Pre-fill from project + contact data ──
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [project, leads, customers] = await Promise.all([
          fetchProject(id),
          fetchLeads(),
          fetchCustomers(),
        ]);
        if (!project) return;

        setProjectType(project.title || '');
        setClientAddress(project.address || '');

        // Resolve contact name from lead_id or customer_id
        if (project.lead_id) {
          const lead = leads.find((l) => l.id === project.lead_id);
          if (lead) setClientName(lead.name);
        } else if (project.customer_id) {
          const cust = customers.find((c) => c.id === project.customer_id);
          if (cust) setClientName(cust.name);
        }

        // Pre-fill line items from most recent estimate if one exists
        const estimates = await fetchEstimates(id);
        if (estimates.length > 0) {
          const est = estimates[0];
          const items = est.line_items as any[];
          if (Array.isArray(items) && items.length > 0) {
            setLineItems(
              items.map((li: any) => ({
                id: newId(),
                service: li.service || '',
                quantity: li.quantity || 1,
                unitPrice: li.price || li.unitPrice || 0,
              }))
            );
          }
        }
      } catch { /* project may not exist yet */ }
    })();
  }, [id]);

  // Load existing proposal if one was saved before (for e-sign status)
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const proposals = await fetchProposals(id);
        if (proposals.length > 0) {
          const latest = proposals[0];
          setSavedProposalId(latest.id);
          setSignatureStatus(latest.signature_status || 'none');
          setSigningLink(latest.signing_link || null);
          if (latest.signer_email) setSignerEmail(latest.signer_email);
        }
      } catch { /* ok */ }
    })();
  }, [id]);

  // ── Calculated totals ──
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const tax = includeTax ? subtotal * TAX_RATE : 0;
  const total = subtotal + tax;

  // ── BNG payment schedule (30 / 40 / 30 split) ──
  const deposit = total * 0.3;
  const midpoint = total * 0.4;
  const finalPayment = total * 0.3;

  // ── Line item helpers ──
  const addLineItem = () => setLineItems((prev) => [...prev, { id: newId(), service: '', quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (itemId: string) => setLineItems((prev) => prev.filter((li) => li.id !== itemId));
  const updateLineItem = (itemId: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((li) => (li.id === itemId ? { ...li, [field]: value } : li)));
  };

  const formatCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── AI generation handler ──
  const handleAiGenerate = async () => {
    if (!aiScopeText.trim()) {
      Alert.alert('Required', 'Paste or type the scope of work / job notes.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateContractProposal({
        clientName: clientName || 'Valued Client',
        address: clientAddress || 'TBD',
        projectType: projectType || 'Home Remodel',
        scopeText: aiScopeText,
        estimateTotal: subtotal > 0 ? subtotal : undefined,
      });

      // Populate form fields with AI result
      setScopeOfWork(result.scopeOfWork);
      setLineItems(
        result.lineItems.map((li: ContractLineItem) => ({
          id: newId(),
          service: li.service,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        }))
      );
      if (result.startDate) setStartDate(result.startDate);
      if (result.completionDate) setCompletionDate(result.completionDate);
      if (result.specialConditions) setSpecialConditions(result.specialConditions);

      // Switch to manual mode so user can review/edit the populated fields
      setMode('manual');
      Alert.alert('AI Complete', 'Proposal fields have been populated. Review and edit below, then preview or export.');
    } catch (error: any) {
      Alert.alert('AI Error', error.message || 'Failed to generate proposal.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Save to Supabase ──
  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const saved = await saveProposal({
        project_id: id,
        client_name: clientName || null,
        client_address: clientAddress || null,
        scope_of_work: scopeOfWork || null,
        line_items: lineItems.map((li) => ({ service: li.service, quantity: li.quantity, unitPrice: li.unitPrice })),
        subtotal,
        tax,
        total_amount: total,
        payment_schedule: {
          deposit: { label: '30% Deposit', amount: deposit },
          midpoint: { label: '40% at Halfway', amount: midpoint },
          final: { label: '30% on Completion', amount: finalPayment },
        },
        start_date: startDate || null,
        completion_date: completionDate || null,
        special_conditions: specialConditions || null,
        status: 'draft',
      });
      setSavedProposalId(saved.id);
      Alert.alert('Saved', 'Proposal saved as draft. You can now send it for e-signature.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save proposal.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Build PDF HTML ──
  const buildPdfHtml = () => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const lineItemsHTML = lineItems
      .filter((li) => li.service.trim())
      .map(
        (li) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#1E293B;">${li.service}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#475569;text-align:center;">${li.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#475569;text-align:right;">${formatCurrency(li.unitPrice)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#1E293B;text-align:right;font-weight:600;">${formatCurrency(li.quantity * li.unitPrice)}</td>
        </tr>`
      )
      .join('');

    return `<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:48px; color:#1E293B; line-height:1.6; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:28px; border-bottom:3px solid #1E3A8A; margin-bottom:36px; }
  .logo { font-size:28px; font-weight:800; color:#1E3A8A; letter-spacing:-1px; }
  .logo span { color:#C53030; }
  .logo-sub { font-size:12px; color:#64748B; margin-top:4px; }
  .doc-info { text-align:right; }
  .doc-type { font-size:22px; font-weight:700; color:#1E3A8A; margin-bottom:6px; }
  .doc-date { font-size:13px; color:#64748B; }
  .client-box { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:20px; margin-bottom:32px; }
  .client-label { font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#94A3B8; margin-bottom:6px; }
  .client-name { font-size:20px; font-weight:700; color:#0F172A; margin-bottom:2px; }
  .client-addr { font-size:14px; color:#64748B; }
  .section-title { font-size:18px; font-weight:700; color:#1E3A8A; margin-bottom:14px; padding-bottom:6px; border-bottom:2px solid #E2E8F0; margin-top:32px; }
  .scope-text { font-size:13px; color:#475569; line-height:1.8; white-space:pre-wrap; margin-bottom:24px; }
  table { width:100%; border-collapse:collapse; margin-bottom:16px; }
  th { background:#1E3A8A; color:#FFF; padding:10px 12px; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; }
  th:first-child { border-radius:6px 0 0 0; text-align:left; }
  th:last-child { border-radius:0 6px 0 0; }
  .totals-row td { padding:8px 12px; font-size:14px; }
  .total-final td { font-size:18px; font-weight:800; color:#1E3A8A; border-top:2px solid #1E3A8A; padding-top:12px; }
  .payment-box { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:20px; margin-bottom:24px; }
  .payment-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#475569; }
  .payment-row strong { color:#1E293B; }
  .note-text { font-size:12px; color:#64748B; margin-top:4px; }
  .timeline-text { font-size:13px; color:#475569; line-height:1.7; margin-bottom:24px; }
  .conditions-text { font-size:13px; color:#475569; line-height:1.7; margin-bottom:24px; }
  .contract-section { margin-top:48px; padding-top:32px; border-top:3px solid #1E3A8A; }
  .sig-section { margin-top:56px; display:flex; justify-content:space-between; gap:48px; }
  .sig-box { flex:1; }
  .sig-line { border-bottom:1px solid #94A3B8; height:48px; margin-bottom:6px; }
  .sig-label { font-size:11px; color:#64748B; }
  .footer { text-align:center; margin-top:48px; padding-top:16px; border-top:1px solid #E2E8F0; color:#94A3B8; font-size:12px; }
  .footer strong { color:#1E3A8A; }
  @media print { body { padding:24px; } }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div>
    <div class="logo">BNG <span>Remodel</span></div>
    <div class="logo-sub">Licensed & Insured General Contractor — Richmond, VA</div>
  </div>
  <div class="doc-info">
    <div class="doc-type">Proposal & Contract</div>
    <div class="doc-date">${today}</div>
  </div>
</div>

<!-- Client -->
<div class="client-box">
  <div class="client-label">Prepared For</div>
  <div class="client-name">${clientName || 'Valued Client'}</div>
  <div class="client-addr">${clientAddress || ''}</div>
</div>

<!-- Scope of Work -->
<div class="section-title">Scope of Work</div>
<div class="scope-text">${(scopeOfWork || '').replace(/\n/g, '<br>')}</div>

<!-- Line Items Table -->
<div class="section-title">Cost Breakdown</div>
<table>
  <thead>
    <tr>
      <th style="text-align:left;">Service</th>
      <th style="text-align:center;">Qty</th>
      <th style="text-align:right;">Unit Price</th>
      <th style="text-align:right;">Total</th>
    </tr>
  </thead>
  <tbody>
    ${lineItemsHTML}
    <tr class="totals-row">
      <td colspan="3" style="text-align:right;color:#64748B;padding-right:12px;">Subtotal</td>
      <td style="text-align:right;font-weight:600;">${formatCurrency(subtotal)}</td>
    </tr>
    ${includeTax ? `
    <tr class="totals-row">
      <td colspan="3" style="text-align:right;color:#64748B;padding-right:12px;">Tax (6%)</td>
      <td style="text-align:right;">${formatCurrency(tax)}</td>
    </tr>` : ''}
    <tr class="total-final">
      <td colspan="3" style="text-align:right;padding-right:12px;">Total</td>
      <td style="text-align:right;">${formatCurrency(total)}</td>
    </tr>
  </tbody>
</table>

<!-- Payment Schedule -->
<div class="section-title">Payment Schedule</div>
<div class="payment-box">
  <div class="payment-row"><span>30% Deposit (due to schedule project)</span><strong>${formatCurrency(deposit)}</strong></div>
  <div class="payment-row"><span>40% at Project Halfway Point</span><strong>${formatCurrency(midpoint)}</strong></div>
  <div class="payment-row"><span>30% Balance Upon Completion</span><strong>${formatCurrency(finalPayment)}</strong></div>
  <div class="note-text">We accept cash, cashier's check, wire transfer, and credit/debit card. Wire transfers are subject to a $35 fee. Card payments are subject to a 3.5% processing fee.</div>
</div>

<!-- Timeline -->
${startDate || completionDate || scopeOfWork ? `
<div class="section-title">Project Timeline</div>
<div class="timeline-text">
  ${startDate ? `<strong>Estimated Start:</strong> ${startDate}<br>` : ''}
  ${completionDate ? `<strong>Estimated Completion:</strong> ${completionDate}<br>` : ''}
</div>
` : ''}

<!-- Special Conditions -->
${specialConditions ? `
<div class="section-title">Special Conditions</div>
<div class="conditions-text">${specialConditions.replace(/\n/g, '<br>')}</div>
` : ''}

<!-- Standard Contract Terms -->
<div class="contract-section">
  ${BNG_CONTRACT_HTML}
</div>

<!-- Signatures -->
<div class="sig-section">
  <div class="sig-box">
    <div class="sig-line"></div>
    <div class="sig-label">${contractorSignerName}, BNG Remodel — Date</div>
  </div>
  <div class="sig-box">
    <div class="sig-line"></div>
    <div class="sig-label">Client Signature — Date</div>
  </div>
</div>

<div class="footer">
  <strong>BNG Remodel</strong> — Richmond, Virginia<br>
  Thank you for the opportunity to serve you!
</div>

</body>
</html>`;
  };

  // ── Export PDF ──
  const handleExportPDF = async () => {
    try {
      const html = buildPdfHtml();
      const { uri } = await Print.printToFileAsync({ html });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Proposal PDF' });
      } else {
        Alert.alert('PDF Generated', `File saved at: ${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF.');
      console.error(error);
    }
  };

  // ── Send for e-signature ──
  const handleSendForSignature = async () => {
    if (!savedProposalId) {
      Alert.alert('Save First', 'Please save the proposal before sending for signature.');
      return;
    }
    if (!signerEmail.trim()) {
      Alert.alert('Email Required', 'Enter the client email address to send the signature request.');
      return;
    }
    setIsSending(true);
    try {
      const html = buildPdfHtml();
      const result = await sendForSignature(savedProposalId, signerEmail.trim(), clientName || 'Client', html);
      setSignatureStatus(result.signature_status);
      setSigningLink(result.signing_link);
      Alert.alert('Sent!', 'Signature request sent to ' + signerEmail.trim());
    } catch (err: any) {
      Alert.alert('E-Sign Error', err.message || 'Could not send for signature.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Refresh e-sign status ──
  const handleCheckStatus = async () => {
    if (!savedProposalId) return;
    setIsCheckingStatus(true);
    try {
      const result = await checkSignatureStatus(savedProposalId);
      setSignatureStatus(result.signature_status);
      if (result.signed) {
        Alert.alert('Signed!', 'The client has signed the proposal.');
      }
    } catch (err: any) {
      Alert.alert('Status Error', err.message || 'Could not check status.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Status badge color/label
  const getStatusBadge = () => {
    switch (signatureStatus) {
      case 'sent': return { color: BNG_COLORS.warning, label: 'Awaiting Signature' };
      case 'viewed': return { color: BNG_COLORS.info, label: 'Viewed by Client' };
      case 'signed': return { color: BNG_COLORS.success, label: 'Signed' };
      case 'declined': return { color: BNG_COLORS.accent, label: 'Declined' };
      default: return { color: BNG_COLORS.textMuted, label: 'Not Sent' };
    }
  };

  // ── Render: Mode Tabs ──
  const renderModeTabs = () => (
    <View style={styles.modeContainer}>
      <TouchableOpacity
        style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]}
        onPress={() => setMode('manual')}
      >
        <FontAwesome name="pencil" size={14} color={mode === 'manual' ? '#FFF' : BNG_COLORS.textSecondary} style={{ marginRight: 6 }} />
        <Text style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}>Manual</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeTab, mode === 'ai' && styles.modeTabActive]}
        onPress={() => setMode('ai')}
      >
        <FontAwesome name="magic" size={14} color={mode === 'ai' ? '#FFF' : BNG_COLORS.textSecondary} style={{ marginRight: 6 }} />
        <Text style={[styles.modeTabText, mode === 'ai' && styles.modeTabTextActive]}>AI Assist</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Render: AI Assist view ──
  const renderAiAssist = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>AI Proposal Generator</Text>
      <Text style={styles.cardSubtitle}>Paste job notes, scope, or a description. AI will generate scope, line items, pricing, and timeline.</Text>
      <TextInput
        style={styles.scopeInput}
        value={aiScopeText}
        onChangeText={setAiScopeText}
        placeholder={"Paste the full job description or scope here...\n\nExample:\nBathroom Remodel – 1209 Howard Ave\nReplace all fixtures, install exhaust, new LED lighting, tile floor and shower walls..."}
        placeholderTextColor={BNG_COLORS.textMuted}
        multiline
        numberOfLines={10}
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={[styles.aiButton, isGenerating && { opacity: 0.7 }]}
        onPress={handleAiGenerate}
        disabled={isGenerating}
        activeOpacity={0.8}
      >
        {isGenerating ? (
          <>
            <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.aiButtonText}>Generating Proposal...</Text>
          </>
        ) : (
          <>
            <FontAwesome name="magic" size={18} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.aiButtonText}>Generate with AI</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ── Render: Manual form ──
  const renderManualForm = () => (
    <>
      {/* Client Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Client Info</Text>
        <View style={styles.row}>
          <View style={[styles.fieldWrap, { flex: 1, marginRight: 12 }]}>
            <Text style={styles.label}>Client Name</Text>
            <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholder="Full name" placeholderTextColor={BNG_COLORS.textMuted} />
          </View>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.label}>Project Type</Text>
            <TextInput style={styles.input} value={projectType} onChangeText={setProjectType} placeholder="e.g. Kitchen Remodel" placeholderTextColor={BNG_COLORS.textMuted} />
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Property Address</Text>
          <TextInput style={styles.input} value={clientAddress} onChangeText={setClientAddress} placeholder="Street address" placeholderTextColor={BNG_COLORS.textMuted} />
        </View>
      </View>

      {/* Scope of Work */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scope of Work</Text>
        <TextInput
          style={styles.scopeInput}
          value={scopeOfWork}
          onChangeText={setScopeOfWork}
          placeholder="Describe everything included in this project..."
          placeholderTextColor={BNG_COLORS.textMuted}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
      </View>

      {/* Line Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Line Items</Text>
        {lineItems.map((li, idx) => (
          <View key={li.id} style={styles.lineItemRow}>
            <View style={{ flex: 2, marginRight: 8 }}>
              {idx === 0 && <Text style={styles.label}>Service</Text>}
              <TextInput
                style={styles.input}
                value={li.service}
                onChangeText={(t) => updateLineItem(li.id, 'service', t)}
                placeholder="Service name"
                placeholderTextColor={BNG_COLORS.textMuted}
              />
            </View>
            <View style={{ flex: 0.6, marginRight: 8 }}>
              {idx === 0 && <Text style={styles.label}>Qty</Text>}
              <TextInput
                style={styles.input}
                value={String(li.quantity)}
                onChangeText={(t) => updateLineItem(li.id, 'quantity', parseInt(t) || 0)}
                keyboardType="numeric"
                placeholderTextColor={BNG_COLORS.textMuted}
              />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              {idx === 0 && <Text style={styles.label}>Unit Price</Text>}
              <CurrencyInput
                value={String(li.unitPrice)}
                onChangeText={(t) => updateLineItem(li.id, 'unitPrice', parseFloat(t) || 0)}
                placeholder="$0.00"
                style={styles.input}
              />
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeLineItem(li.id)}>
              <FontAwesome name="trash-o" size={16} color={BNG_COLORS.accent} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addItemBtn} onPress={addLineItem}>
          <FontAwesome name="plus" size={14} color={BNG_COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.addItemText}>Add Line Item</Text>
        </TouchableOpacity>
      </View>

      {/* Totals */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pricing</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <TouchableOpacity style={styles.taxToggle} onPress={() => setIncludeTax(!includeTax)}>
          <FontAwesome name={includeTax ? 'check-square-o' : 'square-o'} size={18} color={BNG_COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.taxToggleText}>Include 6% Tax ({formatCurrency(tax)})</Text>
        </TouchableOpacity>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
        </View>
        <View style={styles.paymentPreview}>
          <Text style={styles.paymentPreviewTitle}>Payment Schedule (30/40/30)</Text>
          <Text style={styles.paymentPreviewLine}>30% Deposit: {formatCurrency(deposit)}</Text>
          <Text style={styles.paymentPreviewLine}>40% at Halfway: {formatCurrency(midpoint)}</Text>
          <Text style={styles.paymentPreviewLine}>30% on Completion: {formatCurrency(finalPayment)}</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline</Text>
        <View style={styles.row}>
          <View style={[styles.fieldWrap, { flex: 1, marginRight: 12 }]}>
            <DatePickerField value={startDate} onChange={setStartDate} label="Start Date" />
          </View>
          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <DatePickerField value={completionDate} onChange={setCompletionDate} label="Completion Date" />
          </View>
        </View>
      </View>

      {/* Special Conditions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Special Conditions (optional)</Text>
        <TextInput
          style={styles.scopeInput}
          value={specialConditions}
          onChangeText={setSpecialConditions}
          placeholder="Any conditions specific to this project..."
          placeholderTextColor={BNG_COLORS.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Contract note */}
      <View style={styles.contractNote}>
        <FontAwesome name="file-text-o" size={16} color={BNG_COLORS.primary} style={{ marginRight: 10 }} />
        <Text style={styles.contractNoteText}>
          BNG Remodel's standard contract terms will be automatically appended to the PDF.
        </Text>
      </View>
    </>
  );

  // ── Action buttons (always visible in manual mode) ──
  const renderActions = () => (
    <View style={styles.actionsWrap}>
      <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF} activeOpacity={0.8}>
        <FontAwesome name="file-pdf-o" size={18} color="#FFF" style={{ marginRight: 10 }} />
        <Text style={styles.exportButtonText}>Export PDF</Text>
      </TouchableOpacity>
      <View style={styles.secondaryRow}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving} activeOpacity={0.8}>
          <FontAwesome name="save" size={16} color={BNG_COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Draft'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── E-Signature section ──
  const renderESignSection = () => {
    const badge = getStatusBadge();
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={styles.cardTitle}>E-Signature</Text>
          <View style={[styles.esignBadge, { backgroundColor: `${badge.color}15` }]}>
            <View style={[styles.esignDot, { backgroundColor: badge.color }]} />
            <Text style={[styles.esignBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {signatureStatus === 'none' || signatureStatus === 'declined' ? (
          <>
            <Text style={{ fontSize: 13, color: BNG_COLORS.textSecondary, marginBottom: 12, lineHeight: 19 }}>
              Save the proposal first, then enter the client's email and send for e-signature via SignNow.
            </Text>
            <Text style={styles.label}>Client Email</Text>
            <TextInput
              style={styles.input}
              value={signerEmail}
              onChangeText={setSignerEmail}
              placeholder="client@email.com"
              placeholderTextColor={BNG_COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.esignButton, (!savedProposalId || isSending) && { opacity: 0.6 }]}
              onPress={handleSendForSignature}
              disabled={!savedProposalId || isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
              ) : (
                <FontAwesome name="pencil-square-o" size={18} color="#FFF" style={{ marginRight: 10 }} />
              )}
              <Text style={styles.esignButtonText}>
                {isSending ? 'Sending...' : 'Send for Signature'}
              </Text>
            </TouchableOpacity>
            {!savedProposalId && (
              <Text style={{ fontSize: 12, color: BNG_COLORS.textMuted, marginTop: 8, textAlign: 'center' }}>
                Save the proposal first to enable e-signature.
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={{ fontSize: 14, color: BNG_COLORS.textSecondary, marginBottom: 8 }}>
              Sent to: <Text style={{ fontWeight: '600', color: BNG_COLORS.text }}>{signerEmail}</Text>
            </Text>
            <TouchableOpacity
              style={styles.checkStatusBtn}
              onPress={handleCheckStatus}
              disabled={isCheckingStatus}
              activeOpacity={0.8}
            >
              <FontAwesome name="refresh" size={14} color={BNG_COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: BNG_COLORS.primary }}>
                {isCheckingStatus ? 'Checking...' : 'Refresh Status'}
              </Text>
            </TouchableOpacity>
            {signatureStatus === 'signed' && (
              <View style={styles.signedConfirm}>
                <FontAwesome name="check-circle" size={20} color={BNG_COLORS.success} style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: BNG_COLORS.success }}>
                  Contract signed by client
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Proposal & Contract',
          headerStyle: { backgroundColor: BNG_COLORS.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {renderModeTabs()}
        {mode === 'ai' ? renderAiAssist() : (
          <>
            {renderManualForm()}
            {renderActions()}
            {renderESignSection()}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BNG_COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },

  // Mode tabs
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modeTabActive: { backgroundColor: BNG_COLORS.primary },
  modeTabText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.textSecondary },
  modeTabTextActive: { color: '#FFF' },

  // Cards
  card: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({ ios: SHADOWS.sm, android: { elevation: 2 } }),
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text, marginBottom: 14 },
  cardSubtitle: { fontSize: 13, color: BNG_COLORS.textSecondary, marginBottom: 14, lineHeight: 19 },

  // Form fields
  row: { flexDirection: 'row' },
  fieldWrap: { marginBottom: 12 },
  label: {
    fontSize: 11, fontWeight: '700', color: BNG_COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
    borderRadius: 10, padding: 12, fontSize: 15, color: BNG_COLORS.text,
  },
  scopeInput: {
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
    borderRadius: 10, padding: 14, fontSize: 14, color: BNG_COLORS.text,
    minHeight: 140, lineHeight: 21,
  },

  // Line items
  lineItemRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  removeBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: BNG_COLORS.primary, borderStyle: 'dashed', marginTop: 4,
  },
  addItemText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.primary },

  // Totals
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: BNG_COLORS.textSecondary },
  totalValue: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.text },
  taxToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  taxToggleText: { fontSize: 14, color: BNG_COLORS.textSecondary },
  grandTotalRow: { borderTopWidth: 2, borderTopColor: BNG_COLORS.primary, paddingTop: 12, marginTop: 8 },
  grandTotalLabel: { fontSize: 18, fontWeight: '800', color: BNG_COLORS.primary },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: BNG_COLORS.primary },
  paymentPreview: {
    backgroundColor: BNG_COLORS.background, borderRadius: 10, padding: 14, marginTop: 12,
  },
  paymentPreviewTitle: { fontSize: 12, fontWeight: '700', color: BNG_COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  paymentPreviewLine: { fontSize: 13, color: BNG_COLORS.textSecondary, marginBottom: 4 },

  // Contract note
  contractNote: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: `${BNG_COLORS.primary}08`,
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  contractNoteText: { flex: 1, fontSize: 13, color: BNG_COLORS.textSecondary, lineHeight: 18 },

  // AI button
  aiButton: {
    backgroundColor: BNG_COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, marginTop: 12,
    ...Platform.select({ ios: { shadowColor: BNG_COLORS.accent, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }),
  },
  aiButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  // E-Signature
  esignBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  esignDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  esignBadgeText: { fontSize: 12, fontWeight: '700' },
  esignButton: {
    backgroundColor: '#059669', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, marginTop: 14,
    ...Platform.select({ ios: { shadowColor: '#059669', shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }),
  },
  esignButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  checkStatusBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
    marginTop: 8,
  },
  signedConfirm: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${BNG_COLORS.success}10`, borderRadius: 12, padding: 14, marginTop: 12,
  },

  // Actions
  actionsWrap: { marginTop: 8 },
  exportButton: {
    backgroundColor: BNG_COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 14,
    ...Platform.select({ ios: { shadowColor: BNG_COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }),
  },
  exportButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  saveButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, backgroundColor: BNG_COLORS.surface,
    borderWidth: 1, borderColor: BNG_COLORS.border,
  },
  saveButtonText: { fontSize: 15, fontWeight: '600', color: BNG_COLORS.primary },
});
