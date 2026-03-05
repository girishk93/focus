import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useGroupsStore } from '../store/groups-store';
import { useAuthStore } from '../store/auth-store';
import Button from '../components/ui/Button';

export default function JoinGroupScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { joinGroup } = useGroupsStore();
    const [inviteCode, setInviteCode] = useState('');

    const handleJoin = () => {
        if (!inviteCode.trim()) {
            Alert.alert('Error', 'Please enter an invite code');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to join a group');
            return;
        }

        try {
            joinGroup(inviteCode.trim().toUpperCase(), {
                uid: user.uid,
                name: user.name || 'User',
                photoURL: user.photoURL,
            });
            Alert.alert('Success', 'You have joined the group!');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to join group');
        }
    };

    return (
        <ScreenWrapper bg="bg-white">
            <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">Join Group</Text>
                <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                    <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            <View className="p-6">
                <View className="mb-6">
                    <Text className="text-gray-500 mb-4 text-center">
                        Enter the 6-character invite code shared by the group admin.
                    </Text>

                    <TextInput
                        value={inviteCode}
                        onChangeText={(text) => setInviteCode(text.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-widest text-gray-900"
                        placeholderTextColor="#D1D5DB"
                        maxLength={6}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        autoFocus
                    />
                </View>

                <Button
                    title="Join Group"
                    onPress={handleJoin}
                    variant="primary"
                />
            </View>
        </ScreenWrapper>
    );
}
