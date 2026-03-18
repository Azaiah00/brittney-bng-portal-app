import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { BNG_COLORS } from '../lib/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
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

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
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
