import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { BNG_COLORS } from '../lib/theme';
import { AuthProvider, useAuth } from '../lib/auth';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

// Auth gate: redirect to login if no session, redirect away from login if session exists
function useProtectedRoute() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Web OAuth return: URL still has tokens/code before Supabase finishes detectSessionInUrl.
    // Don't send user to login during that brief window.
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !session) {
      const hash = window.location.hash;
      const search = window.location.search;
      const looksLikeOAuthReturn =
        (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) ||
        search.includes('code=');
      if (looksLikeOAuthReturn) return;
    }

    const inLogin = segments[0] === 'login';

    if (!session && !inLogin) {
      router.replace('/login');
    } else if (session && inLogin) {
      router.replace('/');
    }
  }, [session, loading, segments]);
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  useProtectedRoute();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="calendar/callback" options={{ headerShown: false }} />
        <Stack.Screen name="setup-wizard" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="scratchpad" 
          options={{ 
            presentation: 'modal', 
            title: 'AI Scratchpad',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="project/[id]/index" 
          options={{ 
            title: 'Project Timeline',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="project/[id]/estimator" 
          options={{ 
            title: 'Create Estimate',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="project/[id]/proposal" 
          options={{ 
            title: 'AI Proposal',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="add-project" 
          options={{ 
            presentation: 'modal',
            title: 'New Project',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="add-customer" 
          options={{ 
            presentation: 'modal',
            title: 'Add Customer',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="add-lead" 
          options={{ 
            presentation: 'modal',
            title: 'Add Lead',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="add-event" 
          options={{ 
            presentation: 'modal',
            title: 'New Event',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="add-sub" 
          options={{ 
            presentation: 'modal',
            title: 'Add Subcontractor',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="edit-lead" 
          options={{ 
            presentation: 'modal',
            title: 'Edit Lead',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="edit-customer" 
          options={{ 
            presentation: 'modal',
            title: 'Edit Customer',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="edit-project" 
          options={{ 
            presentation: 'modal',
            title: 'Edit Project',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="edit-sub" 
          options={{ 
            presentation: 'modal',
            title: 'Edit Subcontractor',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="message-generator" 
          options={{ 
            presentation: 'modal',
            title: 'Message Generator',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="project/[id]/checklist" 
          options={{ 
            title: 'Job Checklist',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="project/[id]/punch-list" 
          options={{ 
            title: 'Punch List',
            headerStyle: { backgroundColor: BNG_COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
