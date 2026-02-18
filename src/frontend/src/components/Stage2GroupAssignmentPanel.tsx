import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, Trophy, X } from 'lucide-react';
import { RoundRobinRoundConfig, StageAdvancementConfig } from '../features/tournament/types';
import { formatDestination } from '../features/tournament/validation';

interface Stage2GroupAssignmentPanelProps {
  roundRobinRounds: RoundRobinRoundConfig[];
  stageAdvancementConfigs: StageAdvancementConfig[];
}

export default function Stage2GroupAssignmentPanel({
  roundRobinRounds,
  stageAdvancementConfigs,
}: Stage2GroupAssignmentPanelProps) {
  // Build stage flow visualization
  const stageFlow = useMemo(() => {
    return roundRobinRounds.map((round) => {
      const config = stageAdvancementConfigs.find((c) => c.stageNumber === round.roundNumber);
      return {
        roundNumber: round.roundNumber,
        groupCount: round.groupCount,
        winnerDestination: config?.winnerDestination,
        runnerUpDestination: config?.runnerUpDestination,
      };
    });
  }, [roundRobinRounds, stageAdvancementConfigs]);

  if (roundRobinRounds.length <= 1) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage Flow Preview</CardTitle>
        <CardDescription>
          How teams advance between round-robin stages and to knockout. Robin Round 2 is populated exclusively from Robin Round 1 runner-ups in deterministic group order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stageFlow.map((stage, index) => (
            <div key={stage.roundNumber}>
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Robin Round {stage.roundNumber}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {stage.groupCount} {stage.groupCount === 1 ? 'Group' : 'Groups'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {stage.winnerDestination && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-muted-foreground">Winners:</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant="outline" className="font-normal">
                        {formatDestination(stage.winnerDestination)}
                      </Badge>
                    </div>
                  )}

                  {stage.runnerUpDestination && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-muted-foreground">Runners-up:</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      {stage.runnerUpDestination.type === 'Eliminated' ? (
                        <Badge variant="destructive" className="font-normal">
                          <X className="mr-1 h-3 w-3" />
                          Eliminated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal">
                          {formatDestination(stage.runnerUpDestination)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {index < stageFlow.length - 1 && (
                <div className="my-2 flex justify-center">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
