import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../store/onboarding-store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ThemedText } from '../../components/ui/Typography';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

export default function NameScreen() {
    const router = useRouter();
    const { name, setName } = useOnboardingStore();

    const handleNext = () => {
        if (!name.trim()) setName('Friend'); // Default if skipped
        router.push('/(onboarding)/dob');
    };

    return (
        <ScreenWrapper className="pt-6 justify-between">
            <View>
                {/* Header with Back Button */}
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <ThemedText variant="h1" className="mb-2">What should we call you?</ThemedText>
                <ThemedText variant="body" color="neutral" className="mb-8 text-neutral-500">This helps us personalize your experience.</ThemedText>

                <Input
                    placeholder="Your name"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    className="text-xl py-4"
                    containerClassName="mb-4"
                />
            </View>

            <View className="mb-8">
                <View className="flex-row justify-center mb-8 space-x-2">
                    <View className="w-2 h-2 bg-primary-200 rounded-full" />
                    <View className="w-8 h-2 bg-primary-600 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                </View>
                <Button
                    title={name.trim() ? "Continue" : "Skip"}
                    onPress={handleNext}
                    size="lg"
                    variant={name.trim() ? 'primary' : 'ghost'}
                />
            </View>
        </ScreenWrapper>
    );
}
