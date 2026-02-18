import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useTournamentStore } from '../features/tournament/useTournamentStore';

export default function AppHeader() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { setCurrentView } = useTournamentStore();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleProfileClick = async () => {
    if (isAuthenticated) {
      setCurrentView('profile');
    } else {
      try {
        await login();
        setCurrentView('profile');
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleAuthToggle = async () => {
    if (isAuthenticated) {
      await clear();
      setCurrentView('setup');
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">Tournament Manager</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProfileClick}
            disabled={isLoggingIn}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
          
          <Button
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            onClick={handleAuthToggle}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
          </Button>
        </div>
      </div>
    </header>
  );
}
