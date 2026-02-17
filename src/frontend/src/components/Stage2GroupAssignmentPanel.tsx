import { useMemo } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Info } from 'lucide-react';

export default function Stage2GroupAssignmentPanel() {
  const { roundRobinRounds, stageAdvancementConfigs } = useTournamentStore();

  const stageFlows = useMemo(() => {
    return roundRobinRounds.map(round => {
      const config = stageAdvancementConfigs.find(c => c.stageNumber === round.roundNumber);
      
      if (!config) {
        return {
          stageNumber: round.roundNumber,
          groupCount: round.groupCount,
          winnersTo: 'Not configured',
          runnersUpTo: 'Not configured',
          winnersCount: 0,
          runnersUpCount: 0,
        };
      }

      const winnersTo = config.winnerDestination.type === 'NextStage'
        ? `Round ${config.winnerDestination.stageIndex + 1}`
        : config.winnerDestination.entryPoint.replace('finals', '-Finals');
      
      const runnersUpTo = config.runnerUpDestination.type === 'NextStage'
        ? `Round ${config.runnerUpDestination.stageIndex + 1}`
        : config.runnerUpDestination.entryPoint.replace('finals', '-Finals');

      return {
        stageNumber: round.roundNumber,
        groupCount: round.groupCount,
        winnersTo,
        runnersUpTo,
        winnersCount: round.groupCount,
        runnersUpCount: round.groupCount,
      };
    });
  }, [roundRobinRounds, stageAdvancementConfigs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stage Flow Preview</CardTitle>
        <CardDescription>
          How teams advance between round-robin stages and to knockout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stageFlows.map((flow, index) => (
          <div key={flow.stageNumber} className="space-y-2">
            <div className="font-medium text-sm">Robin Round {flow.stageNumber}</div>
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default" className="text-xs">
                  {flow.winnersCount} Winners
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{flow.winnersTo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-xs">
                  {flow.runnersUpCount} Runners-up
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{flow.runnersUpTo}</span>
              </div>
            </div>
          </div>
        ))}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Configure each stage's advancement rules to control team flow through the tournament.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
