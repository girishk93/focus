import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore, Gender } from '../../store/onboarding-store';
import Button from '../../components/ui/Button';
import { ThemedText } from '../../components/ui/Typography';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function GenderScreen() {
    const router = useRouter();
    const { gender, setGender } = useOnboardingStore();

    return (
        <ScreenWrapper className="pt-6 justify-between">
            <View>
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <ThemedText variant="h1" className="mb-2">How do you identify?</ThemedText>
                <ThemedText variant="body" className="mb-8 text-neutral-500">Optional. Helps us with personalized insights.</ThemedText>

                <View className="space-y-4">
                    {GENDERS.map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => setGender(opt)}
                            className={`p-5 rounded-2xl border flex-row items-center justify-between ${gender === opt ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white'
                                }`}
                        >
                            <ThemedText className={`text-lg font-semibold ${gender === opt ? 'text-primary-700' : 'text-neutral-700'}`}>
                                {opt}
                            </ThemedText>
                            {gender === opt && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View className="mb-8">
                <View className="flex-row justify-center mb-8 space-x-2">
                    <View className="w-2 h-2 bg-primary-200 rounded-full" />
                    <View className="w-2 h-2 bg-primary-200 rounded-full" />
                    <View className="w-2 h-2 bg-primary-200 rounded-full" />
                    <View className="w-8 h-2 bg-primary-600 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                </View>
                <Button
                    title={gender ? "Continue" : "Skip"}
                    onPress={() => router.push('/(onboarding)/goals')}
                    size="lg"
                    variant={gender ? 'primary' : 'ghost'}
                />
            </View>
        </ScreenWrapper>
    );
}
