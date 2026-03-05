import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';

export type FriendStatus = 'pending_sent' | 'pending_received' | 'accepted';

export interface Friend {
    id: string; // The friend's User ID
    name: string;
    username?: string;
    photoURL?: string;
    status: FriendStatus;
    addedAt: string;
    level?: number;
}

// Mock database of users for search simulation
const MOCK_USERS = [
    { id: 'u1', name: 'Alice Wonderland', username: 'alice', photoURL: undefined, level: 5 },
    { id: 'u2', name: 'Bob Builder', username: 'bob_builds', photoURL: undefined, level: 3 },
    { id: 'u3', name: 'Charlie Chaplin', username: 'charlie', photoURL: undefined, level: 8 },
    { id: 'u4', name: 'David Bowie', username: 'starman', photoURL: undefined, level: 12 },
    { id: 'u5', name: 'Eve Polastri', username: 'eve_pi', photoURL: undefined, level: 2 },
];

interface FriendsState {
    friends: Friend[];
    searchResults: Friend[];
    isSearching: boolean;

    // Actions
    searchUsers: (query: string) => Promise<void>;
    sendFriendRequest: (user: { id: string; name: string; username?: string; photoURL?: string; level?: number }) => void;
    acceptFriendRequest: (friendId: string) => void;
    rejectFriendRequest: (friendId: string) => void;
    removeFriend: (friendId: string) => void;
    simulateIncomingRequest: () => void;
    clearSearchResults: () => void;

    // Getters
    getAcceptedFriends: () => Friend[];
    getPendingRequests: () => Friend[]; // Received requests
    getSentRequests: () => Friend[]; // Sent requests
}

export const useFriendsStore = create<FriendsState>()(
    persist(
        (set, get) => ({
            friends: [],
            searchResults: [],
            isSearching: false,

            searchUsers: async (query) => {
                if (!query || query.trim().length < 2) {
                    set({ searchResults: [] });
                    return;
                }

                set({ isSearching: true });

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 600));

                const lowerQuery = query.toLowerCase();
                const results = MOCK_USERS.filter(u =>
                    u.name.toLowerCase().includes(lowerQuery) ||
                    (u.username && u.username.toLowerCase().includes(lowerQuery))
                ).map(u => ({
                    ...u,
                    status: 'accepted' as const, // Placeholder, actual status determined by checking friends list
                    addedAt: new Date().toISOString()
                }));

                set({
                    searchResults: results as any, // Cast to avoid strict type mismatch during mock
                    isSearching: false
                });
            },

            clearSearchResults: () => set({ searchResults: [] }),

            sendFriendRequest: (user) => {
                const existing = get().friends.find(f => f.id === user.id);
                if (existing) return; // Already in list

                const newFriend: Friend = {
                    ...user,
                    status: 'pending_sent',
                    addedAt: new Date().toISOString(),
                };

                set((state) => ({
                    friends: [...state.friends, newFriend],
                }));
            },

            acceptFriendRequest: (friendId) => {
                set((state) => ({
                    friends: state.friends.map((friend) =>
                        friend.id === friendId ? { ...friend, status: 'accepted' } : friend
                    ),
                }));
            },

            rejectFriendRequest: (friendId) => {
                set((state) => ({
                    friends: state.friends.filter((friend) => friend.id !== friendId),
                }));
            },

            removeFriend: (friendId) => {
                set((state) => ({
                    friends: state.friends.filter((friend) => friend.id !== friendId),
                }));
            },

            simulateIncomingRequest: () => {
                const mockNames = [
                    { name: 'Sophia Martinez', username: 'sophia_m', level: 7 },
                    { name: 'Liam Johnson', username: 'liam_j', level: 4 },
                    { name: 'Emma Wilson', username: 'emma_w', level: 9 },
                    { name: 'Noah Brown', username: 'noah_b', level: 6 },
                    { name: 'Olivia Davis', username: 'olivia_d', level: 3 },
                ];
                const pick = mockNames[Math.floor(Math.random() * mockNames.length)];
                const existing = get().friends.find(f => f.username === pick.username);
                if (existing) return; // Already in list

                const newFriend: Friend = {
                    id: 'sim_' + Date.now(),
                    name: pick.name,
                    username: pick.username,
                    level: pick.level,
                    status: 'pending_received',
                    addedAt: new Date().toISOString(),
                };

                set((state) => ({
                    friends: [...state.friends, newFriend],
                }));
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
