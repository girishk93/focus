import React, { useState } from 'react';
import { View, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth-store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ThemedText } from '../../components/ui/Typography';
import { Ionicons } from '@expo/vector-icons';

// Fallback or generated image path
const backgroundSource = require('../../assets/images/login_background.png');

const COUNTRY_CODES = [
    { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
    { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳' },
    { code: 'CA', name: 'Canada', dial_code: '+1', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', dial_code: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', dial_code: '+33', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', dial_code: '+81', flag: '🇯🇵' },
    { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
    { code: 'BR', name: 'Brazil', dial_code: '+55', flag: '🇧🇷' },
];

export default function LoginScreen() {
    const router = useRouter();
    const signIn = useAuthStore((state) => state.signIn);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
    const [isLoading, setIsLoading] = useState(false);

    // Country Code State
    const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    const handleGoogleLogin = async () => {
        console.log('Google login pressed');
        await signIn('google-token');
        router.replace('/(tabs)');
    };

    const handleContinue = async () => {
        if (authMethod === 'phone' && phoneNumber.length < 5) return;
        if (authMethod === 'email' && !email.includes('@')) return;

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (authMethod === 'phone') {
                const fullPhoneNumber = `${countryCode.dial_code}${phoneNumber}`;
                router.push({ pathname: '/(auth)/verify-otp', params: { phone: fullPhoneNumber } });
            } else {
                // Mock email login - straight to app for now or verify screen
                router.push({ pathname: '/(auth)/verify-otp', params: { phone: email } }); // Reusing OTP screen for email too
            }
        }, 1000);
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Subtle Background Pattern */}
            <ImageBackground
                source={backgroundSource}
                className="absolute inset-0 opacity-[0.03]"
                resizeMode="cover"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    className="px-6"
                    showsVerticalScrollIndicator={false}
                >
                    <SafeAreaView className="flex-1 justify-center">
                        <View className="w-full max-w-sm mx-auto">

                            {/* Small centered logo at top */}
                            <View className="items-center mb-8">
                                <View className="w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center shadow-lg shadow-indigo-200">
                                    <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                                </View>
                            </View>

                            {/* Main Card */}
                            <View className="bg-white rounded-[24px] p-8 shadow-xl shadow-slate-200/50">
                                <View className="mb-6">
                                    <ThemedText variant="h2" className="text-slate-900 text-center mb-1">Welcome Back</ThemedText>
                                    <ThemedText className="text-slate-500 text-center text-sm">Login or Create an account</ThemedText>
                                </View>

                                {/* Auth Method Tabs */}
                                <View className="flex-row bg-slate-100 p-1 rounded-xl mb-6">
                                    <TouchableOpacity
                                        className={`flex-1 py-2.5 rounded-lg items-center ${authMethod === 'phone' ? 'bg-white shadow-sm' : ''}`}
                                        onPress={() => setAuthMethod('phone')}
                                    >
                                        <ThemedText className={`text-sm font-semibold ${authMethod === 'phone' ? 'text-slate-900' : 'text-slate-500'}`}>Phone</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className={`flex-1 py-2.5 rounded-lg items-center ${authMethod === 'email' ? 'bg-white shadow-sm' : ''}`}
                                        onPress={() => setAuthMethod('email')}
                                    >
                                        <ThemedText className={`text-sm font-semibold ${authMethod === 'email' ? 'text-slate-900' : 'text-slate-500'}`}>Email</ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <View className="space-y-4">
                                    <View>
                                        {authMethod === 'phone' ? (
                                            <Input
                                                label="Mobile Number"
                                                placeholder="000 000 0000"
                                                placeholderTextColor="#94A3B8"
                                                containerClassName="bg-transparent"
                                                className="bg-slate-50 border-slate-200 text-slate-900 h-12"
                                                keyboardType="phone-pad"
                                                value={phoneNumber}
                                                onChangeText={setPhoneNumber}
                                                // Country Code Selector
                                                leftIcon={
                                                    <TouchableOpacity
                                                        onPress={() => setShowCountryPicker(true)}
                                                        className="flex-row items-center justify-center h-full pr-3 border-r border-slate-200 mr-2"
                                                    >
                                                        <ThemedText className="text-slate-600 text-sm font-medium pr-1">
                                                            {countryCode.flag} {countryCode.dial_code}
                                                        </ThemedText>
                                                        <Ionicons name="chevron-down" size={12} color="#64748B" />
                                                    </TouchableOpacity>
                                                }
                                            />
                                        ) : (
                                            <Input
                                                label="Email Address"
                                                placeholder="you@example.com"
                                                placeholderTextColor="#94A3B8"
                                                containerClassName="bg-transparent"
                                                className="bg-slate-50 border-slate-200 text-slate-900 h-12"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                value={email}
                                                onChangeText={setEmail}
                                                leftIcon={
                                                    <View className="pl-1 pr-3">
                                                        <Ionicons name="mail-outline" size={20} color="#64748B" />
                                                    </View>
                                                }
                                            />
                                        )}
                                    </View>

                                    <Button
                                        title="Continue"
                                        onPress={handleContinue}
                                        isLoading={isLoading}
                                        disabled={authMethod === 'phone' ? phoneNumber.length < 5 : !email.includes('@')}
                                        // Solid Black Button Override
                                        className="w-full bg-slate-900 active:bg-slate-800 h-12 rounded-xl border-0 shadow-lg shadow-slate-900/20"
                                        style={{ backgroundColor: '#0F172A' }} // Force dark slate/black
                                    />

                                    <View className="flex-row items-center my-4">
                                        <View className="flex-1 h-[1px] bg-slate-100" />
                                        <ThemedText className="mx-4 text-slate-400 text-xs font-medium">or</ThemedText>
                                        <View className="flex-1 h-[1px] bg-slate-100" />
                                    </View>

                                    <Button
                                        title="Continue with Google"
                                        variant="outline"
                                        onPress={handleGoogleLogin}
                                        className="h-12 border-slate-200 bg-white active:bg-slate-50"
                                        // Google Icon (using Ionicons logo-google for now)
                                        icon={<Ionicons name="logo-google" size={18} color="#000" />}
                                    />
                                </View>

                                <ThemedText className="text-center text-slate-400 text-[10px] mt-8 leading-4">
                                    By continuing, you agree to our Terms & Privacy Policy
                                </ThemedText>
                            </View>

                        </View>
                    </SafeAreaView>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Country Picker Modal */}
            <Modal
                visible={showCountryPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCountryPicker(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl h-[60%] p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <ThemedText variant="h2">Select Country</ThemedText>
                            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={COUNTRY_CODES}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="flex-row items-center py-4 border-b border-slate-100"
                                    onPress={() => {
                                        setCountryCode(item);
                                        setShowCountryPicker(false);
                                    }}
                                >
                                    <ThemedText className="text-2xl mr-4">{item.flag}</ThemedText>
                                    <View className="flex-1">
                                        <ThemedText className="text-slate-900 font-medium">{item.name}</ThemedText>
                                        <ThemedText className="text-slate-500 text-sm">{item.code}</ThemedText>
                                    </View>
                                    <ThemedText className="text-slate-900 font-semibold">{item.dial_code}</ThemedText>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
