// Public terms page — Google OAuth "Branding" asks for this URL (no login required).

import React from 'react';
import { StyleSheet, Text, ScrollView, SafeAreaView, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { BNG_COLORS } from '../lib/theme';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Terms', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Terms of use</Text>
        <Text style={styles.p}>
          This application is provided for BNG Remodel internal operations. Use it responsibly.
          Features may change. Google sign-in and calendar features are subject to Google's terms.
          For questions, contact the business owner.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:bngremodel@gmail.com')}>
          <Text style={styles.link}>bngremodel@gmail.com</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BNG_COLORS.background },
  scroll: { padding: 24, maxWidth: 720, alignSelf: 'center' },
  h1: { fontSize: 28, fontWeight: '800', color: BNG_COLORS.text, marginBottom: 16 },
  p: { fontSize: 16, lineHeight: 24, color: BNG_COLORS.textSecondary },
  link: { marginTop: 16, fontSize: 16, color: BNG_COLORS.primary, fontWeight: '700' },
});
