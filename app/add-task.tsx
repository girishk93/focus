import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Alert, TextInput, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTaskStore } from '../store/task-store';
import { useDurationStore } from '../store/duration-store';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { ThemedText } from '../components/ui/Typography';
import { useThemeStore } from '../store/theme-store';
import Button from '../components/ui/Button';
import { 
  X, 
  Check, 
  Flame, 
  Clock, 
  Calendar, 
  Hash, 
  AlignLeft,
  Bell,
  Activity,
  Zap,
  Coffee,
  Book,
  Heart,
  Briefcase
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleHabitReminder } from '../utils/notifications';

const CATEGORIES = [
  { id: 'health', icon: Activity, label: 'Health' },
  { id: 'focus', icon: Zap, label: 'Focus' },
  { id: 'routine', icon: Coffee, label: 'Routine' },
  { id: 'growth', icon: Book, label: 'Growth' },
  { id: 'wellness', icon: Heart, label: 'Wellness' },
  { id: 'work', icon: Briefcase, label: 'Work' },
];

const THEME_HEXES: Record<string, string> = {
    oxygen: '#06B6D4', leaf: '#22C55E', violet: '#8B5CF6', sunset: '#F59E0B', rose: '#F43F5E'
};

export default function AddTaskScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const fromDayView = params.fromDayView === 'true';
    const addHabit = useTaskStore((state) => state.addHabit);
    const { recentDurations, addRecentDuration } = useDurationStore();
    const activeColor = '#06B6D4';

    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('focus');
    const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
    const [duration, setDuration] = useState<number | null>(null);
    const [customDays, setCustomDays] = useState('');
    const [timeOfDay, setTimeOfDay] = useState<'anytime' | 'specific'>(
        fromDayView ? 'specific' : 'anytime'
    );
    const [durationMinutes, setDurationMinutes] = useState(15);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0)));
    const [notes, setNotes] = useState('');

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Details Missing', 'Please enter a habit title.');
            return;
        }

        const habitId = Date.now().toString();

        addHabit({
            id: habitId,
            title,
            icon: CATEGORIES.find(c => c.id === selectedCategory)?.id || 'focus',
            category: selectedCategory,
            color: 'primary',
            frequency,
            targetDays: frequency === 'daily' ? 30 : 4,
            startDate: new Date().toISOString(),
            durationInDays: duration,
            durationMinutes,
            timeOfDay: timeOfDay as any,
            reminderTime: (reminderEnabled || timeOfDay === 'specific') ? reminderTime.toISOString() : null,
            notes: notes.trim() || undefined,
        });

        if (duration !== null && ![7, 21].includes(duration)) {
            addRecentDuration(duration);
        }

        if (reminderEnabled) {
            await scheduleHabitReminder(habitId, title, reminderTime.getHours(), reminderTime.getMinutes());
        }

        router.back();
    };

    return (
        <ScreenWrapper bg="bg-white" className="px-0">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-zinc-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <X size={24} color="#71717A" />
                </TouchableOpacity>
                <ThemedText className="text-xl font-bold text-zinc-900 tracking-tight">New Habit</ThemedText>
                <TouchableOpacity 
                   onPress={handleCreate} 
                   disabled={!title.trim()}
                   className={`w-10 h-10 rounded-full items-center justify-center ${!title.trim() ? 'bg-zinc-100' : 'bg-primary'}`}
                >
                    <Check size={20} color={!title.trim() ? "#A1A1AA" : "#FFFFFF"} strokeWidth={3} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Name Input */}
                <View className="mb-10">
                    <View className="flex-row items-center mb-4">
                        <AlignLeft size={18} color="#71717A" className="mr-2" />
                        <ThemedText className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Habit Name</ThemedText>
                    </View>
                    <TextInput
                        placeholder="e.g. Morning Meditation"
                        placeholderTextColor="#A1A1AA"
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                        className="text-2xl font-bold text-zinc-900 border-b-2 border-zinc-100 py-2"
                    />
                </View>

                {/* Category Picker */}
                <View className="mb-10">
                    <View className="flex-row items-center mb-4">
                        <Hash size={18} color="#71717A" className="mr-2" />
                        <ThemedText className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Category</ThemedText>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setSelectedCategory(cat.id)}
                                    className={`items-center mr-6`}
                                >
                                    <View className={`w-14 h-14 rounded-2xl items-center justify-center border-2 ${isSelected ? 'bg-primary border-primary' : 'bg-zinc-50 border-zinc-100'}`}>
                                        <Icon size={24} color={isSelected ? "#FFF" : "#71717A"} />
                                    </View>
                                    <ThemedText className={`text-[11px] mt-2 font-bold uppercase tracking-tighter ${isSelected ? 'text-primary' : 'text-zinc-400'}`}>
                                        {cat.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Frequency & Duration */}
                <View className="flex-row justify-between mb-10">
                    <View className="w-[48%]">
                        <View className="flex-row items-center mb-4">
                            <Activity size={18} color="#71717A" className="mr-2" />
                            <ThemedText className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Frequency</ThemedText>
                        </View>
                        <View className="bg-zinc-100 p-1.5 rounded-2xl flex-row">
                            <TouchableOpacity 
                                onPress={() => setFrequency('daily')} 
                                className={`flex-1 py-2.5 items-center rounded-xl ${frequency === 'daily' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <ThemedText className={`text-xs font-bold ${frequency === 'daily' ? 'text-primary' : 'text-zinc-500'}`}>Daily</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setFrequency('weekly')} 
                                className={`flex-1 py-2.5 items-center rounded-xl ${frequency === 'weekly' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <ThemedText className={`text-xs font-bold ${frequency === 'weekly' ? 'text-primary' : 'text-zinc-500'}`}>Weekly</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="w-[48%]">
                        <View className="flex-row items-center mb-4">
                            <Calendar size={18} color="#71717A" className="mr-2" />
                            <ThemedText className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Target</ThemedText>
                        </View>
                        <View className="bg-zinc-100 p-1.5 rounded-2xl flex-row items-center px-4 py-2.5">
                           <ThemedText className="text-xs font-bold text-zinc-900 mr-2">{duration || '∞'}</ThemedText>
                           <ThemedText className="text-[10px] font-bold text-zinc-400 uppercase">Days</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Reminder Settings */}
                <View className="mb-10 bg-zinc-50 p-6 rounded-[32px] border border-zinc-100">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <Bell size={20} color="#71717A" className="mr-3" />
                            <ThemedText className="font-bold text-zinc-900">Daily Reminder</ThemedText>
                        </View>
                        <Switch
                            value={reminderEnabled}
                            onValueChange={setReminderEnabled}
                            trackColor={{ false: '#E4E4E7', true: activeColor }}
                        />
                    </View>

                    {reminderEnabled && (
                        <View className="flex-row items-center justify-between pt-4 border-t border-zinc-200/50">
                            <View className="flex-row items-center">
                                <Clock size={16} color="#71717A" className="mr-2" />
                                <ThemedText className="text-sm font-medium text-zinc-600">Notify me at</ThemedText>
                            </View>
                            <DateTimePicker
                                value={reminderTime}
                                mode="time"
                                display="default"
                                onChange={(_, date) => setReminderTime(date || reminderTime)}
                                themeVariant="light"
                            />
                        </View>
                    )}
                </View>

                {/* Notes */}
                <View className="mb-12">
                   <View className="flex-row items-center mb-4">
                        <ThemedText className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Notes</ThemedText>
                    </View>
                    <TextInput
                        placeholder="Context helps consistency..."
                        placeholderTextColor="#A1A1AA"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        className="bg-zinc-50 p-5 rounded-3xl text-sm text-zinc-900 font-medium"
                        style={{ height: 100, textAlignVertical: 'top' }}
                    />
                </View>

                <Button title="Establish Intent" onPress={handleCreate} disabled={!title.trim()} size="lg" className="shadow-lg shadow-primary/20" />
                <View className="h-20" />
            </ScrollView>
        </ScreenWrapper>
    );
}
