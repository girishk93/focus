import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Text, Image, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../store/task-store';
import { useAuthStore } from '../../store/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import Checkbox from '../../components/ui/Checkbox';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { ThemedText } from '../../components/ui/Typography';
import { Swipeable } from 'react-native-gesture-handler';

import WeekStrip from '../../components/ui/WeekStrip';
import { isHabitActiveOnDate, toLocalDateString } from '../../utils/date';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { habits, logs, toggleHabit, deleteHabit, skipHabit } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Auto-update selectedDate when the calendar day changes
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 1, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(() => setSelectedDate(new Date()), msUntilMidnight);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        const currentDay = toLocalDateString();
        if (toLocalDateString(selectedDate) !== currentDay) {
          setSelectedDate(new Date());
        }
      }
    });

    return () => { clearTimeout(timer); subscription.remove(); };
  }, [selectedDate]);

  const formattedSelectedDate = toLocalDateString(selectedDate);
  const today = toLocalDateString();
  const isPastDate = formattedSelectedDate < today;
  const isFutureDate = formattedSelectedDate > today;
  const isToday = formattedSelectedDate === today;

  const toggle = (id: string) => {
    if (isPastDate) {
      Alert.alert('Cannot Edit Past', 'You cannot mark habits as complete for previous days.');
      return;
    }
    if (isFutureDate) {
      Alert.alert('Cannot Complete Future', 'You can only mark habits as complete for today.');
      return;
    }
    toggleHabit(id, formattedSelectedDate);
  };

  const handleSkip = (habitId: string) => {
    skipHabit(habitId, formattedSelectedDate);
  };

  const handleDelete = (habitId: string, habitTitle: string) => {
    // Block delete on past dates
    if (isPastDate) {
      Alert.alert('Locked', 'You cannot delete or modify habits from previous days.');
      return;
    }

    const habit = habits.find(h => h.id === habitId);
    const isLifetime = habit?.durationInDays === null;

    if (isLifetime) {
      // Lifetime habit: ask if skipping for today or deleting forever
      Alert.alert(
        'What would you like to do?',
        `"${habitTitle}" is a lifetime habit.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete Forever',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Confirm Permanent Delete',
                `This will permanently remove "${habitTitle}" and all its history. Are you sure?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteHabit(habitId)
                  }
                ]
              );
            }
          }
        ]
      );
    } else {
      // Non-lifetime habit: standard delete
      Alert.alert(
        'Delete Habit',
        `Are you sure you want to delete "${habitTitle}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteHabit(habitId)
          }
        ]
      );
    }
  };

  const getDayProgress = () => {
    // Filter tasks that are active on the selected date
    const activeTasks = habits.filter(habit => isHabitActiveOnDate(habit, selectedDate));

    // Filter out skipped tasks from total count logic
    const nonSkippedTasks = activeTasks.filter(h => logs[formattedSelectedDate]?.[h.id] !== 'skipped');

    if (nonSkippedTasks.length === 0) return 0;
    const completed = nonSkippedTasks.filter(h => logs[formattedSelectedDate]?.[h.id] === true).length;
    return Math.round((completed / nonSkippedTasks.length) * 100);
  };

  const progress = getDayProgress();

  return (
    <ScreenWrapper bg="bg-slate-50" className="px-0">
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <ThemedText className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </ThemedText>
            <ThemedText variant="h1" className="text-slate-900">
              Hello, {user?.name?.split(' ')[0] || 'Friend'}! 👋
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-slate-100 overflow-hidden"
          >
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                className="w-full h-full"
              />
            ) : (
              <ThemedText className="text-primary-600 font-bold text-lg">
                {user?.name?.[0] || 'F'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Weekly Calendar Strip */}
        <WeekStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

        {/* Progress Card */}
        {habits.length > 0 && (
          <View className="bg-primary-600 p-6 rounded-[24px] mb-8 flex-row items-center justify-between shadow-xl shadow-primary-900/20">
            <View>
              <ThemedText className="text-white font-bold text-xl mb-1">
                {progress === 100 ? 'All done! 🎉' : 'Keep going! 💪'}
              </ThemedText>
              <ThemedText className="text-primary-100 text-sm">
                You completed {progress}% of your tasks today.
              </ThemedText>
            </View>
            <View className="w-16 h-16 border-4 border-white/20 rounded-full items-center justify-center relative">
              <ThemedText className="text-white font-bold text-sm">{progress}%</ThemedText>
            </View>
          </View>
        )}


        {/* Habits List */}
        <View className="flex-row justify-between items-center mb-4">
          <ThemedText variant="h2" className="text-slate-900">
            {isPastDate ? 'Past Habits' : isFutureDate ? 'Upcoming Habits' : "Today's Habits"}
          </ThemedText>
          {!isPastDate && (
            <TouchableOpacity onPress={() => router.push('/add-task')}>
              <Ionicons name="add-circle" size={32} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>


        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {habits.length === 0 ? (
            <View className="items-center justify-center py-20 opacity-50">
              <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="clipboard-outline" size={32} color="#94A3B8" />
              </View>
              <ThemedText className="text-slate-500 mt-2 text-center text-base">
                No habits yet. {'\n'}Tap + to start your journey!
              </ThemedText>
            </View>
          ) : (
            habits.filter(habit => isHabitActiveOnDate(habit, formattedSelectedDate)).map((habit, index) => {
              const status = logs[formattedSelectedDate]?.[habit.id];
              const isCompleted = status === true;
              const isSkipped = status === 'skipped';

              const renderRightActions = (progress: any, dragX: any) => {
                if (isPastDate) return null; // No actions for past days
                return (
                  <View className="flex-row ml-3 mb-3">
                    {!isCompleted && !isSkipped && (
                      <TouchableOpacity
                        onPress={() => handleSkip(habit.id)}
                        className="bg-orange-400 justify-center items-center px-6 rounded-3xl mr-2"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="play-skip-forward" size={24} color="white" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDelete(habit.id, habit.title)}
                      className="bg-red-500 justify-center items-center px-6 rounded-3xl"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                );
              };

              return (
                <Animated.View
                  key={habit.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  layout={Layout.springify()}
                >
                  <Swipeable
                    renderRightActions={renderRightActions}
                    overshootRight={false}
                    friction={2}
                  >
                    <TouchableOpacity
                      onPress={() => toggle(habit.id)}
                      activeOpacity={0.7}
                      className={`flex-row items-center bg-white p-5 rounded-3xl mb-3 shadow-sm border ${isCompleted ? 'border-primary-100 bg-primary-50/50' :
                          isSkipped ? 'border-orange-200 bg-orange-50/50' : 'border-slate-100'
                        }`}
                    >
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isCompleted ? 'bg-primary-100' :
                          isSkipped ? 'bg-orange-100' : 'bg-slate-50'
                        }`}>
                        {/* Placeholder for real emoji icon */}
                        <ThemedText className="text-2xl">
                          {habit.icon || '📝'}
                        </ThemedText>
                      </View>

                      <View className="flex-1">
                        <ThemedText className={`font-bold text-base ${isCompleted ? 'text-slate-400 line-through' :
                            isSkipped ? 'text-slate-400 italic' : 'text-slate-900'
                          }`}>
                          {habit.title}
                        </ThemedText>
                        <ThemedText className="text-slate-400 text-xs mt-0.5 font-medium">
                          {isSkipped ? '⏩ Skipped' : `🔥 ${habit.streak} day streak`}
                        </ThemedText>
                      </View>

                      <View style={{ opacity: !isToday ? 0.5 : 1 }}>
                        <Checkbox checked={isCompleted} onPress={() => toggle(habit.id)} size={28} />
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
