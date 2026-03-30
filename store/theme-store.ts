import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../utils/storage';
import { AppTheme } from '../constants/Themes';

// Zustand storage requires a specific adapter for MMKV
const mmkvZustandStorage = {
    setItem: (name: string, value: string) => {
        return storage.setItem(name, value);
    },
    getItem: (name: string) => {
        return storage.getItem(name);
    },
    removeItem: (name: string) => {
        return storage.removeItem(name);
    },
};

interface ThemeState {
    activeTheme: AppTheme;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        () => ({
            activeTheme: 'oxygen',
        }),
        {
            name: 'focus-theme-storage',
            storage: createJSONStorage(() => mmkvZustandStorage),
        }
    )
);
