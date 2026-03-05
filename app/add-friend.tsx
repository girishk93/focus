import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useFriendsStore, Friend } from '../store/friends-store';
import { Colors } from '../constants/Colors';

export default function AddFriendScreen() {
    const router = useRouter();
    const { searchUsers, searchResults, isSearching, sendFriendRequest, friends, clearSearchResults } = useFriendsStore();
    const [query, setQuery] = useState('');

    // Clear results on unmount
    useEffect(() => {
        return () => clearSearchResults();
    }, []);

    const handleSearch = (text: string) => {
        setQuery(text);
        // Debounce could be added here, but for now we rely on user stopping typing or manual submit/effect
        if (text.length >= 2) {
            searchUsers(text);
        } else {
            clearSearchResults();
        }
    };

    const handleAdd = (user: Friend) => {
        sendFriendRequest(user);
        Alert.alert('Request Sent', `Friend request sent to ${user.name}!`);
    };

    const getActionState = (userId: string) => {
        const existing = friends.find((f: Friend) => f.id === userId);
        if (existing) {
            if (existing.status === 'accepted') return 'friend';
            if (existing.status === 'pending_sent') return 'sent';
            if (existing.status === 'pending_received') return 'received';
        }
        return 'none';
    };

    return (
        <ScreenWrapper bg="bg-white">
            <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">Add Friend</Text>
                <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                    <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            <View className="px-6 py-4">
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-gray-900"
                        placeholder="Search by name or username"
                        value={query}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); clearSearchResults(); }}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView className="flex-1 px-6">
                {isSearching ? (
                    <View className="py-12 items-center">
                        <ActivityIndicator color={Colors.primary} />
                    </View>
                ) : searchResults.length > 0 ? (
                    <View>
                        <Text className="text-sm font-medium text-gray-500 mb-2">Results</Text>
                        {searchResults.map((user: Friend) => {
                            const actionState = getActionState(user.id);

                            return (
                                <View key={user.id} className="flex-row items-center bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
                                    <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
                                        <Text className="text-primary-600 font-bold text-lg">
                                            {user.name[0]}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-gray-900 text-lg">{user.name}</Text>
                                        <Text className="text-gray-500 text-sm">@{user.username || 'user'}</Text>
                                        {user.level && (
                                            <Text className="text-xs text-primary-600 mt-1">Level {user.level}</Text>
                                        )}
                                    </View>

                                    {actionState === 'none' && (
                                        <TouchableOpacity
                                            onPress={() => handleAdd(user)}
                                            className="bg-primary-600 px-4 py-2 rounded-full"
                                        >
                                            <Text className="text-white font-semibold text-sm">Add</Text>
                                        </TouchableOpacity>
                                    )}

                                    {actionState === 'friend' && (
                                        <View className="bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center">
                                            <Ionicons name="checkmark" size={14} color="#374151" />
                                            <Text className="text-gray-700 text-xs ml-1 font-medium">Friend</Text>
                                        </View>
                                    )}

                                    {actionState === 'sent' && (
                                        <View className="bg-yellow-100 px-3 py-1.5 rounded-full flex-row items-center">
                                            <Ionicons name="time-outline" size={14} color="#B45309" />
                                            <Text className="text-yellow-800 text-xs ml-1 font-medium">Sent</Text>
                                        </View>
                                    )}

                                    {actionState === 'received' && (
                                        <View className="bg-blue-100 px-3 py-1.5 rounded-full flex-row items-center">
                                            <Ionicons name="mail-unread-outline" size={14} color="#1D4ED8" />
                                            <Text className="text-blue-800 text-xs ml-1 font-medium">Pending</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ) : query.length >= 2 ? (
                    <View className="py-12 items-center">
                        <Text className="text-gray-400 text-center">No users found matching "{query}"</Text>
                    </View>
                ) : (
                    <View className="py-12 items-center opacity-50">
                        <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4 text-center">Search for friends by name or username</Text>
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
