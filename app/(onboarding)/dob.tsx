import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../store/onboarding-store';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DobScreen() {
    const router = useRouter();
    const { dateOfBirth, setDateOfBirth } = useOnboardingStore();
    const [showPicker, setShowPicker] = useState(Platform.OS === 'ios'); // iOS shows inline by default

    const handleNext = () => {
        router.push('/(onboarding)/gender');
    };

    const onChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        if (selectedDate) {
            setDateOfBirth(selectedDate);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6 pt-6">
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-gray-900 mb-2">When's your birthday?</Text>
                <Text className="text-gray-500 text-base mb-8">We use this to calculate your age.</Text>

                <View className="items-center justify-center p-4 bg-gray-50 rounded-3xl mb-8">
                    {Platform.OS === 'android' && (
                        <Button
                            title={dateOfBirth ? dateOfBirth.toLocaleDateString() : "Select Date"}
                            variant="outline"
                            onPress={() => setShowPicker(true)}
                        />
                    )}

                    {(showPicker || Platform.OS === 'ios') && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={dateOfBirth || new Date(2000, 0, 1)}
                            mode="date"
                            display="spinner"
                            onChange={onChange}
                            maximumDate={new Date()}
                            textColor="black"
                        />
                    )}
                </View>

                <View className="flex-1" />

                <View className="mb-8">
                    <View className="flex-row justify-center mb-8 space-x-2">
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-2 h-2 bg-primary-200 rounded-full" />
                        <View className="w-8 h-2 bg-primary-500 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                        <View className="w-2 h-2 bg-gray-200 rounded-full" />
                    </View>
                    <Button
                        title="Continue"
                        onPress={handleNext}
                        size="lg"
                        disabled={!dateOfBirth}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
