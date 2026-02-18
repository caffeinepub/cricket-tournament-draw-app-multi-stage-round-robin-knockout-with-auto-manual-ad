import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { useCreateTournament, useAddGroupToTournament, useAddStageToTournament, useGetAllTournaments } from '../hooks/useQueries';
import { serializeGroupsAndStages } from '../features/tournament/serialization';
import { Loader2 } from 'lucide-react';

interface SaveTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SaveTournamentDialog({ open, onOpenChange }: SaveTournamentDialogProps) {
  const [mode, setMode] = useState<'new' | 'update'>('new');
  const [tournamentName, setTournamentName] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');

  const { stages, stageAdvancementConfigs } = useTournamentStore();
  const { data: tournaments } = useGetAllTournaments();
  const createTournament = useCreateTournament();
  const addGroup = useAddGroupToTournament();
  const addStage = useAddStageToTournament();

  const handleSave = async () => {
    if (mode === 'new' && !tournamentName.trim()) {
      toast.error('Please enter a tournament name');
      return;
    }

    if (mode === 'update' && !selectedTournamentId) {
      toast.error('Please select a tournament to update');
      return;
    }

    try {
      const { groups, stages: serializedStages } = serializeGroupsAndStages(stages, stageAdvancementConfigs);

      if (mode === 'new') {
        // Generate new tournament ID
        const newId = BigInt(Date.now());
        
        // Create tournament
        await createTournament.mutateAsync({ id: newId, name: tournamentName.trim() });

        // Add all groups
        for (const [groupId, groupName] of groups) {
          await addGroup.mutateAsync({
            tournamentId: newId,
            groupId,
            groupName,
          });
        }

        // Add all stages
        for (const [stageId, stageType] of serializedStages) {
          await addStage.mutateAsync({
            tournamentId: newId,
            stageId,
            name: `Stage ${stageId}`,
            stageType,
          });
        }

        toast.success('Tournament saved successfully!');
      } else {
        // Update existing tournament
        const tournamentId = BigInt(selectedTournamentId);

        // Add all groups
        for (const [groupId, groupName] of groups) {
          await addGroup.mutateAsync({
            tournamentId,
            groupId,
            groupName,
          });
        }

        // Add all stages
        for (const [stageId, stageType] of serializedStages) {
          await addStage.mutateAsync({
            tournamentId,
            stageId,
            name: `Stage ${stageId}`,
            stageType,
          });
        }

        toast.success('Tournament updated successfully!');
      }

      onOpenChange(false);
      setTournamentName('');
      setSelectedTournamentId('');
    } catch (error) {
      console.error('Error saving tournament:', error);
      toast.error('Failed to save tournament');
    }
  };

  const isLoading = createTournament.isPending || addGroup.isPending || addStage.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Tournament</DialogTitle>
          <DialogDescription>
            Save your tournament configuration to load it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Save Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as 'new' | 'update')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Create New Tournament</SelectItem>
                <SelectItem value="update">Update Existing Tournament</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'new' ? (
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Enter tournament name"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Tournament</Label>
              <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments?.map(([id, tournament]) => (
                    <SelectItem key={id.toString()} value={id.toString()}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Tournament
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
