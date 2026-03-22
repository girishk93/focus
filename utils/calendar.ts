import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

export interface DeviceCalendar {
    id: string;
    title: string;
    source: string;
    allowsModifications: boolean;
}

/**
 * Request calendar permissions from the user
 */
export async function requestCalendarPermissions(): Promise<boolean> {
    try {
        const { status } = await Calendar.requestCalendarPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission Denied',
                'Calendar access is required to sync your habits. Please enable it in Settings.'
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error requesting calendar permissions:', error);
        Alert.alert('Error', 'Failed to request calendar permissions');
        return false;
    }
}

/**
 * Get all available calendars on the device
 */
export async function getDeviceCalendars(): Promise<DeviceCalendar[]> {
    try {
        const hasPermission = await requestCalendarPermissions();
        if (!hasPermission) return [];

        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

        return calendars
            // Not filtering solely by allowsModifications because users might just want to VIEW read-only calendars (like Holidays, Subscribed calendars)
            .map(cal => ({
                id: cal.id,
                title: cal.title,
                source: cal.source.name || 'Unknown',
                allowsModifications: cal.allowsModifications,
            }));
    } catch (error) {
        console.error('Error fetching calendars:', error);
        Alert.alert('Error', 'Failed to fetch device calendars');
        return [];
    }
}

/**
 * Fetch native calendar events
 */
export async function getCalendarEvents(
    calendarIds: string[],
    startDate: Date,
    endDate: Date
): Promise<Calendar.Event[]> {
    try {
        if (!calendarIds || calendarIds.length === 0) return [];
        const hasPermission = await requestCalendarPermissions();
        if (!hasPermission) return [];

        const events = await Calendar.getEventsAsync(calendarIds, startDate, endDate);
        return events;
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
    }
}

/**
 * Sync a habit to the selected calendar
 */
export async function syncHabitToCalendar(
    calendarId: string,
    calendarName: string,
    habitTitle: string,
    habitTime: Date,
    durationMinutes: number,
    notes?: string
): Promise<boolean> {
    try {
        const endDate = new Date(habitTime);
        endDate.setMinutes(endDate.getMinutes() + durationMinutes);

        const eventId = await Calendar.createEventAsync(calendarId, {
            title: `🎯 ${habitTitle}`,
            startDate: habitTime,
            endDate: endDate,
            notes: notes || 'Habit from Habit Tracker',
            timeZone: 'default',
            alarms: [
                {
                    relativeOffset: -5, // 5 minutes before
                    method: Calendar.AlarmMethod.ALERT,
                },
            ],
        });

        return !!eventId;
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return false;
    }
}

/**
 * Sync all habits for a specific date to calendar
 */
export async function syncDayHabitsToCalendar(
    calendarId: string,
    calendarName: string,
    habits: Array<{
        id: string;
        title: string;
        reminderTime?: string;
        durationMinutes?: number;
        notes?: string;
    }>,
    date: Date,
    onHabitSynced?: (habitId: string, calendarId: string, calendarName: string) => void
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const habit of habits) {
        if (!habit.reminderTime) {
            failed++;
            continue;
        }

        const habitTime = new Date(habit.reminderTime);
        // Use the selected date but keep the time from reminderTime
        habitTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());

        const synced = await syncHabitToCalendar(
            calendarId,
            calendarName,
            habit.title,
            habitTime,
            habit.durationMinutes || 15,
            habit.notes
        );

        if (synced) {
            success++;
            // Call callback to update habit with calendar info
            if (onHabitSynced) {
                onHabitSynced(habit.id, calendarId, calendarName);
            }
        } else {
            failed++;
        }
    }

    return { success, failed };
}
