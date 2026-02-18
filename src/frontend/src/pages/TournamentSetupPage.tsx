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
import { Trophy, AlertCircle, CheckCircle2, Info, Plus, Minus, Settings, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '../components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { RoundRobinRoundConfig, StageAdvancementConfig } from '../features/tournament/types';
import AdvancementConfigDialog from '../components/AdvancementConfigDialog';
import Stage2GroupAssignmentPanel from '../components/Stage2GroupAssignmentPanel';
import { getQualifiedTeamCount } from '../features/tournament/qualification';
import SaveTournamentDialog from '../components/SaveTournamentDialog';
import TournamentListDialog from '../components/TournamentListDialog';
import NewTournamentButton from '../components/NewTournamentButton';
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showTournamentListDialog, setShowTournamentListDialog] = useState(false);

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

    for (let i = 1; i <= count; i++) {
      const existing = roundConfigs.find((c) => c.roundNumber === i);
      if (existing) {
        newConfigs.push(existing);
        newInputs[i] = groupCountInputs[i] || existing.groupCount.toString();
      } else {
        const defaultGroupCount = i === 1 ? 12 : 4;
        newConfigs.push({ roundNumber: i, groupCount: defaultGroupCount });
        newInputs[i] = defaultGroupCount.toString();
      }
    }

    setRoundConfigs(newConfigs);
    setGroupCountInputs(newInputs);
  };

  const handleGroupCountChange = (roundNumber: number, value: string) => {
    setGroupCountInputs((prev) => ({ ...prev, [roundNumber]: value }));

    const num = parseInt(value);
    if (!isNaN(num) && num >= 1) {
      setRoundConfigs((prev) =>
        prev.map((config) =>
          config.roundNumber === roundNumber ? { ...config, groupCount: num } : config
        )
      );
    }
  };

  const handleConfigureAdvancement = (stageNumber: number) => {
    setSelectedStageNumber(stageNumber);
    setShowAdvancementDialog(true);
  };

  const handleGenerate = () => {
    if (isGenerated) {
      setShowRegenerateDialog(true);
    } else {
      performGenerate();
    }
  };

  const performGenerate = () => {
    setRoundRobinRounds(roundConfigs);
    generateTournament();
    toast.success('Tournament generated successfully!');
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    reset();
    setRoundConfigs([{ roundNumber: 1, groupCount: 12 }]);
    setGroupCountInputs({ 1: '12' });
    setTeamCountInput('48');
    toast.success('Tournament reset successfully');
    setShowResetDialog(false);
  };

  // Validation
  const teamCountError = validateNumberOfTeams(numberOfTeams);
  const roundConfigErrors = roundConfigs.map((config) => validateRoundConfig(numberOfTeams, config));
  const hasRoundConfigErrors = roundConfigErrors.some((error) => error !== null);

  // Check advancement rule compatibility
  const advancementCompatibilityError = useMemo(() => {
    return validateAdvancementRuleCompatibility(
      numberOfTeams,
      roundConfigs,
      stageAdvancementConfigs,
      knockoutStages
    );
  }, [numberOfTeams, roundConfigs, stageAdvancementConfigs, knockoutStages]);

  const canGenerate =
    !teamCountError && !hasRoundConfigErrors && !advancementCompatibilityError;

  // Calculate qualified team count for knockout
  const qualifiedTeamCount = useMemo(() => {
    return getQualifiedTeamCount(stageAdvancementConfigs, roundConfigs, knockoutStages);
  }, [stageAdvancementConfigs, roundConfigs, knockoutStages]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Tournament Setup
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your tournament structure and advancement rules
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NewTournamentButton />
            <Button onClick={() => setShowTournamentListDialog(true)} variant="outline">
              <FolderOpen className="mr-2 h-4 w-4" />
              Manage Tournaments
            </Button>
            {isGenerated && (
              <Button onClick={() => setShowSaveDialog(true)} variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save Tournament
              </Button>
            )}
          </div>
        </div>

        {/* Step 1: Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="rounded-full w-6 h-6 flex items-center justify-center p-0">
                1
              </Badge>
              Basic Configuration
            </CardTitle>
            <CardDescription>Set the number of teams and round-robin rounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Number of Teams */}
            <div className="space-y-2">
              <Label htmlFor="team-count">Number of Teams</Label>
              <Input
                id="team-count"
                type="number"
                min="4"
                value={teamCountInput}
                onChange={(e) => handleTeamCountChange(e.target.value)}
                className={teamCountError ? 'border-destructive' : ''}
              />
              {teamCountError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {teamCountError}
                </p>
              )}
            </div>

            <Separator />

            {/* Round-Robin Rounds */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Round-Robin Rounds</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRoundCountChange(Math.max(1, roundConfigs.length - 1))}
                    disabled={roundConfigs.length <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{roundConfigs.length}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRoundCountChange(roundConfigs.length + 1)}
                    disabled={roundConfigs.length >= 3}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

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
                    onChange={(e) => handleGroupCountChange(config.roundNumber, e.target.value)}
                    className={roundConfigErrors[index] ? 'border-destructive' : ''}
                  />
                  {roundConfigErrors[index] && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {roundConfigErrors[index]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Advancement Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="rounded-full w-6 h-6 flex items-center justify-center p-0">
                2
              </Badge>
              Advancement Rules
            </CardTitle>
            <CardDescription>Configure how teams advance between stages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roundConfigs.map((config) => {
              const advConfig = stageAdvancementConfigs.find(
                (c) => c.stageNumber === config.roundNumber
              );
              const hasConfig = !!advConfig;

              return (
                <div
                  key={config.roundNumber}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium">Robin Round {config.roundNumber}</h4>
                    {hasConfig ? (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Winners → {formatDestination(advConfig.winnerDestination)}
                        </p>
                        <p>
                          Runner-ups →{' '}
                          {formatDestination(advConfig.runnerUpDestination)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not configured</p>
                    )}
                  </div>
                  <Button
                    variant={hasConfig ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleConfigureAdvancement(config.roundNumber)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {hasConfig ? 'Edit' : 'Configure'}
                  </Button>
                </div>
              );
            })}

            {advancementCompatibilityError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Issue</AlertTitle>
                <AlertDescription>
                  {advancementCompatibilityError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Knockout Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="rounded-full w-6 h-6 flex items-center justify-center p-0">
                3
              </Badge>
              Knockout Stages
            </CardTitle>
            <CardDescription>Select which knockout stages to include</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pre-quarter"
                  checked={knockoutStages.preQuarterFinal}
                  onCheckedChange={(checked) =>
                    setKnockoutStages({ ...knockoutStages, preQuarterFinal: !!checked })
                  }
                />
                <Label htmlFor="pre-quarter" className="cursor-pointer">
                  Pre-Quarterfinals (16 teams)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quarter"
                  checked={knockoutStages.quarterFinal}
                  onCheckedChange={(checked) =>
                    setKnockoutStages({ ...knockoutStages, quarterFinal: !!checked })
                  }
                />
                <Label htmlFor="quarter" className="cursor-pointer">
                  Quarterfinals (8 teams)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="semi"
                  checked={knockoutStages.semiFinal}
                  onCheckedChange={(checked) =>
                    setKnockoutStages({ ...knockoutStages, semiFinal: !!checked })
                  }
                />
                <Label htmlFor="semi" className="cursor-pointer">
                  Semifinals (4 teams)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="final"
                  checked={knockoutStages.final}
                  onCheckedChange={(checked) =>
                    setKnockoutStages({ ...knockoutStages, final: !!checked })
                  }
                />
                <Label htmlFor="final" className="cursor-pointer">
                  Final (2 teams)
                </Label>
              </div>
            </div>

            {qualifiedTeamCount > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Qualified Teams</AlertTitle>
                <AlertDescription>
                  {qualifiedTeamCount} teams will qualify for the knockout stage based on your
                  advancement rules.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Stage 2 Assignment Preview */}
        {roundConfigs.length >= 2 && (
          <Stage2GroupAssignmentPanel
            roundRobinRounds={roundConfigs}
            stageAdvancementConfigs={stageAdvancementConfigs}
          />
        )}

        {/* Generate Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            size="lg"
            className="flex-1 sm:flex-initial"
          >
            {canGenerate ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {isGenerated ? 'Regenerate Tournament' : 'Generate Tournament'}
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-5 w-5" />
                Fix Configuration Issues
              </>
            )}
          </Button>
          {isGenerated && (
            <Button onClick={handleReset} variant="outline" size="lg">
              Reset Configuration
            </Button>
          )}
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
              This will regenerate the tournament with your current configuration. Any manual changes
              to team names, group names, or match schedules will be preserved where possible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                performGenerate();
                setShowRegenerateDialog(false);
              }}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all tournament configuration and generated data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Tournament Dialog */}
      <SaveTournamentDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} />

      {/* Tournament List Dialog */}
      <TournamentListDialog open={showTournamentListDialog} onOpenChange={setShowTournamentListDialog} />
    </AppLayout>
  );
}
