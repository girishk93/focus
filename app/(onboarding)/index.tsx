import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6 justify-between py-12">
                <View className="mt-12 items-center">
                    <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-8">
                        <Ionicons name="leaf" size={48} color="#6C5CE7" />
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
                        Welcome to Focus
                    </Text>
                    <Text className="text-gray-500 text-lg text-center leading-7">
                        Let's personalize your journey to build better habits and a better you. 🌱
                    </Text>
                </View>

                <View>
                    <View className="flex-row justify-center mb-8 space-x-2">
                        <View className="w-8 h-2 bg-primary-500 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                    </View>
                    <Button
                        title="Let's Start"
                        onPress={() => router.push('/(onboarding)/name')}
                        size="lg"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
