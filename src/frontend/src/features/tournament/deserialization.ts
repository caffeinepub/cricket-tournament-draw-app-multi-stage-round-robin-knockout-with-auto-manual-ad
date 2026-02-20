import type { TournamentView, StageType, AdvancementType } from '../../backend';
import type { Stage, Group, Team, StageAdvancementConfig, RoundRobinRoundConfig, AdvancementDestination, KnockoutEntryPoint, KnockoutStage } from './types';

export function deserializeTournament(tournamentView: TournamentView) {
  const { draws } = tournamentView;
  
  // Deserialize groups
  const groupMap = new Map<string, string>();
  draws.groups.forEach(([id, name]) => {
    groupMap.set(id.toString(), name);
  });

  // Deserialize stages
  const stages: Stage[] = [];
  const stageAdvancementConfigs: StageAdvancementConfig[] = [];
  const roundRobinRounds: RoundRobinRoundConfig[] = [];
  const roundRobinStageNumbers = new Set<number>();

  // Track knockout stages that are configured
  const knockoutStages: KnockoutStage = {
    preQuarterFinal: false,
    quarterFinal: false,
    semiFinal: false,
    final: false,
  };

  draws.stages.forEach(([stageId, stageView]) => {
    const stageNumber = Number(stageId);
    
    if (stageView.stageType.__kind__ === 'RoundRobin') {
      const config = stageView.stageType.RoundRobin;
      
      // Create advancement config
      const advancementConfig: StageAdvancementConfig = {
        stageNumber,
        winnerDestination: deserializeAdvancementRule(config.advancementRuleWinner),
        runnerUpDestination: deserializeAdvancementRule(config.advancementRuleRunnerUp),
      };
      stageAdvancementConfigs.push(advancementConfig);

      // Track round robin stage numbers
      roundRobinStageNumbers.add(stageNumber);

      // Detect knockout stages from advancement rules
      if (advancementConfig.winnerDestination.type === 'KnockoutEntry') {
        const entryPoint = advancementConfig.winnerDestination.entryPoint;
        if (entryPoint === 'PreQuarterfinals') knockoutStages.preQuarterFinal = true;
        if (entryPoint === 'Quarterfinals') knockoutStages.quarterFinal = true;
        if (entryPoint === 'Semifinals') knockoutStages.semiFinal = true;
      }
      if (advancementConfig.runnerUpDestination.type === 'KnockoutEntry') {
        const entryPoint = advancementConfig.runnerUpDestination.entryPoint;
        if (entryPoint === 'PreQuarterfinals') knockoutStages.preQuarterFinal = true;
        if (entryPoint === 'Quarterfinals') knockoutStages.quarterFinal = true;
        if (entryPoint === 'Semifinals') knockoutStages.semiFinal = true;
      }
    } else if (stageView.stageType.__kind__ === 'Knockout') {
      // Knockout stage - always has semifinal and final
      knockoutStages.semiFinal = true;
      knockoutStages.final = true;
    }
  });

  // Build roundRobinRounds from the stage numbers we found
  const sortedStageNumbers = Array.from(roundRobinStageNumbers).sort((a, b) => a - b);
  
  // Count groups per stage by looking at group IDs
  const groupCountPerStage = new Map<number, number>();
  draws.groups.forEach(([groupId]) => {
    // Group IDs are typically structured as stageNumber * 100 + groupIndex
    // or we need to infer from the stage configs
    // For now, we'll count all groups and divide by number of stages
    const stageNum = Math.floor(Number(groupId) / 100);
    if (roundRobinStageNumbers.has(stageNum)) {
      groupCountPerStage.set(stageNum, (groupCountPerStage.get(stageNum) || 0) + 1);
    }
  });

  // If we can't determine group counts per stage, use total groups divided by stages
  const totalGroups = draws.groups.length;
  const defaultGroupCount = sortedStageNumbers.length > 0 
    ? Math.floor(totalGroups / sortedStageNumbers.length) 
    : 12;

  sortedStageNumbers.forEach(stageNum => {
    roundRobinRounds.push({
      roundNumber: stageNum,
      groupCount: groupCountPerStage.get(stageNum) || defaultGroupCount,
    });
  });

  // Calculate numberOfTeams from groups
  // Assuming each group has the same number of teams, we can infer from total groups
  // Default to 48 if we can't determine
  const numberOfTeams = totalGroups > 0 ? totalGroups * 4 : 48;

  return {
    name: tournamentView.name,
    creationDate: tournamentView.creationDate,
    stageAdvancementConfigs,
    roundRobinRounds: roundRobinRounds.length > 0 ? roundRobinRounds : [{ roundNumber: 1, groupCount: 12 }],
    knockoutStages,
    numberOfTeams,
    groupMap,
  };
}

function deserializeAdvancementRule(rule: AdvancementType): AdvancementDestination {
  if (rule.__kind__ === 'NextStage') {
    const stageIndex = Number(rule.NextStage);
    if (stageIndex === 999) {
      return { type: 'Eliminated' };
    }
    return { type: 'NextStage', stageIndex };
  } else {
    const knockoutEntry = rule.KnockoutEntry;
    let entryPoint: KnockoutEntryPoint;
    
    switch (knockoutEntry) {
      case 'PreQuarterfinals':
        entryPoint = 'PreQuarterfinals';
        break;
      case 'Quarterfinals':
        entryPoint = 'Quarterfinals';
        break;
      case 'Semifinals':
        entryPoint = 'Semifinals';
        break;
      default:
        throw new Error(`Unknown knockout entry: ${knockoutEntry}`);
    }
    
    return { type: 'KnockoutEntry', entryPoint };
  }
}
