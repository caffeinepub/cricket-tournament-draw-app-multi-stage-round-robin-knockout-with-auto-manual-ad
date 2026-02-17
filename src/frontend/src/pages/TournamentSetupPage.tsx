import { useState, useMemo } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { validateNumberOfTeams, validateRoundConfig, validateAdvancementRuleCompatibility, getStageAdvancementLabel } from '../features/tournament/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, AlertCircle, CheckCircle2, Info, Plus, Minus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '../components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { RoundRobinRoundConfig, StageAdvancementConfig } from '../features/tournament/types';
import AdvancementConfigDialog from '../components/AdvancementConfigDialog';
import Stage2GroupAssignmentPanel from '../components/Stage2GroupAssignmentPanel';
import { getQualifiedTeamCount } from '../features/tournament/qualification';

export default function TournamentSetupPage() {
  const {
    numberOfTeams,
    setNumberOfTeams,
    roundRobinRounds,
    setRoundRobinRounds,
    stageAdvancementConfigs,
    knockoutStages,
    setKnockoutStages,
    generateTournament,
    reset,
  } = useTournamentStore();

  const [teamCountInput, setTeamCountInput] = useState(numberOfTeams.toString());
  const [roundConfigs, setRoundConfigs] = useState<RoundRobinRoundConfig[]>(
    roundRobinRounds.length > 0 ? roundRobinRounds : [{ roundNumber: 1, groupCount: 4 }]
  );
  const [showAdvancementDialog, setShowAdvancementDialog] = useState(false);
  const [selectedStageNumber, setSelectedStageNumber] = useState<number | null>(null);

  const handleTeamCountChange = (value: string) => {
    setTeamCountInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 4) {
      setNumberOfTeams(num);
    }
  };

  const handleRoundCountChange = (count: number) => {
    const newConfigs: RoundRobinRoundConfig[] = [];
    for (let i = 0; i < count; i++) {
      if (i < roundConfigs.length) {
        newConfigs.push({ ...roundConfigs[i], roundNumber: i + 1 });
      } else {
        newConfigs.push({ roundNumber: i + 1, groupCount: 2 });
      }
    }
    setRoundConfigs(newConfigs);
  };

  const handleGroupCountChange = (roundNumber: number, groupCount: number) => {
    setRoundConfigs(prev => 
      prev.map(r => r.roundNumber === roundNumber ? { ...r, groupCount } : r)
    );
  };

  const handleOpenAdvancementDialog = (stageNumber: number) => {
    setSelectedStageNumber(stageNumber);
    setShowAdvancementDialog(true);
  };

  const handleGenerate = () => {
    const teamCount = parseInt(teamCountInput);

    // Validate inputs
    const teamError = validateNumberOfTeams(teamCount);
    if (teamError) {
      toast.error(teamError);
      return;
    }

    // Validate each round configuration
    for (let i = 0; i < roundConfigs.length; i++) {
      const config = roundConfigs[i];
      const prevRoundTeamCount = i === 0 ? teamCount : undefined;
      const roundError = validateRoundConfig(teamCount, config, prevRoundTeamCount);
      if (roundError) {
        toast.error(roundError);
        return;
      }
    }

    // Validate advancement rule compatibility
    const compatibilityError = validateAdvancementRuleCompatibility(
      teamCount,
      roundConfigs,
      stageAdvancementConfigs,
      knockoutStages
    );
    if (compatibilityError) {
      toast.error(compatibilityError);
      return;
    }

    // Update store and generate
    setRoundRobinRounds(roundConfigs);
    generateTournament();
    toast.success('Tournament generated successfully!');
  };

  // Calculate qualified team count for display
  const qualifiedTeamCount = useMemo(() => {
    return getQualifiedTeamCount(stageAdvancementConfigs, roundConfigs, knockoutStages);
  }, [stageAdvancementConfigs, roundConfigs, knockoutStages]);

  const requiredTeamCount = useMemo(() => {
    if (knockoutStages.preQuarterFinal) return 16;
    if (knockoutStages.quarterFinal) return 8;
    if (knockoutStages.semiFinal) return 4;
    if (knockoutStages.final) return 2;
    return 0;
  }, [knockoutStages]);

  const isCompatible = qualifiedTeamCount === requiredTeamCount || requiredTeamCount === 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tournament Setup</h1>
            <p className="text-muted-foreground">Configure your tournament structure</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* 1. Number of Teams */}
            <Card>
              <CardHeader>
                <CardTitle>1. Number of Teams</CardTitle>
                <CardDescription>Set the total number of teams in the tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="team-count">Number of teams</Label>
                  <Input
                    id="team-count"
                    type="number"
                    min="4"
                    value={teamCountInput}
                    onChange={(e) => handleTeamCountChange(e.target.value)}
                    placeholder="Enter number of teams"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 4 teams required</p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Number of Robin Rounds */}
            <Card>
              <CardHeader>
                <CardTitle>2. Number of Robin Rounds</CardTitle>
                <CardDescription>Set how many round-robin rounds to play</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRoundCountChange(Math.max(1, roundConfigs.length - 1))}
                      disabled={roundConfigs.length <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold">{roundConfigs.length}</div>
                      <div className="text-xs text-muted-foreground">Round{roundConfigs.length !== 1 ? 's' : ''}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRoundCountChange(roundConfigs.length + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Groups per Round */}
            <Card>
              <CardHeader>
                <CardTitle>3. Groups in Each Robin Round</CardTitle>
                <CardDescription>Configure the number of groups for each round</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roundConfigs.map((config, index) => (
                  <div key={config.roundNumber} className="space-y-2">
                    <Label htmlFor={`round-${config.roundNumber}-groups`}>
                      Robin Round {config.roundNumber} - Number of Groups
                    </Label>
                    <Input
                      id={`round-${config.roundNumber}-groups`}
                      type="number"
                      min="1"
                      value={config.groupCount}
                      onChange={(e) => handleGroupCountChange(config.roundNumber, parseInt(e.target.value) || 1)}
                      placeholder="Enter number of groups"
                    />
                    {index < roundConfigs.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 4. Advancement Rules */}
            <Card>
              <CardHeader>
                <CardTitle>4. Advancement Rules</CardTitle>
                <CardDescription>Define how teams advance from each round-robin stage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roundConfigs.map((config) => {
                  const stageConfig = stageAdvancementConfigs.find(c => c.stageNumber === config.roundNumber);
                  const isConfigured = !!stageConfig;
                  
                  return (
                    <div key={config.roundNumber} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Robin Round {config.roundNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {config.groupCount} groups
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdvancementDialog(config.roundNumber)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                      {isConfigured ? (
                        <div className="text-sm text-muted-foreground">
                          {getStageAdvancementLabel(config.roundNumber, stageAdvancementConfigs)}
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Not configured - please set advancement rules
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })}

                <Separator />

                <div className="space-y-3">
                  <Label>Knockout Stages</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pre-quarter"
                        checked={knockoutStages.preQuarterFinal}
                        onCheckedChange={(checked) =>
                          setKnockoutStages({ ...knockoutStages, preQuarterFinal: checked as boolean })
                        }
                      />
                      <Label htmlFor="pre-quarter" className="font-normal cursor-pointer">
                        Pre-Quarterfinal (16 teams)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="quarter"
                        checked={knockoutStages.quarterFinal}
                        onCheckedChange={(checked) =>
                          setKnockoutStages({ ...knockoutStages, quarterFinal: checked as boolean })
                        }
                      />
                      <Label htmlFor="quarter" className="font-normal cursor-pointer">
                        Quarterfinal (8 teams)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="semi"
                        checked={knockoutStages.semiFinal}
                        onCheckedChange={(checked) =>
                          setKnockoutStages({ ...knockoutStages, semiFinal: checked as boolean })
                        }
                      />
                      <Label htmlFor="semi" className="font-normal cursor-pointer">
                        Semifinal (4 teams)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="final"
                        checked={knockoutStages.final}
                        onCheckedChange={(checked) =>
                          setKnockoutStages({ ...knockoutStages, final: checked as boolean })
                        }
                      />
                      <Label htmlFor="final" className="font-normal cursor-pointer">
                        Final (2 teams)
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Summary</CardTitle>
                <CardDescription>Overview of your tournament configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Teams</span>
                    <Badge variant="outline">{numberOfTeams}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Robin Rounds</span>
                    <Badge variant="outline">{roundConfigs.length}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Qualified for Knockout</span>
                    <Badge variant={isCompatible ? 'default' : 'destructive'}>
                      {qualifiedTeamCount} teams
                    </Badge>
                  </div>
                  {requiredTeamCount > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Required for Knockout</span>
                        <Badge variant="outline">{requiredTeamCount} teams</Badge>
                      </div>
                    </>
                  )}
                </div>

                {!isCompatible && requiredTeamCount > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Incompatible Configuration</AlertTitle>
                    <AlertDescription>
                      Your advancement rules produce {qualifiedTeamCount} qualified teams, but the first enabled knockout stage requires exactly {requiredTeamCount} teams.
                    </AlertDescription>
                  </Alert>
                )}

                {isCompatible && requiredTeamCount > 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Configuration Valid</AlertTitle>
                    <AlertDescription>
                      Your tournament configuration is valid and ready to generate.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Stage Flow Preview */}
            {roundConfigs.length > 1 && <Stage2GroupAssignmentPanel />}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={!isCompatible}
                className="flex-1"
                size="lg"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Generate Tournament
              </Button>
              <Button onClick={reset} variant="outline" size="lg">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Advancement Config Dialog */}
      {selectedStageNumber !== null && (
        <AdvancementConfigDialog
          open={showAdvancementDialog}
          onOpenChange={setShowAdvancementDialog}
          stageNumber={selectedStageNumber}
          totalStages={roundConfigs.length}
        />
      )}
    </AppLayout>
  );
}
