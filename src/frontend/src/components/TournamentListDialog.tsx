import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useGetAllTournaments, useUpdateTournamentName } from '../hooks/useQueries';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { deserializeTournament } from '../features/tournament/deserialization';
import DeleteTournamentDialog from './DeleteTournamentDialog';
import { Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
import type { TournamentView } from '../backend';

interface TournamentListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TournamentListDialog({ open, onOpenChange }: TournamentListDialogProps) {
  const { data: tournaments, isLoading } = useGetAllTournaments();
  const updateName = useUpdateTournamentName();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<{ id: bigint; name: string } | null>(null);
  const [loadingTournamentId, setLoadingTournamentId] = useState<string | null>(null);

  const { loadTournamentFromBackend } = useTournamentStore();

  const handleRename = async (id: bigint, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!editingName.trim()) {
      toast.error('Tournament name cannot be empty');
      return;
    }

    try {
      await updateName.mutateAsync({ id, newName: editingName.trim() });
      toast.success('Tournament renamed successfully');
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error renaming tournament:', error);
      toast.error('Failed to rename tournament');
    }
  };

  const handleLoad = async (id: bigint, tournament: TournamentView, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    setLoadingTournamentId(id.toString());
    try {
      const deserialized = deserializeTournament(tournament);
      loadTournamentFromBackend(deserialized);
      toast.success(`Tournament loaded: ${tournament.name}`);
      onOpenChange(false); // Close dialog after successful load
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('Failed to load tournament');
    } finally {
      setLoadingTournamentId(null);
    }
  };

  const handleDelete = (id: bigint, name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTournament({ id, name });
    setDeleteDialogOpen(true);
  };

  const startEditing = (id: bigint, currentName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(id.toString());
    setEditingName(currentName);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditingName('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Tournaments</DialogTitle>
            <DialogDescription>
              Load, rename, or delete your saved tournaments
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tournaments && tournaments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map(([id, tournament]) => (
                  <TableRow
                    key={id.toString()}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => handleLoad(id, tournament, e)}
                  >
                    <TableCell>
                      {editingId === id.toString() ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRename(id);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleRename(id, e)}
                            disabled={updateName.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">{tournament.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {loadingTournamentId === id.toString() ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => startEditing(id, tournament.name, e)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleDelete(id, tournament.name, e)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tournaments saved yet
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedTournament && (
        <DeleteTournamentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.name}
        />
      )}
    </>
  );
}
