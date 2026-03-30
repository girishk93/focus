import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Image, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../store/task-store';
import { useAuthStore } from '../../store/auth-store';
import { Plus, Flame, FastForward, Trash2, ListTodo } from 'lucide-react-native';
import Checkbox from '../../components/ui/Checkbox';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { ThemedText } from '../../components/ui/Typography';
import { Swipeable } from 'react-native-gesture-handler';

import WeekStrip from '../../components/ui/WeekStrip';
import { isHabitActiveOnDate, toLocalDateString } from '../../utils/date';
import { useThemeStore } from '../../store/theme-store';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { habits, logs, toggleHabit, deleteHabit, skipHabit } = useTaskStore();

  const activeColor = '#06B6D4';
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
      Alert.alert('Archive', 'You cannot alter past entries.');
      return;
    }
    if (isFutureDate) {
      Alert.alert('Future', 'You can only check off habits for today.');
      return;
    }
    toggleHabit(id, formattedSelectedDate);
  };

  const handleSkip = (habitId: string) => {
    skipHabit(habitId, formattedSelectedDate);
  };

  const handleDelete = (habitId: string, habitTitle: string) => {
    if (isPastDate) {
      Alert.alert('Locked', 'Cannot delete past habits.');
      return;
    }

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    Alert.alert(
      'Permanent Archive',
      `Delete "${habitTitle}" forever?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHabit(habitId)
        }
      ]
    );
  };

  const getDayProgress = () => {
    const activeTasks = habits.filter(habit => isHabitActiveOnDate(habit, selectedDate));
    const nonSkippedTasks = activeTasks.filter(h => logs[formattedSelectedDate]?.[h.id] !== 'skipped');

    if (nonSkippedTasks.length === 0) return 0;
    const completed = nonSkippedTasks.filter(h => logs[formattedSelectedDate]?.[h.id] === true).length;
    return Math.round((completed / nonSkippedTasks.length) * 100);
  };

  const progress = getDayProgress();

  return (
    <ScreenWrapper bg="bg-white" className="px-0">
      <View className="flex-1 px-4 pt-4">
        
        {/* Lighter, Fresher Header */}
        <View className="flex-row justify-between items-center mb-6 bg-white p-6 rounded-3xl border border-primary/10 shadow-sm shadow-primary/5">
          <View>
            <ThemedText className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </ThemedText>
            <ThemedText className="text-zinc-900 font-extrabold text-2xl tracking-tighter">
              Hello, {user?.display_name?.split(' ')[0] || user?.username || 'User'}
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            className="w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-primary items-center justify-center shadow-lg shadow-primary/20"
          >
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} className="w-full h-full" />
            ) : (
              <ThemedText className="text-zinc-900 font-bold text-xl">
                {user?.display_name?.[0] || user?.username?.[0] || 'U'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Lively Progress Block */}
        {habits.length > 0 && (
          <View className="bg-primary p-6 rounded-[32px] mb-8 flex-row items-center justify-between shadow-xl shadow-primary/30">
            <View>
              <ThemedText className="text-white font-bold text-xl mb-1 tracking-tight">
                {progress === 100 ? 'Day Complete' : 'Daily Progress'}
              </ThemedText>
              <ThemedText className="text-white/80 text-sm font-medium">
                {progress}% successfully achieved
              </ThemedText>
            </View>
            <View className="w-[64px] h-[64px] bg-white rounded-full items-center justify-center shadow-sm">
              <ThemedText className="text-primary font-black text-lg">{progress}%</ThemedText>
            </View>
          </View>
        )}

        <View className="mb-4">
          <WeekStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </View>

        <View className="flex-row justify-between items-center mb-5 mt-2 px-1">
          <ThemedText className="text-zinc-900 font-extrabold text-xl tracking-tight">
            {isPastDate ? 'History' : isFutureDate ? 'Scheduled' : 'Today\'s Task List'}
          </ThemedText>
          {!isPastDate && (
            <TouchableOpacity 
              onPress={() => router.push('/add-task')} 
              className="px-5 py-2.5 bg-primary rounded-2xl flex-row items-center shadow-sm"
            >
              <Plus size={18} color="#ffffff" strokeWidth={3} className="mr-1.5" />
              <ThemedText className="text-white font-bold text-[15px]">Add</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {habits.length === 0 ? (
            <View className="items-center justify-center py-16 bg-white rounded-3xl border border-zinc-200 border-dashed mx-1 shadow-sm">
              <ListTodo size={48} color="#A1A1AA" strokeWidth={1.5} />
              <ThemedText className="text-zinc-500 mt-4 text-center text-sm font-medium px-4">
                No active tasks for this date.
              </ThemedText>
            </View>
          ) : (
            habits.filter(habit => isHabitActiveOnDate(habit, formattedSelectedDate)).map((habit, index) => {
              const status = logs[formattedSelectedDate]?.[habit.id];
              const isCompleted = status === true;
              const isSkipped = status === 'skipped';

              const renderRightActions = () => {
                if (isPastDate) return null;
                return (
                  <View className="flex-row items-center ml-2 mb-3">
                    {!isCompleted && !isSkipped && (
                      <TouchableOpacity
                        onPress={() => handleSkip(habit.id)}
                        className="bg-zinc-200 h-full justify-center px-6 rounded-2xl mr-2 shadow-sm"
                      >
                        <FastForward size={22} color="#52525B" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDelete(habit.id, habit.title)}
                      className="bg-red-500 h-full justify-center px-6 rounded-2xl shadow-sm"
                    >
                      <Trash2 size={22} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                );
              };

              return (
                <View key={habit.id}>
                  <Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2}>
                    <TouchableOpacity
                      onPress={() => toggle(habit.id)}
                      activeOpacity={0.6}
                      className={`flex-row items-center p-4 rounded-3xl mb-3 shadow-sm border-[1.5px] ${isCompleted ? 'bg-zinc-100 border-zinc-200 opacity-60' :
                          isSkipped ? 'bg-zinc-100 border-zinc-200 opacity-60' : 'bg-white border-zinc-200'
                        }`}
                    >
                      <View className={`w-[52px] h-[52px] rounded-2xl items-center justify-center mr-4 ${isCompleted ? 'bg-zinc-200' :
                          isSkipped ? 'bg-zinc-300' : 'bg-primary-tint border border-primary/20'
                        }`}>
                         <ThemedText className="font-extrabold text-xl text-zinc-700">
                           {habit.title.charAt(0).toUpperCase()}
                         </ThemedText>
                      </View>

                      <View className="flex-1 justify-center">
                        <ThemedText className={`font-bold text-[17px] tracking-tight ${isCompleted ? 'text-zinc-300 line-through' : isSkipped ? 'text-zinc-500 italic' : 'text-zinc-900'}`}>
                          {habit.title}
                        </ThemedText>
                        <View className="flex-row items-center mt-1.5">
                          {!isSkipped && (
                            <Flame size={14} color={isCompleted ? '#D4D4D8' : activeColor} style={{ marginRight: 4 }} />
                          )}
                          <ThemedText className={`text-[13px] font-bold ${isCompleted ? 'text-zinc-300' : 'text-primary'}`}>
                            {isSkipped ? 'Skipped' : `${habit.streak || 0} Streak`}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={{ opacity: !isToday ? 0.4 : 1 }} className="pr-2">
                        <Checkbox checked={isCompleted} onPress={() => toggle(habit.id)} size={28} />
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
