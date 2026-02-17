import { useMemo, useState } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowLeft, RotateCcw } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { getQualifiedTeamCount } from '../features/tournament/qualification';
import { KNOCKOUT_ROUND_ORDER } from '../features/tournament/knockoutRounds';
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

export default function KnockoutPage() {
  const {
    knockoutMatches,
    knockoutStages,
    stageAdvancementConfigs,
    roundRobinRounds,
    setCurrentView,
    reset,
  } = useTournamentStore();

  const [showResetDialog, setShowResetDialog] = useState(false);

  const qualifiedCount = useMemo(() => {
    return getQualifiedTeamCount(stageAdvancementConfigs, roundRobinRounds, knockoutStages);
  }, [stageAdvancementConfigs, roundRobinRounds, knockoutStages]);

  const requiredCount = useMemo(() => {
    if (knockoutStages.preQuarterFinal) return 16;
    if (knockoutStages.quarterFinal) return 8;
    if (knockoutStages.semiFinal) return 4;
    if (knockoutStages.final) return 2;
    return 0;
  }, [knockoutStages]);

  const isValid = qualifiedCount === requiredCount;

  // Group matches by round using canonical ordering
  const matchesByRound = useMemo(() => {
    const grouped = new Map<string, typeof knockoutMatches>();
    
    knockoutMatches.forEach((match) => {
      if (match.round) {
        const existing = grouped.get(match.round) || [];
        grouped.set(match.round, [...existing, match]);
      }
    });

    // Sort by canonical round order
    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      const orderA = KNOCKOUT_ROUND_ORDER.indexOf(a[0] as any);
      const orderB = KNOCKOUT_ROUND_ORDER.indexOf(b[0] as any);
      return orderA - orderB;
    });

    return new Map(sortedEntries);
  }, [knockoutMatches]);

  const handleBack = () => {
    setCurrentView('fullSchedule');
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    reset();
    setShowResetDialog(false);
    toast.success('Tournament reset successfully');
  };

  if (!isValid) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Knockout Stage</h1>
                <p className="text-sm text-muted-foreground sm:text-base">Tournament bracket</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
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

          <Card>
            <CardHeader>
              <CardTitle>Configuration Error</CardTitle>
              <CardDescription>
                The number of qualified teams ({qualifiedCount}) doesn't match the required teams ({requiredCount}) for the knockout stage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Schedule
              </Button>
            </CardContent>
          </Card>
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
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Knockout Stage</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                {qualifiedCount} qualified teams
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
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

        {/* Knockout Rounds */}
        <div className="space-y-6">
          {Array.from(matchesByRound.entries()).map(([round, matches]) => (
            <Card key={round}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>{round}</CardTitle>
                  <Badge variant="secondary">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1 space-y-2 sm:space-y-0">
                        <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                          <span className="font-medium">
                            {match.team1?.name || 'TBD'}
                          </span>
                          <span className="text-sm text-muted-foreground">vs</span>
                          <span className="font-medium">
                            {match.team2?.name || 'TBD'}
                          </span>
                        </div>
                      </div>
                      {match.date && match.time && (
                        <div className="text-sm text-muted-foreground sm:text-right">
                          {match.date} at {match.time}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
