import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabase';

export type FriendStatus = 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';

export interface Friend {
    id: string;
    name: string;
    username: string;
    photoURL?: string;
    status: FriendStatus;
    addedAt: string;
    level?: number;
}

interface FriendsState {
    friends: Friend[];
    searchResults: Friend[];
    isSearching: boolean;

    // Actions
    searchUsers: (query: string) => Promise<void>;
    sendFriendRequest: (targetUserId: string) => Promise<void>;
    acceptFriendRequest: (friendshipId: string) => Promise<void>;
    rejectFriendRequest: (friendshipId: string) => Promise<void>;
    removeFriend: (friendshipId: string) => Promise<void>;
    fetchFriends: () => Promise<void>;
    clearSearchResults: () => void;

    // Getters
    getAcceptedFriends: () => Friend[];
    getPendingRequests: () => Friend[];
    getSentRequests: () => Friend[];
}

export const useFriendsStore = create<FriendsState>()(
    persist(
        (set, get) => ({
            friends: [],
            searchResults: [],
            isSearching: false,

            fetchFriends: async () => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                if (!userId) return;

                const { data, error } = await supabase
                    .from('friendships')
                    .select(`
                        id,
                        status,
                        created_at,
                        requester:profiles!friendships_requester_id_fkey(id, display_name, username, avatar_url, level),
                        addressee:profiles!friendships_addressee_id_fkey(id, display_name, username, avatar_url, level)
                    `)
                    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

                if (error) {
                    console.error('Error fetching friends:', error);
                    return;
                }

                const mappedFriends: Friend[] = data.map((f: any) => {
                    const isRequester = f.requester.id === userId;
                    const contact = isRequester ? f.addressee : f.requester;

                    let status: FriendStatus = 'accepted';
                    if (f.status === 'pending') {
                        status = isRequester ? 'pending_sent' : 'pending_received';
                    } else if (f.status === 'blocked') {
                        status = 'blocked';
                    }

                    return {
                        id: f.id, // Friendship ID for status updates
                        name: contact.display_name,
                        username: contact.username,
                        photoURL: contact.avatar_url,
                        level: contact.level,
                        status: status,
                        addedAt: f.created_at,
                        contactId: contact.id // Store actual user ID too
                    } as Friend;
                });

                set({ friends: mappedFriends });
            },

            searchUsers: async (query) => {
                if (!query || query.trim().length < 2) {
                    set({ searchResults: [] });
                    return;
                }

                set({ isSearching: true });
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, display_name, username, avatar_url, level')
                    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                    .limit(10);

                if (error) {
                    console.error('Error searching users:', error);
                    set({ isSearching: false });
                    return;
                }

                set({
                    searchResults: data.map(u => ({
                        id: u.id,
                        name: u.display_name,
                        username: u.username,
                        photoURL: u.avatar_url,
                        level: u.level,
                        status: 'accepted' as any, // Placeholder
                        addedAt: new Date().toISOString()
                    })),
                    isSearching: false
                });
            },

            clearSearchResults: () => set({ searchResults: [] }),

            sendFriendRequest: async (targetUserId) => {
                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                if (!userId) return;

                const { error } = await supabase
                    .from('friendships')
                    .insert({ requester_id: userId, addressee_id: targetUserId, status: 'pending' });

                if (error) {
                    console.error('Error sending request:', error);
                } else {
                    get().fetchFriends();
                }
            },

            acceptFriendRequest: async (friendshipId) => {
                const { error } = await supabase
                    .from('friendships')
                    .update({ status: 'accepted' })
                    .eq('id', friendshipId);

                if (error) {
                    console.error('Error accepting request:', error);
                } else {
                    get().fetchFriends();
                }
            },

            rejectFriendRequest: async (friendshipId) => {
                const { error } = await supabase
                    .from('friendships')
                    .delete()
                    .eq('id', friendshipId);

                if (error) {
                    console.error('Error rejecting request:', error);
                } else {
                    get().fetchFriends();
                }
            },

            removeFriend: async (friendshipId) => {
                const { error } = await supabase
                    .from('friendships')
                    .delete()
                    .eq('id', friendshipId);

                if (error) {
                    console.error('Error removing friend:', error);
                } else {
                    get().fetchFriends();
                }
            },

            getAcceptedFriends: () => {
                return get().friends.filter((friend) => friend.status === 'accepted');
            },

            getPendingRequests: () => {
                return get().friends.filter((friend) => friend.status === 'pending_received');
            },

            getSentRequests: () => {
                return get().friends.filter((friend) => friend.status === 'pending_sent');
            },
        }),
        {
            name: 'friends-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
