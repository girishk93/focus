import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        // alert('Failed to get push token for push notification!');
        return;
    }

    // Note: For local notifications we don't strictly need a push token,
    // but this verifies permissions.
    // token = (await Notifications.getExpoPushTokenAsync()).data;
    return finalStatus;
}

export async function scheduleHabitReminder(habitId: string, title: string, hour: number, minute: number, days: number[] = []) {
    // Cancel any existing notification for this habit to avoid duplicates
    await cancelHabitReminder(habitId);

    // If days are empty, assume daily
    const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
    };

    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: "Time for your habit! ⏰",
            body: `Don't forget to ${title}`,
            data: { habitId },
        },
        trigger,
    });

    return identifier;
}

export async function cancelHabitReminder(habitId: string) {
    // In a real app, we would store the notification ID mapped to the habit ID.
    // For this MVP, we might need to cancel all and reschedule, OR store the ID in the habit object.
    // Let's assume we store the notification ID in the habit object or just cancel all for now (simpler MVP).
    // Better approach: Since we don't have the ID handy without storing it, 
    // we can search pending notifications.

    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of pending) {
        if (notification.content.data?.habitId === habitId) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }
}
