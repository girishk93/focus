import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Platform, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTaskStore } from '../store/task-store';
import { useDurationStore } from '../store/duration-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { registerForPushNotificationsAsync, scheduleHabitReminder } from '../utils/notifications';

const EMOJIS = ['📝', '💧', '🏃', '💤', '📚', '🧘', '💻', '🎨', '🧹', '🥗'];

export default function AddHabitScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const fromDayView = params.fromDayView === 'true';
    const addHabit = useTaskStore((state) => state.addHabit);
    const { recentDurations, addRecentDuration } = useDurationStore();

    const [title, setTitle] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('📝');
    const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
    const [duration, setDuration] = useState<number | null>(null); // null = Lifetime
    const [customDays, setCustomDays] = useState('');
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime' | 'specific'>(
        fromDayView ? 'specific' : 'anytime' // Pre-select 'specific' if from Day View
    );
    const [durationMinutes, setDurationMinutes] = useState(15);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0))); // Default 9 AM
    const [notes, setNotes] = useState(''); // Optional context notes

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Details Missing', 'Please enter a habit title to get started.');
            return;
        }

        const habitId = Date.now().toString();

        addHabit({
            id: habitId,
            title,
            icon: selectedEmoji,
            category: 'Personal',
            color: '#6C5CE7',
            frequency,
            targetDays: frequency === 'daily' ? 30 : 4,
            startDate: new Date().toISOString(),
            durationInDays: duration,
            durationMinutes,
            timeOfDay: timeOfDay === 'specific' ? 'anytime' : timeOfDay, // Fallback for DB safety if needed, or update TS interface
            reminderTime: (reminderEnabled || timeOfDay === 'specific') ? reminderTime.toISOString() : null, // Specific time uses reminderTime
            notes: notes.trim() || undefined, // Include notes if provided
        });

        // Save custom duration to recent list
        if (duration !== null && ![7, 21].includes(duration)) {
            addRecentDuration(duration);
        }

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

                {/* Duration */}
                <View className="mb-8">
                    <Text className="text-gray-900 font-bold mb-4 text-base">Duration</Text>

                    {/* Built-in Presets */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
                        {[
                            { label: 'Lifetime', value: null },
                            { label: '7 Days', value: 7 },
                            { label: '21 Days', value: 21 },
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.label}
                                onPress={() => { setDuration(option.value as number | null); setCustomDays(''); }}
                                className={`px-5 py-3 rounded-xl mr-3 border ${duration === option.value
                                    ? 'bg-primary-600 border-primary-600'
                                    : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <Text className={`font-semibold ${duration === option.value ? 'text-white' : 'text-gray-600'}`}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Recently Used */}
                    {recentDurations.length > 0 && (
                        <View className="mb-3">
                            <Text className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">Recently Used</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {recentDurations.map((days) => (
                                    <TouchableOpacity
                                        key={days}
                                        onPress={() => { setDuration(days); setCustomDays(''); }}
                                        className={`px-4 py-2.5 rounded-xl mr-2 border ${duration === days
                                            ? 'bg-primary-600 border-primary-600'
                                            : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <Text className={`font-medium ${duration === days ? 'text-white' : 'text-gray-600'}`}>
                                            {days} {days === 1 ? 'Day' : 'Days'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Custom Days Input */}
                    <View className="flex-row items-center mt-1">
                        <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                            <TextInput
                                placeholder="Custom days"
                                placeholderTextColor="#9CA3AF"
                                value={customDays}
                                onChangeText={setCustomDays}
                                keyboardType="number-pad"
                                style={{ flex: 1, fontSize: 15, color: '#111827' }}
                            />
                            <Text className="text-gray-400 ml-2">days</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                const num = parseInt(customDays, 10);
                                if (num > 0) {
                                    setDuration(num);
                                }
                            }}
                            disabled={!customDays || parseInt(customDays, 10) <= 0}
                            className={`ml-3 px-5 py-3 rounded-xl ${customDays && parseInt(customDays, 10) > 0 ? 'bg-primary-600' : 'bg-gray-200'}`}
                        >
                            <Text className={`font-semibold ${customDays && parseInt(customDays, 10) > 0 ? 'text-white' : 'text-gray-400'}`}>Set</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Show active selection */}
                    {duration !== null && ![7, 21].includes(duration) && (
                        <Text className="text-primary-600 text-sm font-medium mt-2">✓ {duration} {duration === 1 ? 'day' : 'days'} selected</Text>
                    )}
                </View>

                {/* Time of Day */}
                <View className="mb-8">
                    <Text className="text-gray-900 font-bold mb-4 text-base">Do it at</Text>
                    <View className="flex-row flex-wrap">
                        {[
                            { label: 'Anytime', value: 'anytime', icon: '♾️' },
                            { label: 'Specific Time', value: 'specific', icon: '⏰' },
                        ]
                            .filter(option => !fromDayView || option.value !== 'anytime') // Hide 'Anytime' if from Day View
                            .map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => setTimeOfDay(option.value as any)}
                                    className={`px-4 py-3 rounded-xl mr-3 mb-3 border flex-row items-center cursor-pointer ${timeOfDay === option.value
                                        ? 'bg-primary-600 border-primary-600'
                                        : 'bg-gray-50 border-gray-200'
                                        }`}
                                    style={{ minWidth: '45%' }}
                                >
                                    <Text className="text-2xl mr-2">{option.icon}</Text>
                                    <Text
                                        className={`font-semibold ${timeOfDay === option.value ? 'text-white' : 'text-gray-900'
                                            }`}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </View>

                    {/* Specific Time & Duration Pickers */}
                    {timeOfDay === 'specific' && (
                        <View className="bg-gray-50 p-4 rounded-xl space-y-4">
                            {/* Time Picker */}
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-gray-700 font-medium">Start Time</Text>
                                <DateTimePicker
                                    value={reminderTime}
                                    mode="time"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        const currentDate = selectedDate || reminderTime;
                                        setReminderTime(currentDate);
                                    }}
                                    themeVariant="light"
                                />
                            </View>

                            {/* Duration Picker */}
                            <View>
                                <Text className="text-gray-700 font-medium mb-3">Duration</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {[10, 15, 30, 45, 60, 90, 120].map((mins) => (
                                        <TouchableOpacity
                                            key={mins}
                                            onPress={() => setDurationMinutes(mins)}
                                            className={`px-4 py-2 rounded-lg mr-2 border ${durationMinutes === mins ? 'bg-primary-100 border-primary-500' : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            <Text className={`${durationMinutes === mins ? 'text-primary-700 font-bold' : 'text-gray-600'}`}>
                                                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    )}
                </View>

                {/* Notes */}
                <View className="mb-8">
                    <Text className="text-gray-900 font-bold mb-4 text-base">Notes (Optional)</Text>
                    <Input
                        placeholder="e.g., Before breakfast, After gym..."
                        value={notes}
                        onChangeText={setNotes}
                        maxLength={200}
                        multiline
                        numberOfLines={3}
                        style={{ height: 80, textAlignVertical: 'top' }}
                    />
                    <Text className="text-gray-400 text-xs mt-1">{notes.length}/200 characters</Text>
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

            </ScrollView >

            <View className="p-6 border-t border-gray-100">
                <Button title="Create Habit" onPress={handleCreate} disabled={!title.trim()} />
            </View>
        </View >
    );
}
