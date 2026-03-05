import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../components/ui/Button';
import { ThemedText } from '../../components/ui/Typography';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <ScreenWrapper className="justify-between py-12">
            <View className="mt-12 items-center">
                <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-8">
                    <Ionicons name="leaf" size={48} color="#4F46E5" />
                </View>
                <ThemedText variant="h1" className="text-center mb-4 text-primary-900">
                    Welcome to Focus
                </ThemedText>
                <ThemedText variant="body" className="text-center leading-7 px-4">
                    Let's personalize your journey to build better habits and a better you. 🌱
                </ThemedText>
            </View>

            <View>
                <View className="flex-row justify-center mb-8 space-x-2">
                    <View className="w-8 h-2 bg-primary-600 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                </View>
                <Button
                    title="Let's Start"
                    onPress={() => router.push('/(onboarding)/name')}
                    size="lg"
                />
            </View>
        </ScreenWrapper>
    );
}
