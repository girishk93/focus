// Using require to bypass TypeScript "only refers to a type" error
// wrapped in try-catch to support Expo Go (which doesn't support nitro modules/MMKV)
import { Platform } from 'react-native';

class MockStorage {
    private storage: Map<string, string>;

    constructor() {
        this.storage = new Map();
        console.warn('⚠️ FAST_REFRESH_WARNING: Running in environment without MMKV support (likely Expo Go). Persistence is disabled for this session. Use a Development Build for full persistence.');
    }

    set(key: string, value: string) {
        this.storage.set(key, value);
    }

    getString(key: string) {
        return this.storage.get(key);
    }

    delete(key: string) {
        this.storage.delete(key);
    }
}

let storage: any;

try {
    // Only attempt to require MMKV if we are not explicitly avoiding it
    // Note: In Expo Go, this require might throw or the constructor might throw
    const { MMKV } = require('react-native-mmkv');
    storage = new MMKV({
        id: 'habit-tracker-storage',
    });
} catch (e) {
    storage = new MockStorage();
}

export { storage };
