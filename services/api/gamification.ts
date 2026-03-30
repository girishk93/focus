import { supabase } from '@/utils/supabase';

export const getLeaderboard = async (scope: string, period: string) => {
  const { data, error } = await supabase
    .from('leaderboard_snapshots')
    .select('*')
    .eq('scope', scope)
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(100);
  if (error) throw error;
  return data;
};

export const logFocusSession = async (sessionData: any) => {
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert(sessionData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const awardPoints = async (userId: string, delta: number, reason: string) => {
  // We can call the custom RPC function defined in the schema
  const { error } = await supabase.rpc('award_points', {
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason
  });
  if (error) throw error;
  return true;
};
