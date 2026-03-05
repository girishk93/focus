import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, AppState } from 'react-native';
import { toLocalDateString } from '../../utils/date';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeekStripProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export default function WeekStrip({ selectedDate, onDateSelect }: WeekStripProps) {
    const formattedSelectedDate = toLocalDateString(selectedDate);

    // Force re-render when the calendar day changes (midnight) or app comes to foreground
    const [dateKey, setDateKey] = useState(() => toLocalDateString());

    useEffect(() => {
        // Schedule a timer for midnight to refresh dates
        const now = new Date();
        const midnight = new Date(now);
        midnight.setDate(midnight.getDate() + 1);
        midnight.setHours(0, 0, 1, 0); // 1 second past midnight
        const msUntilMidnight = midnight.getTime() - now.getTime();

        const timer = setTimeout(() => {
            const newToday = toLocalDateString();
            setDateKey(newToday);
            onDateSelect(new Date()); // Auto-select the new today
        }, msUntilMidnight);

        // Also refresh when app comes back to foreground
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                const currentDay = toLocalDateString();
                if (currentDay !== dateKey) {
                    setDateKey(currentDay);
                    onDateSelect(new Date());
                }
            }
        });

        return () => {
            clearTimeout(timer);
            subscription.remove();
        };
    }, [dateKey]);

    // Generate week dates centered around today
    const weekDates = useMemo(() => {
        const dates = [];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [dateKey]);

    return (
        <View style={styles.container}>
            {weekDates.map((date) => {
                const dateStr = toLocalDateString(date);
                const isSelected = dateStr === formattedSelectedDate;
                const isToday = dateStr === toLocalDateString();

                return (
                    <TouchableOpacity
                        key={dateStr}
                        onPress={() => onDateSelect(date)}
                        style={[
                            styles.dayButton,
                            isSelected && styles.selectedDay
                        ]}
                    >
                        <Text style={[
                            styles.dayLabel,
                            isSelected && styles.selectedDayLabel
                        ]}>
                            {WEEK_DAYS[date.getDay()]}
                        </Text>
                        <Text style={[
                            styles.dateLabel,
                            isSelected && styles.selectedDateLabel,
                            isToday && !isSelected && styles.todayLabel
                        ]}>
                            {date.getDate()}
                        </Text>
                        {isToday && !isSelected && (
                            <View style={styles.todayIndicator} />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    dayButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 64,
        borderRadius: 16,
    },
    selectedDay: {
        backgroundColor: '#6C5CE7',
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#94A3B8',
        marginBottom: 4,
    },
    selectedDayLabel: {
        color: '#DDD6FE',
    },
    dateLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    selectedDateLabel: {
        color: 'white',
    },
    todayLabel: {
        color: '#6C5CE7',
    },
    todayIndicator: {
        width: 4,
        height: 4,
        backgroundColor: '#6C5CE7',
        borderRadius: 2,
        marginTop: 4,
    },
});
