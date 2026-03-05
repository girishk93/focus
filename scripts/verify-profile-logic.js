
const habits = [
    { id: '1', title: 'Habit 1' },
    { id: '2', title: 'Habit 2' }
];

const logs = {
    '2024-01-01': { '1': true, '2': true },
    '2024-01-02': { '1': true, '2': false }
};

function calculateStats(currentHabits, currentLogs) {
    const activeHabitIds = new Set(currentHabits.map(h => h.id));
    let totalCompletions = 0;

    Object.values(currentLogs).forEach(dateLog => {
        Object.entries(dateLog).forEach(([habitId, completed]) => {
            if (completed && activeHabitIds.has(habitId)) {
                totalCompletions++;
            }
        });
    });

    return totalCompletions;
}

console.log('Initial Habits:', habits.map(h => h.id));
console.log('Initial Total Completions (Expected 3):', calculateStats(habits, logs));

const habitsAfterDelete = habits.filter(h => h.id !== '2');
console.log('After Deleting Habit 2:', habitsAfterDelete.map(h => h.id));
console.log('Total Completions After Delete (Expected 2):', calculateStats(habitsAfterDelete, logs));
