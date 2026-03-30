import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ThemedText } from '../../components/ui/Typography';
import { AuthAPI } from '../../services/api';

const backgroundSource = require('../../assets/images/login_background.png');

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await AuthAPI.loginWithGoogle();
            // Native OAuth usually requires a redirect or linking handling, 
            // but for simplicity we assume redirect is handled by Expo Router/Supabase config.
        } catch (error: any) {
            Alert.alert('Google Login Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            await AuthAPI.login({
                email,
                password,
            });

            // Navigation handled by auth listener in _layout.tsx
        } catch (error: any) {
            Alert.alert('Login Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
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

                            <View className="items-center mb-8">
                                <View className="w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center shadow-lg shadow-indigo-200">
                                    <Ionicons name="sparkles" size={24} color="#FFFFFF" />
                                </View>
                            </View>

                            <View className="bg-white rounded-[24px] p-8 shadow-xl shadow-slate-200/50">
                                <View className="mb-6">
                                    <ThemedText variant="h2" className="text-slate-900 text-center mb-1">Welcome Back</ThemedText>
                                    <ThemedText className="text-slate-500 text-center text-sm">Sign in to your account</ThemedText>
                                </View>

                                <View className="space-y-4">
                                    <View>
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
                                    </View>

                                    <View>
                                        <Input
                                            label="Password"
                                            placeholder="••••••••"
                                            placeholderTextColor="#94A3B8"
                                            containerClassName="bg-transparent"
                                            className="bg-slate-50 border-slate-200 text-slate-900 h-12"
                                            secureTextEntry
                                            value={password}
                                            onChangeText={setPassword}
                                            leftIcon={
                                                <View className="pl-1 pr-3">
                                                    <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
                                                </View>
                                            }
                                        />
                                    </View>

                                    <Button
                                        title="Sign In"
                                        onPress={handleLogin}
                                        isLoading={isLoading}
                                        disabled={!email.includes('@') || password.length < 6}
                                        className="w-full bg-slate-900 active:bg-slate-800 h-12 rounded-xl border-0 shadow-lg shadow-slate-900/20"
                                        style={{ backgroundColor: '#0F172A' }}
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
                                        icon={<Ionicons name="logo-google" size={18} color="#000" />}
                                    />
                                </View>

                                <View className="mt-8 flex-row justify-center items-center">
                                    <ThemedText className="text-slate-500 text-sm">Don't have an account? </ThemedText>
                                    <Link href="/(auth)/signup" asChild>
                                        <TouchableOpacity>
                                            <ThemedText className="text-indigo-600 font-semibold text-sm">Sign Up</ThemedText>
                                        </TouchableOpacity>
                                    </Link>
                                </View>

                                <ThemedText className="text-center text-slate-400 text-[10px] mt-8 leading-4">
                                    By continuing, you agree to our Terms & Privacy Policy
                                </ThemedText>
                            </View>

                        </View>
                    </SafeAreaView>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
