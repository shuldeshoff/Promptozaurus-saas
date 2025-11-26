import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/auth.store';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import { ConfirmationProvider } from './context/ConfirmationContext';
import ConfirmationModal from './components/ui/ConfirmationModal';
import { useConfirmation } from './context/ConfirmationContext';

// Вспомогательный компонент для рендера ConfirmationModal
function ConfirmationModalWrapper() {
  const { confirmationState, closeConfirmation } = useConfirmation();
  return (
    <ConfirmationModal
      isOpen={confirmationState.isOpen}
      onClose={closeConfirmation}
      title={confirmationState.title}
      message={confirmationState.message}
      onConfirm={confirmationState.onConfirm}
      confirmButtonText={confirmationState.confirmButtonText}
      confirmButtonClass={confirmationState.confirmButtonClass}
      withInput={confirmationState.withInput}
      inputDefaultValue={confirmationState.inputDefaultValue}
      options={confirmationState.options}
    />
  );
}

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
        <ConfirmationProvider>
          {user ? <DashboardPage /> : <LandingPage />}
          <ConfirmationModalWrapper />
        </ConfirmationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
