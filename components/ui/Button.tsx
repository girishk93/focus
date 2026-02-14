import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    icon,
}: ButtonProps) {
    const baseStyles = 'rounded-2xl items-center justify-center flex-row';

    const variants = {
        primary: 'bg-primary-500 active:bg-primary-600',
        secondary: 'bg-gray-200 active:bg-gray-300',
        outline: 'border-2 border-primary-500 bg-transparent active:bg-primary-50',
        ghost: 'bg-transparent',
    };

    const textVariants = {
        primary: 'text-white font-bold',
        secondary: 'text-gray-800 font-semibold',
        outline: 'text-primary-500 font-bold',
        ghost: 'text-primary-500 font-semibold',
    };

    const sizes = {
        sm: 'py-2 px-4',
        md: 'py-3.5 px-6',
        lg: 'py-4 px-8',
    };

    const textSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className} `}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : '#6C5CE7'} />
            ) : (
                <View className="flex-row items-center justify-center">
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={`${textVariants[variant]} ${textSizes[size]} `}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
