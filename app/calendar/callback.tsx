// OAuth return URL for Google Calendar — Google redirects here with ?code=...
// Route: /calendar/callback (must match lib/googleCalendarOAuth.ts and Google Cloud "Authorized redirect URIs")

import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { getGoogleCalendarRedirectUri } from '../../lib/googleCalendarOAuth';
import { BNG_COLORS } from '../../lib/theme';

export default function GoogleCalendarOAuthCallbackScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();
  const [message, setMessage] = useState('Connecting Google Calendar…');
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (started.current) return;

    const search =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;

    const oauthError = search?.get('error');
    if (oauthError) {
      started.current = true;
      setFailed(true);
      setMessage(
        oauthError === 'access_denied'
          ? 'Google Calendar access was not granted.'
          : `Google returned an error: ${oauthError}.`
      );
      return;
    }

    const code =
      (typeof params.code === 'string' && params.code) ||
      search?.get('code') ||
      undefined;

    if (!code) {
      started.current = true;
      setFailed(true);
      setMessage('Missing authorization code. Try connecting again from the Calendar tab.');
      return;
    }

    if (!user?.id) {
      started.current = true;
      setFailed(true);
      setMessage('You need to be signed in to link Google Calendar. Sign in, then try again.');
      return;
    }

    started.current = true;
    const redirectUri = getGoogleCalendarRedirectUri();

    (async () => {
      try {
        const { error } = await supabase.functions.invoke('calendar-connect', {
          body: { user_id: user.id, code, redirect_uri: redirectUri },
        });
        if (error) throw error;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(null, '', `${window.location.origin}/calendar`);
        }
        router.replace('/calendar');
      } catch (e: any) {
        setFailed(true);
        setMessage(e.message || 'Could not finish Google Calendar setup.');
      }
    })();
  }, [authLoading, user?.id, params.code]);

  return (
    <View style={styles.container}>
      {!failed && <ActivityIndicator size="large" color={BNG_COLORS.primary} />}
      <Text style={styles.text}>{message}</Text>
      {failed && (
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/calendar')}>
          <Text style={styles.btnText}>Back to Calendar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: BNG_COLORS.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: BNG_COLORS.text,
    textAlign: 'center',
    maxWidth: 320,
  },
  btn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: BNG_COLORS.primary,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
