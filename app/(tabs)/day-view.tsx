import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore, Habit } from '../../store/task-store';
import { useAuthStore } from '../../store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import WeekStrip from '../../components/ui/WeekStrip';
import TaskDetailsModal from '../../components/modals/TaskDetailsModal';
import DraggableTaskCard from '../../components/ui/DraggableTaskCard';
import { getDeviceCalendars, getCalendarEvents, DeviceCalendar } from '../../utils/calendar';
import { isHabitActiveOnDate, toLocalDateString } from '../../utils/date';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

export default function DayViewScreen() {
    const router = useRouter();
    const { habits, logs, toggleHabit, deleteHabit, updateHabitTime, updateHabitCalendarSync } = useTaskStore();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);

    // Native Calendar Integration State
    const [deviceCalendars, setDeviceCalendars] = useState<DeviceCalendar[]>([]);
    const [loadingCalendars, setLoadingCalendars] = useState(false);
    const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>([]);
    const [nativeEvents, setNativeEvents] = useState<Calendar.Event[]>([]);

    const formattedDate = toLocalDateString(selectedDate);
    const today = toLocalDateString();
    const isPastDate = formattedDate < today;

    useEffect(() => {
        // Load visible calendars preference from storage
        AsyncStorage.getItem('visibleCalendarIds').then(val => {
            if (val) {
                setVisibleCalendarIds(JSON.parse(val));
            }
        });
    }, []);

    useEffect(() => {
        // Fetch native events whenever date or selected calendars change
        if (visibleCalendarIds.length > 0) {
            const start = new Date(selectedDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(selectedDate);
            end.setHours(23, 59, 59, 999);

            getCalendarEvents(visibleCalendarIds, start, end).then(events => {
                // Ignore all-day events since timeline is 6 AM to 11 PM
                setNativeEvents(events.filter(e => !e.allDay));
            });
        } else {
            setNativeEvents([]);
        }
    }, [selectedDate, visibleCalendarIds]);

    // Modal handlers
    const handleOpenModal = (habit: Habit) => {
        setSelectedHabit(habit);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setTimeout(() => setSelectedHabit(null), 200);
    };

    const handleToggleComplete = () => {
        if (isPastDate) {
            Alert.alert('Locked', 'You cannot modify habits from previous days.');
            return;
        }
        if (selectedHabit) {
            toggleHabit(selectedHabit.id, formattedDate);
        }
    };

    const handleEdit = () => {
        if (isPastDate) {
            Alert.alert('Locked', 'You cannot edit habits from previous days.');
            return;
        }
        handleCloseModal();
        Alert.alert('Coming Soon', 'Edit functionality will be available soon!');
    };

    const handleDelete = () => {
        if (isPastDate) {
            Alert.alert('Locked', 'You cannot delete habits from previous days.');
            return;
        }
        if (!selectedHabit) return;
        const isLifetime = selectedHabit.durationInDays === null;

        if (isLifetime) {
            Alert.alert(
                'What would you like to do?',
                `"${selectedHabit.title}" is a lifetime habit.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Skip for Today',
                        onPress: () => {
                            if (!logs[formattedDate]?.[selectedHabit.id]) {
                                toggleHabit(selectedHabit.id, formattedDate);
                            }
                            handleCloseModal();
                        }
                    },
                    {
                        text: 'Delete Forever',
                        style: 'destructive',
                        onPress: () => {
                            Alert.alert(
                                'Confirm Permanent Delete',
                                `This will permanently remove "${selectedHabit.title}" and all its history. Are you sure?`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive', onPress: () => { deleteHabit(selectedHabit.id); handleCloseModal(); } }
                                ]
                            );
                        }
                    }
                ]
            );
        } else {
            Alert.alert(
                'Delete Habit',
                `Are you sure you want to delete "${selectedHabit.title}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => { deleteHabit(selectedHabit.id); handleCloseModal(); } }
                ]
            );
        }
    };

    const handleDragEnd = (habitId: string, newY: number) => {
        const PIXELS_PER_HOUR = 40;
        const TIMELINE_START_HOUR = 6;

        const totalMinutesFromStart = (newY / PIXELS_PER_HOUR) * 60;
        const hour = Math.floor(totalMinutesFromStart / 60) + TIMELINE_START_HOUR;
        const minutes = Math.round(totalMinutesFromStart % 60);

        const clampedHour = Math.max(6, Math.min(23, hour));
        const clampedMinutes = Math.max(0, Math.min(59, minutes));

        const newTime = new Date(selectedDate);
        newTime.setHours(clampedHour, clampedMinutes, 0, 0);

        updateHabitTime(habitId, newTime);
    };

    const handleOpenCalendarSync = async () => {
        setLoadingCalendars(true);
        setCalendarModalVisible(true);

        const calendars = await getDeviceCalendars();
        setDeviceCalendars(calendars);
        setLoadingCalendars(false);
    };

    const toggleCalendarVisibility = (calendarId: string) => {
        const newIds = visibleCalendarIds.includes(calendarId)
            ? visibleCalendarIds.filter(id => id !== calendarId)
            : [...visibleCalendarIds, calendarId];

        setVisibleCalendarIds(newIds);
        AsyncStorage.setItem('visibleCalendarIds', JSON.stringify(newIds));
    };

    const activeHabits = habits.filter(habit => isHabitActiveOnDate(habit, selectedDate));
    const scheduledHabits = activeHabits.filter(h => h.timeOfDay !== 'anytime' || h.reminderTime);

    const getHabitHour = (habit: Habit) => {
        if (habit.reminderTime) {
            return new Date(habit.reminderTime).getHours();
        }
        switch (habit.timeOfDay) {
            case 'morning': return 8;
            case 'afternoon': return 13;
            case 'evening': return 18;
            default: return 8;
        }
    };

    const formatHour = (hour: number) => {
        const date = new Date();
        date.setHours(hour, 0, 0, 0);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: undefined });
    };

    return (
        <ScreenWrapper bg="bg-white">
            <View className="flex-1 pt-2" style={{ flex: 1 }}>
                {/* Header */}
                <View className="px-6 mb-2 flex-row justify-between items-center">
                    <View>
                        <Text className="text-3xl font-bold text-gray-900">Day View</Text>
                        <Text className="text-sm text-gray-500">Plan your day</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleOpenCalendarSync}
                        className="bg-blue-100 px-4 py-2 rounded-xl flex-row items-center"
                        activeOpacity={0.8}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                        <Text className="ml-2 text-blue-600 font-semibold">Sync/View</Text>
                    </TouchableOpacity>
                </View>
                <View className="px-6 mb-2">
                    <WeekStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </View>

                <ScrollView
                    className="flex-1 px-4"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                >
                    {/* Timeline */}
                    {HOURS.map(hour => {
                        const habitsAtThisHour = scheduledHabits.filter(h => getHabitHour(h) === hour);
                        const eventsAtThisHour = nativeEvents.filter(e => new Date(e.startDate).getHours() === hour);

                        // Merge all items for the timeline slot calculation
                        const allItems = [
                            ...habitsAtThisHour.map(h => ({ type: 'habit', data: h })),
                            ...eventsAtThisHour.map(e => ({ type: 'event', data: e }))
                        ];

                        const isNow = new Date().getHours() === hour &&
                            selectedDate.toDateString() === new Date().toDateString();

                        return (
                            <View key={hour} className="flex-row" style={{ height: 40 }}>
                                {/* Time Label */}
                                <View className="w-14 items-end pr-2 py-1 border-r border-gray-100 justify-start">
                                    <Text className={`text-[10px] font-medium leading-4 ${isNow ? 'text-primary-600' : 'text-gray-400'}`}>
                                        {formatHour(hour)}
                                    </Text>
                                </View>

                                {/* Habit/Event Slot Container */}
                                <View className="flex-1 relative border-t border-gray-50/50">
                                    {isNow && (
                                        <View className="absolute top-0 left-0 right-0 h-[1px] bg-primary-500 z-10 opacity-50" />
                                    )}

                                    {/* Non-Overlapping Side-by-Side Algorithm */}
                                    {allItems.map((item, index) => {
                                        const PIXELS_PER_HOUR = 40;

                                        let startMinutes = 0;
                                        let durationMins = 60;

                                        if (item.type === 'habit') {
                                            const habit = item.data as Habit;
                                            if (habit.reminderTime) {
                                                startMinutes = new Date(habit.reminderTime).getMinutes();
                                            }
                                            durationMins = habit.durationMinutes || 60;
                                        } else {
                                            const event = item.data as Calendar.Event;
                                            startMinutes = new Date(event.startDate).getMinutes();
                                            durationMins = (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / 60000;
                                        }

                                        const topOffset = (startMinutes / 60) * PIXELS_PER_HOUR;
                                        const cardHeight = Math.max(20, (durationMins / 60) * PIXELS_PER_HOUR);

                                        // Side-by-side positioning
                                        const concurrentCount = allItems.length;
                                        const itemWidthPct = 100 / concurrentCount;
                                        const leftOffsetPct = itemWidthPct * index;

                                        if (item.type === 'habit') {
                                            const habit = item.data as Habit;
                                            const isCompleted = logs[formattedDate]?.[habit.id] === true;
                                            return (
                                                <DraggableTaskCard
                                                    key={`habit-${habit.id}`}
                                                    habit={habit}
                                                    isCompleted={isCompleted}
                                                    onPress={() => handleOpenModal(habit)}
                                                    onDragEnd={(newY) => handleDragEnd(habit.id, newY)}
                                                    height={cardHeight}
                                                    initialTop={topOffset}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${leftOffsetPct}%`,
                                                        width: `${itemWidthPct}%`,
                                                        paddingHorizontal: 2
                                                    }}
                                                />
                                            );
                                        } else {
                                            const event = item.data as Calendar.Event;
                                            return (
                                                <View
                                                    key={`event-${event.id}-${index}`}
                                                    className="absolute rounded-lg border-l-4 p-2 bg-purple-50"
                                                    style={{
                                                        top: topOffset,
                                                        height: cardHeight,
                                                        left: `${leftOffsetPct}%`,
                                                        width: `${itemWidthPct}%`,
                                                        borderColor: (event as any).color || '#A855F7',
                                                        opacity: 0.9,
                                                        marginHorizontal: 2,
                                                    }}
                                                >
                                                    <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>
                                                        {event.title}
                                                    </Text>
                                                    {cardHeight >= 40 && (
                                                        <Text className="text-[10px] text-gray-500 mt-1" numberOfLines={1}>
                                                            {new Date(event.startDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                            {' - '}
                                                            {new Date(event.endDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                        </Text>
                                                    )}
                                                </View>
                                            );
                                        }
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Quick Add FAB */}
            <TouchableOpacity
                onPress={() => router.push('/add-task?fromDayView=true')}
                className="absolute bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>

            {/* Calendar Selection Modal */}
            <Modal
                visible={calendarModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCalendarModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '70%' }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Text className="text-2xl font-bold text-gray-900">Sync Calendars</Text>
                                <Text className="text-sm text-gray-500">Toggle calendars to view their events</Text>
                            </View>
                            <TouchableOpacity onPress={() => setCalendarModalVisible(false)} className="p-2 bg-gray-100 rounded-full">
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {loadingCalendars ? (
                            <View className="py-12 items-center">
                                <ActivityIndicator size="large" color="#6C5CE7" />
                                <Text className="mt-4 text-gray-500">Loading your calendars...</Text>
                            </View>
                        ) : deviceCalendars.length === 0 ? (
                            <View className="py-12 items-center">
                                <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
                                <Text className="mt-4 text-gray-500 text-center">
                                    No calendars found.{'\n'}Please check your calendar permissions.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {deviceCalendars.map((calendar) => {
                                    const isVisible = visibleCalendarIds.includes(calendar.id);
                                    return (
                                        <TouchableOpacity
                                            key={calendar.id}
                                            onPress={() => toggleCalendarVisibility(calendar.id)}
                                            className={`p-4 rounded-xl mb-3 border ${isVisible ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                                            activeOpacity={0.7}
                                        >
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1">
                                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isVisible ? 'bg-blue-100' : 'bg-white'}`}>
                                                        <Ionicons name="calendar" size={20} color={isVisible ? "#2563EB" : "#94A3B8"} />
                                                    </View>
                                                    <View className="flex-1 pr-4">
                                                        <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
                                                            {calendar.title}
                                                        </Text>
                                                        <Text className="text-sm text-gray-500 mt-0.5">
                                                            {calendar.source}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Switch
                                                    value={isVisible}
                                                    onValueChange={() => toggleCalendarVisibility(calendar.id)}
                                                    trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                                                    thumbColor={isVisible ? "#2563EB" : "#F8FAFC"}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Habit Details Modal */}
            <TaskDetailsModal
                visible={modalVisible}
                habit={selectedHabit}
                isCompleted={selectedHabit ? (logs[formattedDate]?.[selectedHabit.id] === true) : false}
                onClose={handleCloseModal}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isPastDate={isPastDate}
            />
        </ScreenWrapper>
    );
}
