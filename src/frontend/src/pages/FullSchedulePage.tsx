import { useMemo } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { KNOCKOUT_ROUND_ORDER } from '../features/tournament/knockoutRounds';
import { formatRoundRobinTeamDisplay } from '../features/tournament/roundRobinDisplayCode';
import { getFixtureCodeForMatch } from '../features/tournament/knockoutFixtureCode';
import { getPlaceholderDisplayLabel, isPlaceholderTeam } from '../features/tournament/knockoutPlaceholders';
import { KnockoutWinnerSelector } from '../components/KnockoutWinnerSelector';
import { formatTeamWithOriginSerial } from '../features/tournament/originGroupSerial';
import { toast } from 'sonner';

export default function FullSchedulePage() {
  const { stages, knockoutMatches, knockoutWarnings, setCurrentView, setKnockoutWinner } = useTournamentStore();

  // Group knockout matches by round using canonical ordering
  const knockoutMatchesByRound = useMemo(() => {
    const grouped = new Map<string, typeof knockoutMatches>();
    
    knockoutMatches.forEach((match) => {
      if (match.round) {
        const existing = grouped.get(match.round) || [];
        grouped.set(match.round, [...existing, match]);
      }
    });

    // Sort by canonical round order
    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      const orderA = KNOCKOUT_ROUND_ORDER.indexOf(a[0] as any);
      const orderB = KNOCKOUT_ROUND_ORDER.indexOf(b[0] as any);
      return orderA - orderB;
    });

    return new Map(sortedEntries);
  }, [knockoutMatches]);

  const handleBack = () => {
    setCurrentView('schedule');
  };

  const handleProceedToKnockout = () => {
    setCurrentView('knockout');
  };

  const handleSelectWinner = (matchId: string, winnerId: string) => {
    setKnockoutWinner(matchId, winnerId);
    toast.success('Winner updated');
  };

  /**
   * Format team display for knockout matches.
   * For real teams, use origin group serial prefix.
   * For placeholders, keep them as-is.
   */
  const formatKnockoutTeamDisplay = (teamName: string): string => {
    if (!teamName || isPlaceholderTeam(teamName)) {
      return getPlaceholderDisplayLabel(teamName);
    }
    
    // Find the team in stages to get origin serial
    for (const stage of stages) {
      for (const group of stage.groups) {
        const team = group.teams.find((t) => t.name === teamName);
        if (team) {
          return formatTeamWithOriginSerial(team, stages);
        }
      }
    }
    
    // Fallback to team name if not found
    return teamName;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Full Schedule</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Complete tournament schedule
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Button>

            <Button onClick={handleProceedToKnockout} variant="default" size="sm">
              Proceed to Knockout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Round-Robin Stages */}
        {stages.map((stage) => (
          <Card key={stage.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{stage.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {stage.groups.length} groups • {stage.matches.length} matches
                  </CardDescription>
                </div>
                <Badge variant="secondary">Round-Robin</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stage.groups.map((group) => {
                  const groupMatches = stage.matches.filter(
                    (match) => match.groupId === group.id
                  );

                  return (
                    <div key={group.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Group {group.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {groupMatches.length} {groupMatches.length === 1 ? 'match' : 'matches'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {groupMatches.map((match) => {
                          const team1Display = formatRoundRobinTeamDisplay(match, match.team1, stages);
                          const team2Display = formatRoundRobinTeamDisplay(match, match.team2, stages);

                          return (
                            <div
                              key={match.id}
                              className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{team1Display}</span>
                                <span className="text-muted-foreground">vs</span>
                                <span className="font-medium">{team2Display}</span>
                              </div>
                              {match.date && match.time && (
                                <div className="text-xs text-muted-foreground sm:text-sm">
                                  {match.date} at {match.time}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Knockout Stages */}
        {knockoutMatches.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Knockout Stage</CardTitle>
                  <CardDescription className="mt-1">
                    {knockoutMatches.length} matches
                  </CardDescription>
                </div>
                <Badge variant="secondary">Knockout</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Reseeding Warnings */}
                {knockoutWarnings.reseedingWarnings.length > 0 && (
                  <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                      <div className="font-semibold mb-1">Bracket Constraints</div>
                      {knockoutWarnings.reseedingWarnings.map((warning, idx) => (
                        <div key={idx} className="mt-1">{warning}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}

                {Array.from(knockoutMatchesByRound.entries()).map(([round, matches]) => (
                  <div key={round} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{round}</h3>
                      <Badge variant="outline" className="text-xs">
                        {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {matches.map((match) => {
                        const fixtureCode = getFixtureCodeForMatch(match, knockoutMatches);
                        const team1Display = match.team1 ? formatKnockoutTeamDisplay(match.team1.name) : 'TBD';
                        const team2Display = match.team2 ? formatKnockoutTeamDisplay(match.team2.name) : 'TBD';
                        
                        return (
                          <div
                            key={match.id}
                            className="flex flex-col gap-3 rounded-lg border bg-card p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                {fixtureCode && (
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {fixtureCode}
                                  </Badge>
                                )}
                                <span className="font-medium">
                                  {team1Display}
                                </span>
                                <span className="text-muted-foreground">vs</span>
                                <span className="font-medium">
                                  {team2Display}
                                </span>
                              </div>
                              {match.date && match.time && (
                                <div className="text-xs text-muted-foreground sm:text-sm">
                                  {match.date} at {match.time}
                                </div>
                              )}
                            </div>
                            
                            <KnockoutWinnerSelector
                              match={match}
                              onSelectWinner={handleSelectWinner}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
