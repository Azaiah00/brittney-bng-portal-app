// Date picker field with calendar popup (web) and auto-formatting.
// On web: renders an HTML date input via a hidden input + visible button.
// On native: uses a modal calendar-style picker.
// When typing manually, auto-formats to YYYY-MM-DD.

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS } from '../lib/theme';

interface DatePickerFieldProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
}

// Auto-format typed input into YYYY-MM-DD as user types digits
function autoFormatDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

// Simple month calendar for the picker modal
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function DatePickerField({ value, onChange, placeholder = 'YYYY-MM-DD', label }: DatePickerFieldProps) {
  const [showModal, setShowModal] = useState(false);

  // Calendar state: start with value date or today
  const parsed = value ? new Date(value) : new Date();
  const initialYear = !isNaN(parsed.getTime()) ? parsed.getFullYear() : new Date().getFullYear();
  const initialMonth = !isNaN(parsed.getTime()) ? parsed.getMonth() : new Date().getMonth();
  const [calYear, setCalYear] = useState(initialYear);
  const [calMonth, setCalMonth] = useState(initialMonth);

  const handleTextChange = (text: string) => {
    onChange(autoFormatDate(text));
  };

  const handleSelectDay = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${calYear}-${mm}-${dd}`);
    setShowModal(false);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  // Build calendar grid
  const totalDays = daysInMonth(calYear, calMonth);
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const selectedDay = value ? parseInt(value.split('-')[2], 10) : -1;
  const selectedMonth = value ? parseInt(value.split('-')[1], 10) - 1 : -1;
  const selectedYear = value ? parseInt(value.split('-')[0], 10) : -1;

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={BNG_COLORS.textMuted}
          keyboardType="number-pad"
          maxLength={10}
        />
        <TouchableOpacity style={styles.calendarBtn} onPress={() => {
          // Sync calendar view to current value
          if (value && !isNaN(new Date(value).getTime())) {
            const d = new Date(value);
            setCalYear(d.getFullYear());
            setCalMonth(d.getMonth());
          }
          setShowModal(true);
        }}>
          <FontAwesome name="calendar" size={18} color={BNG_COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Calendar modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <View style={styles.calendarContainer} onStartShouldSetResponder={() => true}>
            {/* Month navigation */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <FontAwesome name="chevron-left" size={16} color={BNG_COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.calTitle}>{MONTH_NAMES[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <FontAwesome name="chevron-right" size={16} color={BNG_COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Day-of-week headers */}
            <View style={styles.dayRow}>
              {DAY_LABELS.map((d) => (
                <Text key={d} style={styles.dayLabel}>{d}</Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.dayGrid}>
              {Array.from({ length: firstDow }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedDay && calMonth === selectedMonth && calYear === selectedYear;
                const isToday = day === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected, isToday && !isSelected && styles.dayCellToday]}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Today shortcut */}
            <TouchableOpacity style={styles.todayBtn} onPress={() => {
              const now = new Date();
              const mm = String(now.getMonth() + 1).padStart(2, '0');
              const dd = String(now.getDate()).padStart(2, '0');
              onChange(`${now.getFullYear()}-${mm}-${dd}`);
              setShowModal(false);
            }}>
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: '700', color: BNG_COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  input: {
    flex: 1, backgroundColor: BNG_COLORS.background, borderWidth: 1, borderColor: BNG_COLORS.border,
    borderRadius: 10, padding: 12, fontSize: 15, color: BNG_COLORS.text,
  },
  calendarBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: BNG_COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: BNG_COLORS.border,
    marginLeft: 8,
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: BNG_COLORS.surface, borderRadius: 16, padding: 20, width: 320,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20 }, android: { elevation: 10 } }),
  },
  calHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  calTitle: { fontSize: 17, fontWeight: '700', color: BNG_COLORS.text },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: {
    flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: BNG_COLORS.textMuted,
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
  },
  dayCellSelected: { backgroundColor: BNG_COLORS.primary, borderRadius: 20 },
  dayCellToday: { borderWidth: 1, borderColor: BNG_COLORS.primary, borderRadius: 20 },
  dayText: { fontSize: 14, color: BNG_COLORS.text, fontWeight: '500' },
  dayTextSelected: { color: '#FFF', fontWeight: '700' },
  todayBtn: {
    alignSelf: 'center', marginTop: 12, paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 8, backgroundColor: `${BNG_COLORS.primary}10`,
  },
  todayBtnText: { fontSize: 14, fontWeight: '600', color: BNG_COLORS.primary },
});
