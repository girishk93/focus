import React, { useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../store/auth-store';
import { useGamificationStore } from '../../store/gamification-store';
import { useTaskStore } from '../../store/task-store';
import { toLocalDateString } from '../../utils/date';
import { useRouter } from 'expo-router';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { BADGES, LEVELS } from '../../constants/Gamification';
import * as ImagePicker from 'expo-image-picker';

import { AppTheme, Themes } from '../../constants/Themes';
import { useThemeStore } from '../../store/theme-store';

export default function ProfileScreen() {
    const { user, signOut, updateUser } = useAuthStore();
    const { xp, level, badges } = useGamificationStore();
    const { habits, logs } = useTaskStore();
    const router = useRouter();

    const activeColor = '#06B6D4'; // Hardcoded Oxygen primary color

    const currentLevelData = LEVELS.find(l => l.level === level) || LEVELS[0];
    const nextLevelData = LEVELS.find(l => l.level === level + 1);

    const xpForCurrentLevel = currentLevelData.xp;
    const xpForNextLevel = nextLevelData ? nextLevelData.xp : xpForCurrentLevel * 2; // Fallback
    const progress = Math.min(100, Math.max(0, ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100));

    // Calculate actual stats from habit logs
    const stats = useMemo(() => {
        // Get IDs of current active habits only (exclude deleted/archived)
        // Note: deleteHabit removes from array, but we also check archived flag for safety
        const activeHabitIds = new Set(habits.filter(h => !h.archived).map(h => h.id));

        // Calculate totals based ONLY on currently active habits
        let todayCompleted = 0;
        let totalCompletions = 0;

        const today = toLocalDateString();

        // Iterate through all logs
        Object.entries(logs).forEach(([date, dateLog]) => {
            if (!dateLog) return;
            Object.entries(dateLog as Record<string, boolean | 'skipped'>).forEach(([habitId, status]) => {
                // strict check: must be completed (=== true) AND must be a currently active habit
                if (status === true && activeHabitIds.has(habitId)) {
                    totalCompletions++;
                    if (date === today) {
                        todayCompleted++;
                    }
                }
            });
        });

        // Best streak: find the highest streak among all *active* habits
        const maxStreak = Math.max(0, ...habits.map(h => h.streak || 0));

        return {
            todayCompleted,
            totalCompletions,
            maxStreak
        };
    }, [logs, habits]);

    const pickImage = async () => {
        // Request permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permission Required', 'Please allow access to your photos to set a profile picture.');
            return;
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await updateUser({ avatar_url: result.assets[0].uri });
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Header Profile Card */}
                <View className="bg-white p-6 mb-6 rounded-b-3xl shadow-sm items-center">
                    <TouchableOpacity onPress={pickImage} className="relative mb-4">
                        {user?.avatar_url ? (
                            <Image
                                source={{ uri: user.avatar_url }}
                                className="w-24 h-24 rounded-full border-4 border-white shadow-sm"
                            />
                        ) : (
                            <View className="w-24 h-24 bg-primary-tint rounded-full items-center justify-center border-4 border-white shadow-sm">
                                <Text className="text-primary font-bold text-4xl">
                                    {user?.display_name?.[0] || user?.username?.[0] || 'U'}
                                </Text>
                            </View>
                        )}
                        {/* Camera icon overlay */}
                        <View className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center border-2 border-white">
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900 mb-1">{user?.display_name || user?.username || 'User'}</Text>
                    <Text className="text-gray-400 text-xs mb-2">ID: {user?.id}</Text>

                    <TouchableOpacity
                        onPress={() => router.push('/edit-profile')}
                        className="mb-6 bg-gray-100 px-4 py-2 rounded-full"
                    >
                        <Text className="text-gray-700 font-semibold text-sm">Edit Profile</Text>
                    </TouchableOpacity>

                    <Text className="text-primary-500 font-semibold mb-6">Level {level} • {currentLevelData.title}</Text>

                    {/* Level Progress */}
                    <View className="w-full max-w-xs mb-2">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-xs text-gray-500 font-medium">{xp} XP</Text>
                            <Text className="text-xs text-gray-500 font-medium">{xpForNextLevel} XP</Text>
                        </View>
                        <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <View className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
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
                            <Text className="text-2xl font-bold text-gray-900">{stats.todayCompleted}</Text>
                            <Text className="text-gray-500 text-xs">Today's Habits</Text>
                        </View>
                        <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm">
                            <Ionicons name="flame" size={24} color="#F59E0B" className="mb-2" />
                            <Text className="text-2xl font-bold text-gray-900">{stats.maxStreak}</Text>
                            <Text className="text-gray-500 text-xs">Best Streak</Text>
                        </View>
                        <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm">
                            <Ionicons name="trophy" size={24} color="#8B5CF6" className="mb-2" />
                            <Text className="text-2xl font-bold text-gray-900">{stats.totalCompletions}</Text>
                            <Text className="text-gray-500 text-xs">Total Completions</Text>
                        </View>
                        <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm">
                            <Ionicons name="list" size={24} color="#3B82F6" className="mb-2" />
                            <Text className="text-2xl font-bold text-gray-900">{habits.length}</Text>
                            <Text className="text-gray-500 text-xs">Active Habits</Text>
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
                                    className={`w-[30%] aspect-square mr-[32px] mb-3 rounded-2xl items-center justify-center p-2 border-2 ${isUnlocked ? 'bg-white border-primary/20' : 'bg-gray-100 border-transparent opacity-50'}`}
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
                    {/* Settings Rows */}
                    <TouchableOpacity
                        onPress={() => router.push('/calendar-settings')}
                        className="flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-sm"
                    >
                        <View className="w-10 h-10 bg-primary-tint rounded-full items-center justify-center mr-3">
                            <Ionicons name="calendar-outline" size={20} color={activeColor} />
                        </View>
                        <View className="flex-1">
                            <Text className="font-semibold text-gray-900">Calendar Sync</Text>
                            <Text className="text-gray-400 text-xs">Sync habits with Google, Outlook & more</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <Button title="Log Out" variant="outline" onPress={handleLogout} />
                    <Text className="text-center text-gray-300 text-xs mt-4">Version 1.0.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
