import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TournamentState, Team, AdvancementConfig, KnockoutStage, RoundRobinRoundConfig, KnockoutPairingMode, KnockoutFixtureAssignment, StageAdvancementConfig } from './types';
import { generateTournament as generateTournamentStages } from './generation';
import { generateKnockoutMatches } from './knockoutGenerator';

interface TournamentActions {
  setNumberOfTeams: (count: number) => void;
  setRoundRobinRounds: (rounds: RoundRobinRoundConfig[]) => void;
  updateRoundConfig: (roundNumber: number, groupCount: number) => void;
  setStageAdvancementConfig: (config: StageAdvancementConfig) => void;
  setKnockoutStages: (stages: KnockoutStage) => void;
  setAdvancementConfig: (stageId: string, config: AdvancementConfig) => void;
  setKnockoutPairingMode: (mode: KnockoutPairingMode) => void;
  assignKnockoutFixture: (matchId: string, team1Id?: string, team2Id?: string) => void;
  generateTournament: () => void;
  regenerateStage: (stageId: string) => void;
  regenerateKnockout: () => void;
  updateMatchDateTime: (matchId: string, date?: string, time?: string) => void;
  setCurrentView: (view: 'setup' | 'schedule' | 'knockout') => void;
  reset: () => void;
}

const initialState: TournamentState = {
  teams: [],
  numberOfTeams: 16,
  roundRobinRounds: [
    { roundNumber: 1, groupCount: 4 },
  ],
  stageAdvancementConfigs: [],
  knockoutStages: {
    preQuarterFinal: false,
    quarterFinal: true,
    semiFinal: true,
    final: true,
  },
  stages: [],
  knockoutMatches: [],
  advancementConfigs: {},
  currentView: 'setup',
  isGenerated: false,
  knockoutPairingMode: 'auto',
  knockoutFixtureAssignments: [],
};

export const useTournamentStore = create<TournamentState & TournamentActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setNumberOfTeams: (count) => set({ numberOfTeams: count }),
      
      setRoundRobinRounds: (rounds) => set({ roundRobinRounds: rounds }),
      
      updateRoundConfig: (roundNumber, groupCount) => {
        set((state) => {
          const rounds = [...state.roundRobinRounds];
          const index = rounds.findIndex(r => r.roundNumber === roundNumber);
          if (index >= 0) {
            rounds[index] = { ...rounds[index], groupCount };
          }
          return { roundRobinRounds: rounds };
        });
      },
      
      setStageAdvancementConfig: (config) => {
        set((state) => {
          const configs = [...state.stageAdvancementConfigs];
          const index = configs.findIndex(c => c.stageNumber === config.stageNumber);
          if (index >= 0) {
            configs[index] = config;
          } else {
            configs.push(config);
          }
          return { stageAdvancementConfigs: configs };
        });
      },
      
      setKnockoutStages: (stages) => set({ knockoutStages: stages }),
      
      setAdvancementConfig: (stageId, config) =>
        set((state) => ({
          advancementConfigs: {
            ...state.advancementConfigs,
            [stageId]: config,
          },
        })),

      setKnockoutPairingMode: (mode) => set({ knockoutPairingMode: mode }),

      assignKnockoutFixture: (matchId, team1Id, team2Id) => {
        set((state) => {
          const existingIndex = state.knockoutFixtureAssignments.findIndex(
            (a) => a.matchId === matchId
          );
          
          const newAssignment: KnockoutFixtureAssignment = {
            matchId,
            team1Id,
            team2Id,
          };

          if (existingIndex >= 0) {
            const updated = [...state.knockoutFixtureAssignments];
            updated[existingIndex] = newAssignment;
            return { knockoutFixtureAssignments: updated };
          } else {
            return {
              knockoutFixtureAssignments: [...state.knockoutFixtureAssignments, newAssignment],
            };
          }
        });

        // Regenerate knockout matches
        get().regenerateKnockout();
      },

      generateTournament: () => {
        const state = get();
        
        // Generate teams
        const teams: Team[] = Array.from({ length: state.numberOfTeams }, (_, i) => ({
          id: `team-${i + 1}`,
          name: `Team ${i + 1}`,
        }));

        // Generate round-robin stages
        const stages = generateTournamentStages(
          teams,
          state.roundRobinRounds,
          state.stageAdvancementConfigs,
          state.advancementConfigs
        );

        // Generate knockout matches
        const knockoutMatches = generateKnockoutMatches(
          stages,
          state.knockoutStages,
          state.stageAdvancementConfigs,
          state.roundRobinRounds,
          state.knockoutPairingMode,
          state.knockoutFixtureAssignments
        );

        set({
          teams,
          stages,
          knockoutMatches,
          isGenerated: true,
          currentView: 'schedule',
        });
      },

      regenerateStage: (stageId) => {
        const state = get();
        const stages = generateTournamentStages(
          state.teams,
          state.roundRobinRounds,
          state.stageAdvancementConfigs,
          state.advancementConfigs
        );
        set({ stages });
      },

      regenerateKnockout: () => {
        const state = get();
        const knockoutMatches = generateKnockoutMatches(
          state.stages,
          state.knockoutStages,
          state.stageAdvancementConfigs,
          state.roundRobinRounds,
          state.knockoutPairingMode,
          state.knockoutFixtureAssignments
        );
        set({ knockoutMatches });
      },

      updateMatchDateTime: (matchId, date, time) => {
        set((state) => {
          // Update in round-robin stages
          const updatedStages = state.stages.map((stage) => ({
            ...stage,
            matches: stage.matches.map((match) =>
              match.id === matchId ? { ...match, date, time } : match
            ),
          }));

          // Update in knockout matches
          const updatedKnockoutMatches = state.knockoutMatches.map((match) =>
            match.id === matchId ? { ...match, date, time } : match
          );

          return {
            stages: updatedStages,
            knockoutMatches: updatedKnockoutMatches,
          };
        });
      },

      setCurrentView: (view) => set({ currentView: view }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'tournament-storage',
    }
  )
);
