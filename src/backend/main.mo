import Map "mo:core/Map";
import Nat "mo:core/Nat";



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

  type StageType = {
    #RoundRobin : RoundRobinStageConfig;
    #Knockout;
  };

  type Stage = {
    id : Nat;
    name : Text;
    stageType : StageType;
  };

  let groups = Map.empty<Nat, Text>();
  let stages = Map.empty<Nat, Stage>();

  public shared ({ caller }) func addGroup(id : Nat, name : Text) : async () {
    groups.add(id, name);
  };

  public shared ({ caller }) func addStage(id : Nat, name : Text, stageType : StageType) : async () {
    let stage : Stage = {
      id;
      name;
      stageType;
    };
    stages.add(id, stage);
  };

  public shared ({ caller }) func getStage(id : Nat) : async ?Stage {
    stages.get(id);
  };

  public shared ({ caller }) func getAllStages() : async [(Nat, Stage)] {
    stages.toArray();
  };
};
