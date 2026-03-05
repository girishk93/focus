import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useGroupsStore } from '../store/groups-store';
import { useFriendsStore } from '../store/friends-store';
import { useAuthStore } from '../store/auth-store';
import Button from '../components/ui/Button';

export default function CreateGroupScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { createGroup } = useGroupsStore();
    const { getAcceptedFriends } = useFriendsStore();

    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

    const friends = getAcceptedFriends();

    const toggleFriend = (id: string) => {
        if (selectedFriends.includes(id)) {
            setSelectedFriends(selectedFriends.filter((fid) => fid !== id));
        } else {
            setSelectedFriends([...selectedFriends, id]);
        }
    };

    const handleCreate = () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to create a group');
            return;
        }

        // Create group with current user as admin
        const members = [
            {
                userId: user.uid,
                name: user.name || 'You',
                photoURL: user.photoURL,
                role: 'admin' as const,
                joinedAt: new Date().toISOString(),
            },
            // Add selected friends as members
            ...friends
                .filter((friend) => selectedFriends.includes(friend.id))
                .map((friend) => ({
                    userId: friend.id,
                    name: friend.name,
                    photoURL: friend.photoURL,
                    role: 'member' as const,
                    joinedAt: new Date().toISOString(),
                })),
        ];

        const groupId = createGroup({
            name: groupName.trim(),
            description: description.trim() || undefined,
            createdBy: user.uid,
            members,
        });

        Alert.alert('Success', 'Group created successfully! You can now invite others.');
        router.replace(`/group-details?groupId=${groupId}`);
    };

    return (
        <ScreenWrapper>
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-6 pt-6 pb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900">Create Group</Text>
                </View>

                <View className="px-6">
                    {/* Group Name */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">Group Name *</Text>
                        <TextInput
                            value={groupName}
                            onChangeText={setGroupName}
                            placeholder="Enter group name"
                            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Description */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">Description (Optional)</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="What's this group about?"
                            multiline
                            numberOfLines={3}
                            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                            placeholderTextColor="#9CA3AF"
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>

                    {/* Select Friends */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-3">
                            Add Friends ({selectedFriends.length} selected)
                        </Text>

                        {friends.length === 0 ? (
                            <View className="bg-gray-50 p-6 rounded-xl items-center">
                                <Ionicons name="person-add-outline" size={32} color="#9CA3AF" />
                                <Text className="text-gray-500 mt-2 text-center">
                                    No friends yet. Add friends first!
                                </Text>
                            </View>
                        ) : (
                            friends.map((friend) => (
                                <TouchableOpacity
                                    key={friend.id}
                                    onPress={() => toggleFriend(friend.id)}
                                    className={`bg-white border rounded-xl p-4 mb-2 flex-row items-center ${selectedFriends.includes(friend.id)
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                                        <Text className="text-primary-600 font-bold">{friend.name[0]}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-gray-900">{friend.name}</Text>
                                    </View>
                                    {selectedFriends.includes(friend.id) && (
                                        <Ionicons name="checkmark-circle" size={24} color="#7C3AED" />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {/* Create Button */}
                    <Button
                        title="Create Group"
                        onPress={handleCreate}
                        variant="primary"
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
