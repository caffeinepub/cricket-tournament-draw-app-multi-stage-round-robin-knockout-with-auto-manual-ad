import { useMemo, useState } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Trophy, Users } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import MatchDateTimeEditor from '../components/MatchDateTimeEditor';
import KnockoutPairingEditor from '../components/KnockoutPairingEditor';
import { validateAdvancementRuleCompatibility } from '../features/tournament/validation';
import { getQualifiedTeamCount } from '../features/tournament/qualification';

export default function KnockoutPage() {
  const { knockoutMatches, stages, stageAdvancementConfigs, knockoutStages, roundRobinRounds, numberOfTeams } = useTournamentStore();
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  // Group matches by round
  const matchesByRound = useMemo(() => {
    const grouped: Record<string, typeof knockoutMatches> = {};
    knockoutMatches.forEach((match) => {
      const round = match.round || 'Unknown';
      if (!grouped[round]) {
        grouped[round] = [];
      }
      grouped[round].push(match);
    });
    return grouped;
  }, [knockoutMatches]);

  // Calculate qualified team count using shared utility
  const qualifiedTeamCount = useMemo(() => {
    return getQualifiedTeamCount(stageAdvancementConfigs, roundRobinRounds, knockoutStages);
  }, [stageAdvancementConfigs, roundRobinRounds, knockoutStages]);

  // Check for configuration compatibility
  const compatibilityError = useMemo(() => {
    return validateAdvancementRuleCompatibility(
      numberOfTeams,
      roundRobinRounds,
      stageAdvancementConfigs,
      knockoutStages
    );
  }, [numberOfTeams, roundRobinRounds, stageAdvancementConfigs, knockoutStages]);

  const roundOrder = ['Pre Quarter Final', 'Quarter Final', 'Semi Final', 'Final'];
  const sortedRounds = Object.keys(matchesByRound).sort(
    (a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b)
  );

  const toggleRound = (round: string) => {
    setExpandedRound(expandedRound === round ? null : round);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Knockout Stage
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage knockout bracket matches and pairings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Users className="h-4 w-4 mr-1" />
              {qualifiedTeamCount} teams
            </Badge>
          </div>
        </div>

        {/* Qualified Teams Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Qualified Teams</CardTitle>
            <CardDescription>
              Teams advancing to knockout based on stage advancement rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Qualified for Knockout: <strong className="text-foreground">{qualifiedTeamCount} teams</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Compatibility Warning */}
        {compatibilityError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Incompatible</AlertTitle>
            <AlertDescription>{compatibilityError}</AlertDescription>
          </Alert>
        )}

        {/* Enabled Knockout Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enabled Knockout Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {knockoutStages.preQuarterFinal && (
                <Badge variant="outline">Pre-QF</Badge>
              )}
              {knockoutStages.quarterFinal && (
                <Badge variant="outline">QF</Badge>
              )}
              {knockoutStages.semiFinal && (
                <Badge variant="outline">SF</Badge>
              )}
              {knockoutStages.final && (
                <Badge variant="outline">Final</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pairing Editor */}
        <KnockoutPairingEditor />

        {/* Knockout Matches */}
        {knockoutMatches.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No knockout matches generated yet.</p>
                <p className="text-sm mt-2">
                  Complete the round-robin stages and generate the knockout bracket.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedRounds.map((round) => {
              const matches = matchesByRound[round];
              const isExpanded = expandedRound === round;

              return (
                <Card key={round}>
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleRound(round)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{round}</CardTitle>
                      <Badge variant="secondary">{matches.length} matches</Badge>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-4">
                      {matches.map((match, index) => (
                        <div key={match.id}>
                          {index > 0 && <Separator className="my-4" />}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium">
                                    {match.team1.id === 'tbd' ? 'TBD' : match.team1.name}
                                  </span>
                                  <span className="text-muted-foreground">vs</span>
                                  <span className="font-medium">
                                    {match.team2.id === 'tbd' ? 'TBD' : match.team2.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {match.team1.id !== 'tbd' && match.team2.id !== 'tbd' && (
                              <MatchDateTimeEditor match={match} />
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
