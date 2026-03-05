import React from 'react';
import { Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
    color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'white';
    className?: string;
}

export function ThemedText({
    children,
    variant = 'body',
    color = 'neutral',
    className = '',
    style,
    ...props
}: ThemedTextProps) {

    const getVariantStyle = () => {
        switch (variant) {
            case 'h1': return 'text-3xl font-bold';
            case 'h2': return 'text-2xl font-semibold';
            case 'h3': return 'text-xl font-medium';
            case 'body': return 'text-base';
            case 'caption': return 'text-sm text-neutral-500';
            case 'label': return 'text-sm font-medium uppercase tracking-wider';
            default: return 'text-base';
        }
    };

    const getColorStyle = () => {
        switch (color) {
            case 'primary': return 'text-primary-600';
            case 'secondary': return 'text-secondary-500';
            case 'accent': return 'text-accent-500';
            case 'white': return 'text-white';
            case 'neutral': return 'text-neutral-900';
            default: return 'text-neutral-900';
        }
    };

    const combinedClassName = `${getVariantStyle()} ${getColorStyle()} ${className}`;

    return (
        <Text className={combinedClassName} style={style} {...props}>
            {children}
        </Text>
    );
}
