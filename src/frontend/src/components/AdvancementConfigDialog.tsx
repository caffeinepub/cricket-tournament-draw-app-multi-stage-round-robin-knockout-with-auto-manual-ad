import { useState, useEffect } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { StageAdvancementConfig, AdvancementDestination, KnockoutEntryPoint } from '../features/tournament/types';

interface AdvancementConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageNumber: number;
  totalStages: number;
}

export default function AdvancementConfigDialog({
  open,
  onOpenChange,
  stageNumber,
  totalStages,
}: AdvancementConfigDialogProps) {
  const { stageAdvancementConfigs, setStageAdvancementConfig, knockoutStages } = useTournamentStore();
  
  const existingConfig = stageAdvancementConfigs.find(c => c.stageNumber === stageNumber);
  
  const [winnerDestType, setWinnerDestType] = useState<'NextStage' | 'KnockoutEntry'>(
    existingConfig?.winnerDestination.type === 'Eliminated' ? 'KnockoutEntry' : 
    (existingConfig?.winnerDestination.type || 'KnockoutEntry')
  );
  const [winnerNextStage, setWinnerNextStage] = useState<number>(
    existingConfig?.winnerDestination.type === 'NextStage' 
      ? existingConfig.winnerDestination.stageIndex 
      : stageNumber
  );
  const [winnerKnockoutEntry, setWinnerKnockoutEntry] = useState<KnockoutEntryPoint>(
    existingConfig?.winnerDestination.type === 'KnockoutEntry'
      ? existingConfig.winnerDestination.entryPoint
      : 'PreQuarterfinals'
  );
  
  const [runnerUpDestType, setRunnerUpDestType] = useState<'NextStage' | 'KnockoutEntry' | 'Eliminated'>(
    existingConfig?.runnerUpDestination.type || 'NextStage'
  );
  const [runnerUpNextStage, setRunnerUpNextStage] = useState<number>(
    existingConfig?.runnerUpDestination.type === 'NextStage'
      ? existingConfig.runnerUpDestination.stageIndex
      : stageNumber
  );
  const [runnerUpKnockoutEntry, setRunnerUpKnockoutEntry] = useState<KnockoutEntryPoint>(
    existingConfig?.runnerUpDestination.type === 'KnockoutEntry'
      ? existingConfig.runnerUpDestination.entryPoint
      : 'PreQuarterfinals'
  );

  const isLastStage = stageNumber === totalStages;
  const hasNextStage = stageNumber < totalStages;
  const isStage2 = stageNumber === 2;

  const handleSave = () => {
    const winnerDestination: AdvancementDestination = 
      winnerDestType === 'NextStage'
        ? { type: 'NextStage', stageIndex: winnerNextStage }
        : { type: 'KnockoutEntry', entryPoint: winnerKnockoutEntry };
    
    const runnerUpDestination: AdvancementDestination = 
      runnerUpDestType === 'Eliminated'
        ? { type: 'Eliminated' }
        : runnerUpDestType === 'NextStage'
        ? { type: 'NextStage', stageIndex: runnerUpNextStage }
        : { type: 'KnockoutEntry', entryPoint: runnerUpKnockoutEntry };
    
    const config: StageAdvancementConfig = {
      stageNumber,
      winnerDestination,
      runnerUpDestination,
    };
    
    setStageAdvancementConfig(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Advancement - Robin Round {stageNumber}</DialogTitle>
          <DialogDescription>
            Set where winners and runner-ups from this round will advance to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Winner Destination */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Winner Destination</Label>
            
            <div className="space-y-2">
              <Label htmlFor="winner-dest-type">Advance to</Label>
              <Select value={winnerDestType} onValueChange={(v) => setWinnerDestType(v as 'NextStage' | 'KnockoutEntry')}>
                <SelectTrigger id="winner-dest-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hasNextStage && <SelectItem value="NextStage">Next Round-Robin Stage</SelectItem>}
                  <SelectItem value="KnockoutEntry">Knockout Stage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {winnerDestType === 'NextStage' && hasNextStage && (
              <div className="space-y-2">
                <Label htmlFor="winner-next-stage">Next Stage</Label>
                <Select 
                  value={winnerNextStage.toString()} 
                  onValueChange={(v) => setWinnerNextStage(parseInt(v))}
                >
                  <SelectTrigger id="winner-next-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalStages - stageNumber }, (_, i) => stageNumber + i + 1).map(stage => (
                      <SelectItem key={stage} value={stage.toString()}>
                        Robin Round {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {winnerDestType === 'KnockoutEntry' && (
              <div className="space-y-2">
                <Label htmlFor="winner-knockout-entry">Knockout Entry Point</Label>
                <Select 
                  value={winnerKnockoutEntry} 
                  onValueChange={(v) => setWinnerKnockoutEntry(v as KnockoutEntryPoint)}
                >
                  <SelectTrigger id="winner-knockout-entry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {knockoutStages.preQuarterFinal && (
                      <SelectItem value="PreQuarterfinals">Pre-Quarterfinals (16 teams)</SelectItem>
                    )}
                    {knockoutStages.quarterFinal && (
                      <SelectItem value="Quarterfinals">Quarterfinals (8 teams)</SelectItem>
                    )}
                    {knockoutStages.semiFinal && (
                      <SelectItem value="Semifinals">Semifinals (4 teams)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Runner-up Destination */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Runner-up Destination</Label>
            
            <div className="space-y-2">
              <Label htmlFor="runnerup-dest-type">Advance to</Label>
              <Select value={runnerUpDestType} onValueChange={(v) => setRunnerUpDestType(v as 'NextStage' | 'KnockoutEntry' | 'Eliminated')}>
                <SelectTrigger id="runnerup-dest-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hasNextStage && <SelectItem value="NextStage">Next Round-Robin Stage</SelectItem>}
                  <SelectItem value="KnockoutEntry">Knockout Stage</SelectItem>
                  {isStage2 && <SelectItem value="Eliminated">Eliminate</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {runnerUpDestType === 'NextStage' && hasNextStage && (
              <div className="space-y-2">
                <Label htmlFor="runnerup-next-stage">Next Stage</Label>
                <Select 
                  value={runnerUpNextStage.toString()} 
                  onValueChange={(v) => setRunnerUpNextStage(parseInt(v))}
                >
                  <SelectTrigger id="runnerup-next-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalStages - stageNumber }, (_, i) => stageNumber + i + 1).map(stage => (
                      <SelectItem key={stage} value={stage.toString()}>
                        Robin Round {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {runnerUpDestType === 'KnockoutEntry' && (
              <div className="space-y-2">
                <Label htmlFor="runnerup-knockout-entry">Knockout Entry Point</Label>
                <Select 
                  value={runnerUpKnockoutEntry} 
                  onValueChange={(v) => setRunnerUpKnockoutEntry(v as KnockoutEntryPoint)}
                >
                  <SelectTrigger id="runnerup-knockout-entry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {knockoutStages.preQuarterFinal && (
                      <SelectItem value="PreQuarterfinals">Pre-Quarterfinals (16 teams)</SelectItem>
                    )}
                    {knockoutStages.quarterFinal && (
                      <SelectItem value="Quarterfinals">Quarterfinals (8 teams)</SelectItem>
                    )}
                    {knockoutStages.semiFinal && (
                      <SelectItem value="Semifinals">Semifinals (4 teams)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {runnerUpDestType === 'Eliminated' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Runner-ups from this round will be eliminated and will not advance to any further stages.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Teams routed to "Next Round-Robin Stage" will participate in that stage's groups. 
              Teams routed to "Knockout Stage" will enter the knockout bracket directly.
              {isStage2 && " Teams marked as \"Eliminate\" will not advance further."}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
