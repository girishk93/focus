import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export const CalendarService = {
    async getPermissions() {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
            const remindersStatus = await Calendar.requestRemindersPermissionsAsync();
            return remindersStatus.status === 'granted';
        }
        return false;
    },

    async getCalendars() {
        const hasPermissions = await this.getPermissions();
        if (!hasPermissions) return [];

        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

        // Filter for editable calendars and primary ones where possible
        return calendars.filter(
            (cal) => cal.allowsModifications && (
                Platform.OS === 'ios'
                    ? (cal.source.name === 'iCloud' || cal.source.name === 'Gmail' || cal.source.name === 'Exchange' || cal.type === Calendar.CalendarType.LOCAL)
                    : true
            )
        );
    },

    async createCalendar(calendarName: string = 'Focus Habits') {
        const defaultCalendarSource =
            Platform.OS === 'ios'
                ? await getDefaultCalendarSource()
                : { isLocalAccount: true, name: 'Focus Habits', type: Calendar.CalendarType.LOCAL };

        const newCalendarID = await Calendar.createCalendarAsync({
            title: calendarName,
            color: '#4F46E5', // Primary brand color
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: defaultCalendarSource.id,
            source: defaultCalendarSource,
            name: 'internalCalendarName',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });

        return newCalendarID;
    },

    async createEvent(
        calendarId: string,
        title: string,
        startDate: Date,
        durationMinutes: number = 15,
        frequency?: 'daily' | 'weekly',
        days?: string[], // 'Mon', 'Tue' etc.
        notes?: string
    ) {
        try {
            const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

            let recurrenceRule: Calendar.RecurrenceRule = {
                frequency: Calendar.Frequency.DAILY,
            };

            if (frequency === 'weekly') {
                recurrenceRule.frequency = Calendar.Frequency.WEEKLY;
                if (days && days.length > 0) {
                    // Map 'Mon' -> Calendar.DayOfTheWeek.Monday
                    const dayMap: Record<string, Calendar.DayOfTheWeek> = {
                        'Mon': Calendar.DayOfTheWeek.Monday,
                        'Tue': Calendar.DayOfTheWeek.Tuesday,
                        'Wed': Calendar.DayOfTheWeek.Wednesday,
                        'Thu': Calendar.DayOfTheWeek.Thursday,
                        'Fri': Calendar.DayOfTheWeek.Friday,
                        'Sat': Calendar.DayOfTheWeek.Saturday,
                        'Sun': Calendar.DayOfTheWeek.Sunday,
                    };

                    const daysOfTheWeek = days.map(d => ({
                        dayOfTheWeek: dayMap[d]
                    })).filter(d => d.dayOfTheWeek !== undefined);

                    if (daysOfTheWeek.length > 0) {
                        recurrenceRule.daysOfTheWeek = daysOfTheWeek;
                    }
                }
            } else {
                // Daily
                recurrenceRule.frequency = Calendar.Frequency.DAILY;
            }

            const eventId = await Calendar.createEventAsync(calendarId, {
                title,
                startDate,
                endDate,
                notes,
                timeZone: 'GMT',
                alarms: [{ relativeOffset: -10 }],
                recurrenceRule
            });

            return eventId;
        } catch (error) {
            console.error('[CalendarService] Error creating event:', error);
            return null;
        }
    },

    async deleteEvent(eventId: string, params: { instanceStartDate?: Date, futureEvents?: boolean } = {}) {
        try {
            await Calendar.deleteEventAsync(eventId, params);
        } catch (error) {
            console.error('[CalendarService] Error deleting event:', error);
        }
    }
};

async function getDefaultCalendarSource() {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendars = calendars.filter((each) => each.source.name === 'Default');
    return defaultCalendars.length > 0 ? defaultCalendars[0].source : calendars[0].source;
}
