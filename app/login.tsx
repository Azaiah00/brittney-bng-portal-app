// Login screen — branded BNG sign-in with Google OAuth.
// Shown when no active session exists.

import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Image,
  ActivityIndicator, Alert, Platform, SafeAreaView,
} from 'react-native';
import { BNG_COLORS, SHADOWS } from '../lib/theme';
import { useAuth } from '../lib/auth';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Sign In Error', err.message || 'Could not sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / brand */}
        <View style={styles.logoSection}>
          {/* Brand mark: full BNG Remodel logo (assets/images/logo-bng.png). */}
          <View style={styles.logoIcon}>
            <Image
              source={require('../assets/images/logo-bng.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="BNG Remodel logo"
            />
          </View>
          <Text style={styles.logoText}>BNG <Text style={styles.logoAccent}>Remodel</Text></Text>
          <Text style={styles.tagline}>Your remodeling business hub</Text>
        </View>

        {/* Welcome text */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to manage your projects, crew, proposals, and more.
          </Text>
        </View>

        {/* Google sign-in button */}
        <TouchableOpacity
          style={[styles.googleButton, loading && { opacity: 0.7 }]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={BNG_COLORS.text} style={{ marginRight: 12 }} />
          ) : (
            <View style={styles.googleIconWrap}>
              <Text style={styles.googleG}>G</Text>
            </View>
          )}
          <Text style={styles.googleButtonText}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BNG Remodel — Richmond, VA
          </Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BNG_COLORS.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  // Wide wordmark: taller box than the old square home icon so nothing feels cropped.
  logoIcon: {
    width: '100%',
    maxWidth: 280,
    height: 104,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
  },
  logoAccent: {
    color: BNG_COLORS.accentLight,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: '500',
  },

  // Welcome card
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleG: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: BNG_COLORS.text,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  footerVersion: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
});
