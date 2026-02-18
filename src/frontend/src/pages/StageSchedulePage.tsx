import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft, RotateCcw, ArrowRight } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import RoundRobinGroupTable from '../components/RoundRobinGroupTable';
import { toast } from 'sonner';
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
import { useState } from 'react';

export default function StageSchedulePage() {
  const { stages, setCurrentView, reset } = useTournamentStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Get all round-robin stages (sorted by stage number)
  const roundRobinStages = stages.sort((a, b) => a.stageNumber - b.stageNumber);

  const handleViewSchedule = () => {
    setCurrentView('fullSchedule');
  };

  const handleBack = () => {
    setCurrentView('setup');
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    reset();
    setShowResetDialog(false);
    toast.success('Tournament reset successfully');
  };

  if (roundRobinStages.length === 0) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tournament data available. Please generate a tournament first.</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Setup
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Round Robin Groups</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                {roundRobinStages.length} {roundRobinStages.length === 1 ? 'round' : 'rounds'} • Click to edit group and team names
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleViewSchedule} variant="default" size="sm">
              View Full Schedule
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* All Round Robin Stages */}
        {roundRobinStages.map((stage) => (
          <Card key={stage.id}>
            <CardHeader>
              <CardTitle>{stage.name}</CardTitle>
              <CardDescription>
                {stage.groups.length} groups • Edit group names by clicking on them. Changes are saved automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoundRobinGroupTable stage={stage} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all tournament data and return to the setup screen. All your configurations and edits will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
