import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface CheckboxProps {
    checked: boolean;
    onPress: () => void;
    size?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Checkbox({ checked, onPress, size = 24 }: CheckboxProps) {
    const scale = useSharedValue(1);
    const progress = useSharedValue(checked ? 1 : 0);

    useEffect(() => {
        progress.value = withSpring(checked ? 1 : 0, {
            damping: 15,
            stiffness: 150,
        });

        if (checked) {
            scale.value = withSequence(
                withTiming(1.2, { duration: 100 }),
                withSpring(1, { damping: 10 })
            );
        }
    }, [checked]);

    const animatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            ['transparent', Colors.primary]
        );
        const borderColor = interpolateColor(
            progress.value,
            [0, 1],
            ['#D1D5DB', Colors.primary] // gray-300 to primary
        );

        return {
            backgroundColor,
            borderColor,
            transform: [{ scale: scale.value }],
        };
    });

    const checkmarkStyle = useAnimatedStyle(() => {
        return {
            opacity: progress.value,
            transform: [{ scale: progress.value }]
        };
    });

    return (
        <AnimatedPressable
            onPress={onPress}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                animatedStyle
            ]}
        >
            <Animated.View style={checkmarkStyle}>
                <Ionicons name="checkmark" size={size * 0.6} color="white" />
            </Animated.View>
        </AnimatedPressable>
    );
}
