import { RoundRobinRoundConfig, KnockoutStage, StageAdvancementConfig, AdvancementDestination } from './types';
import { getQualifiedTeamCount } from './qualification';

export function validatePositiveInteger(value: number, fieldName: string): string | null {
  if (!Number.isInteger(value) || value <= 0) {
    return `${fieldName} must be a positive integer`;
  }
  return null;
}

export function validateNumberOfTeams(numberOfTeams: number): string | null {
  if (!Number.isInteger(numberOfTeams) || numberOfTeams < 4) {
    return 'Number of teams must be at least 4';
  }
  return null;
}

export function validateGroupCount(groupCount: number, numberOfTeams: number): string | null {
  if (!Number.isInteger(groupCount) || groupCount <= 0) {
    return 'Number of groups must be a positive integer';
  }
  if (groupCount > numberOfTeams) {
    return 'Number of groups cannot exceed number of teams';
  }
  return null;
}

export function validateRoundConfig(
  totalTeams: number,
  config: RoundRobinRoundConfig,
  prevRoundTeamCount?: number
): string | null {
  const teamCount = prevRoundTeamCount || totalTeams;
  
  if (config.groupCount <= 0) {
    return `Round ${config.roundNumber}: Number of groups must be positive`;
  }
  
  if (config.groupCount > teamCount) {
    return `Round ${config.roundNumber}: Cannot have more groups (${config.groupCount}) than teams (${teamCount})`;
  }
  
  const teamsPerGroup = Math.floor(teamCount / config.groupCount);
  if (teamsPerGroup < 2) {
    return `Round ${config.roundNumber}: Each group must have at least 2 teams`;
  }
  
  return null;
}

export function validateAdvancementRuleCompatibility(
  numberOfTeams: number,
  roundRobinRounds: RoundRobinRoundConfig[],
  stageAdvancementConfigs: StageAdvancementConfig[],
  knockoutStages: KnockoutStage
): string | null {
  // Calculate qualified team count
  const qualifiedCount = getQualifiedTeamCount(stageAdvancementConfigs, roundRobinRounds, knockoutStages);
  
  // Determine required team count for first enabled knockout stage
  let requiredCount = 0;
  if (knockoutStages.preQuarterFinal) {
    requiredCount = 16;
  } else if (knockoutStages.quarterFinal) {
    requiredCount = 8;
  } else if (knockoutStages.semiFinal) {
    requiredCount = 4;
  } else if (knockoutStages.final) {
    requiredCount = 2;
  }
  
  if (requiredCount === 0) {
    return null; // No knockout stages enabled
  }
  
  if (qualifiedCount !== requiredCount) {
    return `Advancement configuration produces ${qualifiedCount} qualified teams, but the first enabled knockout stage requires exactly ${requiredCount} teams. Please adjust your stage advancement rules.`;
  }
  
  return null;
}

export function validateDateFormat(date: string): boolean {
  // Basic YYYY-MM-DD format validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
}

export function validateTimeFormat(time: string): boolean {
  // Basic HH:MM format validation
  const timeRegex = /^\d{2}:\d{2}$/;
  return timeRegex.test(time);
}

/**
 * Format a destination for display
 */
export function formatDestination(destination: AdvancementDestination): string {
  if (destination.type === 'Eliminated') {
    return 'Eliminated';
  }
  if (destination.type === 'NextStage') {
    return `Round ${destination.stageIndex + 1}`;
  }
  return destination.entryPoint.replace('finals', '-Finals');
}

/**
 * Get a human-readable label for a stage's advancement configuration
 */
export function getStageAdvancementLabel(
  stageNumber: number,
  stageAdvancementConfigs: StageAdvancementConfig[]
): string {
  const config = stageAdvancementConfigs.find(c => c.stageNumber === stageNumber);
  
  if (!config) {
    return 'Not configured';
  }
  
  const winnerDest = formatDestination(config.winnerDestination);
  const runnerUpDest = formatDestination(config.runnerUpDestination);
  
  return `Winners → ${winnerDest} • Runners-up → ${runnerUpDest}`;
}
