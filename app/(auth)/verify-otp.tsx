import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOtpScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams();
    const signIn = useAuthStore((state) => state.signIn);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async () => {
        if (otp.length !== 6) return;
        setIsLoading(true);

        // Simulate API verification
        setTimeout(async () => {
            await signIn('mock-token');
            setIsLoading(false);
            router.replace('/(tabs)');
        }, 1500);
    };

    const handleResend = () => {
        setTimer(30);
        // Logic to resend OTP
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <View className="mb-8">
                    <Text className="text-3xl font-bold text-gray-900 mb-2">Verify Phone</Text>
                    <Text className="text-gray-500 text-base">
                        Code sent to <Text className="font-semibold text-gray-900">{phone}</Text>
                    </Text>
                </View>

                <View className="space-y-6">
                    <Input
                        label="Enter Code"
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                        className="text-center text-2xl tracking-widest font-bold"
                    />

                    <Button
                        title="Verify & Continue"
                        onPress={handleVerify}
                        isLoading={isLoading}
                        disabled={otp.length !== 6}
                    />

                    <View className="flex-row justify-center mt-4">
                        <Text className="text-gray-500">Didn't receive code? </Text>
                        {timer > 0 ? (
                            <Text className="text-primary-500 font-semibold">Resend in {timer}s</Text>
                        ) : (
                            <TouchableOpacity onPress={handleResend}>
                                <Text className="text-primary-600 font-bold">Resend</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
