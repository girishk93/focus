import { supabase } from '@/utils/supabase';

export const login = async (credentials: any) => {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data;
};

export const signup = async (credentials: any) => {
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            queryParams: {
                access_type: 'offline',
                prompt: 'consensus',
            },
        },
    });
    if (error) throw error;
    return data;
};
