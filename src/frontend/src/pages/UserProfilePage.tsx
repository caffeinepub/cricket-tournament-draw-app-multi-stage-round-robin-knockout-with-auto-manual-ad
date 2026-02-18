import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Calendar, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { useGetCallerUserProfile, useSetProfilePrivacy, useUpdateUsername, useGetAllTournaments } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import UserTournamentCard from '../components/UserTournamentCard';
import AppLayout from '../components/AppLayout';

export default function UserProfilePage() {
  const { setCurrentView } = useTournamentStore();
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: tournaments, isLoading: tournamentsLoading } = useGetAllTournaments();
  const setPrivacy = useSetProfilePrivacy();
  const updateUsername = useUpdateUsername();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const handlePrivacyToggle = async (checked: boolean) => {
    try {
      await setPrivacy.mutateAsync(checked);
      toast.success(`Profile is now ${checked ? 'private' : 'public'}`);
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast.error('Failed to update privacy setting');
    }
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    try {
      await updateUsername.mutateAsync(newUsername.trim());
      toast.success('Username updated successfully');
      setIsEditingUsername(false);
      setNewUsername('');
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Failed to update username');
    }
  };

  if (!identity) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please log in to view your profile</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const displayUsername = userProfile?.username || 'Unknown User';
  const joinDate = userProfile?.joinDate ? new Date(Number(userProfile.joinDate) / 1000000) : new Date();
  const isPrivate = userProfile?.isPrivate ?? false;
  const tournamentCount = tournaments?.length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('setup')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournament
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your tournament profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Username</Label>
                {isEditingUsername ? (
                  <div className="flex gap-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username"
                    />
                    <Button
                      size="sm"
                      onClick={handleUsernameUpdate}
                      disabled={updateUsername.isPending}
                    >
                      {updateUsername.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium">{displayUsername}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewUsername(displayUsername);
                        setIsEditingUsername(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Join Date
                </Label>
                <p className="text-sm text-muted-foreground">
                  {joinDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {isPrivate ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <ShieldOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="space-y-0.5">
                    <Label htmlFor="privacy-toggle" className="cursor-pointer">
                      Profile Privacy
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isPrivate ? 'Your profile is private' : 'Your profile is public'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="privacy-toggle"
                  checked={isPrivate}
                  onCheckedChange={handlePrivacyToggle}
                  disabled={setPrivacy.isPending}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Tournaments</p>
                  <p className="text-3xl font-bold text-primary">{tournamentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Saved Tournaments</CardTitle>
            <CardDescription>
              {tournamentCount === 0
                ? 'You haven\'t saved any tournaments yet'
                : `You have ${tournamentCount} saved tournament${tournamentCount !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournamentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tournaments && tournaments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tournaments.map(([id, tournament]) => (
                  <UserTournamentCard
                    key={id.toString()}
                    id={id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tournaments saved yet.</p>
                <p className="text-sm mt-2">Create and save a tournament to see it here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
