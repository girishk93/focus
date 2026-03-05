import React from 'react';
import { TextInput, View, TextInputProps } from 'react-native';
import { ThemedText } from './Typography';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
    leftIcon?: React.ReactNode;
}

export default function Input({
    label,
    error,
    containerClassName = '',
    className = '',
    leftIcon,
    ...props
}: InputProps) {
    return (
        <View className={`w-full ${containerClassName}`}>
            {label && (
                <ThemedText variant="label" className="mb-2 ml-1">
                    {label}
                </ThemedText>
            )}
            <View className={`flex-row items-center w-full bg-neutral-50 border border-neutral-200 rounded-xl focus:border-primary-500 focus:bg-white ${error ? 'border-red-500' : ''} ${className}`}>
                {leftIcon && <View className="pl-3">{leftIcon}</View>}
                <TextInput
                    className="flex-1 px-4 py-3 text-neutral-900 placeholder:text-neutral-400"
                    placeholderTextColor="#94A3B8"
                    {...props}
                />
            </View>
            {error && (
                <ThemedText className="text-red-500 text-xs mt-1 ml-1">
                    {error}
                </ThemedText>
            )}
        </View>
    );
}
