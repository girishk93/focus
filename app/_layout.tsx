import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth-store';

import { registerForPushNotificationsAsync } from '../utils/notifications';
import { supabase } from '../utils/supabase';

function InitialLayout() {
  const { user, session, isLoading, setUser, setSession, refreshUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const rootNavigationState = useRootNavigationState();

  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Initialize session and listen for auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) refreshUser();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        refreshUser();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (rootNavigationState?.key) {
      setIsNavigationReady(true);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    const isAuthenticated = !!session;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && user && !user.isOnboarded && !inOnboardingGroup) {
      router.replace('/(onboarding)');
    } else if (isAuthenticated && user && user.isOnboarded && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)');
    }
  }, [session, user, segments, isLoading, isNavigationReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="add-task" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="add-friend" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="join-group" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <InitialLayout />
  );
}
