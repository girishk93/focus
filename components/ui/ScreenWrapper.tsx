import React from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
    children: React.ReactNode;
    className?: string;
    bg?: string;
}

export function ScreenWrapper({ children, className = '', bg = 'bg-background' }: ScreenWrapperProps) {
    return (
        <SafeAreaView className={`flex-1 ${bg}`}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View className={`flex-1 px-4 ${className}`}>
                {children}
            </View>
        </SafeAreaView>
    );
}
