import type { StageType, RoundRobinStageConfig, AdvancementType, KnockoutEntryType } from '../../backend';
import type { Stage, StageAdvancementConfig } from './types';

export function serializeStageType(
  stage: Stage,
  stageAdvancementConfigs: StageAdvancementConfig[]
): StageType {
  // Stages don't have a 'type' field, they're all round-robin in the current structure
  // Knockout is handled separately via knockoutMatches
  
  // Find advancement config for this stage
  const config = stageAdvancementConfigs.find(c => c.stageNumber === stage.stageNumber);
  
  if (!config) {
    throw new Error(`No advancement config found for stage ${stage.stageNumber}`);
  }

  const roundRobinConfig: RoundRobinStageConfig = {
    id: BigInt(stage.stageNumber),
    advancementRuleWinner: serializeAdvancementRule(config.winnerDestination),
    advancementRuleRunnerUp: serializeAdvancementRule(config.runnerUpDestination),
  };

  return { __kind__: 'RoundRobin', RoundRobin: roundRobinConfig };
}

function serializeAdvancementRule(destination: StageAdvancementConfig['winnerDestination']): AdvancementType {
  if (destination.type === 'NextStage') {
    return { __kind__: 'NextStage', NextStage: BigInt(destination.stageIndex) };
  } else if (destination.type === 'KnockoutEntry') {
    let knockoutEntry: KnockoutEntryType;
    switch (destination.entryPoint) {
      case 'PreQuarterfinals':
        knockoutEntry = 'PreQuarterfinals' as KnockoutEntryType;
        break;
      case 'Quarterfinals':
        knockoutEntry = 'Quarterfinals' as KnockoutEntryType;
        break;
      case 'Semifinals':
        knockoutEntry = 'Semifinals' as KnockoutEntryType;
        break;
      default:
        throw new Error(`Invalid knockout stage: ${destination.entryPoint}`);
    }
    return { __kind__: 'KnockoutEntry', KnockoutEntry: knockoutEntry };
  } else {
    // Eliminated - use a sentinel value (NextStage with max value)
    return { __kind__: 'NextStage', NextStage: BigInt(999) };
  }
}

export function serializeGroupsAndStages(stages: Stage[], stageAdvancementConfigs: StageAdvancementConfig[]) {
  const groups: Array<[bigint, string]> = [];
  const serializedStages: Array<[bigint, StageType]> = [];

  // Collect all groups from all stages
  let groupIdCounter = 0;
  stages.forEach(stage => {
    stage.groups.forEach(group => {
      groups.push([BigInt(groupIdCounter++), group.name]);
    });

    // Serialize stage
    const stageType = serializeStageType(stage, stageAdvancementConfigs);
    serializedStages.push([BigInt(stage.stageNumber), stageType]);
  });

  return { groups, stages: serializedStages };
}
