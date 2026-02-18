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
import { Loader2, Pencil, Trash2, FolderOpen, Check, X } from 'lucide-react';
import { useActor } from '../hooks/useActor';

interface TournamentListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TournamentListDialog({ open, onOpenChange }: TournamentListDialogProps) {
  const { data: tournaments, isLoading } = useGetAllTournaments();
  const { actor } = useActor();
  const updateName = useUpdateTournamentName();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<{ id: bigint; name: string } | null>(null);
  const [loadingTournamentId, setLoadingTournamentId] = useState<string | null>(null);

  const { loadTournamentFromBackend, setCurrentView } = useTournamentStore();

  const handleRename = async (id: bigint) => {
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

  const handleLoad = async (id: bigint, name: string) => {
    if (!actor) {
      toast.error('Backend not initialized');
      return;
    }

    setLoadingTournamentId(id.toString());
    try {
      // Fetch tournament data from backend
      const tournamentView = await actor.getTournament(id);
      
      if (!tournamentView) {
        toast.error('Tournament not found');
        return;
      }

      const deserialized = deserializeTournament(tournamentView);

      // Load into store
      loadTournamentFromBackend(deserialized);

      toast.success(`Loaded tournament: ${name}`);
      setCurrentView('schedule');
      onOpenChange(false);
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('Failed to load tournament');
    } finally {
      setLoadingTournamentId(null);
    }
  };

  const handleDeleteClick = (id: bigint, name: string) => {
    setSelectedTournament({ id, name });
    setDeleteDialogOpen(true);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Tournaments</DialogTitle>
            <DialogDescription>
              Load, rename, or delete your saved tournaments.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tournaments && tournaments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map(([id, tournament]) => (
                  <TableRow key={id.toString()}>
                    <TableCell>
                      {editingId === id.toString() ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRename(id)}
                            disabled={updateName.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLoad(id, tournament.name)}
                          disabled={loadingTournamentId === id.toString()}
                          className="font-medium text-left hover:text-primary hover:underline cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {tournament.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tournament.creationDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoad(id, tournament.name)}
                          disabled={loadingTournamentId === id.toString()}
                        >
                          {loadingTournamentId === id.toString() ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FolderOpen className="h-4 w-4" />
                          )}
                          <span className="ml-2">Load</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(id.toString());
                            setEditingName(tournament.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(id, tournament.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tournaments saved yet. Create and save your first tournament!
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
          onDeleted={() => {
            setSelectedTournament(null);
          }}
        />
      )}
    </>
  );
}
