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
    setIsLoading: (isLoading: boolean) => void;
    hasHydrated: boolean;
    setHasHydrated: (hydrated: boolean) => void;
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

                // 3s safety timeout - don't let profile refresh hang the app boot
                const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 3000));

                try {
                    const fetchPromise = supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentSession.user.id)
                        .maybeSingle();

                    const result = await Promise.race([fetchPromise, timeoutPromise]);
                    
                    if (result === 'timeout') {
                        console.warn('refreshUser: Profile fetch timed out (3s)');
                        return;
                    }

                    const { data: profile, error } = result as any;

                    if (error) throw error;
                    if (profile) {
                        set({
                            user: {
                                ...profile,
                                id: profile.id,
                                isOnboarded: !!profile.username
                            }
                        });
                    } else {
                        // Profile missing, create dummy profile
                        const email = currentSession.user.email || '';
                        const fallbackName = email.split('@')[0] || 'User';
                        const newProfile = { id: currentSession.user.id, email, username: fallbackName, display_name: fallbackName };
                        
                        const { data: createdProfile, error: insertError } = await supabase
                            .from('profiles').insert(newProfile).select().single();
                        if (insertError) throw insertError;
                        await supabase.from('user_settings').insert({ user_id: currentSession.user.id });

                        if (createdProfile) {
                            set({
                                user: { ...createdProfile, id: createdProfile.id, isOnboarded: !!createdProfile.username }
                            });
                        }
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
            setIsLoading: (isLoading) => set({ isLoading }),
            hasHydrated: false,
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        }),
        {
            name: 'auth-storage-v2',
            storage: createJSONStorage(() => storage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);
