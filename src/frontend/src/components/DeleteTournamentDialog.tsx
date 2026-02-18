import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useDeleteTournament } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';

interface DeleteTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: bigint;
  tournamentName: string;
  onDeleted?: () => void;
}

export default function DeleteTournamentDialog({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
  onDeleted,
}: DeleteTournamentDialogProps) {
  const deleteTournament = useDeleteTournament();

  const handleDelete = async () => {
    try {
      const success = await deleteTournament.mutateAsync(tournamentId);
      if (success) {
        toast.success('Tournament deleted successfully');
        onOpenChange(false);
        onDeleted?.();
      } else {
        toast.error('Failed to delete tournament');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast.error('Failed to delete tournament');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{tournamentName}</strong>? This action cannot be undone and will permanently remove all tournament data including draws, stages, and groups.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTournament.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTournament.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTournament.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Tournament
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
