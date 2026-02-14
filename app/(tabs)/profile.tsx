import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/auth-store';
import { useGamificationStore } from '../../store/gamification-store';
import { useRouter } from 'expo-router';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { BADGES, LEVELS } from '../../constants/Gamification';

export default function ProfileScreen() {
    const { user, signOut } = useAuthStore();
    const { xp, level, badges, stats } = useGamificationStore();
    const router = useRouter();

    const currentLevelData = LEVELS.find(l => l.level === level) || LEVELS[0];
    const nextLevelData = LEVELS.find(l => l.level === level + 1);

    const xpForCurrentLevel = currentLevelData.xp;
    const xpForNextLevel = nextLevelData ? nextLevelData.xp : xpForCurrentLevel * 2; // Fallback
    const progress = Math.min(100, Math.max(0, ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100));

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Header Profile Card */}
                <View className="bg-white p-6 mb-6 rounded-b-3xl shadow-sm items-center">
                    <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm">
                        <Text className="text-primary-600 font-bold text-4xl">
                            {user?.name?.[0] || 'U'}
                        </Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-1">{user?.name || 'User'}</Text>
                    <Text className="text-primary-500 font-semibold mb-6">Level {level} • {currentLevelData.title}</Text>

                    {/* Level Progress */}
                    <View className="w-full max-w-xs mb-2">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-xs text-gray-500 font-medium">{xp} XP</Text>
                            <Text className="text-xs text-gray-500 font-medium">{xpForNextLevel} XP</Text>
                        </View>
                        <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <View className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                        </View>
                        <Text className="text-center text-xs text-gray-400 mt-2">
                            {Math.round(xpForNextLevel - xp)} XP to next level
                        </Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="px-6 mb-8">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Statistics</Text>
                    <View className="flex-row flex-wrap justify-between">
                        <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm">
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" className="mb-2" />
                            <Text className="text-2xl font-bold text-gray-900">{stats.totalCompleted}</Text>
                            <Text className="text-gray-500 text-xs">Habits Completed</Text>
                        </View>
                        <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm">
                            <Ionicons name="flame" size={24} color="#F59E0B" className="mb-2" />
                            <Text className="text-2xl font-bold text-gray-900">{stats.maxStreak}</Text>
                            <Text className="text-gray-500 text-xs">Best Streak</Text>
                        </View>
                    </View>
                </View>

                {/* Badges */}
                <View className="px-6 mb-8">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Badges</Text>
                    <View className="flex-row flex-wrap">
                        {BADGES.map((badge) => {
                            const isUnlocked = badges.includes(badge.id);
                            return (
                                <TouchableOpacity
                                    key={badge.id}
                                    className={`w-[30%] aspect-square mr-[3%] mb-3 rounded-2xl items-center justify-center p-2 border-2 ${isUnlocked ? 'bg-white border-primary-100' : 'bg-gray-100 border-transparent opacity-50'
                                        }`}
                                >
                                    <Text className="text-3xl mb-2">{isUnlocked ? badge.icon : '🔒'}</Text>
                                    <Text className="text-xs text-center font-medium text-gray-900" numberOfLines={1}>
                                        {badge.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View className="px-6">
                    <Button title="Log Out" variant="outline" onPress={handleLogout} />
                    <Text className="text-center text-gray-300 text-xs mt-4">Version 1.0.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
