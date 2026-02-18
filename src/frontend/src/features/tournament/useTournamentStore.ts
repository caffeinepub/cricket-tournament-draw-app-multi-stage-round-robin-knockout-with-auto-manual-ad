import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  TournamentState,
  RoundRobinRoundConfig,
  KnockoutStage,
  StageAdvancementConfig,
  Stage,
  KnockoutPairingMode,
  KnockoutFixtureAssignment,
  Team,
} from './types';
import { generateTournament } from './generation';
import { generateKnockoutMatches } from './knockoutGenerator';
import { reorderGroupTeams } from './groupReorder';

interface TournamentStore extends Omit<TournamentState, 'advancementConfigs'> {
  setNumberOfTeams: (count: number) => void;
  setRoundRobinRounds: (rounds: RoundRobinRoundConfig[]) => void;
  setKnockoutStages: (stages: KnockoutStage) => void;
  setStageAdvancementConfigs: (configs: StageAdvancementConfig[]) => void;
  setStageAdvancementConfig: (config: StageAdvancementConfig) => void;
  generateTournament: () => void;
  updateMatchDateTime: (matchId: string, date: string, time: string) => void;
  updateTeamName: (teamId: string, newName: string) => void;
  updateTeamPosition: (stageId: string, groupId: string, teamId: string, position: number) => void;
  updateGroupName: (stageId: string, groupId: string, newName: string) => { success: boolean; error?: string };
  setCurrentView: (view: 'setup' | 'schedule' | 'fullSchedule' | 'knockout') => void;
  setKnockoutPairingMode: (mode: KnockoutPairingMode) => void;
  assignKnockoutFixture: (assignment: KnockoutFixtureAssignment) => void;
  reset: () => void;
}

