import { useState, useMemo } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { validateNumberOfTeams, validateRoundConfig, validateAdvancementRuleCompatibility, formatDestination } from '../features/tournament/validation';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    isGenerated,
  } = useTournamentStore();

  const [teamCountInput, setTeamCountInput] = useState(numberOfTeams.toString());
  const [roundConfigs, setRoundConfigs] = useState<RoundRobinRoundConfig[]>(
    roundRobinRounds.length > 0 ? roundRobinRounds : [{ roundNumber: 1, groupCount: 12 }]
  );
  // Track group count inputs as strings to allow temporary empty state
  const [groupCountInputs, setGroupCountInputs] = useState<Record<number, string>>(
    roundConfigs.reduce((acc, config) => {
      acc[config.roundNumber] = config.groupCount.toString();
      return acc;
    }, {} as Record<number, string>)
  );
  const [showAdvancementDialog, setShowAdvancementDialog] = useState(false);
  const [selectedStageNumber, setSelectedStageNumber] = useState<number | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleTeamCountChange = (value: string) => {
    setTeamCountInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 4) {
      setNumberOfTeams(num);
    }
  };

  const handleRoundCountChange = (count: number) => {
    const newConfigs: RoundRobinRoundConfig[] = [];
    const newInputs: Record<number, string> = {};
    
    for (let i = 0; i < count; i++) {
      const roundNumber = i + 1;
      if (i < roundConfigs.length) {
        newConfigs.push({ ...roundConfigs[i], roundNumber });
        newInputs[roundNumber] = groupCountInputs[roundConfigs[i].roundNumber] || '2';
      } else {
        newConfigs.push({ roundNumber, groupCount: 2 });
        newInputs[roundNumber] = '2';
      }
    }
    
    setRoundConfigs(newConfigs);
    setGroupCountInputs(newInputs);
  };

  const handleGroupCountInputChange = (roundNumber: number, value: string) => {
    // Allow empty string while editing
    setGroupCountInputs(prev => ({
      ...prev,
      [roundNumber]: value,
    }));
  };

  const handleGroupCountBlur = (roundNumber: number) => {
    const value = groupCountInputs[roundNumber];
    const parsed = parseInt(value);
    
    // Clamp to minimum 1 on blur
    const finalValue = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    
    setGroupCountInputs(prev => ({
      ...prev,
      [roundNumber]: finalValue.toString(),
    }));
    
    setRoundConfigs(prev => 
      prev.map(r => r.roundNumber === roundNumber ? { ...r, groupCount: finalValue } : r)
    );
  };

  const handleOpenAdvancementDialog = (stageNumber: number) => {
    setSelectedStageNumber(stageNumber);
    setShowAdvancementDialog(true);
  };

  const handleGenerate = () => {
    // Check if tournament already generated
    if (isGenerated) {
      setShowRegenerateDialog(true);
      return;
    }

    performGeneration();
  };

  const performGeneration = () => {
    const teamCount = parseInt(teamCountInput);

    // Validate inputs
    const teamError = validateNumberOfTeams(teamCount);
    if (teamError) {
      toast.error(teamError);
      return;
    }

    // Ensure all group counts are valid before generation
    const validatedConfigs = roundConfigs.map(config => {
      const inputValue = groupCountInputs[config.roundNumber];
      const parsed = parseInt(inputValue);
      const groupCount = isNaN(parsed) || parsed < 1 ? 1 : parsed;
      return { ...config, groupCount };
    });

    // Validate each round configuration
    for (let i = 0; i < validatedConfigs.length; i++) {
      const config = validatedConfigs[i];
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
      validatedConfigs,
      stageAdvancementConfigs,
      knockoutStages
    );
    if (compatibilityError) {
      toast.error(compatibilityError);
      return;
    }

    // Update store and generate
    setRoundConfigs(validatedConfigs);
    setRoundRobinRounds(validatedConfigs);
    generateTournament();
    toast.success('Tournament generated successfully!');
  };

  const handleConfirmRegenerate = () => {
    setShowRegenerateDialog(false);
    performGeneration();
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    reset();
    setShowResetDialog(false);
    toast.success('Tournament reset successfully');
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tournament Setup</h1>
            <p className="text-sm text-muted-foreground sm:text-base">Configure your tournament structure</p>
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
                      value={groupCountInputs[config.roundNumber] || ''}
                      onChange={(e) => handleGroupCountInputChange(config.roundNumber, e.target.value)}
                      onBlur={() => handleGroupCountBlur(config.roundNumber)}
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
                      <label
                        htmlFor="pre-quarter"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Pre-Quarterfinals (16 teams)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="quarter"
                        checked={knockoutStages.quarterFinal}
                        onCheckedChange={(checked) =>
                          setKnockoutStages({ ...knockoutStages, quarterFinal: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="quarter"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Quarterfinals (8 teams)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="semi"
                        checked={knockoutStages.semiFinal}
                        onCheckedChange={(checked) =>
                          setKnockoutStages({ ...knockoutStages, semiFinal: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="semi"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Semifinals (4 teams)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="final"
                        checked={knockoutStages.final}
                        onCheckedChange={(checked) =>
                          setKnockoutStages({ ...knockoutStages, final: checked as boolean })
                        }
                      />
                      <label
                        htmlFor="final"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Final (2 teams)
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Robin Round Advancement</Label>
                  <div className="space-y-2">
                    {roundConfigs.map((config) => {
                      const stageConfig = stageAdvancementConfigs.find(
                        (c) => c.stageNumber === config.roundNumber
                      );
                      return (
                        <div
                          key={config.roundNumber}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Robin Round {config.roundNumber}</div>
                            {stageConfig ? (
                              <div className="text-xs text-muted-foreground">
                                Winners: {formatDestination(stageConfig.winnerDestination)} •
                                Runners-up: {formatDestination(stageConfig.runnerUpDestination)}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Not configured</div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAdvancementDialog(config.roundNumber)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {/* Stage Flow Preview */}
            <Stage2GroupAssignmentPanel 
              roundRobinRounds={roundConfigs}
              stageAdvancementConfigs={stageAdvancementConfigs}
            />

            {/* Validation Status */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Status</CardTitle>
                <CardDescription>Check if your configuration is valid</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requiredTeamCount > 0 && (
                  <Alert variant={isCompatible ? 'default' : 'destructive'}>
                    {isCompatible ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {isCompatible ? 'Configuration Valid' : 'Configuration Invalid'}
                    </AlertTitle>
                    <AlertDescription>
                      {isCompatible ? (
                        <>
                          Your advancement rules will qualify exactly {qualifiedTeamCount} teams for the
                          knockout stage.
                        </>
                      ) : (
                        <>
                          Your advancement rules qualify {qualifiedTeamCount} teams, but the first enabled
                          knockout stage requires {requiredTeamCount} teams. Please adjust your advancement
                          rules or knockout stages.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {requiredTeamCount === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Knockout Stage</AlertTitle>
                    <AlertDescription>
                      Enable at least one knockout stage to proceed with tournament generation.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleGenerate}
                disabled={!isCompatible || requiredTeamCount === 0}
                className="flex-1"
                size="lg"
              >
                <Trophy className="mr-2 h-5 w-5" />
                {isGenerated ? 'Regenerate Tournament' : 'Generate Tournament'}
              </Button>
              {isGenerated && (
                <Button onClick={handleReset} variant="outline" size="lg">
                  Reset
                </Button>
              )}
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

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will regenerate the entire tournament with the current configuration. All existing
              matches, schedules, and results will be replaced. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegenerate}>Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the entire tournament to its initial state. All configuration, matches,
              schedules, and results will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
