import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// Attempt to initialize MMKV
let mmkv: any;
try {
    if (Platform.OS !== 'web') {
        const { MMKV } = require('react-native-mmkv');
        mmkv = new MMKV({
            id: 'habit-tracker-storage',
        });
    }
} catch (e) {
    console.log('MMKV not available, falling back to AsyncStorage (likely running in Expo Go)');
    mmkv = null;
}

export const storage: StateStorage = {
    getItem: (name: string): string | null | Promise<string | null> => {
        if (mmkv) {
            const value = mmkv.getString(name);
            return value ?? null;
        }
        return AsyncStorage.getItem(name);
    },
    setItem: (name: string, value: string): void | Promise<void> => {
        if (mmkv) {
            mmkv.set(name, value);
            return;
        }
        return AsyncStorage.setItem(name, value);
    },
    removeItem: (name: string): void | Promise<void> => {
        if (mmkv) {
            mmkv.delete(name);
            return;
        }
        return AsyncStorage.removeItem(name);
    },
};
