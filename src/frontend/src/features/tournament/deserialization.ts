import type { TournamentView, StageType, AdvancementType } from '../../backend';
import type { Stage, Group, Team, StageAdvancementConfig, RoundRobinRoundConfig, AdvancementDestination, KnockoutEntryPoint } from './types';

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

      // Track round robin rounds
      if (!roundRobinRounds.find(r => r.roundNumber === stageNumber)) {
        roundRobinRounds.push({
          roundNumber: stageNumber,
          groupCount: 0, // Will be updated when we count groups
        });
      }
    }
  });

  return {
    name: tournamentView.name,
    creationDate: tournamentView.creationDate,
    stageAdvancementConfigs,
    roundRobinRounds,
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
