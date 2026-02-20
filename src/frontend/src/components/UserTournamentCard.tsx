import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TournamentView } from '../backend';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { deserializeTournament } from '../features/tournament/deserialization';

interface UserTournamentCardProps {
  id: bigint;
  tournament: TournamentView;
}

export default function UserTournamentCard({ id, tournament }: UserTournamentCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { loadTournamentFromBackend } = useTournamentStore();

  const creationDate = new Date(Number(tournament.creationDate) / 1000000);
  const totalGroups = tournament.draws.groups.length;
  const totalStages = tournament.draws.stages.length;

  const handleLoadTournament = async () => {
    setIsLoading(true);
    try {
      const deserialized = deserializeTournament(tournament);
      loadTournamentFromBackend(deserialized);
      toast.success(`Tournament loaded: ${tournament.name}`);
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('Failed to load tournament');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleLoadTournament}>
      <CardHeader>
        <CardTitle className="text-lg">{tournament.name}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs">
          <Calendar className="h-3 w-3" />
          {creationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Groups</span>
          <span className="font-medium">{totalGroups}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Stages</span>
          <span className="font-medium">{totalStages}</span>
        </div>
        <Button
          className="w-full"
          size="sm"
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            handleLoadTournament();
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Load Tournament
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
