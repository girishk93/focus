import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore, Gender } from '../../store/onboarding-store';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function GenderScreen() {
    const router = useRouter();
    const { gender, setGender } = useOnboardingStore();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6 pt-6">
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-gray-900 mb-2">How do you identify?</Text>
                <Text className="text-gray-500 text-base mb-8">Optional. Helps us with personalized insights.</Text>

                <View className="space-y-4">
                    {GENDERS.map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => setGender(opt)}
                            className={`p-5 rounded-2xl border-2 flex-row items-center justify-between ${gender === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white'
                                }`}
                        >
                            <Text className={`text-lg font-semibold ${gender === opt ? 'text-primary-700' : 'text-gray-700'}`}>
                                {opt}
                            </Text>
                            {gender === opt && <Ionicons name="checkmark-circle" size={24} color="#6C5CE7" />}
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="flex-1" />

                <View className="mb-8">
                    <View className="flex-row justify-center mb-8 space-x-2">
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-8 h-2 bg-primary-500 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                    </View>
                    <Button
                        title={gender ? "Continue" : "Skip"}
                        onPress={() => router.push('/(onboarding)/goals')}
                        size="lg"
                        variant={gender ? 'primary' : 'ghost'}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
