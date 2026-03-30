import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Placeholder values when Supabase not configured yet - allows app to load for UI preview
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const noopStorage = {
  getItem: async () => null as string | null,
  setItem: async () => {},
  removeItem: async () => {},
};

// Web: use localStorage + read OAuth tokens from URL on return from Google.
// Native: AsyncStorage + detectSessionInUrl false (custom scheme handled in auth.tsx).
function getAuthStorage() {
  // Native always uses AsyncStorage (do not key off window — RN can be odd at import time).
  if (Platform.OS !== 'web') {
    return AsyncStorage;
  }
  if (typeof window === 'undefined') {
    return noopStorage;
  }
  return {
    getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
    setItem: (key: string, value: string) => {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    // Must be true on web or the session is never applied after OAuth redirect.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
