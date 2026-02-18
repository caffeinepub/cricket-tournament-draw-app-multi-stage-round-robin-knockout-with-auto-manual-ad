import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NewTournamentButton() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { reset, isGenerated } = useTournamentStore();

  const handleNewTournament = () => {
    if (isGenerated) {
      setShowConfirmDialog(true);
    } else {
      reset();
      toast.success('Started new tournament');
    }
  };

  const handleConfirm = () => {
    reset();
    setShowConfirmDialog(false);
    toast.success('Started new tournament');
  };

  return (
    <>
      <Button onClick={handleNewTournament} variant="outline">
        <PlusCircle className="mr-2 h-4 w-4" />
        New Tournament
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your current tournament setup. Make sure you've saved your work if you want to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Start New Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
