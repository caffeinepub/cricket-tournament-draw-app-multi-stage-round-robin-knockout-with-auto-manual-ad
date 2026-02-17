import { useMemo } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shuffle, Lock, Unlock } from 'lucide-react';
import { getQualifiedTeamsForKnockout } from '../features/tournament/qualification';

export default function KnockoutPairingEditor() {
  const {
    knockoutPairingMode,
    setKnockoutPairingMode,
    knockoutFixtureAssignments,
    assignKnockoutFixture,
    stages,
    stageAdvancementConfigs,
    knockoutStages,
    roundRobinRounds,
    knockoutMatches,
  } = useTournamentStore();

  // Get qualified teams using shared utility
  const qualifiedTeams = useMemo(() => {
    return getQualifiedTeamsForKnockout(stages, stageAdvancementConfigs, knockoutStages, roundRobinRounds);
  }, [stages, stageAdvancementConfigs, knockoutStages, roundRobinRounds]);

  // Get first round matches (Pre-QF or QF or SF or Final)
  const firstRoundMatches = useMemo(() => {
    if (knockoutMatches.length === 0) return [];
    
    const roundOrder = ['Pre Quarter Final', 'Quarter Final', 'Semi Final', 'Final'];
    const firstRound = roundOrder.find(round => 
      knockoutMatches.some(m => m.round === round)
    );
    
    return knockoutMatches.filter(m => m.round === firstRound && m.team1.id !== 'tbd');
  }, [knockoutMatches]);

  const handleModeToggle = () => {
    const newMode = knockoutPairingMode === 'auto' ? 'manual' : 'auto';
    setKnockoutPairingMode(newMode);
  };

  const handleTeamAssignment = (matchId: string, position: 'team1' | 'team2', teamId: string) => {
    const currentAssignment = knockoutFixtureAssignments.find(a => a.matchId === matchId);
    
    assignKnockoutFixture(
      matchId,
      position === 'team1' ? teamId : currentAssignment?.team1Id,
      position === 'team2' ? teamId : currentAssignment?.team2Id
    );
  };

  if (firstRoundMatches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Knockout Pairing</CardTitle>
            <CardDescription>
              Configure how teams are paired in the first knockout round
            </CardDescription>
          </div>
          <Button
            variant={knockoutPairingMode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={handleModeToggle}
          >
            {knockoutPairingMode === 'manual' ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Manual
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Auto
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {knockoutPairingMode === 'auto' ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Shuffle className="h-4 w-4" />
            <span>Teams are automatically paired in order of qualification</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Manually assign teams to each match fixture
            </div>
            
            {/* Qualified Teams Pool */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Available Teams ({qualifiedTeams.length})</div>
              <div className="flex flex-wrap gap-2">
                {qualifiedTeams.map(team => (
                  <Badge key={team.id} variant="outline">
                    {team.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Match Assignments */}
            <div className="space-y-3">
              {firstRoundMatches.map((match, index) => {
                const assignment = knockoutFixtureAssignments.find(a => a.matchId === match.id);
                
                return (
                  <div key={match.id} className="border rounded-lg p-4 space-y-3">
                    <div className="font-medium text-sm">Match {index + 1}</div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Team 1</label>
                        <Select
                          value={assignment?.team1Id || match.team1.id}
                          onValueChange={(value) => handleTeamAssignment(match.id, 'team1', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {qualifiedTeams.map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Team 2</label>
                        <Select
                          value={assignment?.team2Id || match.team2.id}
                          onValueChange={(value) => handleTeamAssignment(match.id, 'team2', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {qualifiedTeams.map(team => (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
