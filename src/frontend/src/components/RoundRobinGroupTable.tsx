import { useMemo, useState } from 'react';
import { Stage } from '../features/tournament/types';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface RoundRobinGroupTableProps {
  stage: Stage;
}

export default function RoundRobinGroupTable({ stage }: RoundRobinGroupTableProps) {
  const { updateTeamName, updateTeamPosition, updateGroupName } = useTournamentStore();
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupEditValue, setGroupEditValue] = useState('');

  // Calculate max teams per group for consistent row count
  const maxTeamsPerGroup = useMemo(() => {
    return Math.max(...stage.groups.map(g => g.teams.length));
  }, [stage.groups]);

  const handleStartEdit = (teamId: string, currentName: string) => {
    setEditingTeamId(teamId);
    setEditValue(currentName);
  };

  const handleSaveEdit = (teamId: string) => {
    if (editValue.trim()) {
      updateTeamName(teamId, editValue.trim());
    }
    setEditingTeamId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, teamId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(teamId);
    } else if (e.key === 'Escape') {
      setEditingTeamId(null);
      setEditValue('');
    }
  };

  const handlePositionChange = (groupId: string, teamId: string, newPosition: string) => {
    const position = parseInt(newPosition, 10);
    if (!isNaN(position)) {
      updateTeamPosition(stage.id, groupId, teamId, position);
    }
  };

  const handleStartGroupEdit = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setGroupEditValue(currentName);
  };

  const handleSaveGroupEdit = (groupId: string) => {
    const result = updateGroupName(stage.id, groupId, groupEditValue);
    
    if (result.success) {
      toast.success('Group name updated successfully');
      setEditingGroupId(null);
      setGroupEditValue('');
    } else {
      toast.error(result.error || 'Failed to update group name');
    }
  };

  const handleCancelGroupEdit = () => {
    setEditingGroupId(null);
    setGroupEditValue('');
  };

  const handleGroupKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === 'Enter') {
      handleSaveGroupEdit(groupId);
    } else if (e.key === 'Escape') {
      handleCancelGroupEdit();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stage.groups.map((group) => {
        const isEditingGroup = editingGroupId === group.id;
        
        return (
          <div key={group.id} className="space-y-2">
            {/* Group Header */}
            <div className="rounded-lg bg-primary/10 p-3 text-center font-semibold">
              {isEditingGroup ? (
                <div className="flex items-center justify-center gap-2">
                  <Input
                    value={groupEditValue}
                    onChange={(e) => setGroupEditValue(e.target.value)}
                    onKeyDown={(e) => handleGroupKeyDown(e, group.id)}
                    autoFocus
                    className="h-8 text-center text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleSaveGroupEdit(group.id)}
                  >
                    <Check className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleCancelGroupEdit}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartGroupEdit(group.id, group.name)}
                  className="group inline-flex items-center gap-2 hover:text-primary"
                >
                  <span>Group {group.name}</span>
                  <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
            </div>

            {/* Team Slots */}
            <div className="space-y-2">
              {Array.from({ length: maxTeamsPerGroup }).map((_, index) => {
                const team = group.teams[index];
                
                if (!team) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center text-sm text-muted-foreground"
                    >
                      —
                    </div>
                  );
                }

                const isEditing = editingTeamId === team.id;
                const currentPosition = index + 1;
                const serialNumber = `${group.name}-${currentPosition}`;

                return (
                  <div
                    key={team.id}
                    className="flex items-center gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    {/* Position Dropdown */}
                    <div className="flex-shrink-0">
                      <Select
                        value={currentPosition.toString()}
                        onValueChange={(value) => handlePositionChange(group.id, team.id, value)}
                      >
                        <SelectTrigger className="h-8 w-14 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: group.teams.length }, (_, i) => i + 1).map((pos) => (
                            <SelectItem key={pos} value={pos.toString()}>
                              {pos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Serial Number */}
                    <div className="flex-shrink-0 text-xs font-semibold text-muted-foreground">
                      {serialNumber}
                    </div>
                    
                    {/* Team Name */}
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(team.id)}
                          onKeyDown={(e) => handleKeyDown(e, team.id)}
                          autoFocus
                          className="h-auto border-0 p-0 text-sm focus-visible:ring-0"
                        />
                      ) : (
                        <button
                          onClick={() => handleStartEdit(team.id, team.name)}
                          className="w-full text-left text-sm font-medium hover:text-primary"
                        >
                          {team.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
