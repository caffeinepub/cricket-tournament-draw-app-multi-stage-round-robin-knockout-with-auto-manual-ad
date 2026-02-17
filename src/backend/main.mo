import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Migration "migration";

(with migration = Migration.run)
actor {
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

  let groups = Map.empty<Nat, Text>();
  let stages = Map.empty<Nat, Text>();
  let roundRobinStages = Map.empty<Nat, RoundRobinStageConfig>();

  public shared ({ caller }) func addGroup(id : Nat, name : Text) : async () {
    groups.add(id, name);
  };

  public shared ({ caller }) func addStage(id : Nat, name : Text) : async () {
    stages.add(id, name);
  };

  public shared ({ caller }) func createRoundRobinStageConfig(
    stageId : Nat,
    advancementRuleWinner : AdvancementType,
    advancementRuleRunnerUp : AdvancementType,
  ) : async () {
    if (not stages.containsKey(stageId)) {
      return;
    };

    let config : RoundRobinStageConfig = {
      id = stageId;
      advancementRuleWinner;
      advancementRuleRunnerUp;
    };

    roundRobinStages.add(stageId, config);
  };
};
