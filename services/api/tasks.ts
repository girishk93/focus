import { supabase } from '@/utils/supabase';

export const getTasks = async (userId: string, date?: string) => {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
  
  if (date) {
    query = query.eq('scheduled_date', date);
  }
  
  const { data, error } = await query.order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
};

export const createTask = async (taskData: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateTask = async (taskId: string, updates: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  if (error) throw error;
  return true;
};
