import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useFriendsStore } from '../store/friends-store';
import { Colors } from '../constants/Colors';

export default function FriendProfileScreen() {
    const router = useRouter();
    const { friendId } = useLocalSearchParams<{ friendId: string }>();
    const { friends, removeFriend } = useFriendsStore();

    const friend = friends.find(f => f.id === friendId);

    if (!friend) {
        return (
            <ScreenWrapper>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-gray-400 text-lg">Friend not found</Text>
                    <TouchableOpacity onPress={() => router.back()} className="mt-4">
                        <Text className="text-primary-600 font-semibold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const handleRemoveFriend = () => {
        Alert.alert(
            'Remove Friend',
            `Are you sure you want to remove ${friend.name} from your friends?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        removeFriend(friend.id);
                        router.back();
                    },
                },
            ]
        );
    };

    const handleChat = () => {
        // Navigate to direct chat (reusing ChatTab logic with a "dm" group)
        Alert.alert('Coming Soon', 'Direct messaging is coming in a future update!');
    };

    return (
        <ScreenWrapper>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center px-6 pt-4 pb-2">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 flex-1">Profile</Text>
                <TouchableOpacity onPress={handleRemoveFriend}>
                    <Ionicons name="ellipsis-vertical" size={22} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Profile Card */}
            <View className="items-center px-6 py-8">
                {friend.photoURL ? (
                    <Image
                        source={{ uri: friend.photoURL }}
                        className="w-28 h-28 rounded-full border-4 border-white shadow-lg mb-4"
                    />
                ) : (
                    <View className="w-28 h-28 bg-primary-100 rounded-full items-center justify-center border-4 border-white shadow-lg mb-4">
                        <Text className="text-primary-600 text-5xl font-bold">
                            {friend.name[0]}
                        </Text>
                    </View>
                )}
                <Text className="text-2xl font-bold text-gray-900 mb-1">{friend.name}</Text>
                {friend.username && (
                    <Text className="text-gray-500 text-base mb-2">@{friend.username}</Text>
                )}
                {friend.level && (
                    <View className="bg-primary-100 px-4 py-1.5 rounded-full">
                        <Text className="text-primary-600 font-semibold text-sm">Level {friend.level}</Text>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row px-6 mb-8">
                <TouchableOpacity
                    onPress={handleChat}
                    className="flex-1 bg-primary-600 py-4 rounded-xl flex-row items-center justify-center mr-2 shadow-sm"
                >
                    <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleRemoveFriend}
                    className="bg-red-50 py-4 px-5 rounded-xl items-center justify-center shadow-sm"
                >
                    <Ionicons name="person-remove" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* Stats (Mock for now) */}
            <View className="px-6">
                <Text className="text-lg font-bold text-gray-900 mb-4">Stats</Text>
                <View className="flex-row">
                    <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100 mr-2 items-center">
                        <Ionicons name="flame" size={24} color="#F59E0B" />
                        <Text className="text-2xl font-bold text-gray-900 mt-2">—</Text>
                        <Text className="text-gray-400 text-xs mt-1">Current Streak</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100 ml-2 items-center">
                        <Ionicons name="trophy" size={24} color="#8B5CF6" />
                        <Text className="text-2xl font-bold text-gray-900 mt-2">—</Text>
                        <Text className="text-gray-400 text-xs mt-1">Completions</Text>
                    </View>
                </View>
                <Text className="text-gray-300 text-xs text-center mt-3">
                    Stats sharing coming soon
                </Text>
            </View>

            {/* Friend Since */}
            <View className="px-6 mt-8">
                <View className="bg-gray-50 p-4 rounded-xl flex-row items-center">
                    <Ionicons name="heart" size={20} color="#F87171" />
                    <Text className="text-gray-500 ml-3 text-sm">
                        Friends since {new Date(friend.addedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                </View>
            </View>
        </ScreenWrapper>
    );
}
