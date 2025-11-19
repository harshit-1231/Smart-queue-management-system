import { useEffect, useState } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { logout, getCurrentSession } from '../lib/auth';
import { LogOut, Home, LayoutDashboard } from 'lucide-react';
import CustomerView from './CustomerView';
import AdminView from './AdminView';

export default function MainLayout() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const session = getCurrentSession();
        if (isMounted && session?.id) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.id)
            .maybeSingle();
          if (isMounted) {
            setUserProfile(profile);
          }
        }
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    const handleStorageChange = () => {
      if (isMounted) {
        loadProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A1828' }}>
        <div style={{ color: '#BFA181' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A1828' }}>
      <header
        className="border-b"
        style={{
          backgroundColor: 'rgba(23, 133, 130, 0.1)',
          borderColor: 'rgba(191, 161, 129, 0.2)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#178582' }}>
              {userProfile?.role === 'admin' || userProfile?.role === 'staff' ? (
                <LayoutDashboard size={24} style={{ color: '#BFA181' }} />
              ) : (
                <Home size={24} style={{ color: '#BFA181' }} />
              )}
            </div>
            <div>
              <h1 className="font-bold text-xl" style={{ color: '#BFA181' }}>
                Appointments
              </h1>
              <p className="text-xs" style={{ color: '#178582' }}>
                {userProfile?.full_name}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{
              backgroundColor: 'rgba(191, 161, 129, 0.2)',
              color: '#BFA181',
              border: '1px solid rgba(191, 161, 129, 0.3)',
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {userProfile?.role === 'admin' || userProfile?.role === 'staff' ? (
          <AdminView userProfile={userProfile} />
        ) : (
          <CustomerView userProfile={userProfile} />
        )}
      </main>
    </div>
  );
}
