import { Match } from '@/features/tournament/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { isPlaceholderTeam } from '@/features/tournament/knockoutPlaceholders';

interface KnockoutWinnerSelectorProps {
  match: Match;
  onSelectWinner: (matchId: string, winnerId: string) => void;
}

export function KnockoutWinnerSelector({ match, onSelectWinner }: KnockoutWinnerSelectorProps) {
  const team1IsPlaceholder = !match.team1 || isPlaceholderTeam(match.team1.name);
  const team2IsPlaceholder = !match.team2 || isPlaceholderTeam(match.team2.name);
  
  // Don't show selector if either team is still TBD
  if (team1IsPlaceholder || team2IsPlaceholder) {
    return null;
  }

  const team1IsWinner = match.winnerId === match.team1?.id;
  const team2IsWinner = match.winnerId === match.team2?.id;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Winner:</span>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={team1IsWinner ? 'default' : 'outline'}
          onClick={() => onSelectWinner(match.id, match.team1!.id)}
          className="h-7 px-2 text-xs"
        >
          {team1IsWinner && <Check className="mr-1 h-3 w-3" />}
          Team 1
        </Button>
        <Button
          size="sm"
          variant={team2IsWinner ? 'default' : 'outline'}
          onClick={() => onSelectWinner(match.id, match.team2!.id)}
          className="h-7 px-2 text-xs"
        >
          {team2IsWinner && <Check className="mr-1 h-3 w-3" />}
          Team 2
        </Button>
      </div>
    </div>
  );
}
