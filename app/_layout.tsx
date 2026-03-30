// CRITICAL: This side-effect import MUST be first.
import 'react-native-gesture-handler';

import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/auth-store';
import { supabase } from '../utils/supabase';
import { useThemeStore } from '../store/theme-store';
import { Themes } from '../constants/Themes';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const rootStyle = useMemo(() => [Themes.oxygen, { flex: 1 }], []);
  
  const colorScheme = useColorScheme();
  const { setSession, refreshUser, setUser, setIsLoading, hasHydrated, setHasHydrated, isLoading } = useAuthStore();

  // Step 1: Make sure the store is hydrated from disk
  useEffect(() => {
    const checkHydration = async () => {
      if (useAuthStore.persist.hasHydrated()) {
        setHasHydrated(true);
      } else {
        await useAuthStore.persist.rehydrate();
        setHasHydrated(true);
      }
    };
    checkHydration();
  }, []);

  // Step 2: Once hydrated, fetch the session
  useEffect(() => {
    if (!hasHydrated) return;

    setIsLoading(true);

    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      if (session) {
        setSession(session);
        refreshUser().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        refreshUser();
      } else {
        setUser(null);
      }
    });

    try {
      const { registerForPushNotificationsAsync } = require('../utils/notifications');
      registerForPushNotificationsAsync();
    } catch (e) {
      // Notifications not available in Expo Go
    }

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [hasHydrated]);

  // No SplashScreen API — it doesn't work properly in Expo Go.
  // The native splash screen auto-hides when the first frame renders.

  if (!hasHydrated) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={rootStyle}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="add-task" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
