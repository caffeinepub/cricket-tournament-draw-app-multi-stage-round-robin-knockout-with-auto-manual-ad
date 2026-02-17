import { useMemo } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Trophy, Medal, X } from 'lucide-react';
import { formatDestination } from '../features/tournament/validation';

export default function Stage2GroupAssignmentPanel() {
  const { roundRobinRounds, stageAdvancementConfigs } = useTournamentStore();

  const stageFlow = useMemo(() => {
    return roundRobinRounds.map((round) => {
      const config = stageAdvancementConfigs.find(c => c.stageNumber === round.roundNumber);
      return {
        stageNumber: round.roundNumber,
        groupCount: round.groupCount,
        winnerDestination: config?.winnerDestination,
        runnerUpDestination: config?.runnerUpDestination,
      };
    });
  }, [roundRobinRounds, stageAdvancementConfigs]);

  if (stageFlow.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stage Flow Preview</CardTitle>
        <CardDescription>How teams advance through the tournament</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stageFlow.map((stage, index) => (
          <div key={stage.stageNumber} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-semibold">
                Robin Round {stage.stageNumber}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({stage.groupCount} groups)
              </span>
            </div>

            <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
              {/* Winners */}
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <span className="font-medium">Winners:</span>
                {stage.winnerDestination ? (
                  <>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="default" className="text-xs">
                      {formatDestination(stage.winnerDestination)}
                    </Badge>
                  </>
                ) : (
                  <span className="text-muted-foreground italic">Not configured</span>
                )}
              </div>

              {/* Runner-ups */}
              <div className="flex items-center gap-2 text-sm">
                <Medal className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Runners-up:</span>
                {stage.runnerUpDestination ? (
                  <>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {stage.runnerUpDestination.type === 'Eliminated' ? (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                        <X className="h-3 w-3" />
                        Eliminated
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {formatDestination(stage.runnerUpDestination)}
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground italic">Not configured</span>
                )}
              </div>
            </div>

            {index < stageFlow.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
