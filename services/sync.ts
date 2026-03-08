import { Task, TaskLog } from '../store/task-store';
import { supabase } from '../utils/supabase';

export const SyncService = {
    // Save user profile data (Handled by Supabase Auth Triggers mostly, but for manual updates)
    async saveUserProfile(userId: string, data: any) {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update(data)
                .eq('id', userId);
            if (error) throw error;
        } catch (error) {
            console.error('Error syncing profile:', error);
        }
    },

    // Save habits (sync with habits table)
    async syncHabits(userId: string, habits: Task[]) {
        if (!userId) return;
        try {
            // Mapping store task to database habit schema
            const habitsToSync = habits.map(h => ({
                id: h.id,
                user_id: userId,
                title: h.title,
                category_id: h.category, // using category title/id from store task
                frequency_type: h.frequency,
                duration_minutes: h.durationMinutes,
                is_archived: h.archived,
                created_at: h.createdAt,
                // Add other fields as per schema
            }));

            const { error } = await supabase
                .from('habits')
                .upsert(habitsToSync, { onConflict: 'id' });

            if (error) throw error;
        } catch (error) {
            console.error('Error syncing habits:', error);
        }
    },

    // Save logs
    async syncLogs(userId: string, logs: TaskLog) {
        if (!userId) return;
        // In Supabase, logs might be better as a flat table or a JSONB field in a profile/habits.
        // The schema.sql doesn't have a direct 'logs' table for simple boolean toggles, 
        // but it has focus_sessions and tasks. For now, let's skip or implement custom sync if needed.
    },

    // Pull data from Supabase
    async pullData(userId: string) {
        if (!userId) return null;
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data: habits } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', userId);

            return {
                profile,
                habits: habits || []
            };
        } catch (error) {
            console.error('Error pulling data:', error);
            return null;
        }
    }
};
