import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth-store';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateUser, checkUsernameAvailability } = useAuthStore();

    const [name, setName] = useState(user?.name || '');
    const [userId, setUserId] = useState(user?.uid || '');
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined);
    const [gender, setGender] = useState(user?.gender || '');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [isChecking, setIsChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [idError, setIdError] = useState<string | null>(null);
    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);

    // Reset availability check when ID changes
    useEffect(() => {
        if (userId !== user?.uid) {
            setIsIdAvailable(null);
            setIdError(null);
        }
    }, [userId, user?.uid]);

    const handleCheckAvailability = async () => {
        if (!userId.trim()) return;
        if (userId === user?.uid) return;

        setIsChecking(true);
        try {
            const available = await checkUsernameAvailability(userId);
            setIsIdAvailable(available);
            if (!available) {
                setIdError('This User ID is already taken.');
            } else {
                setIdError(null);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check availability.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Invalid Name', 'Name cannot be empty.');
            return;
        }
        if (!userId.trim()) {
            Alert.alert('Invalid ID', 'User ID cannot be empty.');
            return;
        }

        // If ID changed, enforce availability check
        if (userId !== user?.uid && isIdAvailable !== true) {
            await handleCheckAvailability();
            if (isIdAvailable === false) return; // Stop if still not available
        }

        setIsSaving(true);
        try {
            await updateUser({
                name,
                uid: userId,
                dateOfBirth: dateOfBirth?.toISOString(),
                gender
            });
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header (Modal style) */}
            <View className="px-4 py-4 border-b border-gray-100 flex-row justify-between items-center mt-2">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-gray-500 text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold">Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving || (userId !== user?.uid && isIdAvailable === false)}>
                    <Text className={`text-base font-bold ${isSaving ? 'text-gray-300' : 'text-primary-500'}`}>Save</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-6">
                    <View className="mb-6">
                        <Input
                            label="Display Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Your Name"
                        />
                    </View>

                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-1">
                            <Text className="text-gray-900 font-bold ml-1">User ID</Text>
                            {isChecking && <ActivityIndicator size="small" color="#6C5CE7" />}
                            {!isChecking && isIdAvailable === true && userId !== user?.uid && (
                                <Text className="text-green-600 text-xs font-medium">Available ✓</Text>
                            )}
                        </View>

                        <View className="flex-row items-center">
                            <Input
                                value={userId}
                                onChangeText={setUserId}
                                placeholder="Unique ID"
                                autoCapitalize="none"
                                containerClassName="flex-1"
                                error={idError || undefined}
                                onBlur={handleCheckAvailability}
                            />
                        </View>
                        <Text className="text-gray-400 text-xs mt-1 ml-1">
                            This must be unique. Others can use this to find you.
                        </Text>
                    </View>

                    {/* Date of Birth */}
                    <View className="mb-6">
                        <Text className="text-gray-900 font-bold ml-1 mb-2">Date of Birth</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="w-full bg-gray-50 border border-neutral-200 rounded-xl px-4 py-3 h-14 justify-center"
                        >
                            <Text className={`${dateOfBirth ? 'text-gray-900' : 'text-gray-400'}`}>
                                {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select Date'}
                            </Text>
                        </TouchableOpacity>

                        {(showDatePicker || (Platform.OS === 'ios' && false)) && ( // Simple modal logic for now, or just show if true
                            <DateTimePicker
                                value={dateOfBirth || new Date(2000, 0, 1)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setDateOfBirth(date);
                                }}
                                maximumDate={new Date()}
                            />
                        )}
                        {/* Note: iOS Spinner often needs a visible container or modal. 
                            For simplicity in this View, using default behavior or standard picker.
                            Let's refine slightly for iOS to be more standard inline if needed, 
                            but for specific 'edit' actions, a modal picker logic is often cleaner 
                            or just letting DateTimePicker handle it (Android does modal automatically). 
                        */}
                    </View>

                    {/* Gender */}
                    <View className="mb-6">
                        <Text className="text-gray-900 font-bold ml-1 mb-2">Gender</Text>
                        <View className="flex-row flex-wrap">
                            {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => setGender(opt)}
                                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${gender === opt
                                        ? 'bg-primary-100 border-primary-500'
                                        : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <Text className={`${gender === opt ? 'text-primary-700 font-semibold' : 'text-gray-600'}`}>
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