const initialState: Omit<TournamentState, 'advancementConfigs'> = {
  numberOfTeams: 48,
  roundRobinRounds: [{ roundNumber: 1, groupCount: 12 }],
  knockoutStages: {
    preQuarterFinal: false,
    quarterFinal: false,
    semiFinal: true,
    final: true,
  },
  stageAdvancementConfigs: [],
  teams: [],
  stages: [],
  knockoutMatches: [],
  currentView: 'setup',
  isGenerated: false,
  knockoutPairingMode: 'auto',
  knockoutFixtureAssignments: [],
};

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setNumberOfTeams: (count) => set({ numberOfTeams: count }),

      setRoundRobinRounds: (rounds) => set({ roundRobinRounds: rounds }),

      setKnockoutStages: (stages) => set({ knockoutStages: stages }),

      setStageAdvancementConfigs: (configs) => set({ stageAdvancementConfigs: configs }),

      setStageAdvancementConfig: (config) => {
        const { stageAdvancementConfigs } = get();
        const existingIndex = stageAdvancementConfigs.findIndex(
          (c) => c.stageNumber === config.stageNumber
        );

        let updatedConfigs: StageAdvancementConfig[];
        if (existingIndex >= 0) {
          updatedConfigs = [...stageAdvancementConfigs];
          updatedConfigs[existingIndex] = config;
        } else {
          updatedConfigs = [...stageAdvancementConfigs, config];
        }

        set({ stageAdvancementConfigs: updatedConfigs });
      },

      generateTournament: () => {
        const {
          numberOfTeams,
          roundRobinRounds,
          knockoutStages,
          stageAdvancementConfigs,
          knockoutPairingMode,
          knockoutFixtureAssignments,
        } = get();

        // Generate teams array
        const teams: Team[] = Array.from({ length: numberOfTeams }, (_, i) => ({
          id: `team-${i + 1}`,
          name: `Team ${i + 1}`,
        }));

        const stages = generateTournament(
          teams,
          roundRobinRounds,
          stageAdvancementConfigs,
          {} // Empty advancementConfigs object (legacy parameter)
        );

        const knockoutMatches = generateKnockoutMatches(
          stages,
          knockoutStages,
          stageAdvancementConfigs,
          roundRobinRounds,
          knockoutPairingMode,
          knockoutFixtureAssignments
        );

        set({
          teams,
          stages,
          knockoutMatches,
          currentView: 'schedule',
          isGenerated: true,
        });
      },

      updateMatchDateTime: (matchId, date, time) => {
        const { stages, knockoutMatches } = get();

        const updatedStages = stages.map((stage) => ({
          ...stage,
          matches: stage.matches.map((match) =>
            match.id === matchId ? { ...match, date, time } : match
          ),
        }));

        const updatedKnockoutMatches = knockoutMatches.map((match) =>
          match.id === matchId ? { ...match, date, time } : match
        );

        set({
          stages: updatedStages,
          knockoutMatches: updatedKnockoutMatches,
        });
      },

      updateTeamName: (teamId, newName) => {
        const { stages, knockoutMatches } = get();

        const updatedStages = stages.map((stage) => ({
          ...stage,
          groups: stage.groups.map((group) => ({
            ...group,
            teams: group.teams.map((team) =>
              team.id === teamId ? { ...team, name: newName } : team
            ),
          })),
          matches: stage.matches.map((match) => ({
            ...match,
            team1: match.team1.id === teamId ? { ...match.team1, name: newName } : match.team1,
            team2: match.team2.id === teamId ? { ...match.team2, name: newName } : match.team2,
          })),
        }));

        const updatedKnockoutMatches = knockoutMatches.map((match) => ({
          ...match,
          team1: match.team1?.id === teamId ? { ...match.team1, name: newName } : match.team1,
          team2: match.team2?.id === teamId ? { ...match.team2, name: newName } : match.team2,
        }));

        set({
          stages: updatedStages,
          knockoutMatches: updatedKnockoutMatches,
        });
      },

      updateTeamPosition: (stageId, groupId, teamId, position) => {
        const { stages, knockoutStages, stageAdvancementConfigs, roundRobinRounds, knockoutPairingMode, knockoutFixtureAssignments } = get();

        // Update the group's team order
        const updatedStages = stages.map((stage) => {
          if (stage.id !== stageId) return stage;

          return {
            ...stage,
            groups: stage.groups.map((group) => {
              if (group.id !== groupId) return group;

              const reorderedTeams = reorderGroupTeams(group.teams, teamId, position);
              return {
                ...group,
                teams: reorderedTeams,
              };
            }),
          };
        });

        // Regenerate knockout matches to reflect new group ordering (winners/runner-ups)
        const regeneratedKnockoutMatches = generateKnockoutMatches(
          updatedStages,
          knockoutStages,
          stageAdvancementConfigs,
          roundRobinRounds,
          knockoutPairingMode,
          knockoutFixtureAssignments
        );

        set({
          stages: updatedStages,
          knockoutMatches: regeneratedKnockoutMatches,
        });
      },

      updateGroupName: (stageId, groupId, newName) => {
        const { stages } = get();
        
        // Trim the new name
        const trimmedName = newName.trim();
        
        if (!trimmedName) {
          return { success: false, error: 'Group name cannot be empty' };
        }
        
        // Check for duplicates across all stages (excluding the current group)
        for (const stage of stages) {
          for (const group of stage.groups) {
            if (group.id !== groupId && group.name.toLowerCase() === trimmedName.toLowerCase()) {
              return { 
                success: false, 
                error: `Group name "${trimmedName}" is already used in ${stage.name}` 
              };
            }
          }
        }
        
        // Update the group name
        const updatedStages = stages.map((stage) => {
          if (stage.id !== stageId) return stage;

          return {
            ...stage,
            groups: stage.groups.map((group) => {
              if (group.id !== groupId) return group;
              return {
                ...group,
                name: trimmedName,
              };
            }),
          };
        });

        set({ stages: updatedStages });
        return { success: true };
      },

      setCurrentView: (view) => set({ currentView: view }),

      setKnockoutPairingMode: (mode) => set({ knockoutPairingMode: mode }),

      assignKnockoutFixture: (assignment) => {
        const { knockoutFixtureAssignments } = get();
        const existingIndex = knockoutFixtureAssignments.findIndex(
          (a) => a.matchId === assignment.matchId
        );

        let updatedAssignments: KnockoutFixtureAssignment[];
        if (existingIndex >= 0) {
          updatedAssignments = [...knockoutFixtureAssignments];
          updatedAssignments[existingIndex] = assignment;
        } else {
          updatedAssignments = [...knockoutFixtureAssignments, assignment];
        }

        set({ knockoutFixtureAssignments: updatedAssignments });
      },

      reset: () => {
        set(initialState);
        localStorage.removeItem('tournament-storage');
      },
    }),
    {
      name: 'tournament-storage',
    }
  )
);
