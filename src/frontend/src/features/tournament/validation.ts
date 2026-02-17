import { RoundRobinRoundConfig, StageAdvancementConfig, KnockoutStage, AdvancementDestination } from './types';
import { getQualifiedTeamCount } from './qualification';

export function validateNumberOfTeams(count: number): string | null {
  if (isNaN(count) || count < 4) {
    return 'Please enter at least 4 teams';
  }
  return null;
}

export function validateRoundConfig(
  totalTeams: number,
  config: RoundRobinRoundConfig,
  prevRoundTeamCount?: number
): string | null {
  if (config.groupCount < 1) {
    return `Round ${config.roundNumber}: At least 1 group is required`;
  }

  const teamsForThisRound = prevRoundTeamCount ?? totalTeams;
  if (config.groupCount > teamsForThisRound) {
    return `Round ${config.roundNumber}: Cannot have more groups (${config.groupCount}) than teams (${teamsForThisRound})`;
  }

  return null;
}

export function validateAdvancementRuleCompatibility(
  totalTeams: number,
  roundConfigs: RoundRobinRoundConfig[],
  stageAdvancementConfigs: StageAdvancementConfig[],
  knockoutStages: KnockoutStage
): string | null {
  // Check if all stages have advancement configs
  for (const config of roundConfigs) {
    const hasConfig = stageAdvancementConfigs.some(c => c.stageNumber === config.roundNumber);
    if (!hasConfig) {
      return `Robin Round ${config.roundNumber} is missing advancement configuration`;
    }
  }

  // Calculate qualified team count
  const qualifiedCount = getQualifiedTeamCount(stageAdvancementConfigs, roundConfigs, knockoutStages);

  // Determine required team count based on first enabled knockout stage
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

  // If knockout stages are enabled, validate team count
  if (requiredCount > 0 && qualifiedCount !== requiredCount) {
    return `Qualified teams (${qualifiedCount}) must match the first enabled knockout stage requirement (${requiredCount} teams)`;
  }

  return null;
}

/**
 * Format an advancement destination for display
 */
export function formatDestination(destination: AdvancementDestination): string {
  switch (destination.type) {
    case 'NextStage':
      return `Robin Round ${destination.stageIndex}`;
    case 'KnockoutEntry':
      return destination.entryPoint;
    case 'Eliminated':
      return 'Eliminated';
  }
}

/**
 * Get a human-readable label for a stage's advancement configuration
 */
export function getStageAdvancementLabel(
  stageNumber: number,
  stageAdvancementConfigs: StageAdvancementConfig[]
): string {
  const config = stageAdvancementConfigs.find(c => c.stageNumber === stageNumber);
  if (!config) return 'Not configured';

  const winnerDest = formatDestination(config.winnerDestination);
  const runnerUpDest = formatDestination(config.runnerUpDestination);

  return `Winners → ${winnerDest}, Runners-up → ${runnerUpDest}`;
}
