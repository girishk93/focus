import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { View, Text, Image } from 'react-native';
import { useEffect } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { user, session, isLoading } = useAuthStore();
  const router = useRouter();

  // Redirect based on auth state
  useEffect(() => {
    console.log('[TABS] Auth check:', { isLoading, session: !!session, user: !!user, isOnboarded: user?.isOnboarded });
    if (isLoading) return; // Still loading, don't redirect yet
    if (!session) {
      console.log('[TABS] No session → login');
      router.replace('/(auth)/login');
    } else if (user && !user.isOnboarded) {
      console.log('[TABS] Not onboarded → onboarding');
      router.replace('/(onboarding)');
    } else {
      console.log('[TABS] Rendering tabs');
    }
  }, [session, user, isLoading]);

  // Don't render tabs until we have a session
  if (!session) {
    console.log('[TABS] No session yet, returning null');
    return null;
  }

  console.log('[TABS] Rendering tab bar');

  const activeColor = '#06B6D4';
  const inactiveColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          height: 60 + (insets.bottom > 0 ? insets.bottom - 4 : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom - 4 : 8,
          paddingTop: 8,
          backgroundColor: colorScheme === 'dark' ? '#18181B' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#27272A' : '#E4E4E7',
          elevation: 0,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="day-view"
        options={{
          title: 'Day View',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: focused ? 2 : 1.5,
                borderColor: focused ? activeColor : inactiveColor,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: user?.avatar_url ? 'transparent' : (colorScheme === 'dark' ? '#374151' : '#F3F4F6'),
              }}
            >
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: focused ? activeColor : inactiveColor,
                  }}
                >
                  {user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
