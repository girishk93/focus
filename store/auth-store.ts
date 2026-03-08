import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabase';

export interface User {
    id: string; // Changed from uid to id to match Supabase
    username?: string;
    display_name?: string;
    email?: string;
    avatar_url?: string;
    isOnboarded: boolean;
    timezone?: string;
    total_points?: number;
    level?: number;
    streak_current?: number;
}

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
    setIsOnboarded: (isOnboarded: boolean) => void;
    signOut: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
    checkUsernameAvailability: (username: string) => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            isLoading: false,
            setUser: (user) => set({ user }),
            setSession: (session) => set({ session }),
            setIsOnboarded: (isOnboarded) =>
                set((state) => ({
                    user: state.user ? { ...state.user, isOnboarded } : null
                })),

            signOut: async () => {
                set({ isLoading: true });
                try {
                    await supabase.auth.signOut();
                    set({ user: null, session: null });
                } catch (error) {
                    console.error('Error signing out:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            updateUser: async (updates) => {
                const currentUser = get().user;
                if (!currentUser) return;

                set({ isLoading: true });
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update(updates)
                        .eq('id', currentUser.id);

                    if (error) throw error;

                    set((state) => ({
                        user: state.user ? { ...state.user, ...updates } : null
                    }));
                } catch (error) {
                    console.error('Error updating user:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            refreshUser: async () => {
                const currentSession = get().session;
                if (!currentSession?.user) return;

                try {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentSession.user.id)
                        .single();

                    if (error) throw error;

                    if (profile) {
                        set({
                            user: {
                                ...profile,
                                id: profile.id,
                                isOnboarded: !!profile.username // Consider onboarded if they have a username
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error refreshing user:', error);
                }
            },

            checkUsernameAvailability: async (username) => {
                if (!username) return false;

                const reserved = ['admin', 'root', 'test', 'null', 'undefined', 'system'];
                if (reserved.includes(username.toLowerCase())) return false;

                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('username', username.toLowerCase())
                        .maybeSingle();

                    if (error) throw error;
                    return !data;
                } catch (error) {
                    console.error('Error checking username:', error);
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage-v2', // Changed name to avoid conflict with old storage
            storage: createJSONStorage(() => storage),
        }
    )
);
