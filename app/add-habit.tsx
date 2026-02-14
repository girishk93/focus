import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useHabitStore } from '../store/habit-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

import { registerForPushNotificationsAsync, scheduleHabitReminder } from '../utils/notifications';

const EMOJIS = ['📝', '💧', '🏃', '💤', '📚', '🧘', '💻', '🎨', '🧹', '🥗'];

export default function AddHabitScreen() {
    const router = useRouter();
    const addHabit = useHabitStore((state) => state.addHabit);

    const [title, setTitle] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('📝');
    const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0))); // Default 9 AM

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Details Missing', 'Please enter a habit title to get started.');
            return;
        }

        const habitId = Date.now().toString(); // Pre-generate ID to use for notification
        // Note: In our store `addHabit` generates the ID. We should probably accept an ID or 
        // return the created habit. For MVP, we'll let the store generate it, 
        // but this makes linking notification to ID tricky without refactoring store.
        // Hack: We'll modify store to accept optional ID or refactor. 
        // Simpler: Just rely on store generating it, but then we can't easily schedule 
        // with that ID immediately without knowing it.
        // BETTER FIX: Let's pass the ID in `addHabit`.

        addHabit({
            id: habitId, // Pass the ID explicitly
            title,
            icon: selectedEmoji,
            category: 'Personal',
            color: '#6C5CE7',
            frequency,
            targetDays: frequency === 'daily' ? 30 : 4,
            reminderTime: reminderEnabled ? reminderTime.toISOString() : null,
        });

        if (reminderEnabled) {
            await scheduleHabitReminder(
                habitId,
                title,
                reminderTime.getHours(),
                reminderTime.getMinutes()
            );
        }

        router.back();
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header (Modal style) */}
            <View className="px-4 py-4 border-b border-gray-100 flex-row justify-between items-center mt-2">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-gray-500 text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold">New Habit</Text>
                <TouchableOpacity onPress={handleCreate} disabled={!title.trim()}>
                    <Text className={`text-base font-bold ${!title.trim() ? 'text-gray-300' : 'text-primary-500'}`}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">

                {/* Name Input */}
                <View className="mb-8">
                    <Text className="text-gray-900 font-bold mb-4 text-base">Name</Text>
                    <Input
                        placeholder="e.g. Read 10 pages"
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                        className="text-lg"
                    />
                </View>

                {/* Icon Picker */}
                <View className="mb-8">
                    <Text className="text-gray-900 font-bold mb-4 text-base">Icon</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {EMOJIS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                onPress={() => setSelectedEmoji(emoji)}
                                className={`w-12 h-12 rounded-full items-center justify-center mr-3 border-2 ${selectedEmoji === emoji ? 'bg-primary-100 border-primary-500' : 'bg-gray-50 border-transparent'
                                    }`}
                            >
                                <Text className="text-2xl">{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Frequency */}
                <View className="mb-8">
                    <Text className="text-gray-900 font-bold mb-4 text-base">Goal Frequency</Text>
                    <View className="flex-row bg-gray-100 p-1 rounded-xl">
                        <TouchableOpacity
                            onPress={() => setFrequency('daily')}
                            className={`flex-1 py-2 items-center rounded-lg ${frequency === 'daily' ? 'bg-white shadow-sm' : ''
                                }`}
                        >
                            <Text className={`font-semibold ${frequency === 'daily' ? 'text-primary-600' : 'text-gray-500'}`}>
                                Daily
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setFrequency('weekly')}
                            className={`flex-1 py-2 items-center rounded-lg ${frequency === 'weekly' ? 'bg-white shadow-sm' : ''
                                }`}
                        >
                            <Text className={`font-semibold ${frequency === 'weekly' ? 'text-primary-600' : 'text-gray-500'}`}>
                                Weekly
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Reminder */}
                <View className="flex-row justify-between items-center mb-8 bg-gray-50 p-4 rounded-xl">
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="notifications" size={16} color="#F97316" />
                        </View>
                        <Text className="text-gray-900 font-medium text-base">Daily Reminder</Text>
                    </View>
                    <Switch
                        value={reminderEnabled}
                        onValueChange={setReminderEnabled}
                        trackColor={{ false: '#E5E7EB', true: '#6C5CE7' }}
                    />
                </View>

            </ScrollView>

            <View className="p-6 border-t border-gray-100">
                <Button title="Create Habit" onPress={handleCreate} disabled={!title.trim()} />
            </View>
        </View>
    );
}
