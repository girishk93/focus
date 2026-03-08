import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BADGES, LEVELS } from '../constants/Gamification';
import { storage } from '../utils/storage';

// mmkvStorage wrapper removed - using unified storage adapter

interface GamificationState {
    xp: number;
    level: number;
    badges: string[]; // IDs of unlocked badges
    stats: {
        totalCompleted: number;
        maxStreak: number;
        earlyCompletions: number;
    };

    addXp: (amount: number) => void;
    checkBadges: (currentStreak: number) => void;
    reset: () => void;
}

export const useGamificationStore = create<GamificationState>()(
    persist(
        (set, get) => ({
            xp: 0,
            level: 1,
            badges: [],
            stats: {
                totalCompleted: 0,
                maxStreak: 0,
                earlyCompletions: 0,
            },

            addXp: (amount) => set((state) => {
                const newXp = state.xp + amount;
                let newLevel = state.level;
                const nextLevelData = LEVELS.find(l => l.level === state.level + 1);
                if (nextLevelData && newXp >= nextLevelData.xp) {
                    newLevel = nextLevelData.level;
                }

                const newStats = {
                    ...state.stats,
                    totalCompleted: state.stats.totalCompleted + (amount > 0 ? 1 : 0),
                };

                // Sync with Supabase
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                if (userId) {
                    require('../services/sync').SyncService.saveUserProfile(userId, {
                        xp: newXp,
                        level: newLevel,
                        total_habits_completed: newStats.totalCompleted
                    });
                }

                return {
                    xp: newXp,
                    level: newLevel,
                    stats: newStats
                };
            }),

            checkBadges: (currentStreak) => set((state) => {
                const newStats = {
                    ...state.stats,
                    maxStreak: Math.max(state.stats.maxStreak, currentStreak)
                };

                const unlockedBadges = [...state.badges];
                let hasNewBadge = false;

                BADGES.forEach(badge => {
                    if (!unlockedBadges.includes(badge.id) && badge.condition(newStats)) {
                        unlockedBadges.push(badge.id);
                        hasNewBadge = true;
                    }
                });

                // Sync streak with Supabase
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                if (userId) {
                    require('../services/sync').SyncService.saveUserProfile(userId, {
                        max_streak: newStats.maxStreak
                    });
                }

                if (hasNewBadge) {
                    return { badges: unlockedBadges, stats: newStats };
                }

                return { stats: newStats };
            }),

            reset: () => set({
                xp: 0,
                level: 1,
                badges: [],
                stats: { totalCompleted: 0, maxStreak: 0, earlyCompletions: 0 }
            })
        }),
        {
            name: 'gamification-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
