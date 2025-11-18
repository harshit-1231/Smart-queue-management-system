import { useEffect } from 'react';
import AuthGuard from './components/AuthGuard';
import MainLayout from './components/MainLayout';

function App() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <AuthGuard>
      <MainLayout />
    </AuthGuard>
  );
}

export default App;
