import React, { useMemo, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, AppState } from 'react-native';
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

    const weekDates = useMemo(() => {
        const dates = [];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [dateKey]);

    return (
        <View className="flex-row justify-between bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm mx-1">
            {weekDates.map((date) => {
                const dateStr = toLocalDateString(date);
                const isSelected = dateStr === formattedSelectedDate;
                const isToday = dateStr === toLocalDateString();

                return (
                    <TouchableOpacity
                        key={dateStr}
                        onPress={() => onDateSelect(date)}
                        className={`items-center justify-center w-[42px] h-[68px] rounded-2xl ${isSelected ? 'bg-primary shadow-sm shadow-primary/30' : ''}`}
                    >
                        <Text className={`text-xs font-bold mb-1 ${isSelected ? 'text-primary-tint' : 'text-zinc-400'}`}>
                            {WEEK_DAYS[date.getDay()]}
                        </Text>
                        <Text className={`text-lg font-bold ${isSelected ? 'text-white' : isToday ? 'text-primary' : 'text-zinc-900'}`}>
                            {date.getDate()}
                        </Text>
                        {isToday && !isSelected && (
                            <View className="w-1 h-1 rounded-full bg-primary mt-1" />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
