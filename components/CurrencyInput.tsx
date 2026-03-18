// Currency input that auto-formats to dollar format ($1,234.56).
// Stores raw number, displays formatted string while editing.

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { BNG_COLORS } from '../lib/theme';

interface CurrencyInputProps {
  value: string;
  onChangeText: (raw: string) => void;
  placeholder?: string;
  label?: string;
  style?: any;
}

// Format a raw numeric string into $X,XXX.XX display
function formatDollar(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return '';
  const parts = cleaned.split('.');
  const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimal = parts.length > 1 ? `.${parts[1].slice(0, 2)}` : '';
  return `$${whole}${decimal}`;
}

// Strip formatting to get raw numeric string
function stripDollar(formatted: string): string {
  return formatted.replace(/[$,]/g, '');
}

export function CurrencyInput({ value, onChangeText, placeholder = '$0.00', label, style }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    const stripped = stripDollar(value);
    return stripped ? formatDollar(stripped) : '';
  });
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    const raw = stripDollar(text);
    // Allow empty, digits, and a single decimal point
    if (raw !== '' && !/^\d*\.?\d{0,2}$/.test(raw)) return;
    setDisplayValue(raw ? formatDollar(raw) : '');
    onChangeText(raw);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw value while editing for easier typing
    const raw = stripDollar(value);
    setDisplayValue(raw ? `$${raw}` : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    const raw = stripDollar(value);
    setDisplayValue(raw ? formatDollar(raw) : '');
  };

  // Keep display in sync when value changes externally
  React.useEffect(() => {
    if (!isFocused) {
      const raw = stripDollar(value);
      setDisplayValue(raw ? formatDollar(raw) : '');
    }
  }, [value, isFocused]);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, style]}
        value={displayValue}
        onChangeText={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={BNG_COLORS.textMuted}
        keyboardType="decimal-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: '700', color: BNG_COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
    borderRadius: 10, padding: 12, fontSize: 15, color: BNG_COLORS.text,
  },
});
