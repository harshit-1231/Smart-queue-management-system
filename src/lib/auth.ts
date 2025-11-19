import { supabase, UserRole } from './supabase';

const STORAGE_KEY = 'appointments_user_session';

interface MockSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export const mockLogin = async (name: string, role: UserRole = 'customer') => {
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@appointments.local`;

  try {
    let userId: string;
    let existingProfile = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile.data?.id) {
      userId = existingProfile.data.id;
    } else {
      userId = crypto.getRandomValues(new Uint8Array(16))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
    }

    await supabase.from('user_profiles').upsert({
      id: userId,
      email,
      full_name: name,
      role,
    });

    const session: MockSession = {
      id: userId,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    return { error: null };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getCurrentSession = () => {
  const session = localStorage.getItem(STORAGE_KEY);
  return session ? JSON.parse(session) as MockSession : null;
};

export const getCurrentUser = () => {
  const session = getCurrentSession();
  return session ? { id: session.id, email: session.email } : null;
};

export const getCurrentUserProfile = async () => {
  const session = getCurrentSession();
  if (!session) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.id)
    .maybeSingle();

  return data;
};

export const isAuthenticated = () => {
  return !!getCurrentSession();
};
