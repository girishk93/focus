import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';

const mmkvStorage = {
    getItem: (key: string) => {
        const value = storage.getString(key);
        return value ?? null;
    },
    setItem: (key: string, value: string) => {
        storage.set(key, value);
    },
    removeItem: (key: string) => {
        storage.delete(key);
    },
};

export type Frequency = 'daily' | 'weekly';
export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Habit {
    id: string;
    title: string;
    category: string; // 'health', 'learning', etc.
    icon: string; // Ionicons name
    color: string;
    frequency: Frequency;
    targetDays: number; // For logging purposes
    reminderTime?: string | null;
    createdAt: string;
    archived: boolean;
    streak: number;
}

export interface HabitLog {
    [date: string]: { // "YYYY-MM-DD"
        [habitId: string]: boolean; // true = completed
    };
}

interface HabitState {
    habits: Habit[];
    logs: HabitLog;

    addHabit: (habit: Omit<Habit, 'createdAt' | 'archived' | 'streak'> & { id?: string }) => void;
    updateHabit: (id: string, updates: Partial<Habit>) => void;
    deleteHabit: (id: string) => void;
    toggleHabit: (id: string, date: string) => void;
    getHabitProgress: (id: string, month: string) => number; // Returns %
}

export const useHabitStore = create<HabitState>()(
    persist(
        (set, get) => ({
            habits: [],
            logs: {},

            addHabit: (habitData) => {
                set((state) => {
                    const newHabits = [
                        ...state.habits,
                        {
                            ...habitData,
                            id: habitData.id || Date.now().toString(), // Use provided ID or generate
                            createdAt: new Date().toISOString(),
                            archived: false,
                            streak: 0,
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

            deleteHabit: (id) => {
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

                const wasCompleted = newLogs[date][id];
                newLogs[date][id] = !wasCompleted;

                // Recalculate streak (Simplistic implementation for now)
                // In a real app, we'd need a robust streak calculation algorithm 
                // that looks back from 'today' and accounts for frequency.
                // For MVP: simple counter increment/decrement based on *today* 
                const today = new Date().toISOString().split('T')[0];
                let streakDelta = 0;
                if (date === today) {
                    streakDelta = !wasCompleted ? 1 : -1;
                }

                const newHabits = state.habits.map(h => {
                    if (h.id === id) {
                        return { ...h, streak: Math.max(0, h.streak + streakDelta) };
                    }
                    return h;
                });

                if (!wasCompleted) {
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

            getHabitProgress: (id, month) => {
                // TODO: Implement calculation
                return 0;
            }
        }),
        {
            name: 'habit-storage',
            storage: createJSONStorage(() => mmkvStorage),
        }
    )
);
