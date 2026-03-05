import React, { useState } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../store/onboarding-store';
import Button from '../../components/ui/Button';
import { ThemedText } from '../../components/ui/Typography';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
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
        <ScreenWrapper className="pt-6 justify-between">
            <View>
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <ThemedText variant="h1" className="mb-2">When's your birthday?</ThemedText>
                <ThemedText variant="body" className="mb-8 text-neutral-500">We use this to calculate your age.</ThemedText>

                <View className="items-center justify-center p-4 bg-neutral-50 rounded-3xl mb-8">
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
            </View>

            <View className="mb-8">
                <View className="flex-row justify-center mb-8 space-x-2">
                    <View className="w-2 h-2 bg-primary-200 rounded-full" />
                    <View className="w-2 h-2 bg-primary-200 rounded-full" />
                    <View className="w-8 h-2 bg-primary-600 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                    <View className="w-2 h-2 bg-neutral-200 rounded-full" />
                </View>
                <Button
                    title="Continue"
                    onPress={handleNext}
                    size="lg"
                    disabled={!dateOfBirth}
                />
            </View>
        </ScreenWrapper>
    );
}
