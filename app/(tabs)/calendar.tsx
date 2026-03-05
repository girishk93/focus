import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useTaskStore } from '../../store/task-store';
import { Colors } from '../../constants/Colors';
import { toLocalDateString } from '../../utils/date';

type ViewMode = 'week' | 'month' | 'year';

export default function HistoryScreen() {
    const { habits, logs } = useTaskStore();
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Helper function to get week dates
    const getWeekDates = (date: Date) => {
        const dates: Date[] = [];
        const current = new Date(date);
        current.setDate(current.getDate() - current.getDay()); // Start from Sunday

        for (let i = 0; i < 7; i++) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    // Helper function to get month dates
    const getMonthDates = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dates: Date[] = [];

        for (let i = 1; i <= daysInMonth; i++) {
            dates.push(new Date(year, month, i));
        }
        return dates;
    };

    // Helper function to get year months
    const getYearMonths = (date: Date) => {
        const year = date.getFullYear();
        const months: Date[] = [];

        for (let i = 0; i < 12; i++) {
            months.push(new Date(year, i, 1));
        }
        return months;
    };

    // Calculate completion stats
    const getCompletionStats = (date: Date) => {
        const dateStr = toLocalDateString(date);
        const dayLogs = logs[dateStr] || {};

        const activeHabitsOnDate = habits.filter(habit => {
            const target = new Date(date);
            target.setHours(0, 0, 0, 0);
            const start = new Date(habit.startDate);
            start.setHours(0, 0, 0, 0);
            if (target < start) return false;
            if (habit.durationInDays === null || habit.durationInDays === undefined) return true;
            const expiry = new Date(start);
            expiry.setDate(start.getDate() + habit.durationInDays);
            return target < expiry;
        });

        // Filter out skipped tasks
        const nonSkippedHabits = activeHabitsOnDate.filter(h => dayLogs[h.id] !== 'skipped');

        const completed = Object.values(dayLogs).filter(v => v === true).length;
        const total = nonSkippedHabits.length;
        const percentage = total > 0 ? Math.min(100, (completed / total) * 100) : 0;

        return { completed, total, percentage };
    };

    // Calculate task streaks for the month
    const calculateTaskStreaks = () => {
        const taskStreaks: Record<string, { current: number; best: number; bestStart?: Date; bestEnd?: Date }> = {};

        habits.forEach(task => {
            const dates = getMonthDates(selectedDate);
            let currentStreak = 0;
            let bestStreak = 0;
            let bestStart: Date | undefined;
            let bestEnd: Date | undefined;
            let currentStart: Date | undefined;

            dates.forEach(date => {
                const dateStr = toLocalDateString(date);
                const status = logs[dateStr]?.[task.id];
                const isCompleted = status === true;
                const isSkipped = status === 'skipped';

                if (isCompleted) {
                    if (currentStreak === 0) {
                        currentStart = date;
                    }
                    currentStreak++;

                    if (currentStreak > bestStreak) {
                        bestStreak = currentStreak;
                        bestStart = currentStart;
                        bestEnd = date;
                    }
                } else if (isSkipped) {
                    // Streak preserved, do not reset.
                } else {
                    currentStreak = 0;
                    currentStart = undefined;
                }
            });

            taskStreaks[task.id] = {
                current: currentStreak,
                best: bestStreak,
                bestStart,
                bestEnd
            };
        });

        return taskStreaks;
    };

    // Calculate month completion
    const getMonthCompletionPercentage = (month: Date) => {
        const dates = getMonthDates(month);
        const totalPercentage = dates.reduce((sum, date) => {
            return sum + getCompletionStats(date).percentage;
        }, 0);
        return Math.min(100, totalPercentage / dates.length);
    };

    // Navigation handlers
    const navigatePrevious = () => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setFullYear(newDate.getFullYear() - 1);
        }
        setSelectedDate(newDate);
    };

    const navigateNext = () => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setFullYear(newDate.getFullYear() + 1);
        }
        setSelectedDate(newDate);
    };

    const getHeaderTitle = () => {
        if (viewMode === 'week') {
            const weekDates = getWeekDates(selectedDate);
            const start = weekDates[0];
            const end = weekDates[6];
            const sameMonth = start.getMonth() === end.getMonth();
            if (sameMonth) {
                return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
            }
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (viewMode === 'month') {
            return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else {
            return selectedDate.getFullYear().toString();
        }
    };

    const getColorForPercentage = (percentage: number) => {
        if (percentage >= 80) return '#10B981'; // Green
        if (percentage >= 60) return '#3B82F6'; // Blue
        if (percentage >= 40) return '#F59E0B'; // Amber
        if (percentage >= 20) return '#F97316'; // Orange
        if (percentage > 0) return '#EF4444'; // Red
        return '#E5E7EB'; // Gray
    };

    return (
        <ScreenWrapper>
            {/* Header */}
            <View className="px-6 pt-4 mb-4">
                <Text className="text-3xl font-bold text-gray-900 mb-6">History</Text>

                {/* View Mode Selector */}
                <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
                    {(['week', 'month', 'year'] as ViewMode[]).map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            onPress={() => setViewMode(mode)}
                            className={`flex-1 py-3 rounded-lg ${viewMode === mode ? 'bg-white' : ''}`}
                            style={{
                                shadowColor: viewMode === mode ? '#000' : 'transparent',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: viewMode === mode ? 0.1 : 0,
                                shadowRadius: 2,
                                elevation: viewMode === mode ? 2 : 0,
                            }}
                        >
                            <Text className={`text-center font-semibold ${viewMode === mode ? 'text-primary-600' : 'text-gray-500'}`}>
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}ly
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date Navigation */}
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={navigatePrevious} className="p-2">
                        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-gray-900">{getHeaderTitle()}</Text>
                    <TouchableOpacity onPress={navigateNext} className="p-2">
                        <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                {/* Weekly View */}
                {viewMode === 'week' && (
                    <View className="mb-6">
                        {getWeekDates(selectedDate).map((date, index) => {
                            const stats = getCompletionStats(date);
                            const isToday = toLocalDateString(date) === toLocalDateString();

                            return (
                                <View
                                    key={index}
                                    className={`mb-3 p-4 rounded-xl border ${isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}
                                >
                                    <View className="flex-row justify-between items-center mb-2">
                                        <View>
                                            <Text className="text-sm font-medium text-gray-500">
                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </Text>
                                            <Text className={`text-lg font-bold ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-2xl font-bold" style={{ color: getColorForPercentage(stats.percentage) }}>
                                                {stats.percentage.toFixed(0)}%
                                            </Text>
                                            <Text className="text-xs text-gray-500">
                                                {stats.completed}/{stats.total} habits
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Progress Bar */}
                                    <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <View
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${stats.percentage}%`,
                                                backgroundColor: getColorForPercentage(stats.percentage),
                                            }}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Monthly View - Task Streaks */}
                {viewMode === 'month' && (
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Best Streaks</Text>
                        <Text className="text-sm text-gray-500 mb-6">
                            Longest consecutive completion periods for each task this month
                        </Text>

                        {(() => {
                            const streaks = calculateTaskStreaks();
                            const tasksWithStreaks = habits
                                .map(task => ({
                                    task,
                                    ...streaks[task.id]
                                }))
                                .filter(item => item.best > 0)
                                .sort((a, b) => b.best - a.best);

                            if (tasksWithStreaks.length === 0) {
                                return (
                                    <View className="py-12 items-center">
                                        <Text className="text-gray-400 text-center">
                                            No completed tasks this month yet. {'\n'}Start building streaks!
                                        </Text>
                                    </View>
                                );
                            }

                            return tasksWithStreaks.map((item, index) => {
                                const barWidth = (item.best / getMonthDates(selectedDate).length) * 100;
                                const color = item.best >= 7 ? '#EC4899' : item.best >= 3 ? '#8B5CF6' : '#6B7280';

                                return (
                                    <View key={item.task.id} className="mb-4">
                                        <View className="flex-row items-center mb-2">
                                            <Text className="text-2xl mr-3">{item.task.icon || '📝'}</Text>
                                            <View className="flex-1">
                                                <Text className="text-sm font-semibold text-gray-900">
                                                    {item.task.title}
                                                </Text>
                                                {item.bestStart && item.bestEnd && (
                                                    <Text className="text-xs text-gray-500">
                                                        {item.bestStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        {' - '}
                                                        {item.bestEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </Text>
                                                )}
                                            </View>
                                            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: `${color}20` }}>
                                                <Text className="font-bold text-sm" style={{ color }}>
                                                    {item.best} days
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Streak Bar */}
                                        <View className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                                            <View
                                                className="h-full rounded-lg flex-row items-center justify-center"
                                                style={{
                                                    width: `${Math.max(barWidth, 10)}%`,
                                                    backgroundColor: color,
                                                }}
                                            >
                                                {item.best >= 5 && (
                                                    <Text className="text-white text-xs font-bold">
                                                        {item.best}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            });
                        })()}

                        {/* Info Card */}
                        <View className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="trophy" size={20} color="#8B5CF6" />
                                <Text className="text-purple-900 font-semibold ml-2">Streak Tips</Text>
                            </View>
                            <Text className="text-purple-700 text-xs">
                                🔥 7+ days = Amazing! {'\n'}
                                ⭐ 3-6 days = Great progress {'\n'}
                                💪 1-2 days = Keep going!
                            </Text>
                        </View>
                    </View>
                )}

                {/* Yearly View - Interactive Chart */}
                {viewMode === 'year' && (
                    <View className="mb-6">
                        {/* Summary Stats */}
                        <View className="flex-row justify-between mb-6">
                            {(() => {
                                const yearMonths = getYearMonths(selectedDate);
                                const monthlyPercentages = yearMonths.map(m => getMonthCompletionPercentage(m));
                                const avgCompletion = monthlyPercentages.reduce((sum, p) => sum + p, 0) / 12;
                                const currentMonth = new Date().getMonth();
                                const thisYear = new Date().getFullYear() === selectedDate.getFullYear();
                                const currentMonthPercentage = thisYear ? monthlyPercentages[currentMonth] : 0;
                                const lastMonthPercentage = currentMonth > 0 ? monthlyPercentages[currentMonth - 1] : 0;
                                const monthChange = thisYear && currentMonth > 0 ? currentMonthPercentage - lastMonthPercentage : 0;

                                return (
                                    <>
                                        <View className="flex-1 items-center">
                                            <Text className="text-3xl font-bold text-primary-600">{avgCompletion.toFixed(0)}%</Text>
                                            <Text className="text-xs text-gray-500 mt-1">Avg Score</Text>
                                        </View>
                                        <View className="flex-1 items-center">
                                            <Text className="text-3xl font-bold text-gray-900">{currentMonthPercentage.toFixed(0)}%</Text>
                                            <Text className="text-xs text-gray-500 mt-1">This Month</Text>
                                        </View>
                                        <View className="flex-1 items-center">
                                            <Text className={`text-3xl font-bold ${monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(0)}%
                                            </Text>
                                            <Text className="text-xs text-gray-500 mt-1">Month Change</Text>
                                        </View>
                                        <View className="flex-1 items-center">
                                            <Text className="text-3xl font-bold text-gray-900">{habits.length}</Text>
                                            <Text className="text-xs text-gray-500 mt-1">Total Tasks</Text>
                                        </View>
                                    </>
                                );
                            })()}
                        </View>

                        {/* Line Chart */}
                        <View className="mb-6">
                            <Text className="text-sm font-semibold text-gray-700 mb-3">Score Trend</Text>
                            <View className="bg-white p-4 rounded-xl border border-gray-200">
                                {/* Y-axis labels */}
                                <View className="flex-row mb-2">
                                    <View className="w-8">
                                        <Text className="text-[10px] text-gray-400">100%</Text>
                                    </View>
                                </View>

                                {/* Chart Area */}
                                <View style={{ height: 150 }} className="relative">
                                    {/* Grid lines */}
                                    <View className="absolute inset-0 flex-col justify-between">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <View key={i} className="h-px bg-gray-100" />
                                        ))}
                                    </View>

                                    {/* Data points and lines */}
                                    <View className="absolute inset-0 flex-row items-end justify-between px-1">
                                        {getYearMonths(selectedDate).map((month, index) => {
                                            const percentage = getMonthCompletionPercentage(month);
                                            const height = (percentage / 100) * 140;

                                            return (
                                                <View key={index} className="flex-1 items-center" style={{ height: 150 }}>
                                                    <View className="flex-1 justify-end items-center">
                                                        {/* Data point */}
                                                        <View
                                                            className="w-3 h-3 rounded-full bg-pink-500 border-2 border-white"
                                                            style={{
                                                                marginBottom: Math.max(0, height - 6),
                                                                shadowColor: '#EC4899',
                                                                shadowOffset: { width: 0, height: 2 },
                                                                shadowOpacity: 0.3,
                                                                shadowRadius: 3,
                                                                elevation: 3,
                                                            }}
                                                        />
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* X-axis labels */}
                                <View className="flex-row justify-between mt-2 px-1">
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                                        <Text key={index} className="text-[10px] text-gray-400 flex-1 text-center">
                                            {month}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Bar Chart - Monthly Breakdown */}
                        <View className="mb-6">
                            <Text className="text-sm font-semibold text-gray-700 mb-3">Monthly Breakdown</Text>
                            <View className="flex-row items-end justify-between" style={{ height: 120 }}>
                                {getYearMonths(selectedDate).map((month, index) => {
                                    const percentage = getMonthCompletionPercentage(month);
                                    const barHeight = (percentage / 100) * 100;
                                    const isCurrentMonth = new Date().getMonth() === index &&
                                        new Date().getFullYear() === selectedDate.getFullYear();

                                    return (
                                        <View key={index} className="flex-1 items-center px-0.5">
                                            <View className="w-full items-center justify-end" style={{ height: 100 }}>
                                                {percentage > 0 && (
                                                    <>
                                                        <Text className="text-[10px] font-bold text-pink-600 mb-1">
                                                            {percentage.toFixed(0)}
                                                        </Text>
                                                        <View
                                                            className="w-full rounded-t-md"
                                                            style={{
                                                                height: Math.max(4, barHeight),
                                                                backgroundColor: isCurrentMonth ? '#EC4899' : '#F9A8D4',
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </View>
                                            <Text className="text-[9px] text-gray-400 mt-1">
                                                {month.toLocaleDateString('en-US', { month: 'short' })}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Yearly Summary Card */}
                        <View className="mt-6 p-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl">
                            <Text className="text-white text-lg font-semibold mb-4">
                                {selectedDate.getFullYear()} Summary
                            </Text>
                            <View className="flex-row justify-between">
                                <View>
                                    <Text className="text-white/80 text-sm">Best Month</Text>
                                    <Text className="text-white text-2xl font-bold">
                                        {(() => {
                                            const months = getYearMonths(selectedDate);
                                            const percentages = months.map(m => getMonthCompletionPercentage(m));
                                            const maxIndex = percentages.indexOf(Math.max(...percentages));
                                            return months[maxIndex].toLocaleDateString('en-US', { month: 'short' });
                                        })()}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-white/80 text-sm">Total Days</Text>
                                    <Text className="text-white text-2xl font-bold">
                                        {(() => {
                                            const year = selectedDate.getFullYear();
                                            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
                                        })()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
