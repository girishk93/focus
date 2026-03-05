import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../store/task-store';
import Button from '../ui/Button';

interface TaskDetailsModalProps {
    visible: boolean;
    habit: Habit | null;
    isCompleted: boolean;
    onClose: () => void;
    onToggleComplete: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isPastDate?: boolean;
}

export default function TaskDetailsModal({
    visible,
    habit,
    isCompleted,
    onClose,
    onToggleComplete,
    onEdit,
    onDelete,
    isPastDate = false,
}: TaskDetailsModalProps) {
    if (!habit) return null;

    const formatTime = (time: string | null | undefined) => {
        if (!time) return null;
        const date = new Date(time);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl max-h-[80%]">
                    {/* Header */}
                    <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-900">Habit Details</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="px-6 py-6">
                        {/* Icon & Title */}
                        <View className="items-center mb-6">
                            <View className="w-20 h-20 bg-indigo-100 rounded-3xl items-center justify-center mb-4">
                                <Text className="text-4xl">{habit.icon}</Text>
                            </View>
                            <Text className="text-2xl font-bold text-gray-900 text-center">{habit.title}</Text>
                        </View>

                        {/* Info Cards */}
                        <View className="space-y-3">
                            {/* Time & Duration */}
                            {habit.reminderTime && (
                                <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
                                    <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="time-outline" size={20} color="#6C5CE7" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-500 text-xs font-medium">Time</Text>
                                        <Text className="text-gray-900 font-semibold">
                                            {formatTime(habit.reminderTime)} • {habit.durationMinutes} min
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Category */}
                            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
                                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="folder-outline" size={20} color="#3B82F6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs font-medium">Category</Text>
                                    <Text className="text-gray-900 font-semibold">{habit.category}</Text>
                                </View>
                            </View>

                            {/* Streak */}
                            <View className="flex-row items-center bg-gray-50 p-4 rounded-xl">
                                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="flame" size={20} color="#F97316" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs font-medium">Current Streak</Text>
                                    <Text className="text-gray-900 font-semibold">{habit.streak} days</Text>
                                </View>
                            </View>

                            {/* Notes */}
                            {habit.notes && (
                                <View className="bg-gray-50 p-4 rounded-xl">
                                    <View className="flex-row items-center mb-2">
                                        <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                                        <Text className="text-gray-500 text-xs font-medium ml-2">Notes</Text>
                                    </View>
                                    <Text className="text-gray-900">{habit.notes}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View className="px-6 pb-6 pt-4 border-t border-gray-100 space-y-2">
                        {isPastDate ? (
                            <View className="py-4 bg-gray-100 rounded-xl items-center">
                                <Text className="text-gray-500 font-semibold">🔒 Past day — read only</Text>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={onToggleComplete}
                                    className={`py-4 rounded-xl flex-row items-center justify-center ${isCompleted ? 'bg-gray-100' : 'bg-primary-600'
                                        }`}
                                >
                                    <Ionicons
                                        name={isCompleted ? "checkmark-done" : "checkmark-circle"}
                                        size={22}
                                        color={isCompleted ? "#6B7280" : "white"}
                                    />
                                    <Text className={`font-bold ml-2 ${isCompleted ? 'text-gray-700' : 'text-white'}`}>
                                        {isCompleted ? 'Completed' : 'Mark Complete'}
                                    </Text>
                                </TouchableOpacity>

                                <View className="flex-row space-x-2">
                                    <TouchableOpacity
                                        onPress={onEdit}
                                        className="flex-1 py-4 bg-gray-100 rounded-xl items-center"
                                    >
                                        <Text className="text-gray-700 font-semibold">Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={onDelete}
                                        className="flex-1 py-4 bg-red-50 rounded-xl items-center"
                                    >
                                        <Text className="text-red-600 font-semibold">Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
