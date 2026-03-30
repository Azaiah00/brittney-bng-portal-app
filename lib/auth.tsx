// Auth context — wraps Supabase Auth for the whole app.
// Provides session, user, signIn (Google OAuth), signOut, and loading state.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Needed so the auth session closes properly on web
WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Web: redirect must match Supabase "Redirect URLs" exactly (many projects list no trailing slash).
function getOAuthRedirectTo(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  return makeRedirectUri({
    scheme: 'brittanybngremodelapp',
    path: 'auth/callback',
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // IMPORTANT: Do not call getSession().then(setLoading false) before URL/PKCE recovery finishes on web.
  // That races the auth gate and sends users to /login with session still null.
  // INITIAL_SESSION fires after Supabase finishes detectSessionInUrl + storage hydrate.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Only INITIAL_SESSION runs after initializePromise (incl. OAuth URL / PKCE recovery).
      // Do not use getSession().then(setLoading false) — that races and drops users on /login.
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    // Never spin forever if INITIAL_SESSION never fires (edge case)
    const failSafe = setTimeout(() => setLoading(false), 12000);

    return () => {
      clearTimeout(failSafe);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = getOAuthRedirectTo();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No auth URL returned');

      if (Platform.OS === 'web') {
        window.location.href = data.url;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const params = new URLSearchParams(
            url.hash ? url.hash.substring(1) : url.search.substring(1)
          );
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('signOut:', error.message);
    } finally {
      setSession(null);
      // If OAuth hash/query is still on the URL, the auth gate treats it as a return-from-Google
      // and skips redirect to login while session is null — user appears "stuck" after logout.
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const u = new URL(window.location.href);
        u.hash = '';
        ['code', 'state', 'error', 'error_description'].forEach((k) => u.searchParams.delete(k));
        const next = u.pathname + (u.search ? u.search : '');
        window.history.replaceState(null, '', next);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
