import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="name" />
            <Stack.Screen name="dob" />
            <Stack.Screen name="gender" />
            <Stack.Screen name="goals" />
        </Stack>
    );
}
