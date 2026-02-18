import { useMemo } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { getQualifiedTeamsForKnockout } from '../features/tournament/qualification';
import { getFirstEnabledRound } from '../features/tournament/knockoutRounds';
import { getFixtureCodeForMatch } from '../features/tournament/knockoutFixtureCode';
import { toast } from 'sonner';

export default function KnockoutPairingEditor() {
  const {
    knockoutPairingMode,
    setKnockoutPairingMode,
    knockoutFixtureAssignments,
    assignKnockoutFixture,
    validateManualPairing,
    stages,
    stageAdvancementConfigs,
    knockoutStages,
    roundRobinRounds,
    knockoutMatches,
    knockoutWarnings,
  } = useTournamentStore();

  // Get qualified teams using shared utility
  const qualifiedTeams = useMemo(() => {
    const teams = getQualifiedTeamsForKnockout(stages, stageAdvancementConfigs, knockoutStages, roundRobinRounds);
    // Filter out TBD placeholder teams
    return teams.filter(team => !team.id.startsWith('tbd-'));
  }, [stages, stageAdvancementConfigs, knockoutStages, roundRobinRounds]);

  // Get first round matches using canonical round detection
  const firstRoundMatches = useMemo(() => {
    if (knockoutMatches.length === 0) return [];
    
    const firstRound = getFirstEnabledRound(knockoutStages);
    if (!firstRound) return [];
    
    return knockoutMatches.filter(m => m.round === firstRound && !m.team1.id.startsWith('tbd-'));
  }, [knockoutMatches, knockoutStages]);

  const handleModeToggle = () => {
    const newMode = knockoutPairingMode === 'auto' ? 'manual' : 'auto';
    setKnockoutPairingMode(newMode);
    toast.success(`Switched to ${newMode} pairing mode`);
  };

  const handleTeamAssignment = (matchId: string, position: 'team1' | 'team2', teamId: string) => {
    const currentAssignment = knockoutFixtureAssignments.find(a => a.matchId === matchId);
    
    const newAssignment = {
      matchId,
      team1Id: position === 'team1' ? teamId : currentAssignment?.team1Id,
      team2Id: position === 'team2' ? teamId : currentAssignment?.team2Id,
    };

    // Validate the pairing
    const warnings = validateManualPairing(newAssignment);
    if (warnings.length > 0) {
      toast.warning('Pairing Warning', {
        description: warnings.join(' '),
      });
    }

    assignKnockoutFixture(newAssignment);
  };

  if (qualifiedTeams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knockout Pairing</CardTitle>
          <CardDescription>Configure first-round matchups</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No qualified teams yet. Complete the group stage configuration first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Knockout Pairing</CardTitle>
            <CardDescription>
              {knockoutPairingMode === 'auto' 
                ? 'Automatic pairing with rematch avoidance' 
                : 'Manually assign teams to first-round matches'}
            </CardDescription>
          </div>
          <Button
            onClick={handleModeToggle}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            {knockoutPairingMode === 'auto' ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Switch to Manual
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Switch to Auto
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {knockoutPairingMode === 'auto' ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Shuffle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Automatic Pairing Active</p>
                    <p className="text-sm text-muted-foreground">
                      Teams are automatically arranged to minimize rematches from the group stage. 
                      Teams that already played will be placed in opposite bracket halves when possible.
                    </p>
                  </div>
                </div>
              </div>

              {/* Display reseeding warnings in auto mode (English-only, no emoji) */}
              {knockoutWarnings.reseedingWarnings.length > 0 && (
                <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                    <div className="font-semibold mb-2">Bracket Constraints</div>
                    <div className="space-y-1">
                      {knockoutWarnings.reseedingWarnings.map((warning, idx) => (
                        <div key={idx} className="text-xs leading-relaxed">{warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {firstRoundMatches.map((match) => {
                const fixtureCode = getFixtureCodeForMatch(match, knockoutMatches);
                const assignment = knockoutFixtureAssignments.find(a => a.matchId === match.id);

                return (
                  <div key={match.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {fixtureCode && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {fixtureCode}
                        </Badge>
                      )}
                      <span className="text-sm font-medium text-muted-foreground">
                        Match {match.id.split('-').pop()}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Team 1
                        </label>
                        <Select
                          value={assignment?.team1Id || ''}
                          onValueChange={(value) => handleTeamAssignment(match.id, 'team1', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team..." />
                          </SelectTrigger>
                          <SelectContent>
                            {qualifiedTeams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Team 2
                        </label>
                        <Select
                          value={assignment?.team2Id || ''}
                          onValueChange={(value) => handleTeamAssignment(match.id, 'team2', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team..." />
                          </SelectTrigger>
                          <SelectContent>
                            {qualifiedTeams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
