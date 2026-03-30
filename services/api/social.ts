import { supabase } from '@/utils/supabase';

export const getFriends = async (userId: string) => {
  // Using the custom view v_friends_leaderboard for rich friend data
  const { data, error } = await supabase
    .from('v_friends_leaderboard')
    .select('*')
    .eq('viewer_id', userId);
  if (error) throw error;
  return data;
};

export const sendFriendRequest = async (requesterId: string, addresseeId: string) => {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const respondToFriendRequest = async (friendshipId: string, status: 'accepted' | 'blocked') => {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status })
    .eq('id', friendshipId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
