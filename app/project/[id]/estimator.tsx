import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Alert, Platform, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS, SHADOWS } from '../../../lib/theme';

type LineItem = {
  id: string;
  service: string;
  quantity: string;
  price: string;
};

const PRESET_ITEMS = [
  { service: 'Kitchen Demo', quantity: '1', price: '2500' },
  { service: 'Cabinet Install', quantity: '1', price: '3500' },
  { service: 'Countertop', quantity: '1', price: '4500' },
  { service: 'Plumbing Rough-in', quantity: '1', price: '1800' },
  { service: 'Electrical Work', quantity: '1', price: '2200' },
];

export default function EstimatorScreen() {
  const { id } = useLocalSearchParams();
  const [items, setItems] = useState<LineItem[]>([]);
  const [service, setService] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const handleAddItem = () => {
    if (!service || !price) {
      Alert.alert('Error', 'Please enter a service and price.');
      return;
    }

    const newItem: LineItem = {
      id: Math.random().toString(),
      service,
      quantity,
      price,
    };

    setItems([...items, newItem]);
    setService('');
    setQuantity('1');
    setPrice('');
  };

  const handleAddPreset = (preset: typeof PRESET_ITEMS[0]) => {
    const newItem: LineItem = {
      id: Math.random().toString(),
      ...preset,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return total + (q * p);
    }, 0);
  };

  const calculateSubtotal = () => calculateTotal();
  const calculateTax = () => calculateTotal() * 0.06; // 6% tax
  const calculateGrandTotal = () => calculateSubtotal() + calculateTax();

  const generatePDF = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one line item.');
      return;
    }

    const total = calculateGrandTotal();
    
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 40px;
              color: #1E293B;
              background: #fff;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 3px solid #1E3A8A; 
              padding-bottom: 24px; 
              margin-bottom: 40px; 
            }
            .logo-container { display: flex; align-items: center; gap: 16px; }
            .logo-icon { 
              width: 48px; 
              height: 48px; 
              background: linear-gradient(135deg, #1E3A8A, #C53030); 
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-icon::after {
              content: 'BNG';
              color: white;
              font-weight: 800;
              font-size: 14px;
            }
            .logo { 
              color: #1E3A8A; 
              font-size: 28px; 
              font-weight: 800; 
              letter-spacing: -1px;
            }
            .logo span { color: #C53030; }
            .estimate-info { text-align: right; }
            .estimate-title { 
              font-size: 14px; 
              color: #64748B; 
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .estimate-number { 
              font-size: 20px; 
              font-weight: 700;
              color: #1E3A8A;
            }
            .client-section {
              background: #F1F5F9;
              padding: 24px;
              border-radius: 12px;
              margin-bottom: 32px;
            }
            .client-label {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748B;
              margin-bottom: 8px;
            }
            .client-name {
              font-size: 20px;
              font-weight: 700;
              color: #0F172A;
              margin-bottom: 4px;
            }
            .client-address {
              font-size: 14px;
              color: #64748B;
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            th { 
              background-color: #F1F5F9; 
              color: #64748B; 
              padding: 16px; 
              text-align: left; 
              font-weight: 600; 
              text-transform: uppercase;
              font-size: 12px; 
              letter-spacing: 0.5px; 
              border-bottom: 2px solid #E2E8F0; 
            }
            th:last-child { text-align: right; }
            td { 
              padding: 20px 16px; 
              border-bottom: 1px solid #E2E8F0; 
            }
            td:last-child { text-align: right; font-weight: 600; }
            .service-name { font-weight: 600; color: #0F172A; }
            .qty-price { color: #64748B; font-size: 14px; }
            .totals-section {
              width: 300px;
              margin-left: auto;
              border-top: 2px solid #E2E8F0;
              padding-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
            }
            .total-label { 
              color: #64748B; 
              font-weight: 500; 
            }
            .total-value { 
              font-weight: 600; 
              color: #0F172A; 
            }
            .grand-total {
              display: flex;
              justify-content: space-between;
              padding-top: 16px;
              border-top: 2px solid #1E3A8A;
              margin-top: 16px;
            }
            .grand-total-label {
              font-size: 18px;
              font-weight: 700;
              color: #1E3A8A;
            }
            .grand-total-value {
              font-size: 24px;
              font-weight: 800;
              color: #1E3A8A;
            }
            .footer { 
              text-align: center; 
              color: #94A3B8; 
              font-size: 14px; 
              margin-top: 60px;
              padding-top: 24px;
              border-top: 1px solid #E2E8F0;
            }
            .signature-section {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 280px;
            }
            .signature-line {
              border-bottom: 1px solid #94A3B8;
              height: 60px;
              margin-bottom: 8px;
            }
            .signature-label {
              font-size: 12px;
              color: #64748B;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              <div class="logo-icon"></div>
              <div class="logo">BNG <span>Remodel</span></div>
            </div>
            <div class="estimate-info">
              <div class="estimate-title">Project Estimate</div>
              <div class="estimate-number">#EST-2026-001</div>
            </div>
          </div>
          
          <div class="client-section">
            <div class="client-label">Prepared For</div>
            <div class="client-name">John & Jane Doe</div>
            <div class="client-address">123 Oak Street, Richmond, VA 23220</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Service Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const q = parseFloat(item.quantity) || 0;
                const p = parseFloat(item.price) || 0;
                const lineTotal = q * p;
                return `
                  <tr>
                    <td>
                      <div class="service-name">${item.service}</div>
                    </td>
                    <td class="qty-price">${item.quantity}</td>
                    <td class="qty-price">$${p.toFixed(2)}</td>
                    <td>$${lineTotal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">$${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Tax (6%)</span>
              <span class="total-value">$${calculateTax().toFixed(2)}</span>
            </div>
            <div class="grand-total">
              <span class="grand-total-label">Grand Total</span>
              <span class="grand-total-value">$${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Contractor Signature & Date</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Client Signature & Date</div>
            </div>
          </div>
          
          <div class="footer">
            Thank you for choosing BNG Remodel. We look forward to working with you!<br>
            Questions? Call us at (555) 123-4567
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
          dialogTitle: 'Share Estimate PDF',
        });
      } else {
        Alert.alert('Success', `PDF generated at: ${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF.');
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: LineItem }) => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseFloat(item.price) || 0;
    const total = q * p;

    return (
      <View style={styles.lineItem}>
        <View style={styles.lineItemInfo}>
          <Text style={styles.lineItemService}>{item.service}</Text>
          <View style={styles.lineItemDetailsRow}>
            <Text style={styles.lineItemDetails}>
              {item.quantity} × ${p.toFixed(2)}
            </Text>
            <Text style={styles.lineItemTotal}>${total.toFixed(2)}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
          activeOpacity={0.7}
        >
          <FontAwesome name="trash-o" size={18} color={BNG_COLORS.accent} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Create Estimate',
          headerStyle: { backgroundColor: BNG_COLORS.primary },
          headerTintColor: '#fff',
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Client Info Card */}
        <View style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <View style={styles.clientIconContainer}>
              <FontAwesome name="user" size={20} color={BNG_COLORS.primary} />
            </View>
            <View>
              <Text style={styles.clientLabel}>Estimate For</Text>
              <Text style={styles.clientName}>Doe Kitchen Remodel</Text>
            </View>
          </View>
        </View>

        {/* Add Item Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Line Item</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Service Description"
            placeholderTextColor={BNG_COLORS.textMuted}
            value={service}
            onChangeText={setService}
          />
          
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.inputSmall}
                placeholder="1"
                placeholderTextColor={BNG_COLORS.textMuted}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 2 }]}>
              <Text style={styles.inputLabel}>Unit Price</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor={BNG_COLORS.textMuted}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem} activeOpacity={0.8}>
            <FontAwesome name="plus" size={16} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>

          {/* Presets Toggle */}
          <TouchableOpacity 
            style={styles.presetsToggle}
            onPress={() => setShowPresets(!showPresets)}
          >
            <Text style={styles.presetsToggleText}>
              {showPresets ? 'Hide Quick Presets' : 'Show Quick Presets'}
            </Text>
            <FontAwesome 
              name={showPresets ? "chevron-up" : "chevron-down"} 
              size={14} 
              color={BNG_COLORS.primary} 
            />
          </TouchableOpacity>

          {/* Preset Items */}
          {showPresets && (
            <View style={styles.presetsContainer}>
              {PRESET_ITEMS.map((preset, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.presetItem}
                  onPress={() => handleAddPreset(preset)}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetInfo}>
                    <Text style={styles.presetService}>{preset.service}</Text>
                    <Text style={styles.presetPrice}>${preset.price}</Text>
                  </View>
                  <FontAwesome name="plus-circle" size={20} color={BNG_COLORS.success} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Items List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Estimate Items</Text>
            <Text style={styles.itemCount}>{items.length} items</Text>
          </View>
          
          {items.length > 0 ? (
            <View style={styles.itemsCard}>
              {items.map((item, index) => (
                <View key={item.id}>
                  {renderItem({ item })}
                  {index < items.length - 1 && <View style={styles.itemDivider} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <FontAwesome name="file-text-o" size={48} color={BNG_COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Items Yet</Text>
              <Text style={styles.emptyText}>Add services to build your estimate</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        {items.length > 0 && (
          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${calculateSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax (6%)</Text>
              <Text style={styles.totalValue}>${calculateTax().toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>${calculateGrandTotal().toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer with Generate Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.generateButton, items.length === 0 && styles.generateButtonDisabled]} 
          onPress={generatePDF}
          disabled={items.length === 0}
          activeOpacity={0.8}
        >
          <FontAwesome name="file-pdf-o" size={20} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.generateButtonText}>Generate PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  clientCard: {
    backgroundColor: BNG_COLORS.surface,
    margin: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientLabel: {
    fontSize: 12,
    color: BNG_COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  formCard: {
    backgroundColor: BNG_COLORS.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    ...Platform.select({
      ios: SHADOWS.md,
      android: {
        elevation: 3,
      },
    }),
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: BNG_COLORS.background,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: BNG_COLORS.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'column',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BNG_COLORS.textMuted,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputSmall: {
    backgroundColor: BNG_COLORS.background,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: BNG_COLORS.text,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BNG_COLORS.background,
    borderWidth: 1,
    borderColor: BNG_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    color: BNG_COLORS.textMuted,
    fontWeight: '600',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: BNG_COLORS.text,
  },
  addButton: {
    backgroundColor: BNG_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: BNG_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  presetsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
  },
  presetsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.primary,
    marginRight: 6,
  },
  presetsContainer: {
    marginTop: 12,
    backgroundColor: BNG_COLORS.background,
    borderRadius: 12,
    padding: 8,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  presetInfo: {
    flex: 1,
  },
  presetService: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.text,
    marginBottom: 2,
  },
  presetPrice: {
    fontSize: 13,
    color: BNG_COLORS.textSecondary,
  },
  listContainer: {
    margin: 16,
    marginTop: 0,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: BNG_COLORS.textMuted,
  },
  itemsCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 4,
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  emptyCard: {
    backgroundColor: BNG_COLORS.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    ...Platform.select({
      ios: SHADOWS.sm,
      android: {
        elevation: 2,
      },
    }),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: BNG_COLORS.textMuted,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemService: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.text,
    marginBottom: 4,
  },
  lineItemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  lineItemDetails: {
    fontSize: 14,
    color: BNG_COLORS.textSecondary,
    fontWeight: '500',
  },
  lineItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.primary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${BNG_COLORS.accent}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDivider: {
    height: 1,
    backgroundColor: BNG_COLORS.border,
    marginHorizontal: 16,
  },
  totalsCard: {
    backgroundColor: BNG_COLORS.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: SHADOWS.md,
      android: {
        elevation: 3,
      },
    }),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: BNG_COLORS.textSecondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: BNG_COLORS.border,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: BNG_COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: BNG_COLORS.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: BNG_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: BNG_COLORS.border,
  },
  generateButton: {
    backgroundColor: BNG_COLORS.accent,
    flexDirection: 'row',
    padding: 18,
    borderRadius: 14,
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
  generateButtonDisabled: {
    backgroundColor: BNG_COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  bottomSpacing: {
    height: 20,
  },
});
