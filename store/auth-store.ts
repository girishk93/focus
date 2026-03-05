import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';

// mmkvStorage wrapper removed - using unified storage adapter

interface User {
    uid: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    photoURL?: string;
    dateOfBirth?: string; // ISO String
    gender?: string;
    isOnboarded: boolean;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setIsOnboarded: (isOnboarded: boolean) => void;
    signIn: (token: string) => Promise<void>; // Mock function for now
    signOut: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
    checkUsernameAvailability: (username: string) => Promise<boolean>;
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
            signIn: async (identifier) => {
                // TODO: Implement actual Firebase generic sign in logic here
                set({ isLoading: true });
                // Simulating API call
                setTimeout(() => {
                    const isDemo = identifier.toLowerCase().includes('demo');
                    const uniqueId = isDemo
                        ? 'demo-user-id'
                        : `user_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;

                    set({
                        user: {
                            uid: uniqueId,
                            name: isDemo ? 'Demo User' : 'New User',
                            email: identifier.includes('@') ? identifier : undefined,
                            phoneNumber: identifier.includes('@') ? undefined : identifier,
                            isOnboarded: isDemo // Demo user skips onboarding
                        },
                        isLoading: false
                    });
                }, 1000);
            },
            signOut: async () => {
                set({ user: null });
            },
            updateUser: async (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null
                }));
            },
            checkUsernameAvailability: async (username) => {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));

                const reserved = ['admin', 'root', 'test', 'null', 'undefined', 'system'];
                if (reserved.includes(username.toLowerCase())) return false;

                return true;
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
