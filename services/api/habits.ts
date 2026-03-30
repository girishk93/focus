import { supabase } from '@/utils/supabase';

export const getHabits = async (userId: string) => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createHabit = async (habitData: any) => {
  const { data, error } = await supabase
    .from('habits')
    .insert(habitData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateHabit = async (habitId: string, updates: any) => {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteHabit = async (habitId: string) => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);
  if (error) throw error;
  return true;
};

export const getCategories = async (userId?: string) => {
  let query = supabase.from('categories').select('*');
  if (userId) {
    query = query.or(`user_id.eq.${userId},is_default.eq.true`);
  } else {
    query = query.eq('is_default', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
