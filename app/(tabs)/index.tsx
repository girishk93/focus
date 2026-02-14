import React, { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { useHabitStore, Habit } from '../../store/habit-store';
import { useAuthStore } from '../../store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import Checkbox from '../../components/ui/Checkbox';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { habits, logs, toggleHabit } = useHabitStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate week dates centered around today or selected date
  const weekDates = useMemo(() => {
    const dates = [];
    const today = new Date(); // Anchor to today for the strip
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const formattedSelectedDate = selectedDate.toISOString().split('T')[0];

  const toggle = (id: string) => {
    toggleHabit(id, formattedSelectedDate);
  };

  const getDayProgress = () => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(h => logs[formattedSelectedDate]?.[h.id]).length;
    return Math.round((completed / habits.length) * 100);
  };

  const progress = getDayProgress();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text className="text-2xl font-bold text-gray-900">
              Hello, {user?.name?.split(' ')[0] || 'Friend'}! ☀️
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center"
          >
            <Text className="text-primary-700 font-bold text-lg">
              {user?.name?.[0] || 'F'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Calendar Strip */}
        <View className="flex-row justify-between bg-white p-3 rounded-2xl shadow-sm mb-6">
          {weekDates.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = dateStr === formattedSelectedDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <TouchableOpacity
                key={dateStr}
                onPress={() => setSelectedDate(date)}
                className={`items-center justify-center w-10 h-14 rounded-xl ${isSelected ? 'bg-primary-500' : 'bg-transparent'
                  }`}
              >
                <Text className={`text-xs mb-1 ${isSelected ? 'text-primary-100' : 'text-gray-400'
                  }`}>
                  {WEEK_DAYS[date.getDay()]}
                </Text>
                <Text className={`font-bold ${isSelected ? 'text-white' : (isToday ? 'text-primary-600' : 'text-gray-900')
                  }`}>
                  {date.getDate()}
                </Text>
                {isToday && !isSelected && (
                  <View className="w-1 h-1 bg-primary-500 rounded-full mt-1" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress Card */}
        {habits.length > 0 && (
          <View className="bg-primary-600 p-4 rounded-2xl mb-6 flex-row items-center justify-between shadow-lg shadow-primary-200">
            <View>
              <Text className="text-white font-bold text-lg mb-1">
                {progress === 100 ? 'All done! 🎉' : 'Keep going! 💪'}
              </Text>
              <Text className="text-primary-100 text-sm">
                You completed {progress}% of your habits today.
              </Text>
            </View>
            <View className="w-12 h-12 border-4 border-primary-400 rounded-full items-center justify-center">
              <Text className="text-white font-bold text-xs">{progress}%</Text>
            </View>
          </View>
        )}


        {/* Habits List */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-900">Today's Habits</Text>
          <TouchableOpacity onPress={() => router.push('/add-habit')}>
            <Ionicons name="add-circle" size={32} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {habits.length === 0 ? (
            <View className="items-center justify-center py-20 opacity-50">
              <Ionicons name="clipboard-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4 text-center">
                No habits yet. {'\n'}Tap + to start your journey!
              </Text>
            </View>
          ) : (
            habits.map((habit, index) => {
              const isCompleted = logs[formattedSelectedDate]?.[habit.id] || false;

              return (
                <Animated.View
                  key={habit.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    onPress={() => toggle(habit.id)}
                    activeOpacity={0.7}
                    className={`flex-row items-center bg-white p-4 rounded-2xl mb-3 shadow-sm border ${isCompleted ? 'border-primary-100 bg-primary-50' : 'border-transparent'
                      }`}
                  >
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isCompleted ? 'bg-primary-100' : 'bg-gray-100'
                      }`}>
                      {/* Placeholder for real emoji icon */}
                      <Text className="text-xl">
                        {habit.icon || '📝'}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text className={`font-bold text-base ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                        }`}>
                        {habit.title}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        🔥 {habit.streak} day streak
                      </Text>
                    </View>

                    <Checkbox checked={isCompleted} onPress={() => toggle(habit.id)} size={32} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
