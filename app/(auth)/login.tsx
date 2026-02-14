import React, { useState } from 'react';
import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const router = useRouter();
    const signIn = useAuthStore((state) => state.signIn);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        // TODO: Implement Google Sign In
        console.log('Google login pressed');
        await signIn('google-token');
        router.replace('/(tabs)');
    };

    const handleSendOTP = async () => {
        if (phoneNumber.length < 10) return;
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            router.push({ pathname: '/(auth)/verify-otp', params: { phone: phoneNumber } });
        }, 1000);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">

                <View className="items-center mb-10">
                    <View className="w-20 h-20 bg-primary-100 rounded-3xl items-center justify-center mb-6">
                        <Ionicons name="sparkles" size={40} color="#6C5CE7" />
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 mb-2">Focus</Text>
                    <Text className="text-gray-500 text-base">Small habits. Big change.</Text>
                </View>

                <View className="space-y-4 w-full">
                    <Input
                        label="Mobile Number"
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        leftIcon={<Ionicons name="call-outline" size={20} color="#6B7280" />}
                    />

                    <Button
                        title="Continue with Phone"
                        onPress={handleSendOTP}
                        isLoading={isLoading}
                        disabled={phoneNumber.length < 5}
                    />

                    <View className="flex-row items-center my-6">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="mx-4 text-gray-400 text-sm">Or continue with</Text>
                        <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    <Button
                        title="Google"
                        variant="outline"
                        onPress={handleGoogleLogin}
                        icon={<Ionicons name="logo-google" size={20} color="#000" />} // Note: Button component update needed for icon prop or complex children
                    />
                </View>

                <Text className="text-center text-gray-400 text-xs mt-10">
                    By continuing, you agree to our Terms & Privacy Policy
                </Text>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
