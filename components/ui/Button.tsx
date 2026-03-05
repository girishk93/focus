import React from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { ThemedText } from './Typography';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
    style?: any;
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
    style,
}: ButtonProps) {

    const getContainerStyles = () => {
        let styles = 'flex-row items-center justify-center rounded-xl';

        // Size
        switch (size) {
            case 'sm': styles += ' px-3 py-2'; break;
            case 'md': styles += ' px-4 py-3'; break;
            case 'lg': styles += ' px-6 py-4'; break;
        }

        // Variant
        switch (variant) {
            case 'primary':
                styles += disabled ? ' bg-primary-300' : ' bg-primary-600 active:bg-primary-700';
                break;
            case 'secondary':
                styles += disabled ? ' bg-secondary-200' : ' bg-secondary-100 active:bg-secondary-200';
                break;
            case 'outline':
                styles += ' border-2 border-primary-600 bg-transparent active:bg-primary-50';
                break;
            case 'ghost':
                styles += ' bg-transparent active:bg-neutral-100';
                break;
        }

        return styles;
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary': return 'white';
            case 'secondary': return 'secondary';
            case 'outline': return 'primary';
            case 'ghost': return 'neutral';
            default: return 'white';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            className={`${getContainerStyles()} ${className} ${disabled ? 'opacity-70' : ''}`}
            style={style}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : '#4F46E5'} />
            ) : (
                <>
                    {icon && <View className="mr-2">{icon}</View>}
                    <ThemedText
                        variant="label"
                        color={getTextColor()}
                        className={variant === 'primary' ? 'text-white' : ''} // Force white for primary
                        style={{ fontWeight: '600' }}
                    >
                        {title}
                    </ThemedText>
                </>
            )}
        </TouchableOpacity>
    );
}
