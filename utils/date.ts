/**
 * Formats a Date to 'YYYY-MM-DD' using LOCAL timezone.
 * This MUST be used instead of date.toISOString().split('T')[0]
 * because toISOString() uses UTC, which produces the wrong date
 * after midnight in timezones ahead of UTC.
 */
export const toLocalDateString = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Interface representing the minimal fields required for date checking
 */
interface HabitDateFields {
    startDate: string;
    durationInDays: number | null;
}

/**
 * Checks if a habit is active on a specific date.
 * 
 * @param habit The habit object containing startDate and durationInDays
 * @param date The date to check against (Date object or ISO string)
 * @returns true if the habit is active on the given date
 */
export const isHabitActiveOnDate = (habit: HabitDateFields, date: Date | string): boolean => {
    const targetDate = new Date(date);
    // Normalize target date to midnight
    targetDate.setHours(0, 0, 0, 0);

    const startDate = new Date(habit.startDate);
    // Normalize start date to midnight
    startDate.setHours(0, 0, 0, 0);

    // Check if the target date is before the start date
    if (targetDate < startDate) {
        return false;
    }

    // If no duration is set (lifetime habit), it's active anytime after start date
    if (habit.durationInDays === null || habit.durationInDays === undefined) {
        return true;
    }

    // Calculate expiry date
    const expiryDate = new Date(startDate);
    expiryDate.setDate(startDate.getDate() + habit.durationInDays);
    // expiryDate is already normalized since specific time was set to 0 above

    // Check if target date is strictly before expiry date
    // (Duration of 1 day means active on start date only)
    return targetDate < expiryDate;
};
