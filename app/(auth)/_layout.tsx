import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { useEffect } from 'react';

export default function AuthLayout() {
    const { session, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && session) {
            router.replace('/(tabs)');
        }
    }, [session, isLoading]);

    if (isLoading || session) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
        </Stack>
    );
}
