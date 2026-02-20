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
  KnockoutWarnings,
  KnockoutWinnerMap,
  Match,
} from './types';
import { generateTournament } from './generation';
import { generateKnockoutMatches } from './knockoutGenerator';
import { reorderGroupTeams } from './groupReorder';
import { reseedKnockoutTeams } from './knockoutReseeding';
import { getQualifiedTeamsForKnockout } from './qualification';
import { applyKnockoutWinners, clearDownstreamWinners } from './knockoutWinners';
import { normalizePlaceholder } from './knockoutPlaceholders';
import { getFixtureCodeForMatch } from './knockoutFixtureCode';

interface TournamentStore extends Omit<TournamentState, 'advancementConfigs'> {
  currentTournamentName: string | null;
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
  setCurrentView: (view: 'setup' | 'schedule' | 'fullSchedule' | 'knockout' | 'profile') => void;
  setKnockoutPairingMode: (mode: KnockoutPairingMode) => void;
  assignKnockoutFixture: (assignment: KnockoutFixtureAssignment) => void;
  validateManualPairing: (assignment: KnockoutFixtureAssignment) => string[];
  setKnockoutWinner: (matchId: string, winnerId: string) => void;
  setCurrentTournamentName: (name: string | null) => void;
  newTournament: () => void;
  loadTournamentFromBackend: (data: any) => void;
  reset: () => void;
}

const initialState: Omit<TournamentState, 'advancementConfigs'> & { currentTournamentName: string | null } = {
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
  knockoutWarnings: {
    reseedingWarnings: [],
    manualPairingWarnings: [],
    seedingRuleWarnings: [],
  },
  knockoutWinners: {},
  currentTournamentName: null,
};

/**
 * Migrate legacy matches to add stable source references
 */
