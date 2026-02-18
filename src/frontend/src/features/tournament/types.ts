export interface Team {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  date?: string;
  time?: string;
  groupId?: string;
  stageId?: string;
  round?: string;
  winnerId?: string;
  // Stable upstream fixture references for knockout matches
  team1Source?: string; // e.g., "PQ1" - the fixture code that feeds team1
  team2Source?: string; // e.g., "PQ2" - the fixture code that feeds team2
}

export interface Stage {
  id: string;
  name: string;
  stageNumber: number;
  groups: Group[];
  matches: Match[];
}

export interface AdvancementConfig {
  mode: 'auto' | 'manual';
  qualifiersPerGroup?: number;
  nextStageGroups?: number;
}

export interface KnockoutStage {
  preQuarterFinal: boolean;
  quarterFinal: boolean;
  semiFinal: boolean;
  final: boolean;
}

// Per-stage advancement destination types
export type KnockoutEntryPoint = 'PreQuarterfinals' | 'Quarterfinals' | 'Semifinals';

export type AdvancementDestination = 
  | { type: 'NextStage'; stageIndex: number }
  | { type: 'KnockoutEntry'; entryPoint: KnockoutEntryPoint }
  | { type: 'Eliminated' };

// Per-stage advancement configuration
export interface StageAdvancementConfig {
  stageNumber: number;
  winnerDestination: AdvancementDestination;
  runnerUpDestination: AdvancementDestination;
}

// New types for multi-round configuration
export interface RoundRobinRoundConfig {
  roundNumber: number;
  groupCount: number;
}

export type KnockoutPairingMode = 'auto' | 'manual';

export interface KnockoutFixtureAssignment {
  matchId: string;
  team1Id?: string;
  team2Id?: string;
}

// Knockout generation warnings
export interface KnockoutWarnings {
  reseedingWarnings: string[];
  manualPairingWarnings: string[];
}

// Knockout winner map: matchId -> winnerId
export type KnockoutWinnerMap = Record<string, string>;

export interface TournamentState {
  teams: Team[];
  numberOfTeams: number;
  
  // Multi-round configuration
  roundRobinRounds: RoundRobinRoundConfig[];
  
  // Per-stage advancement configuration
  stageAdvancementConfigs: StageAdvancementConfig[];
  
  knockoutStages: KnockoutStage;
  stages: Stage[];
  knockoutMatches: Match[];
  advancementConfigs: Record<string, AdvancementConfig>;
  currentView: 'setup' | 'schedule' | 'fullSchedule' | 'knockout';
  isGenerated: boolean;
  knockoutPairingMode: KnockoutPairingMode;
  knockoutFixtureAssignments: KnockoutFixtureAssignment[];
  knockoutWarnings: KnockoutWarnings;
  knockoutWinners: KnockoutWinnerMap;
}
