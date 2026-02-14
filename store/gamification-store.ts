import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BADGES, LEVELS, XP_PER_COMPLETION } from '../constants/Gamification';
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

                // Check for level up
                let newLevel = state.level;
                const nextLevelData = LEVELS.find(l => l.level === state.level + 1);
                if (nextLevelData && newXp >= nextLevelData.xp) {
                    newLevel = nextLevelData.level;
                    // TODO: Trigger level up notification
                }

                return {
                    xp: newXp,
                    level: newLevel,
                    stats: {
                        ...state.stats,
                        totalCompleted: state.stats.totalCompleted + (amount > 0 ? 1 : 0), // Assumes addXp called on completion
                    }
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
                        // TODO: Trigger badge unlock notification
                    }
                });

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
            storage: createJSONStorage(() => mmkvStorage),
        }
    )
);
