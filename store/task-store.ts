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
                const habitId = habitData.id || Date.now().toString();
                let calendarEventId: string | undefined;

                // Calendar Sync Logic
                try {
                    const syncedCalendarId = await require('@react-native-async-storage/async-storage').default.getItem('synced_calendar_id');
                    if (syncedCalendarId) {
                        const { CalendarService } = require('../services/calendar-service');

                        // Parse recurring days
                        // If frequency is weekly but no specific days, maybe default to specific day? 
                        // For MVP assume current day or standard pattern. 
                        // Actually habitData usually has frequency.
                        // We need to parse proper days from habitData if we had them stored that way. 
                        // task-store says frequency: 'daily' | 'weekly'. 
                        // It doesn't seem to store *which* days for weekly? 
                        // Wait, Day type is defined but where is it used? 
                        // Ah, I see `Day` type but it's not in Task interface? 
                        // Let's assume daily for now or checking if we need to add days to Task.
                        // Re-reading Task interface: no 'days' field. 
                        // I might have missed it in previous view or it's missing. 
                        // I will assume daily or just pass undefined for days for now.

                        // Construct startDate date object
                        const startDate = new Date(habitData.startDate || Date.now());

                        // Parse timeOfDay to set specific time if needed, otherwise default to 9am?
                        // If reminderTime exists, use that.
                        if (habitData.reminderTime) {
                            const reminderDate = new Date(habitData.reminderTime);
                            startDate.setHours(reminderDate.getHours(), reminderDate.getMinutes());
                        } else {
                            // Default times
                            if (habitData.timeOfDay === 'morning') startDate.setHours(9, 0);
                            else if (habitData.timeOfDay === 'afternoon') startDate.setHours(14, 0);
                            else if (habitData.timeOfDay === 'evening') startDate.setHours(19, 0);
                            else startDate.setHours(9, 0); // Anytime default
                        }

                        calendarEventId = await CalendarService.createEvent(
                            syncedCalendarId,
                            habitData.title,
                            startDate,
                            habitData.durationMinutes,
                            habitData.frequency,
                            undefined, // Days support pending in Task interface
                            habitData.notes
                        );
                    }
                } catch (e) {
                    console.error('Calendar Sync Error (Add):', e);
                }

                set((state) => {
                    const newHabits = [
                        ...state.habits,
                        {
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
                        },
                    ];
                    // Sync
                    const userId = require('./auth-store').useAuthStore.getState().user?.id;
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);

                    return { habits: newHabits };
                });
            },

            updateHabit: (id, updates) => {
                set((state) => {
                    const newHabits = state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h));

                    // Sync
                    const userId = require('./auth-store').useAuthStore.getState().user?.id;
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);

                    return { habits: newHabits };
                });
            },

            updateHabitTime: (id, newTime) => {
                set((state) => {
                    const newHabits = state.habits.map((h) =>
                        h.id === id
                            ? {
                                ...h,
                                reminderTime: newTime.toISOString(),
                                timeOfDay: 'anytime' as 'morning' | 'afternoon' | 'evening' | 'anytime', // Set to anytime since it has specific time
                            }
                            : h
                    );

                    // Sync
                    const userId = require('./auth-store').useAuthStore.getState().user?.id;
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);

                    return { habits: newHabits };
                });
            },

            updateHabitCalendarSync: (id, calendarId, calendarName) => {
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

                    // Sync
                    const userId = require('./auth-store').useAuthStore.getState().user?.id;
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);

                    return { habits: newHabits };
                });
            },

            deleteHabit: async (id) => {
                // Calendar Sync Logic (Delete)
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

                    // Sync
                    const userId = require('./auth-store').useAuthStore.getState().user?.id;
                    if (userId) require('../services/sync').SyncService.syncHabits(userId, newHabits);

                    return { habits: newHabits };
                });
            },

            toggleHabit: (id, date) => set((state) => {
                const newLogs = { ...state.logs };
                if (!newLogs[date]) newLogs[date] = {};

                const currentStatus = newLogs[date][id];
                const wasCompleted = currentStatus === true;

                // Toggle logic: If completed -> incomplete. If anything else (incomplete/skipped) -> completed.
                const newStatus = !wasCompleted;
                newLogs[date][id] = newStatus;

                // Recalculate streak
                // For MVP: simple counter increment/decrement based on *today* 
                const { toLocalDateString } = require('../utils/date');
                const today = toLocalDateString();
                let streakDelta = 0;

                if (date === today) {
                    if (wasCompleted) {
                        // Going from Completed -> Incomplete: -1
                        streakDelta = -1;
                    } else {
                        // Going from Incomplete/Skipped -> Completed: +1
                        // Note: If it was skipped, streak wasn't incremented, so adding +1 is correct to reflect completion.
                        streakDelta = 1;
                    }
                }

                const newHabits = state.habits.map(h => {
                    if (h.id === id) {
                        return { ...h, streak: Math.max(0, h.streak + streakDelta) };
                    }
                    return h;
                });

                if (newStatus === true) {
                    // Award XP
                    const { addXp, checkBadges } = require('./gamification-store').useGamificationStore.getState();
                    const { XP_PER_COMPLETION } = require('../constants/Gamification');
                    addXp(XP_PER_COMPLETION);

                    // Check for badges with new streak
                    const currentHabit = state.habits.find(h => h.id === id);
                    if (currentHabit) {
                        checkBadges(currentHabit.streak + 1); // +1 because we effectively just incremented it locally
                    }
                }

                // Sync
                const userId = require('./auth-store').useAuthStore.getState().user?.id;
                if (userId) {
                    const { SyncService } = require('../services/sync');
                    SyncService.syncHabits(userId, newHabits);
                    SyncService.syncLogs(userId, newLogs);
                }

                return { logs: newLogs, habits: newHabits };
            }),

            skipHabit: (id, date) => set((state) => {
                const newLogs = { ...state.logs };
                if (!newLogs[date]) newLogs[date] = {};

                const currentStatus = newLogs[date][id];
                const wasCompleted = currentStatus === true;

                // Set to skipped
                newLogs[date][id] = 'skipped';

                // Recalculate streak
                // If it was previously completed, we need to remove the streak increment.
                // If it was incomplete, streak stays same.
                const { toLocalDateString } = require('../utils/date');
                const today = toLocalDateString();
                let streakDelta = 0;

                if (date === today && wasCompleted) {
                    streakDelta = -1;
                }

                const newHabits = state.habits.map(h => {
                    if (h.id === id) {
                        return { ...h, streak: Math.max(0, h.streak + streakDelta) };
                    }
                    return h;
                });

                // Sync
                const userId = require('./auth-store').useAuthStore.getState().user?.id;
                if (userId) {
                    const { SyncService } = require('../services/sync');
                    SyncService.syncHabits(userId, newHabits);
                    SyncService.syncLogs(userId, newLogs);
                }

                return { logs: newLogs, habits: newHabits };
            }),

            getHabitProgress: (id, month) => {
                // TODO: Implement calculation
                return 0;
            }
        }),
        {
            name: 'habit-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
