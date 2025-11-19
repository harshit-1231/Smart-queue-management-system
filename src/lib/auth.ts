import { supabase, UserRole } from './supabase';

export const mockLogin = async (name: string, role: UserRole = 'customer') => {
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@appointments.local`;

  try {
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password: 'demo123456',
    });

    if (signInResult.error) {
      const signUpResult = await supabase.auth.signUp({
        email,
        password: 'demo123456',
        options: {
          data: {
            full_name: name,
            role,
          },
        },
      });

      if (!signUpResult.error && signUpResult.data.user) {
        await supabase.from('user_profiles').upsert({
          id: signUpResult.data.user.id,
          email,
          full_name: name,
          role,
        });
      }

      return signUpResult;
    }

    return signInResult;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
};

export const getCurrentUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return data;
};
