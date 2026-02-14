import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../store/onboarding-store';
import { useAuthStore } from '../../store/auth-store';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const GOALS = [
    { id: 'health', icon: 'fitness', label: 'Health & Fitness' },
    { id: 'learning', icon: 'book', label: 'Learning & Growth' },
    { id: 'productivity', icon: 'briefcase', label: 'Productivity' },
    { id: 'mindfulness', icon: 'happy', label: 'Mental Wellness' },
    { id: 'personal', icon: 'person', label: 'Personal Goals' },
    { id: 'routine', icon: 'alarm', label: 'Morning Routine' },
];

export default function GoalsScreen() {
    const router = useRouter();
    const { selectedGoals, toggleGoal } = useOnboardingStore();
    const [isFinishing, setIsFinishing] = useState(false);
    const setIsOnboarded = useAuthStore((state) => state.setIsOnboarded);

    const handleFinish = async () => {
        setIsFinishing(true);
        // Simulate saving profile to DB
        setTimeout(() => {
            setIsOnboarded(true); // Updates Auth State to redirect to Tabs
            router.replace('/(tabs)');
        }, 1500);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6 pt-6">
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-gray-900 mb-2">What brings you here?</Text>
                <Text className="text-gray-500 text-base mb-8">Select all that apply. We'll recommend habits.</Text>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="flex-row flex-wrap justify-between">
                        {GOALS.map((item) => {
                            const isSelected = selectedGoals.includes(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => toggleGoal(item.id)}
                                    className={`w-[48%] aspect-square mb-4 p-4 rounded-3xl border-2 items-center justify-center space-y-3 ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white'
                                        }`}
                                >
                                    <View className={`w-12 h-12 rounded-full items-center justify-center ${isSelected ? 'bg-primary-100' : 'bg-gray-50'
                                        }`}>
                                        <Ionicons
                                            name={item.icon as any}
                                            size={24}
                                            color={isSelected ? '#6C5CE7' : '#9CA3AF'}
                                        />
                                    </View>
                                    <Text className={`text-center font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-900'
                                        }`}>
                                        {item.label}
                                    </Text>
                                    {isSelected && (
                                        <View className="absolute top-3 right-3">
                                            <Ionicons name="checkmark-circle" size={20} color="#6C5CE7" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                <View className="py-8">
                    <View className="flex-row justify-center mb-8 space-x-2">
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-8 h-2 bg-primary-500 rounded-full" />
                    </View>
                    <Button
                        title="Finish Profile"
                        onPress={handleFinish}
                        size="lg"
                        isLoading={isFinishing}
                        disabled={selectedGoals.length === 0}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
