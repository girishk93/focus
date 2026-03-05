import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../../store/task-store';

interface DraggableTaskCardProps {
    habit: Habit;
    isCompleted: boolean;
    onPress: () => void;
    onDragEnd: (newY: number) => void;
    height: number;
    initialTop: number;
    style?: any;
}

const PIXELS_PER_HOUR = 40;

export default function DraggableTaskCard({
    habit,
    isCompleted,
    onPress,
    onDragEnd,
    height,
    initialTop,
    style
}: DraggableTaskCardProps) {
    const translateY = useSharedValue(0);
    const offsetY = useSharedValue(initialTop);
    const scale = useSharedValue(1);
    const isDragging = useSharedValue(false);

    const gesture = Gesture.Pan()
        .onStart(() => {
            isDragging.value = true;
            scale.value = withSpring(1.05);
        })
        .onUpdate((event) => {
            translateY.value = event.translationY;
        })
        .onEnd(() => {
            isDragging.value = false;
            scale.value = withSpring(1);

            const newY = offsetY.value + translateY.value;
            runOnJS(onDragEnd)(newY);

            offsetY.value = newY;
            translateY.value = 0;
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onStart(() => {
            // Trigger haptic feedback if available
        });

    const composedGesture = Gesture.Exclusive(
        Gesture.Simultaneous(longPressGesture, gesture),
        Gesture.Tap().onEnd(() => {
            runOnJS(onPress)();
        })
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        zIndex: isDragging.value ? 100 : 10,
        shadowOpacity: isDragging.value ? 0.3 : (isCompleted ? 0.1 : 0.15),
        elevation: isDragging.value ? 8 : 2,
    }));

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: 8,
                        right: 0,
                        top: initialTop,
                        height: height,
                        paddingHorizontal: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        overflow: 'hidden',
                        backgroundColor: isCompleted ? '#F3F0FF' : '#EEF2FF',
                        borderColor: isCompleted ? '#D4C5F9' : '#C7D2FE',
                        shadowColor: '#6C5CE7',
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 4,
                    },
                    animatedStyle,
                    style
                ]}
            >
                <View
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        backgroundColor: isCompleted ? '#A78BFA' : '#818CF8'
                    }}
                />

                <View
                    style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                        marginLeft: 4,
                        backgroundColor: isCompleted ? '#DDD6FE' : 'white',
                        transform: height && height < 30 ? [{ scale: 0.7 }] : []
                    }}
                >
                    <Text style={{ fontSize: 10 }}>{habit.icon}</Text>
                </View>

                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text
                        numberOfLines={1}
                        style={{
                            fontWeight: '600',
                            fontSize: 10,
                            flex: 1,
                            marginRight: 8,
                            color: isCompleted ? '#5B21B6' : '#3730A3',
                            textDecorationLine: isCompleted ? 'line-through' : 'none'
                        }}
                    >
                        {habit.title}
                    </Text>
                    {isCompleted && (
                        <View style={{ marginRight: 4 }}>
                            <Ionicons name="checkmark-circle" size={14} color="#6C5CE7" />
                        </View>
                    )}
                </View>
            </Animated.View>
        </GestureDetector>
    );
}
