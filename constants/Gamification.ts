export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (stats: any) => boolean;
}

export const LEVELS = [
    { level: 1, xp: 0, title: 'Novice' },
    { level: 2, xp: 100, title: 'Apprentice' },
    { level: 3, xp: 300, title: 'Consistent' },
    { level: 4, xp: 600, title: 'Expert' },
    { level: 5, xp: 1000, title: 'Master' },
    { level: 6, xp: 1500, title: 'Grandmaster' },
    { level: 7, xp: 2500, title: 'Legend' },
];

export const BADGES: Badge[] = [
    {
        id: 'first_step',
        name: 'First Step',
        description: 'Complete your first habit.',
        icon: '🌱',
        condition: (stats) => stats.totalCompleted >= 1,
    },
    {
        id: 'streak_3',
        name: 'Momentum',
        description: 'Reach a 3-day streak.',
        icon: '🔥',
        condition: (stats) => stats.maxStreak >= 3,
    },
    {
        id: 'streak_7',
        name: 'Unstoppable',
        description: 'Reach a 7-day streak.',
        icon: '🚀',
        condition: (stats) => stats.maxStreak >= 7,
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete a habit before 8 AM.',
        icon: '🌅',
        condition: (stats) => stats.earlyCompletions >= 1,
    },
];

export const XP_PER_COMPLETION = 10;
