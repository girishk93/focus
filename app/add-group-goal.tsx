import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useGroupsStore } from '../store/groups-store';
import { useAuthStore } from '../store/auth-store';
import Button from '../components/ui/Button';

const EMOJI_OPTIONS = ['🎯', '💪', '📚', '🏃', '💧', '🍎', '😴', '🧘', '🎨', '💼', '🎮', '🎵'];

export default function AddGroupGoalScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const groupId = params.groupId as string;

    const { user } = useAuthStore();
    const { addGoal, getGroup } = useGroupsStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('🎯');

    const group = getGroup(groupId);

    const handleAdd = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a goal title');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in');
            return;
        }

        addGoal(groupId, {
            title: title.trim(),
            description: description.trim() || undefined,
            icon: selectedEmoji,
            createdBy: user.uid,
        });

        Alert.alert('Success', 'Goal added to group!');
        router.back();
    };

    if (!group) {
        return (
            <ScreenWrapper>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-500">Group not found</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-6 pt-6 pb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-900">Add Group Goal</Text>
                        <Text className="text-gray-500 mt-1">{group.name}</Text>
                    </View>
                </View>

                <View className="px-6">
                    {/* Emoji Selection */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-3">Icon</Text>
                        <View className="flex-row flex-wrap">
                            {EMOJI_OPTIONS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() => setSelectedEmoji(emoji)}
                                    className={`w-14 h-14 items-center justify-center rounded-xl mr-2 mb-2 ${selectedEmoji === emoji ? 'bg-primary-100 border-2 border-primary-600' : 'bg-gray-100'
                                        }`}
                                >
                                    <Text className="text-3xl">{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Goal Title */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">Goal Title *</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="E.g., Read for 30 minutes"
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
                            placeholder="Add any details about this goal..."
                            multiline
                            numberOfLines={3}
                            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                            placeholderTextColor="#9CA3AF"
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>

                    {/* Info Card */}
                    <View className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
                        <View className="flex-row">
                            <Ionicons name="information-circle" size={20} color="#3B82F6" />
                            <View className="flex-1 ml-2">
                                <Text className="text-blue-900 font-semibold text-sm">Group Goal</Text>
                                <Text className="text-blue-700 text-sm mt-1">
                                    All {group.members.length} members will see this goal and can mark it as complete.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Add Button */}
                    <Button
                        title="Add Goal to Group"
                        onPress={handleAdd}
                        variant="primary"
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}
