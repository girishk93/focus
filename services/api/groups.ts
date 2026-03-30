import { supabase } from '@/utils/supabase';

export const getGroups = async (userId: string) => {
  const { data, error } = await supabase
    .from('group_members')
    .select('groups(*), role')
    .eq('user_id', userId);
  if (error) throw error;
  return data.map((d: any) => ({ ...d.groups, myRole: d.role }));
};

export const createGroup = async (groupData: any) => {
  const { data, error } = await supabase
    .from('groups')
    .insert(groupData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const joinGroup = async (groupId: string, userId: string, role = 'member') => {
  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role })
    .select()
    .single();
  if (error) throw error;
  return data;
};
