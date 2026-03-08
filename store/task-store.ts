import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';

// mmkvStorage wrapper removed - using unified storage adapter

export type Frequency = 'daily' | 'weekly';
export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Task {
    id: string;
    title: string;
    category: string; // 'health', 'learning', etc.
    icon: string; // Ionicons name
    color: string;
    frequency: Frequency;
    targetDays: number; // For logging purposes
    reminderTime?: string | null;
    startDate: string; // ISO Date string of when the habit started
    durationInDays: number | null; // null means "Lifetime" / forever
    durationMinutes: number; // default 15
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
    notes?: string; // Optional context notes (e.g., "Before breakfast")
    createdAt: string;
    archived: boolean;
    streak: number;
    calendarEventId?: string; // ID of the synced calendar event
}

// Alias for backwards compatibility — many components import { Habit }
export type Habit = Task;

export interface TaskLog {
    [date: string]: { // "YYYY-MM-DD"
        [habitId: string]: boolean | 'skipped'; // true = completed, 'skipped' = skipped
    };
}

interface HabitState {
    habits: Task[];
    logs: TaskLog;

    addHabit: (habit: Omit<Task, 'createdAt' | 'archived' | 'streak'> & { id?: string }) => Promise<void>;
    updateHabit: (id: string, updates: Partial<Task>) => void;
    updateHabitTime: (id: string, newTime: Date) => void; // Helper for drag-and-drop
    updateHabitCalendarSync: (id: string, calendarId: string, calendarName: string) => void; // Track calendar sync
    deleteHabit: (id: string) => Promise<void>;
    toggleHabit: (id: string, date: string) => void;
    skipHabit: (id: string, date: string) => void;
    getHabitProgress: (id: string, month: string) => number; // Returns %
}

export const useTaskStore = create<HabitState>()(
    persist(
        (set, get) => ({
            habits: [],
            logs: {},

            addHabit: async (habitData) => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                const habitId = habitData.id || Date.now().toString();
                let calendarEventId: string | undefined;

                // Calendar Sync Logic
                try {
                    const syncedCalendarId = await require('@react-native-async-storage/async-storage').default.getItem('synced_calendar_id');
                    if (syncedCalendarId) {
                        const { CalendarService } = require('../services/calendar-service');
                        const startDate = new Date(habitData.startDate || Date.now());

                        if (habitData.reminderTime) {
                            const reminderDate = new Date(habitData.reminderTime);
                            startDate.setHours(reminderDate.getHours(), reminderDate.getMinutes());
                        } else {
                            if (habitData.timeOfDay === 'morning') startDate.setHours(9, 0);
                            else if (habitData.timeOfDay === 'afternoon') startDate.setHours(14, 0);
                            else if (habitData.timeOfDay === 'evening') startDate.setHours(19, 0);
                            else startDate.setHours(9, 0);
                        }

                        calendarEventId = await CalendarService.createEvent(
                            syncedCalendarId,
                            habitData.title,
                            startDate,
                            habitData.durationMinutes,
                            habitData.frequency,
                            undefined,
                            habitData.notes
                        );
                    }
                } catch (e) {
                    console.error('Calendar Sync Error (Add):', e);
                }

                const newHabit: Task = {
                    ...habitData,
                    id: habitId,
                    createdAt: new Date().toISOString(),
                    startDate: habitData.startDate || new Date().toISOString(),
                    durationInDays: habitData.durationInDays !== undefined ? habitData.durationInDays : null,
                    durationMinutes: habitData.durationMinutes || 15,
                    timeOfDay: habitData.timeOfDay || 'anytime',
                    archived: false,
                    streak: 0,
                    calendarEventId
                } as Task;

                set((state) => {
                    const newHabits = [...state.habits, newHabit];
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);
                    return { habits: newHabits };
                });
            },

            updateHabit: (id, updates) => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                set((state) => {
                    const newHabits = state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);
                    return { habits: newHabits };
                });
            },

            updateHabitTime: (id, newTime) => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                set((state) => {
                    const newHabits = state.habits.map((h) =>
                        h.id === id
                            ? {
                                ...h,
                                reminderTime: newTime.toISOString(),
                                timeOfDay: 'anytime' as 'morning' | 'afternoon' | 'evening' | 'anytime',
                            }
                            : h
                    );
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);
                    return { habits: newHabits };
                });
            },

            updateHabitCalendarSync: (id, calendarId, calendarName) => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                set((state) => {
                    const newHabits = state.habits.map((h) =>
                        h.id === id
                            ? {
                                ...h,
                                syncedCalendar: {
                                    calendarId,
                                    calendarName,
                                    lastSyncDate: new Date().toISOString(),
                                },
                            }
                            : h
                    );
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);
                    return { habits: newHabits };
                });
            },

            deleteHabit: async (id) => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                try {
                    const habit = get().habits.find(h => h.id === id);
                    if (habit?.calendarEventId) {
                        const { CalendarService } = require('../services/calendar-service');
                        await CalendarService.deleteEvent(habit.calendarEventId, { futureEvents: true });
                    }
                } catch (e) {
                    console.error('Calendar Sync Error (Delete):', e);
                }

                set((state) => {
                    const newHabits = state.habits.filter((h) => h.id !== id);
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);
                    return { habits: newHabits };
                });
            },

            toggleHabit: (id, date) => set((state) => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                const newLogs = { ...state.logs };
                if (!newLogs[date]) newLogs[date] = {};

                const currentStatus = newLogs[date][id];
                const wasCompleted = currentStatus === true;

                const newStatus = !wasCompleted;
                newLogs[date][id] = newStatus;

                const { toLocalDateString } = require('../utils/date');
                const today = toLocalDateString();
                let streakDelta = 0;

                if (date === today) {
                    if (wasCompleted) streakDelta = -1;
                    else streakDelta = 1;
                }

                const newHabits = state.habits.map(h => {
                    if (h.id === id) {
                        return { ...h, streak: Math.max(0, h.streak + streakDelta) };
                    }
                    return h;
                });

                if (newStatus === true) {
                    const { addXp, checkBadges } = require('./gamification-store').useGamificationStore.getState();
                    const { XP_PER_COMPLETION } = require('../constants/Gamification');
                    addXp(XP_PER_COMPLETION);

                    const currentHabit = state.habits.find(h => h.id === id);
                    if (currentHabit) {
                        checkBadges(currentHabit.streak + 1);
                    }
                }

                if (userId) {
                    const { SyncService } = require('../services/sync');
                    SyncService.syncHabits(userId, newHabits);
                    SyncService.syncLogs(userId, newLogs);
                }

                return { logs: newLogs, habits: newHabits };
            }),

            skipHabit: (id, date) => set((state) => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                const newLogs = { ...state.logs };
                if (!newLogs[date]) newLogs[date] = {};

                const currentStatus = newLogs[date][id];
                const wasCompleted = currentStatus === true;

                newLogs[date][id] = 'skipped';

                const { toLocalDateString } = require('../utils/date');
                const today = toLocalDateString();
                let streakDelta = 0;

                if (date === today && wasCompleted) streakDelta = -1;

                const newHabits = state.habits.map(h => {
                    if (h.id === id) {
                        return { ...h, streak: Math.max(0, h.streak + streakDelta) };
                    }
                    return h;
                });

                if (userId) {
                    const { SyncService } = require('../services/sync');
                    SyncService.syncHabits(userId, newHabits);
                    SyncService.syncLogs(userId, newLogs);
                }

                return { logs: newLogs, habits: newHabits };
            }),

            getHabitProgress: (id, month) => {
                return 0;
            }
        }),
        {
            name: 'habit-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
