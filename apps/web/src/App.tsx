import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/auth.store';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  const { user, isLoading, fetchUser } = useAuthStore();
  const hasFetchedUser = useRef(false);

  useEffect(() => {
    if (!hasFetchedUser.current) {
      hasFetchedUser.current = true;
      fetchUser();
    }
  }, [fetchUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {user ? <DashboardPage /> : <LandingPage />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
