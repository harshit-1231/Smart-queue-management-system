import { useState } from 'react';
import { mockLogin } from '../lib/auth';
import { LogIn } from 'lucide-react';

export default function LoginView() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'staff' | 'admin'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await mockLogin(name, role);
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0A1828' }}
    >
      <div
        className="w-full max-w-md p-8 rounded-lg backdrop-blur-md border"
        style={{
          backgroundColor: 'rgba(23, 133, 130, 0.1)',
          borderColor: 'rgba(191, 161, 129, 0.3)',
        }}
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#178582' }}>
            <LogIn size={32} style={{ color: '#BFA181' }} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#BFA181' }}>
          Appointments
        </h1>
        <p className="text-center mb-8" style={{ color: '#178582' }}>
          Queue Management System
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#BFA181' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(23, 133, 130, 0.3)',
                color: '#fff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#178582';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(23, 133, 130, 0.3)';
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#BFA181' }}>
              Login As
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'customer' | 'staff' | 'admin')}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(23, 133, 130, 0.3)',
                color: '#fff',
              }}
            >
              <option value="customer" style={{ backgroundColor: '#0A1828', color: '#fff' }}>
                Customer
              </option>
              <option value="staff" style={{ backgroundColor: '#0A1828', color: '#fff' }}>
                Staff
              </option>
              <option value="admin" style={{ backgroundColor: '#0A1828', color: '#fff' }}>
                Admin
              </option>
            </select>
          </div>

          {error && <div style={{ color: '#ff6b6b' }} className="text-sm">
            {error}
          </div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#178582', color: '#BFA181' }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(191, 161, 129, 0.3)' }}>
          <p className="text-xs text-center" style={{ color: '#178582' }}>
            Try different names to create multiple accounts
          </p>
        </div>
      </div>
    </div>
  );
}
