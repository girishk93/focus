import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../store/onboarding-store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

export default function NameScreen() {
    const router = useRouter();
    const { name, setName } = useOnboardingStore();

    const handleNext = () => {
        if (!name.trim()) setName('Friend'); // Default if skipped
        router.push('/(onboarding)/dob');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6 pt-6">
                {/* Header with Back Button */}
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-gray-900 mb-2">What should we call you?</Text>
                <Text className="text-gray-500 text-base mb-8">This helps us personalize your experience.</Text>

                <Input
                    placeholder="Your name"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    className="text-xl py-4"
                />

                <View className="flex-1" />

                <View className="mb-8">
                    <View className="flex-row justify-center mb-8 space-x-2">
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-8 h-2 bg-primary-500 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                    </View>
                    <Button
                        title={name.trim() ? "Continue" : "Skip"}
                        onPress={handleNext}
                        size="lg"
                        variant={name.trim() ? 'primary' : 'ghost'}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
