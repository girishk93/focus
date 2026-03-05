import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Share } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useGroupsStore } from '../store/groups-store';
import { useAuthStore } from '../store/auth-store';
import { Colors } from '../constants/Colors';
import { ChatTab } from '../components/group/ChatTab';

type TabType = 'goals' | 'members' | 'stats' | 'chat';

export default function GroupDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const groupId = params.groupId as string;

    const { user } = useAuthStore();
    const { getGroup, toggleGoalCompletion, deleteGoal, generateInviteCode, deleteGroup, removeMember } = useGroupsStore();

    const [activeTab, setActiveTab] = useState<TabType>('goals');

    const group = getGroup(groupId);

    // Auto-migrate: Generate invite code if missing
    useEffect(() => {
        if (group && !group.inviteCode) {
            generateInviteCode(group.id);
        }
    }, [group]);

    if (!group) {
        return (
            <ScreenWrapper>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-500">Group not found</Text>
                </View>
            </ScreenWrapper>
        );
    }

    // Check if current user is admin (by ID or by name fallback for local dev resilience)
    const adminMember = group.members.find((m) => m.role === 'admin');
    const isAdmin =
        adminMember?.userId === user?.uid ||
        (adminMember?.name?.trim().toLowerCase() === user?.name?.trim().toLowerCase()) ||
        // Explicit dev override for current user
        user?.name === 'Girish Kumar';

    const handleToggleGoal = (goalId: string) => {
        if (!user) return;
        toggleGoalCompletion(groupId, goalId, user.uid, user.name || 'You');
    };

    const handleDeleteGoal = (goalId: string, goalTitle: string) => {
        Alert.alert(
            'Delete Goal',
            `Are you sure you want to delete "${goalTitle}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteGoal(groupId, goalId),
                },
            ]
        );
    };

    const handleDeleteGroup = () => {
        Alert.alert(
            'Delete Group',
            `Are you sure you want to delete "${group?.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        router.back();
                        // Small delay to ensure navigation happens before deletion updates state
                        setTimeout(() => deleteGroup(groupId), 100);
                    },
                },
            ]
        );
    };

    const handleRemoveMember = (userId: string, userName: string) => {
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${userName} from the group?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeMember(groupId, userId),
                },
            ]
        );
    };

    const handleLeaveGroup = () => {
        Alert.alert(
            'Leave Group',
            `Are you sure you want to leave "${group.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: () => {
                        if (user) {
                            router.back();
                            setTimeout(() => removeMember(groupId, user.uid), 100);
                        }
                    },
                },
            ]
        );
    };

    const handleShare = async () => {
        if (!group) return;
        try {
            // In a real app, this would be a deep link like: focus://join-group?code=${group.inviteCode}
            const message = `Join my group "${group.name}" on Focus! Use invite code: ${group.inviteCode}`;
            await Share.share({
                message,
            });
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate stats
    // Calculate stats
    const { toLocalDateString } = require('../utils/date');
    const today = toLocalDateString();

    const totalGoals = group.goals.length;

    // "Your Progress": Goals completed TODAY by the current user
    const completedByUser = group.goals.filter((g) =>
        g.completions.some((c) => c.userId === user?.uid && toLocalDateString(new Date(c.completedAt)) === today)
    ).length;

    // "Leaderboard": Total LIFETIME completions by each member
    const memberStats = group.members.map((member) => ({
        ...member,
        completedCount: group.goals.reduce((acc, goal) => {
            const userCompletions = goal.completions.filter((c) => c.userId === member.userId).length;
            return acc + userCompletions;
        }, 0),
    })).sort((a, b) => b.completedCount - a.completedCount);


    // Reusable Header Component
    const renderHeader = () => (
        <View className="px-6 pt-2 pb-2 bg-white">
            <View className="flex-row items-center justify-between mb-2">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} className="bg-primary-50 px-3 py-1.5 rounded-full flex-row items-center">
                    <Ionicons name="share-outline" size={18} color={Colors.primary} />
                    <Text className="text-primary-600 font-semibold ml-1">Invite</Text>
                </TouchableOpacity>
            </View>
            <Text className="text-3xl font-bold text-gray-900">{group.name}</Text>
            {group.description && (
                <Text className="text-gray-500 mt-2">{group.description}</Text>
            )}
            <View className="flex-row items-center mt-3 bg-gray-50 self-start px-3 py-1.5 rounded-lg">
                <Text className="text-gray-500 text-xs uppercase font-bold mr-2">Invite Code:</Text>
                <Text className="text-gray-900 font-mono font-bold tracking-widest">{group.inviteCode}</Text>
            </View>
        </View>
    );

    // Reusable Tabs Component
    const renderTabs = () => (
        <View className="flex-row px-6 mb-4 bg-white border-b border-gray-100">
            {['goals', 'chat', 'members', 'stats'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab as TabType)}
                    className={`flex-1 py-3 border-b-2 ${activeTab === tab ? 'border-primary-600' : 'border-transparent'}`}
                >
                    <Text
                        className={`text-center font-semibold capitalize ${activeTab === tab ? 'text-primary-600' : 'text-gray-500'}`}
                    >
                        {tab}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // If active tab is 'chat', use a View (flex-1) so ChatTab can control its own scroll (FlatList)
    if (activeTab === 'chat') {
        return (
            <ScreenWrapper>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 bg-white">
                    {renderHeader()}
                    {renderTabs()}
                    <View className="flex-1">
                        <ChatTab groupId={groupId} members={group.members} />
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    // For other tabs, use a ScrollView
    return (
        <ScreenWrapper>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-white">
                {/* Note: If we want header/tabs to scroll away, they need to be inside ScrollView */
                    /* But for consistency with Chat tab (where they are fixed), let's make them fixed here too? */
                    /* If the user wants them to scroll, we have to duplicate code inside ScrollView. */
                    /* Let's try Fixed Header first as it's cleaner code. If user complains, we change. */
                }

                {/* Actually, user might want scrolling for long lists. 
                   If we fix the header, the content area is smaller. 
                   Let's put Header/Tabs INSIDE ScrollView for non-chat tabs.
                   This means transition between chat/others will jump (header position changes),
                   but it solves the VirtualizedList error properly.
                */}

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
                    {renderHeader()}
                    {renderTabs()}

                    {/* Tab Content */}
                    <View className="flex-1">
                        {activeTab === 'goals' && (
                            <View className="px-6 pb-20">
                                {group.goals.length === 0 ? (
                                    <View className="py-20 items-center">
                                        <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
                                            <Ionicons name="flag-outline" size={32} color={Colors.primary} />
                                        </View>
                                        <Text className="text-gray-900 font-semibold text-lg mb-2">No Goals Yet</Text>
                                        <Text className="text-gray-500 text-center mb-6">
                                            Add a goal to get started
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => router.push(`/add-group-goal?groupId=${groupId}`)}
                                            className="bg-primary-600 px-6 py-3 rounded-full"
                                        >
                                            <Text className="text-white font-semibold">Add First Goal</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            onPress={() => router.push(`/add-group-goal?groupId=${groupId}`)}
                                            className="bg-primary-600 py-4 rounded-xl mb-4 flex-row items-center justify-center"
                                        >
                                            <Ionicons name="add-circle-outline" size={24} color="white" />
                                            <Text className="text-white font-semibold ml-2">Add New Goal</Text>
                                        </TouchableOpacity>

                                        {group.goals.map((goal) => {
                                            const today = toLocalDateString();
                                            const userCompleted = goal.completions.some((c) =>
                                                c.userId === user?.uid && toLocalDateString(new Date(c.completedAt)) === today
                                            );
                                            // Count completions for TODAY for display
                                            const completionCount = goal.completions.filter((c) =>
                                                toLocalDateString(new Date(c.completedAt)) === today
                                            ).length;

                                            return (
                                                <View
                                                    key={goal.id}
                                                    className="bg-white p-4 rounded-xl mb-3 border border-gray-200"
                                                >
                                                    <View className="flex-row items-start">
                                                        <Text className="text-2xl mr-3">{goal.icon || '🎯'}</Text>
                                                        <View className="flex-1">
                                                            <Text className="text-lg font-bold text-gray-900">{goal.title}</Text>
                                                            {goal.description && (
                                                                <Text className="text-gray-500 mt-1">{goal.description}</Text>
                                                            )}
                                                            <View className="flex-row items-center mt-3">
                                                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                                                <Text className="text-gray-600 ml-1 text-sm">
                                                                    {completionCount}/{group.members.length} completed
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        {isAdmin && (
                                                            <TouchableOpacity
                                                                onPress={() => handleDeleteGoal(goal.id, goal.title)}
                                                                className="ml-2"
                                                            >
                                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>

                                                    <TouchableOpacity
                                                        onPress={() => handleToggleGoal(goal.id)}
                                                        className={`mt-3 py-3 rounded-lg flex-row items-center justify-center ${userCompleted ? 'bg-green-500' : 'bg-primary-600'
                                                            }`}
                                                    >
                                                        <Ionicons
                                                            name={userCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
                                                            size={20}
                                                            color="white"
                                                        />
                                                        <Text className="text-white font-semibold ml-2">
                                                            {userCompleted ? 'Completed' : 'Mark Complete'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </>
                                )}
                            </View>
                        )}

                        {activeTab === 'members' && (
                            <View className="px-6 pb-20">
                                {group.members.map((member) => (
                                    <View
                                        key={member.userId}
                                        className="bg-white p-4 rounded-xl mb-3 border border-gray-200 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center flex-1">
                                            {member.photoURL ? (
                                                <Image
                                                    source={{ uri: member.photoURL }}
                                                    className="w-12 h-12 rounded-full mr-3"
                                                />
                                            ) : (
                                                <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
                                                    <Text className="text-primary-600 font-bold text-lg">
                                                        {member.name[0]}
                                                    </Text>
                                                </View>
                                            )}
                                            <View className="flex-1">
                                                <Text className="font-semibold text-gray-900">{member.name}</Text>
                                                <Text className="text-gray-500 text-sm capitalize">{member.role}</Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center">
                                            {member.role === 'admin' && (
                                                <View className="bg-primary-100 px-3 py-1 rounded-full ml-2">
                                                    <Text className="text-primary-600 text-xs font-semibold">Admin</Text>
                                                </View>
                                            )}

                                            {/* Admin Actions: Remove Member */}
                                            {isAdmin && member.userId !== user?.uid && (
                                                <TouchableOpacity
                                                    onPress={() => handleRemoveMember(member.userId, member.name)}
                                                    className="px-3 py-1.5 ml-2 bg-red-50 rounded-lg border border-red-100 flex-row items-center"
                                                >
                                                    <Text className="text-red-600 text-xs font-semibold mr-1">Remove</Text>
                                                    <Ionicons name="person-remove-outline" size={14} color="#EF4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}

                                {/* Group Actions: Delete (Admin) or Leave (Member) */}
                                {isAdmin ? (
                                    <TouchableOpacity
                                        onPress={handleDeleteGroup}
                                        className="mt-6 flex-row items-center justify-center py-4 bg-red-50 rounded-xl border border-red-100"
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        <Text className="font-semibold text-red-600 ml-2">Delete Group</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={handleLeaveGroup}
                                        className="mt-6 flex-row items-center justify-center py-4 bg-red-50 rounded-xl border border-red-100"
                                    >
                                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                        <Text className="font-semibold text-red-600 ml-2">Leave Group</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {activeTab === 'stats' && (
                            <View className="px-6 pb-20">
                                {/* Your Stats */}
                                <View className="bg-primary-600 p-6 rounded-2xl mb-6 shadow-sm">
                                    <Text className="text-white text-lg font-semibold mb-4">Your Progress</Text>
                                    <View className="flex-row justify-between">
                                        <View>
                                            <Text className="text-white/80 text-sm">Completed</Text>
                                            <Text className="text-white text-3xl font-bold">{completedByUser}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-white/80 text-sm">Total Goals</Text>
                                            <Text className="text-white text-3xl font-bold">{totalGoals}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Leaderboard */}
                                <Text className="text-lg font-bold text-gray-900 mb-4">Leaderboard</Text>
                                {memberStats.map((member, index) => {
                                    // Usage of set to get unique completion dates for this user across all goals
                                    const uniqueDates = new Set<string>();
                                    group.goals.forEach(g => {
                                        g.completions.forEach(c => {
                                            if (c.userId === member.userId) {
                                                const dateStr = toLocalDateString(new Date(c.completedAt));
                                                uniqueDates.add(dateStr);
                                            }
                                        });
                                    });

                                    // Calculate Streak
                                    const sortedDates = Array.from(uniqueDates).sort().reverse(); // Descending
                                    let streak = 0;
                                    let currentValues = new Date();
                                    // Check today
                                    const todayStr = toLocalDateString(currentValues);
                                    // Check yesterday
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    const yesterdayStr = toLocalDateString(yesterday);

                                    // If they have activity today, start counting.
                                    // If not today, check yesterday. If no yesterday, streak is 0.
                                    let contentDate = sortedDates.includes(todayStr) ? todayStr : (sortedDates.includes(yesterdayStr) ? yesterdayStr : null);

                                    if (contentDate) {
                                        streak = 1;
                                        let checkDate = new Date(contentDate);
                                        while (true) {
                                            checkDate.setDate(checkDate.getDate() - 1);
                                            const checkStr = toLocalDateString(checkDate);
                                            if (sortedDates.includes(checkStr)) {
                                                streak++;
                                            } else {
                                                break;
                                            }
                                        }
                                    }

                                    // Determine Rating / Badge
                                    let ratingIcon = '';
                                    let ratingLabel = '';

                                    if (streak >= 3) {
                                        ratingIcon = '🔥';
                                        ratingLabel = 'On Fire!';
                                    } else if (member.completedCount > 5) {
                                        ratingIcon = '⚡';
                                        ratingLabel = 'Consistent';
                                    } else if (member.completedCount > 0) {
                                        ratingIcon = '🌱';
                                        ratingLabel = 'Started';
                                    } else {
                                        ratingIcon = '💤';
                                        ratingLabel = 'Snoozing';
                                    }

                                    return (
                                        <View
                                            key={member.userId}
                                            className={`bg-white p-4 rounded-xl mb-2 border flex-row items-center ${index === 0 ? 'border-yellow-400' : 'border-gray-200'
                                                }`}
                                        >
                                            <View className="w-8 h-8 items-center justify-center mr-3">
                                                {index === 0 ? (
                                                    <Text className="text-2xl">🏆</Text>
                                                ) : (
                                                    <Text className="text-gray-600 font-bold">#{index + 1}</Text>
                                                )}
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row items-center">
                                                    <Text className="font-semibold text-gray-900 mr-2">{member.name}</Text>
                                                    {ratingLabel ? (
                                                        <View className="bg-gray-100 px-2 py-0.5 rounded-md flex-row items-center">
                                                            <Text className="text-xs">{ratingIcon} {ratingLabel}</Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                                <Text className="text-gray-500 text-sm">
                                                    {member.completedCount} goal{member.completedCount !== 1 ? 's' : ''} completed
                                                    {streak > 0 && ` • ${streak} day streak`}
                                                </Text>
                                            </View>
                                            <View className="bg-primary-100 px-3 py-1 rounded-full">
                                                <Text className="text-primary-600 font-bold">
                                                    {member.completedCount}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
}
