import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';

const BUILT_IN_DURATIONS = [7, 21]; // Built-in values that should not be stored as "recent"
const MAX_RECENT = 5;

interface DurationState {
    recentDurations: number[];
    addRecentDuration: (days: number) => void;
}

export const useDurationStore = create<DurationState>()(
    persist(
        (set) => ({
            recentDurations: [],

            addRecentDuration: (days: number) => {
                // Skip built-in values — they are always shown
                if (BUILT_IN_DURATIONS.includes(days)) return;

                set((state) => {
                    // Remove duplicate if it exists, then prepend
                    const filtered = state.recentDurations.filter((d) => d !== days);
                    const updated = [days, ...filtered].slice(0, MAX_RECENT);
                    return { recentDurations: updated };
                });
            },
        }),
        {
            name: 'duration-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
