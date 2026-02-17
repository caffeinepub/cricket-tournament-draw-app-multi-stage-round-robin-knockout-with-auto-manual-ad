import { useMemo, useState } from 'react';
import { Stage } from '../features/tournament/types';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Input } from '@/components/ui/input';

interface RoundRobinGroupTableProps {
  stage: Stage;
}

export default function RoundRobinGroupTable({ stage }: RoundRobinGroupTableProps) {
  const { updateTeamName } = useTournamentStore();
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stage.groups.map((group) => (
        <div key={group.id} className="space-y-2">
          {/* Group Header */}
          <div className="rounded-lg bg-primary/10 p-3 text-center font-semibold">
            Group {group.name}
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

              return (
                <div
                  key={team.id}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                >
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
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
