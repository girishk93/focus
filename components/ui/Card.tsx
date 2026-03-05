import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    className?: string;
    variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ children, className = '', variant = 'elevated', style, ...props }: CardProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'elevated': return 'bg-white shadow-sm shadow-neutral-200';
            case 'outlined': return 'bg-white border border-neutral-200';
            case 'flat': return 'bg-neutral-50';
            default: return 'bg-white';
        }
    };

    return (
        <View
            className={`rounded-2xl p-4 ${getVariantStyles()} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </View>
    );
}
