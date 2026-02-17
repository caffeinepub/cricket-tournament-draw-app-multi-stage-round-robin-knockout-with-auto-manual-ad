import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";

module {
  type OldGroup = {
    id : Nat;
    name : Text;
    teams : [OldTeam];
  };

  type OldTeam = {
    id : Nat;
    name : Text;
  };

  type KnockoutMatch = {
    id : Nat;
    stageId : Nat;
    team1 : OldTeam;
    team2 : OldTeam;
    matchTime : Text;
    winner : ?OldTeam;
  };

  type OldRoundConfig = {
    roundNumber : Nat;
    groupCount : Nat;
    advancementRule : Text;
  };

  type OldTournamentConfig = {
    totalRounds : Nat;
    roundConfigs : [OldRoundConfig];
    enablePreQuarterfinals : Bool;
    enableQuarterfinals : Bool;
  };

  type OldStage = {
    id : Nat;
    name : Text;
    groups : [OldGroup];
  };

  type OldActor = {
    teams : List.List<OldTeam>;
    groups : List.List<OldGroup>;
    stages : List.List<OldStage>;
    knockoutMatches : List.List<KnockoutMatch>;
    tournamentConfigs : Map.Map<Nat, OldTournamentConfig>;
  };

  type AdvancementType = {
    #NextStage : Nat;
    #KnockoutEntry : KnockoutEntryType;
  };

  type KnockoutEntryType = {
    #PreQuarterfinals;
    #Quarterfinals;
    #Semifinals;
  };

  type RoundRobinStageConfig = {
    id : Nat;
    advancementRuleWinner : AdvancementType;
    advancementRuleRunnerUp : AdvancementType;
  };

  type NewActor = {
    groups : Map.Map<Nat, Text>;
    stages : Map.Map<Nat, Text>;
    roundRobinStages : Map.Map<Nat, RoundRobinStageConfig>;
  };

  public func run(old : OldActor) : NewActor {
    let newGroups = Map.empty<Nat, Text>();
    for (oldGroup in old.groups.values()) {
      newGroups.add(oldGroup.id, oldGroup.name);
    };

    let newStages = Map.empty<Nat, Text>();
    for (oldStage in old.stages.values()) {
      newStages.add(oldStage.id, oldStage.name);
    };

    {
      groups = newGroups;
      stages = newStages;
      roundRobinStages = Map.empty<Nat, RoundRobinStageConfig>();
    };
  };
};
