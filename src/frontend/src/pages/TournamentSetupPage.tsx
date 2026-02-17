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
import { Trophy, AlertCircle, CheckCircle2, Info, Plus, Minus, Settings, Sparkles } from 'lucide-react';
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
    setStageAdvancementConfig,
    knockoutStages,
    setKnockoutStages,
    generateTournament,
    reset,
    isGenerated,
  } = useTournamentStore();

  const [teamCountInput, setTeamCountInput] = useState(numberOfTeams.toString());
  const [roundConfigs, setRoundConfigs] = useState<RoundRobinRoundConfig[]>(
    roundRobinRounds.length > 0 ? roundRobinRounds : [{ roundNumber: 1, groupCount: 4 }]
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

  const handleApplyPreset = () => {
    // Apply the 12-group → 4-group → Pre-Quarterfinals preset
    const presetRoundConfigs: RoundRobinRoundConfig[] = [
      { roundNumber: 1, groupCount: 12 },
      { roundNumber: 2, groupCount: 4 },
    ];
    
    const presetGroupCountInputs: Record<number, string> = {
      1: '12',
      2: '4',
    };
    
    const presetAdvancementConfigs: StageAdvancementConfig[] = [
      {
        stageNumber: 1,
        winnerDestination: { type: 'KnockoutEntry', entryPoint: 'PreQuarterfinals' },
        runnerUpDestination: { type: 'NextStage', stageIndex: 2 },
      },
      {
        stageNumber: 2,
        winnerDestination: { type: 'KnockoutEntry', entryPoint: 'PreQuarterfinals' },
        runnerUpDestination: { type: 'Eliminated' },
      },
    ];
    
    const presetKnockoutStages = {
      preQuarterFinal: true,
      quarterFinal: true,
      semiFinal: true,
      final: true,
    };
    
    // Apply all preset configurations
    setRoundConfigs(presetRoundConfigs);
    setGroupCountInputs(presetGroupCountInputs);
    setRoundRobinRounds(presetRoundConfigs);
    
    // Apply advancement configs
    presetAdvancementConfigs.forEach(config => {
      setStageAdvancementConfig(config);
    });
    
    // Apply knockout stages
    setKnockoutStages(presetKnockoutStages);
    
    toast.success('Preset applied: 12 groups (A-L) → 4 groups (M-P) → Pre-Quarterfinals');
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
            {/* Preset Button */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30">
              <CardContent className="pt-6">
                <Button 
                  onClick={handleApplyPreset} 
                  className="w-full"
                  variant="default"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Apply Preset: 12 Groups (A-L) → 4 Groups (M-P) → Pre-Quarterfinals
                </Button>
                <p className="mt-3 text-xs text-center text-muted-foreground">
                  Quick setup: Round 1 winners (A1-L1) → Pre-Quarterfinals, runners-up (A2-L2) → Round 2 (M-P), Round 2 winners (M1-P1) → Pre-Quarterfinals
                </p>
              </CardContent>
            </Card>

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
                      <Label htmlFor="pre-quarter" className="text-sm font-normal cursor-pointer">
                        Pre-Quarterfinals (16 teams)
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
                      <Label htmlFor="quarter" className="text-sm font-normal cursor-pointer">
                        Quarterfinals (8 teams)
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
                      <Label htmlFor="semi" className="text-sm font-normal cursor-pointer">
                        Semifinals (4 teams)
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
                      <Label htmlFor="final" className="text-sm font-normal cursor-pointer">
                        Final (2 teams)
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {!isCompatible && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Configuration Mismatch</AlertTitle>
                      <AlertDescription>
                        Qualified teams ({qualifiedTeamCount}) don't match required teams ({requiredTeamCount}) for the selected knockout stages.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {isCompatible && qualifiedTeamCount > 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Configuration Valid</AlertTitle>
                      <AlertDescription>
                        {qualifiedTeamCount} teams will advance to knockout stages.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={handleGenerate} className="flex-1" size="lg">
                      <Trophy className="mr-2 h-5 w-5" />
                      Generate Tournament
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="lg">
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {roundConfigs.length > 1 && (
              <Stage2GroupAssignmentPanel />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Tournament Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Teams:</span>
                  <Badge variant="secondary">{numberOfTeams}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Robin Rounds:</span>
                  <Badge variant="secondary">{roundConfigs.length}</Badge>
                </div>
                <Separator />
                {roundConfigs.map((config) => (
                  <div key={config.roundNumber} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Round {config.roundNumber} Groups:</span>
                    <Badge variant="outline">{config.groupCount}</Badge>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Qualified for Knockout:</span>
                  <Badge variant={isCompatible ? "default" : "destructive"}>
                    {qualifiedTeamCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>
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
              This will regenerate the tournament with the current configuration. All existing matches and team assignments will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegenerate}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all tournament data including configuration, teams, matches, and results. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
