// Public privacy page — Google OAuth "Branding" asks for this URL (no login required).

import React from 'react';
import { StyleSheet, Text, ScrollView, SafeAreaView, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { BNG_COLORS } from '../lib/theme';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Privacy', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Privacy</Text>
        <Text style={styles.p}>
          BNG Remodel Command Center collects only what you choose to enter in the app and what is
          needed to sign in (handled by Supabase and Google). We use that information to run your
          remodeling business tools. Contact the business owner for questions or deletion requests.
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
