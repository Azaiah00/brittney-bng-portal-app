// Setup Wizard — one-time onboarding after first Google sign-in.
// Step 1: Welcome (shows user name/email)
// Step 2: Connect Google Calendar (optional)
// Step 3: All set + tip about iPhone calendar sync

import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  SafeAreaView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { getGoogleCalendarRedirectUri } from '../lib/googleCalendarOAuth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BNG_COLORS } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETUP_COMPLETE_KEY = 'bng_setup_complete';

export default function SetupWizardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const userName = user?.user_metadata?.full_name || user?.email || 'there';

  // Connect Google Calendar (same flow as calendar tab)
  const handleConnectGcal = async () => {
    if (!user?.id) return;
    setIsConnecting(true);
    try {
      const redirectUri = getGoogleCalendarRedirectUri();
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
      const scope = 'https://www.googleapis.com/auth/calendar.events';

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.functions.invoke('calendar-connect', {
            body: { user_id: user.id, code, redirect_uri: redirectUri },
          });
          if (error) throw error;
          setGcalConnected(true);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not connect Google Calendar.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Mark setup as done and go to main app
  const handleFinish = async () => {
    await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');
    router.replace('/');
  };

  // ── Step content ──
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <FontAwesome name="check" size={40} color={BNG_COLORS.success} />
            </View>
            <Text style={styles.stepTitle}>Welcome, {userName.split(' ')[0]}!</Text>
            <Text style={styles.stepText}>
              You're signed in and ready to go. Let's get a couple of things set up so the app works perfectly for you.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.primaryBtnText}>Next</Text>
              <FontAwesome name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: gcalConnected ? `${BNG_COLORS.success}15` : '#4285F415' }]}>
              <FontAwesome
                name={gcalConnected ? 'check-circle' : 'google'}
                size={40}
                color={gcalConnected ? BNG_COLORS.success : '#4285F4'}
              />
            </View>
            <Text style={styles.stepTitle}>
              {gcalConnected ? 'Calendar Connected!' : 'Connect Google Calendar'}
            </Text>
            <Text style={styles.stepText}>
              {gcalConnected
                ? 'Your BNG events will sync to Google Calendar. You can manage this anytime in Settings.'
                : 'Connect your Google Calendar so project events, walkthroughs, and meetings sync automatically.'}
            </Text>

            {!gcalConnected && (
              <TouchableOpacity
                style={[styles.googleBtn, isConnecting && { opacity: 0.7 }]}
                onPress={handleConnectGcal}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                ) : (
                  <View style={styles.googleIconWrap}>
                    <Text style={styles.googleG}>G</Text>
                  </View>
                )}
                <Text style={styles.googleBtnText}>
                  {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.primaryBtnText}>{gcalConnected ? 'Next' : 'Skip for now'}</Text>
              <FontAwesome name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: `${BNG_COLORS.success}15` }]}>
              <FontAwesome name="star" size={40} color={BNG_COLORS.warning} />
            </View>
            <Text style={styles.stepTitle}>You're All Set!</Text>
            <Text style={styles.stepText}>
              Your BNG Remodel hub is ready. You can manage projects, send proposals, track your crew, and more.
            </Text>

            {gcalConnected && (
              <View style={styles.tipCard}>
                <FontAwesome name="info-circle" size={16} color={BNG_COLORS.info} style={{ marginRight: 10 }} />
                <Text style={styles.tipText}>
                  To see Google Calendar events on your iPhone, go to Settings → Calendar → Accounts → Add your Google account.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
              <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
              <FontAwesome name="home" size={16} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
          />
        ))}
      </View>

      {renderStep()}

      {/* Step label */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Step {step + 1} of 3</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BNG_COLORS.background,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 24,
    paddingBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BNG_COLORS.border,
  },
  dotActive: {
    backgroundColor: BNG_COLORS.primary,
    width: 28,
    borderRadius: 5,
  },
  dotDone: {
    backgroundColor: BNG_COLORS.success,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${BNG_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: BNG_COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 16,
    color: BNG_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 360,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BNG_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 320,
    marginTop: 12,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 320,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleG: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '700',
  },
  googleBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${BNG_COLORS.info}10`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    maxWidth: 360,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: BNG_COLORS.textSecondary,
    lineHeight: 19,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 13,
    color: BNG_COLORS.textMuted,
    fontWeight: '500',
  },
});
