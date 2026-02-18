import { useTournamentStore } from './features/tournament/useTournamentStore';
import TournamentSetupPage from './pages/TournamentSetupPage';
import StageSchedulePage from './pages/StageSchedulePage';
import FullSchedulePage from './pages/FullSchedulePage';
import KnockoutPage from './pages/KnockoutPage';
import UserProfilePage from './pages/UserProfilePage';
import AppHeader from './components/AppHeader';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const { currentView } = useTournamentStore();

  return (
    <>
      <AppHeader />
      {currentView === 'setup' && <TournamentSetupPage />}
      {currentView === 'schedule' && <StageSchedulePage />}
      {currentView === 'fullSchedule' && <FullSchedulePage />}
      {currentView === 'knockout' && <KnockoutPage />}
      {currentView === 'profile' && <UserProfilePage />}
      <Toaster />
    </>
  );
}

export default App;
