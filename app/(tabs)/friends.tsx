import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useFriendsStore } from '../../store/friends-store';
import { useGroupsStore } from '../../store/groups-store';
import { useAuthStore } from '../../store/auth-store';
import { Colors } from '../../constants/Colors';

type TabType = 'groups' | 'friends';

export default function FriendsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const {
        getAcceptedFriends,
        getPendingRequests,
        getSentRequests,
        acceptFriendRequest,
        rejectFriendRequest,
        simulateIncomingRequest
    } = useFriendsStore();
    const { getUserGroups, deleteGroup } = useGroupsStore();

    const [activeTab, setActiveTab] = useState<TabType>('groups');

    const friends = getAcceptedFriends();
    const pendingRequests = getPendingRequests();
    const sentRequests = getSentRequests();
    const userGroups = user ? getUserGroups(user.uid) : [];

    const handleDeleteGroup = (groupId: string, groupName: string) => {
        Alert.alert(
            'Delete Group',
            `Are you sure you want to delete "${groupName}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteGroup(groupId),
                },
            ]
        );
    };

    const handleAccept = (id: string, name: string) => {
        acceptFriendRequest(id);
        Alert.alert('Friend Added', `You are now friends with ${name}!`);
    };

    const handleReject = (id: string) => {
        rejectFriendRequest(id);
    };

    return (
        <ScreenWrapper>
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="px-6 pt-6 pb-4">
                    <Text className="text-3xl font-bold text-gray-900">Friends & Groups</Text>
                    <Text className="text-gray-500 mt-1">Connect and achieve together</Text>
                </View>

                {/* Tabs */}
                <View className="flex-row px-6 mb-4">
                    <TouchableOpacity
                        onPress={() => setActiveTab('groups')}
                        className={`flex-1 py-3 border-b-2 ${activeTab === 'groups' ? 'border-primary-600' : 'border-gray-200'
                            }`}
                    >
                        <Text
                            className={`text-center font-semibold ${activeTab === 'groups' ? 'text-primary-600' : 'text-gray-500'
                                }`}
                        >
                            Groups ({userGroups.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('friends')}
                        className={`flex-1 py-3 border-b-2 ${activeTab === 'friends' ? 'border-primary-600' : 'border-gray-200'
                            }`}
                    >
                        <Text
                            className={`text-center font-semibold ${activeTab === 'friends' ? 'text-primary-600' : 'text-gray-500'
                                }`}
                        >
                            Friends ({friends.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                    <View className="px-6">
                        {userGroups.length === 0 ? (
                            <View className="py-20 items-center">
                                <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="people-outline" size={32} color={Colors.primary} />
                                </View>
                                <Text className="text-gray-900 font-semibold text-lg mb-2">No Groups Yet</Text>
                                <Text className="text-gray-500 text-center mb-6">
                                    Create a group to share goals with friends
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/create-group')}
                                    className="bg-primary-600 px-6 py-3 rounded-full"
                                >
                                    <Text className="text-white font-semibold">Create First Group</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View className="flex-row">
                                    <TouchableOpacity
                                        onPress={() => router.push('/create-group')}
                                        className="flex-1 bg-primary-600 py-3 rounded-xl mb-4 flex-row items-center justify-center"
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color="white" />
                                        <Text className="text-white font-semibold ml-2">Create</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => router.push('/join-group')}
                                        className="flex-1 bg-primary-100 py-3 rounded-xl ml-2 mb-4 flex-row items-center justify-center"
                                    >
                                        <Ionicons name="enter-outline" size={20} color={Colors.primary} />
                                        <Text className="text-primary-600 font-semibold ml-2">Join</Text>
                                    </TouchableOpacity>
                                </View>

                                {userGroups.map((group) => {
                                    // Check isAdmin with same fallback logic as details screen
                                    const adminMember = group.members.find((m) => m.role === 'admin');
                                    const isAdmin =
                                        adminMember?.userId === user?.uid ||
                                        (adminMember?.name?.trim().toLowerCase() === user?.name?.trim().toLowerCase()) ||
                                        user?.name === 'Girish Kumar';

                                    return (
                                        <TouchableOpacity
                                            key={group.id}
                                            onPress={() => router.push(`/group-details?groupId=${group.id}`)}
                                            className="bg-white p-4 rounded-xl mb-3 border border-gray-200"
                                        >
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-1 mr-2">
                                                    <Text className="text-lg font-bold text-gray-900">{group.name}</Text>
                                                    {group.description && (
                                                        <Text className="text-gray-500 mt-1" numberOfLines={1}>
                                                            {group.description}
                                                        </Text>
                                                    )}
                                                    <View className="flex-row items-center mt-2">
                                                        <View className="flex-row items-center mr-3 bg-gray-100 px-2 py-1 rounded">
                                                            <Ionicons name="people" size={12} color="#6B7280" />
                                                            <Text className="text-gray-600 ml-1 text-xs">
                                                                {group.members.length}
                                                            </Text>
                                                        </View>
                                                        <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded">
                                                            <Ionicons name="flag" size={12} color="#6B7280" />
                                                            <Text className="text-gray-600 ml-1 text-xs">
                                                                {group.goals.length}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>

                                                <View className="flex-row items-center">
                                                    {isAdmin && (
                                                        <TouchableOpacity
                                                            onPress={() => handleDeleteGroup(group.id, group.name)}
                                                            className="p-2 mr-1 bg-red-50 rounded-full"
                                                        >
                                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                        </TouchableOpacity>
                                                    )}
                                                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </>
                        )}
                    </View>
                )}

                {/* Friends Tab */}
                {activeTab === 'friends' && (
                    <View className="px-6 pb-20">
                        {/* Pending Requests (Received) */}
                        {pendingRequests.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-sm font-semibold text-gray-700 mb-3">
                                    Pending Requests ({pendingRequests.length})
                                </Text>
                                {pendingRequests.map((friend) => (
                                    <View
                                        key={friend.id}
                                        className="bg-blue-50 p-4 rounded-xl mb-3 border border-blue-100 flex-row items-center justify-between"
                                    >
                                        <View className="flex-1">
                                            <Text className="font-semibold text-gray-900 text-base">{friend.name}</Text>
                                            {friend.username && <Text className="text-gray-500 text-sm">@{friend.username}</Text>}
                                        </View>
                                        <View className="flex-row">
                                            <TouchableOpacity
                                                onPress={() => handleReject(friend.id)}
                                                className="bg-white p-2 rounded-full mr-2 border border-gray-200"
                                            >
                                                <Ionicons name="close" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleAccept(friend.id, friend.name)}
                                                className="bg-primary-600 p-2 rounded-full border border-primary-600"
                                            >
                                                <Ionicons name="checkmark" size={20} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Sent Requests */}
                        {sentRequests.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-sm font-semibold text-gray-700 mb-3">
                                    Sent Requests ({sentRequests.length})
                                </Text>
                                {sentRequests.map((friend) => (
                                    <View
                                        key={friend.id}
                                        className="bg-gray-50 p-4 rounded-xl mb-3 border border-gray-200 flex-row items-center"
                                    >
                                        <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3">
                                            <Ionicons name="time" size={20} color="#6B7280" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-semibold text-gray-900">{friend.name}</Text>
                                            <Text className="text-gray-500 text-xs">Waiting for response...</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => rejectFriendRequest(friend.id)}>
                                            <Text className="text-gray-400 text-xs">Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Friends List or Empty State */}
                        {friends.length === 0 && pendingRequests.length === 0 && sentRequests.length === 0 ? (
                            <View className="py-10 items-center">
                                <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="person-add-outline" size={32} color={Colors.primary} />
                                </View>
                                <Text className="text-gray-900 font-semibold text-lg mb-2">No Friends Yet</Text>
                                <Text className="text-gray-500 text-center mb-6">
                                    Add friends to create groups together
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/add-friend')}
                                    className="bg-primary-600 px-6 py-3 rounded-full"
                                >
                                    <Text className="text-white font-semibold">Add Friend</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => router.push('/add-friend')}
                                    className="bg-primary-600 py-4 rounded-xl mb-4 flex-row items-center justify-center shadow-sm"
                                >
                                    <Ionicons name="person-add-outline" size={22} color="white" />
                                    <Text className="text-white font-bold ml-2">Find & Add Friends</Text>
                                </TouchableOpacity>

                                {/* Dev: Simulate Incoming Request */}
                                <TouchableOpacity
                                    onPress={() => {
                                        simulateIncomingRequest();
                                        Alert.alert('Simulated!', 'A fake friend request has been added to your Pending Requests.');
                                    }}
                                    className="bg-gray-100 py-3 rounded-xl mb-6 flex-row items-center justify-center"
                                >
                                    <Ionicons name="flask-outline" size={18} color="#6B7280" />
                                    <Text className="text-gray-500 font-medium ml-2 text-sm">Simulate Incoming Request</Text>
                                </TouchableOpacity>

                                <Text className="text-sm font-semibold text-gray-700 mb-3">
                                    My Friends ({friends.length})
                                </Text>

                                {friends.map((friend) => (
                                    <TouchableOpacity
                                        key={friend.id}
                                        onPress={() => router.push(`/friend-profile?friendId=${friend.id}`)}
                                        className="bg-white p-4 rounded-xl mb-3 border border-gray-200 flex-row items-center shadow-sm"
                                    >
                                        <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
                                            <Text className="text-primary-600 font-bold text-lg">
                                                {friend.name[0]}
                                            </Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-semibold text-gray-900 text-base">{friend.name}</Text>
                                            {friend.username && <Text className="text-gray-500 text-sm">@{friend.username}</Text>}
                                            {friend.level && <Text className="text-primary-600 text-xs mt-0.5">Level {friend.level}</Text>}
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}
