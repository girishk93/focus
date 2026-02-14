import React, { useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useHabitStore } from '../../store/habit-store';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
    const { habits, logs } = useHabitStore();
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate days in month
    const daysInMonth = useMemo(() => {
        return new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    }, [currentMonthIndex, currentYear]);

    // Generate array of days [1..31]
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Calculate completion stats per day
    const dailyStats = useMemo(() => {
        const stats: Record<string, number> = {};
        monthDays.forEach(day => {
            const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLogs = logs[dateStr] || {};
            const completedCount = Object.values(dayLogs).filter(Boolean).length;
            // Percentage of habits completed that day
            stats[day] = habits.length > 0 ? completedCount / habits.length : 0;
        });
        return stats;
    }, [logs, habits, monthDays]);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 pt-6 mb-6">
                <Text className="text-3xl font-bold text-gray-900">History</Text>
                <Text className="text-gray-500 text-base">Your consistence journey.</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
                {/* Month Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-bold text-gray-800">{MONTHS[currentMonthIndex]} {currentYear}</Text>
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </View>

                {/* Monthly Grid */}
                <View className="flex-row flex-wrap justify-between">
                    {monthDays.map((day) => {
                        const progress = dailyStats[day] || 0;
                        // Color coding based on completion rate
                        let bgClass = 'bg-gray-100';
                        let textClass = 'text-gray-400';

                        if (progress === 1) {
                            bgClass = 'bg-green-500';
                            textClass = 'text-white font-bold';
                        } else if (progress > 0) {
                            bgClass = 'bg-orange-300';
                            textClass = 'text-white font-bold';
                        }

                        return (
                            <View key={day} className={`w-[13%] aspect-square mb-3 rounded-lg items-center justify-center ${bgClass}`}>
                                <Text className={`text-xs ${textClass}`}>{day}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Legend */}
                <View className="flex-row justify-center mt-8 space-x-6">
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-gray-100 rounded-full mr-2" />
                        <Text className="text-gray-500 text-xs">Empty</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-orange-300 rounded-full mr-2" />
                        <Text className="text-gray-500 text-xs">Partial</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                        <Text className="text-gray-500 text-xs">Perfect</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
