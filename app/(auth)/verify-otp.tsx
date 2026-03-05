import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { ThemedText } from '../../components/ui/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOtpScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams();
    const signIn = useAuthStore((state) => state.signIn);
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
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
            const identifier = Array.isArray(phone) ? phone[0] : phone;
            await signIn(identifier || 'unknown');
            setIsLoading(false);
            router.replace('/(tabs)');
        }, 1500);
    };

    const handleResend = () => {
        setTimer(30);
        // Logic to resend OTP
        console.log('Resend OTP');
    };

    return (
        <ScreenWrapper className="justify-between">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="py-6">
                    <TouchableOpacity onPress={() => router.back()} className="mb-8 w-10 h-10 items-center justify-center rounded-full bg-neutral-100">
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>

                    <View className="flex-1 justify-center max-w-sm mx-auto w-full">
                        <View className="items-center mb-10">
                            <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-6">
                                <Ionicons name="shield-checkmark" size={40} color="#4F46E5" />
                            </View>
                            <ThemedText variant="h1" className="text-center mb-2">Verify Phone</ThemedText>
                            <ThemedText className="text-neutral-500 text-center text-base">
                                Code sent to <ThemedText className="font-semibold text-neutral-900">{phone}</ThemedText>
                            </ThemedText>
                        </View>

                        <View className="space-y-6">
                            <Input
                                label="Enter Verification Code"
                                placeholder="000000"
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={setOtp}
                                className="text-center text-3xl tracking-[10px] font-bold h-16"
                            />

                            <Button
                                title="Verify & Continue"
                                onPress={handleVerify}
                                isLoading={isLoading}
                                disabled={otp.length !== 6}
                                size="lg"
                            />

                            <View className="flex-row justify-center mt-4">
                                <ThemedText className="text-neutral-500">Didn't receive code? </ThemedText>
                                {timer > 0 ? (
                                    <ThemedText className="text-primary-600 font-semibold">Resend in {timer}s</ThemedText>
                                ) : (
                                    <TouchableOpacity onPress={handleResend}>
                                        <ThemedText className="text-primary-600 font-bold">Resend</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}
