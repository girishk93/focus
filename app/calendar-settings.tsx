import React, { useEffect, useState } from 'react';
import { View, Text, Switch, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Colors } from '../constants/Colors';
import { CalendarService } from '../services/calendar-service';
import { useAuthStore } from '../store/auth-store';
import * as Calendar from 'expo-calendar';

// Ideally this would be in a store
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CalendarSettingsScreen() {
    const router = useRouter();
    const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
    const [syncedCalendarId, setSyncedCalendarId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCalendars();
    }, []);

    const loadCalendars = async () => {
        try {
            setLoading(true);
            const hasPermission = await CalendarService.getPermissions();
            if (!hasPermission) {
                Alert.alert('Permission Required', 'Please enable calendar access in your device settings.');
                setLoading(false);
                return;
            }

            const deviceCalendars = await CalendarService.getCalendars();
            setCalendars(deviceCalendars);

            // Load saved preference
            const savedId = await AsyncStorage.getItem('synced_calendar_id');
            setSyncedCalendarId(savedId);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load calendars');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCalendar = async (calendarId: string) => {
        // If selecting the already selected one, allow deselection (turn off sync)
        if (calendarId === syncedCalendarId) {
            setSyncedCalendarId(null);
            await AsyncStorage.removeItem('synced_calendar_id');
            return;
        }

        // Otherwise select new one
        setSyncedCalendarId(calendarId);
        await AsyncStorage.setItem('synced_calendar_id', calendarId);

        Alert.alert('Synced!', 'Habits will now be added to this calendar.');
    };

    const createDedicatedCalendar = async () => {
        try {
            const newId = await CalendarService.createCalendar();
            await loadCalendars(); // Refresh list
            handleToggleCalendar(newId); // Auto select it
            Alert.alert('Success', 'Created "Focus Habits" calendar!');
        } catch (error) {
            Alert.alert('Error', 'Could not create calendar.');
        }
    };

    const renderItem = ({ item }: { item: Calendar.Calendar }) => {
        const isSelected = item.id === syncedCalendarId;
        const isGoogle = item.source.name === 'Gmail' || item.source.type === 'com.google';
        const isExchange = item.source.name === 'Exchange';

        let iconName: keyof typeof Ionicons.glyphMap = 'calendar-outline';
        if (isGoogle) iconName = 'logo-google';
        // if (isExchange) iconName = 'briefcase-outline'; 

        // Fix color to be hex string
        const colorStyle = { backgroundColor: item.color || Colors.primary };

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleToggleCalendar(item.id)}
                className={`flex-row items-center p-4 mb-3 rounded-xl border ${isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 bg-white'}`}
            >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: item.color + '20' }}>
                    <Ionicons name={iconName} size={20} color={item.color || Colors.primary} />
                </View>
                <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{item.title}</Text>
                    <Text className="text-gray-500 text-xs">{item.source.name}</Text>
                </View>
                {
                    isSelected && (
                        <View className="bg-primary-600 rounded-full p-1 ml-2">
                            <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                    )
                }
            </TouchableOpacity >
        );
    };

    return (
        <ScreenWrapper>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Calendar Sync',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                )
            }} />

            <View className="flex-1 px-6 pt-4">
                <Text className="text-gray-500 mb-6">
                    Select a calendar to sync your habits with. You can use your existing Google or Outlook calendars, or create a dedicated one.
                </Text>

                {loading ? (
                    <Text className="text-center mt-10 text-gray-400">Loading calendars...</Text>
                ) : (
                    <>
                        <TouchableOpacity
                            onPress={createDedicatedCalendar}
                            className="bg-gray-900 flex-row items-center justify-center py-4 rounded-xl mb-6 shadow-sm"
                        >
                            <Ionicons name="add-circle" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">Create Dedicated Calendar</Text>
                        </TouchableOpacity>

                        <Text className="font-bold text-lg mb-3">Your Calendars</Text>

                        {calendars.length === 0 ? (
                            <View className="items-center py-10">
                                <Text className="text-gray-400 text-center">No editable calendars found.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={calendars}
                                renderItem={renderItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 40 }}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </>
                )}
            </View>
        </ScreenWrapper>
    );
}