function migrateMatchSources(matches: Match[]): Match[] {
  return matches.map(match => {
    // Skip if already has source references
    if (match.team1Source || match.team2Source) {
      return match;
    }

    // Build fixture code map
    const fixtureToMatchId = new Map<string, string>();
    matches.forEach(m => {
      const code = getFixtureCodeForMatch(m, matches);
      if (code) {
        fixtureToMatchId.set(code, m.id);
      }
    });

    let team1Source: string | undefined;
    let team2Source: string | undefined;

    // Try to infer source from placeholder names
    if (match.team1?.name) {
      const normalized = normalizePlaceholder(match.team1.name);
      if (fixtureToMatchId.has(normalized)) {
        team1Source = normalized;
      }
    }

    if (match.team2?.name) {
      const normalized = normalizePlaceholder(match.team2.name);
      if (fixtureToMatchId.has(normalized)) {
        team2Source = normalized;
      }
    }

    return {
      ...match,
      team1Source,
      team2Source,
    };
  });
}

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

        const { matches: knockoutMatches, warnings } = generateKnockoutMatches(
          stages,
          knockoutStages,
          stageAdvancementConfigs,
          roundRobinRounds,
          knockoutPairingMode,
          knockoutFixtureAssignments
        );

        // Apply any existing winners
        const { knockoutWinners } = get();
        const matchesWithWinners = applyKnockoutWinners(knockoutMatches, knockoutWinners);

        set({
          teams,
          stages,
          knockoutMatches: matchesWithWinners,
          knockoutWarnings: warnings,
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
        const { stages, knockoutStages, stageAdvancementConfigs, roundRobinRounds, knockoutPairingMode, knockoutFixtureAssignments, knockoutWinners } = get();

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
        const { matches: regeneratedKnockoutMatches, warnings } = generateKnockoutMatches(
          updatedStages,
          knockoutStages,
          stageAdvancementConfigs,
          roundRobinRounds,
          knockoutPairingMode,
          knockoutFixtureAssignments
        );

        // Apply winners
        const matchesWithWinners = applyKnockoutWinners(regeneratedKnockoutMatches, knockoutWinners);

        set({
          stages: updatedStages,
          knockoutMatches: matchesWithWinners,
          knockoutWarnings: warnings,
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

      setKnockoutPairingMode: (mode) => {
        const { stages, knockoutStages, stageAdvancementConfigs, roundRobinRounds, knockoutFixtureAssignments, knockoutWinners } = get();
        
        // Regenerate knockout matches with new mode
        const { matches: knockoutMatches, warnings } = generateKnockoutMatches(
          stages,
          knockoutStages,
          stageAdvancementConfigs,
          roundRobinRounds,
          mode,
          knockoutFixtureAssignments
        );

        // Apply winners
        const matchesWithWinners = applyKnockoutWinners(knockoutMatches, knockoutWinners);
        
        set({ 
          knockoutPairingMode: mode,
          knockoutMatches: matchesWithWinners,
          knockoutWarnings: warnings,
        });
      },

      assignKnockoutFixture: (assignment) => {
        const { knockoutFixtureAssignments, stages, knockoutStages, stageAdvancementConfigs, roundRobinRounds, knockoutPairingMode, knockoutWinners } = get();
        
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

        // Regenerate knockout matches with new assignments
        const { matches: knockoutMatches, warnings } = generateKnockoutMatches(
          stages,
          knockoutStages,
          stageAdvancementConfigs,
          roundRobinRounds,
          knockoutPairingMode,
          updatedAssignments
        );

        // Apply winners
        const matchesWithWinners = applyKnockoutWinners(knockoutMatches, knockoutWinners);

        set({
          knockoutFixtureAssignments: updatedAssignments,
          knockoutMatches: matchesWithWinners,
          knockoutWarnings: warnings,
        });
      },

      validateManualPairing: (assignment) => {
        const { stages } = get();
        const warnings: string[] = [];

        if (!assignment.team1Id || !assignment.team2Id) {
          return warnings;
        }

        // Find teams in round-robin stages
        let team1Group: string | null = null;
        let team2Group: string | null = null;

        for (const stage of stages) {
          for (const group of stage.groups) {
            const hasTeam1 = group.teams.some(t => t.id === assignment.team1Id);
            const hasTeam2 = group.teams.some(t => t.id === assignment.team2Id);
            
            if (hasTeam1) team1Group = group.name;
            if (hasTeam2) team2Group = group.name;
          }
        }

        // Check if teams are from the same group
        if (team1Group && team2Group && team1Group === team2Group) {
          warnings.push(`Teams from the same group (${team1Group}) should not meet before the final.`);
        }

        return warnings;
      },

      setKnockoutWinner: (matchId, winnerId) => {
        const { knockoutMatches, knockoutWinners } = get();

        // Clear downstream winners first (transitive clearing)
        // Fix: correct parameter order is (matches, changedMatchId, winnerMap)
        const clearedWinners = clearDownstreamWinners(knockoutMatches, matchId, knockoutWinners);

        // Set new winner
        const updatedWinners: KnockoutWinnerMap = {
          ...clearedWinners,
          [matchId]: winnerId,
        };

        // Apply winners to matches
        const matchesWithWinners = applyKnockoutWinners(knockoutMatches, updatedWinners);

        set({
          knockoutWinners: updatedWinners,
          knockoutMatches: matchesWithWinners,
        });
      },

      setCurrentTournamentName: (name) => set({ currentTournamentName: name }),

      newTournament: () => {
        set({
          ...initialState,
          currentView: 'setup',
        });
      },

      loadTournamentFromBackend: (data) => {
        const { 
          name, 
          stageAdvancementConfigs, 
          roundRobinRounds, 
          knockoutStages,
          teams,
          stages,
          knockoutMatches,
          knockoutWarnings,
          knockoutPairingMode,
          knockoutFixtureAssignments,
          knockoutWinners,
          numberOfTeams,
        } = data;
        
        set({
          currentTournamentName: name,
          stageAdvancementConfigs,
          roundRobinRounds,
          knockoutStages: knockoutStages || initialState.knockoutStages,
          teams: teams || [],
          stages: stages || [],
          knockoutMatches: knockoutMatches || [],
          knockoutWarnings: knockoutWarnings || initialState.knockoutWarnings,
          knockoutPairingMode: knockoutPairingMode || 'auto',
          knockoutFixtureAssignments: knockoutFixtureAssignments || [],
          knockoutWinners: knockoutWinners || {},
          numberOfTeams: numberOfTeams || 48,
          isGenerated: (stages && stages.length > 0) || false,
          currentView: 'setup',
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'tournament-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate knockout matches to include source references
          if (persistedState.knockoutMatches) {
            persistedState.knockoutMatches = migrateMatchSources(persistedState.knockoutMatches);
          }
        }
        return persistedState;
      },
    }
  )
);
