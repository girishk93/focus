import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export default function Input({
    label,
    error,
    leftIcon,
    className = '',
    ...props
}: InputProps) {
    return (
        <View className="mb-4 w-full">
            {label && <Text className="text-gray-700 font-medium mb-1.5 ml-1">{label}</Text>}

            <View className={`
        flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5
        focus:border-primary-500 focus:bg-white
        ${error ? 'border-red-500 bg-red-50' : ''}
        ${className}
      `}>
                {leftIcon && <View className="mr-3">{leftIcon}</View>}

                <TextInput
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 text-gray-900 text-base"
                    {...props}
                />
            </View>

            {error && <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>}
        </View>
    );
}
