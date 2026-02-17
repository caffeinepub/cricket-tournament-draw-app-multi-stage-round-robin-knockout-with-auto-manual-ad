import { useTournamentStore } from './features/tournament/useTournamentStore';
import TournamentSetupPage from './pages/TournamentSetupPage';
import StageSchedulePage from './pages/StageSchedulePage';
import KnockoutPage from './pages/KnockoutPage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const { currentView } = useTournamentStore();

  return (
    <>
      {currentView === 'setup' && <TournamentSetupPage />}
      {currentView === 'schedule' && <StageSchedulePage />}
      {currentView === 'knockout' && <KnockoutPage />}
      <Toaster />
    </>
  );
}

export default App;
