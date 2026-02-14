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

interface User {
    uid: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    photoURL?: string;
    isOnboarded: boolean;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setIsOnboarded: (isOnboarded: boolean) => void;
    signIn: (token: string) => Promise<void>; // Mock function for now
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            setUser: (user) => set({ user }),
            setIsOnboarded: (isOnboarded) =>
                set((state) => ({
                    user: state.user ? { ...state.user, isOnboarded } : null
                })),
            signIn: async (token) => {
                // TODO: Implement actual Firebase generic sign in logic here
                set({ isLoading: true });
                // Simulating API call
                setTimeout(() => {
                    set({
                        user: {
                            uid: 'test-user-id',
                            name: 'Test User',
                            email: 'test@example.com',
                            isOnboarded: false
                        },
                        isLoading: false
                    });
                }, 1000);
            },
            signOut: async () => {
                set({ user: null });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => mmkvStorage),
        }
    )
);
