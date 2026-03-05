import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore, Habit } from '../../store/task-store';
import { useAuthStore } from '../../store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import WeekStrip from '../../components/ui/WeekStrip';
import TaskDetailsModal from '../../components/modals/TaskDetailsModal';
import DraggableTaskCard from '../../components/ui/DraggableTaskCard';
import { getDeviceCalendars, syncDayHabitsToCalendar, DeviceCalendar } from '../../utils/calendar';
import { isHabitActiveOnDate, toLocalDateString } from '../../utils/date';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

// Remove old HabitCard component - now using DraggableTaskCard

export default function DayViewScreen() {
    const router = useRouter();
    const { habits, logs, toggleHabit, deleteHabit, updateHabitTime, updateHabitCalendarSync } = useTaskStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);
    const [deviceCalendars, setDeviceCalendars] = useState<DeviceCalendar[]>([]);
    const [loadingCalendars, setLoadingCalendars] = useState(false);
    const formattedDate = toLocalDateString(selectedDate);
    const today = toLocalDateString();
    const isPastDate = formattedDate < today;

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
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: () => {
                                            deleteHabit(selectedHabit.id);
                                            handleCloseModal();
                                        }
                                    }
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
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                            deleteHabit(selectedHabit.id);
                            handleCloseModal();
                        }
                    }
                ]
            );
        }
    };

    const handleDragEnd = (habitId: string, newY: number) => {
        const PIXELS_PER_HOUR = 40;
        const TIMELINE_START_HOUR = 6; // 6 AM

        // Convert Y position to hour and minutes
        const totalMinutesFromStart = (newY / PIXELS_PER_HOUR) * 60;
        const hour = Math.floor(totalMinutesFromStart / 60) + TIMELINE_START_HOUR;
        const minutes = Math.round(totalMinutesFromStart % 60);

        // Clamp to valid range (6 AM - 11 PM)
        const clampedHour = Math.max(6, Math.min(23, hour));
        const clampedMinutes = Math.max(0, Math.min(59, minutes));

        // Create new Date with the calculated time
        const newTime = new Date(selectedDate);
        newTime.setHours(clampedHour, clampedMinutes, 0, 0);

        // Update habit time in store
        updateHabitTime(habitId, newTime);
    };

    // Calendar sync handlers
    const handleOpenCalendarSync = async () => {
        setLoadingCalendars(true);
        setCalendarModalVisible(true);

        const calendars = await getDeviceCalendars();
        setDeviceCalendars(calendars);
        setLoadingCalendars(false);
    };

    const handleSyncToCalendar = async (calendarId: string) => {
        const selectedCalendar = deviceCalendars.find(c => c.id === calendarId);
        if (!selectedCalendar) return;

        const habitsToSync = activeHabits
            .filter(h => h.reminderTime)
            .map(h => ({
                id: h.id,
                title: h.title,
                reminderTime: h.reminderTime || undefined,
                durationMinutes: h.durationMinutes,
                notes: h.notes,
            }));

        if (habitsToSync.length === 0) {
            Alert.alert('No Habits to Sync', 'Add habits with specific times to sync them to your calendar.');
            setCalendarModalVisible(false);
            return;
        }

        const result = await syncDayHabitsToCalendar(
            calendarId,
            selectedCalendar.title,
            habitsToSync,
            selectedDate,
            (habitId, calId, calName) => {
                // Update each habit with calendar sync info
                updateHabitCalendarSync(habitId, calId, calName);
            }
        );

        setCalendarModalVisible(false);

        if (result.success > 0) {
            Alert.alert(
                'Sync Complete',
                `Successfully synced ${result.success} habit${result.success > 1 ? 's' : ''} to ${selectedCalendar.title}!${result.failed > 0 ? `\n${result.failed} habit${result.failed > 1 ? 's' : ''} failed to sync.` : ''}`
            );
        } else {
            Alert.alert('Sync Failed', 'Failed to sync habits to calendar. Please try again.');
        }
    };

    // Filter valid habits for selected date
    const activeHabits = habits.filter(habit => isHabitActiveOnDate(habit, selectedDate));

    // Scheduled section: truly anytime habits with no specific time assigned are now HIDDEN from Day View per request.
    // Scheduled section: specific time of day OR has a specific reminder time defined
    const scheduledHabits = activeHabits.filter(h => h.timeOfDay !== 'anytime' || h.reminderTime);

    const getHabitHour = (habit: Habit) => {
        if (habit.reminderTime) {
            return new Date(habit.reminderTime).getHours();
        }
        switch (habit.timeOfDay) {
            case 'morning': return 8;
            case 'afternoon': return 13; // 1 PM
            case 'evening': return 18; // 6 PM
            default: return 8;
        }
    };

    // Helper to format hour based on system locale
    const formatHour = (hour: number) => {
        const date = new Date();
        date.setHours(hour, 0, 0, 0);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: undefined });
        // Note: passing undefined/empty options often defaults to system preference. 
        // Explicitly asking for hour usually respects 12/24 preference of the locale.
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
                        <Text className="ml-2 text-blue-600 font-semibold">Sync</Text>
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

                                {/* Habit Slot Container*/}
                                <View className="flex-1 relative border-t border-gray-50/50">
                                    {/* Current Time Indicator Line */}
                                    {isNow && (
                                        <View className="absolute top-0 left-0 right-0 h-[1px] bg-primary-500 z-10 opacity-50" />
                                    )}

                                    {/* Render Habits Absolutely positioned within this slot */}
                                    {habitsAtThisHour.map((habit, habitIndex) => {
                                        const isCompleted = logs[formattedDate]?.[habit.id] || false;
                                        const durationMins = habit.durationMinutes || 60;
                                        const PIXELS_PER_HOUR = 40;
                                        const cardHeight = Math.max(20, (durationMins / 60) * PIXELS_PER_HOUR);

                                        // Calculate start offset (minutes)
                                        let startMinutes = 0;
                                        if (habit.reminderTime) {
                                            startMinutes = new Date(habit.reminderTime).getMinutes();
                                        }
                                        const topOffset = (startMinutes / 60) * PIXELS_PER_HOUR;

                                        // Check for overlapping habits at the same minute
                                        const overlappingHabits = habitsAtThisHour.filter((h, idx) => {
                                            if (!h.reminderTime || !habit.reminderTime) return false;
                                            const hMinutes = new Date(h.reminderTime).getMinutes();
                                            return hMinutes === startMinutes && idx < habitIndex;
                                        });

                                        // Offset horizontally if there are overlapping habits
                                        const horizontalOffset = overlappingHabits.length > 0 ? overlappingHabits.length * 8 : 0;
                                        const cardWidth = overlappingHabits.length > 0 ? '85%' : '100%';

                                        return (
                                            <DraggableTaskCard
                                                key={habit.id}
                                                habit={habit}
                                                isCompleted={isCompleted}
                                                onPress={() => handleOpenModal(habit)}
                                                onDragEnd={(newY) => handleDragEnd(habit.id, newY)}
                                                height={cardHeight}
                                                initialTop={topOffset}
                                                style={{
                                                    position: 'absolute',
                                                    left: 8 + horizontalOffset,
                                                    right: overlappingHabits.length > 0 ? 8 + (8 * overlappingHabits.length) : 0,
                                                    width: cardWidth,
                                                }}
                                            />
                                        );
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
                style={{
                    shadowColor: '#6C5CE7',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                }}
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
                            <Text className="text-2xl font-bold text-gray-900">Select Calendar</Text>
                            <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {loadingCalendars ? (
                            <View className="py-12 items-center">
                                <ActivityIndicator size="large" color="#6C5CE7" />
                                <Text className="mt-4 text-gray-500">Loading calendars...</Text>
                            </View>
                        ) : deviceCalendars.length === 0 ? (
                            <View className="py-12 items-center">
                                <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
                                <Text className="mt-4 text-gray-500 text-center">
                                    No writable calendars found.{'\n'}Please check your calendar permissions.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text className="text-sm text-gray-500 mb-4">
                                    Choose which calendar to sync your habits to:
                                </Text>
                                {deviceCalendars.map((calendar) => (
                                    <TouchableOpacity
                                        key={calendar.id}
                                        onPress={() => handleSyncToCalendar(calendar.id)}
                                        className="bg-gray-50 p-4 rounded-xl mb-3 border border-gray-200"
                                        activeOpacity={0.7}
                                    >
                                        <View className="flex-row items-center">
                                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                                                <Ionicons name="calendar" size={20} color="#2563EB" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="font-semibold text-gray-900 text-base">
                                                    {calendar.title}
                                                </Text>
                                                <Text className="text-sm text-gray-500 mt-0.5">
                                                    {calendar.source}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Habit Details Modal */}
            <TaskDetailsModal
                visible={modalVisible}
                habit={selectedHabit}
                isCompleted={selectedHabit ? (logs[formattedDate]?.[selectedHabit.id] || false) : false}
                onClose={handleCloseModal}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isPastDate={isPastDate}
            />
        </ScreenWrapper>
    );
}
