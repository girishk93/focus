import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../store/onboarding-store';
import { useAuthStore } from '../../store/auth-store';
import Button from '../../components/ui/Button';
import { ThemedText } from '../../components/ui/Typography';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
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
    const { selectedGoals, toggleGoal, name, reset } = useOnboardingStore();
    const [isFinishing, setIsFinishing] = useState(false);
    const { user, setUser } = useAuthStore();

    const handleFinish = async () => {
        setIsFinishing(true);
        // Simulate saving profile to DB
        setTimeout(() => {
            if (user) {
                setUser({
                    ...user,
                    name: name,
                    isOnboarded: true
                });
            }
            reset(); // Clear onboarding store
            router.replace('/(tabs)');
        }, 1500);
    };

    return (
        <ScreenWrapper className="pt-6">
            <TouchableOpacity onPress={() => router.back()} className="mb-8">
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            <ThemedText variant="h1" className="mb-2">What brings you here?</ThemedText>
            <ThemedText variant="body" className="mb-8 text-neutral-500">Select all that apply. We'll recommend habits.</ThemedText>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="flex-row flex-wrap justify-between pb-8">
                    {GOALS.map((item) => {
                        const isSelected = selectedGoals.includes(item.id);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => toggleGoal(item.id)}
                                className={`w-[48%] aspect-square mb-4 p-4 rounded-3xl border items-center justify-center space-y-3 ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-white'
                                    }`}
                            >
                                <View className={`w-12 h-12 rounded-full items-center justify-center ${isSelected ? 'bg-primary-100' : 'bg-neutral-50'
                                    }`}>
                                    <Ionicons
                                        name={item.icon as any}
                                        size={24}
                                        color={isSelected ? '#4F46E5' : '#9CA3AF'}
                                    />
                                </View>
                                <ThemedText className={`text-center font-semibold ${isSelected ? 'text-primary-700' : 'text-neutral-900'
                                    }`}>
                                    {item.label}
                                </ThemedText>
                                {isSelected && (
                                    <View className="absolute top-3 right-3">
                                        <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
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
                    <View className="w-8 h-2 bg-primary-600 rounded-full" />
                </View>
                <Button
                    title="Finish Profile"
                    onPress={handleFinish}
                    size="lg"
                    isLoading={isFinishing}
                    disabled={selectedGoals.length === 0}
                />
            </View>
        </ScreenWrapper>
    );
}
