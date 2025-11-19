import { useEffect, useState } from 'react';
import { isAuthenticated } from '../lib/auth';
import LoginView from './LoginView';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setIsLoading(false);

    const handleStorageChange = () => {
      setAuthenticated(isAuthenticated());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A1828' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#178582' }}></div>
          <p className="mt-4" style={{ color: '#BFA181' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginView onLoginSuccess={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
}
