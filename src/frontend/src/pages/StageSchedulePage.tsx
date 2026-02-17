import { useState } from 'react';
import { useTournamentStore } from '../features/tournament/useTournamentStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import MatchDateTimeEditor from '../components/MatchDateTimeEditor';

export default function StageSchedulePage() {
  const { stages } = useTournamentStore();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stage Schedule</h1>
            <p className="text-muted-foreground">Manage round-robin stage matches</p>
          </div>
        </div>

        {/* Stages */}
        {stages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No stages generated yet. Configure and generate a tournament first.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {stages.map((stage) => {
              const isStageExpanded = expandedStage === stage.id;

              return (
                <Card key={stage.id}>
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedStage(isStageExpanded ? null : stage.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{stage.name}</CardTitle>
                        <CardDescription>
                          {stage.groups.length} group{stage.groups.length !== 1 ? 's' : ''} · {stage.matches.length} matches
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{stage.groups.length} groups</Badge>
                    </div>
                  </CardHeader>
                  {isStageExpanded && (
                    <CardContent className="space-y-6">
                      {stage.groups.map((group, groupIdx) => {
                        const isGroupExpanded = expandedGroup === group.id;
                        const groupMatches = stage.matches.filter((m) => m.groupId === group.id);

                        return (
                          <div key={group.id}>
                            {groupIdx > 0 && <Separator className="my-6" />}
                            <div className="space-y-4">
                              <div
                                className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors"
                                onClick={() => setExpandedGroup(isGroupExpanded ? null : group.id)}
                              >
                                <div>
                                  <h3 className="font-semibold">Group {group.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {group.teams.length} teams · {groupMatches.length} matches
                                  </p>
                                </div>
                                <Badge variant="secondary">{groupMatches.length} matches</Badge>
                              </div>

                              {isGroupExpanded && (
                                <div className="space-y-4 pl-4">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Teams</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {group.teams.map((team, idx) => (
                                        <Badge key={team.id} variant="outline">
                                          {idx + 1}. {team.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <Separator />

                                  <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Matches</h4>
                                    {groupMatches.map((match, matchIdx) => (
                                      <div key={match.id}>
                                        {matchIdx > 0 && <Separator className="my-3" />}
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="font-mono">
                                              Match {matchIdx + 1}
                                            </Badge>
                                            <span className="font-medium">{match.team1.name}</span>
                                            <span className="text-muted-foreground">vs</span>
                                            <span className="font-medium">{match.team2.name}</span>
                                          </div>
                                          <MatchDateTimeEditor match={match} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
