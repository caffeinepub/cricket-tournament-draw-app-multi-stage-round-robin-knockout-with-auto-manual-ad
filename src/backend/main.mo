import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Use migration module for smooth upgrades

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

  // Mutable types for internal use only (never returned directly)
  type Groups = Map.Map<Nat, Text>;
  type Stages = Map.Map<Nat, Stage>;
  type Draws = {
    groups : Groups;
    stages : Stages;
  };

  type Tournament = {
    name : Text;
    creationDate : Time.Time;
    draws : Draws;
    owner : ?Principal; // Make owner optional to avoid migration issues
  };

  // Immutable "View" types for public API
  type StageView = Stage;
  type DrawsView = {
    groups : [(Nat, Text)];
    stages : [(Nat, StageView)];
  };

  type TournamentView = {
    name : Text;
    creationDate : Time.Time;
    draws : DrawsView;
    owner : ?Principal;
  };

  type UserProfile = {
    id : Principal;
    username : Text;
    isPrivate : Bool;
    joinDate : Time.Time;
  };

  let tournaments = Map.empty<Nat, Tournament>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper to convert mutable Draws to immutable DrawsView
  func toDrawsView(draws : Draws) : DrawsView {
    {
      groups = draws.groups.toArray();
      stages = draws.stages.toArray();
    };
  };

  // Helper to convert mutable Tournament to immutable TournamentView
  func toTournamentView(tournament : Tournament) : TournamentView {
    {
      name = tournament.name;
      creationDate = tournament.creationDate;
      draws = toDrawsView(tournament.draws);
      owner = tournament.owner;
    };
  };

  // Helper to check if caller owns tournament or is admin
  func canModifyTournament(caller : Principal, tournament : Tournament) : Bool {
    switch (tournament.owner) {
      case (?owner) { caller == owner or AccessControl.isAdmin(accessControlState, caller) };
      case (null) { false };
    };
  };

  public shared ({ caller }) func createTournament(id : Nat, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tournaments");
    };
    let tournament : Tournament = {
      name;
      creationDate = Time.now();
      draws = {
        groups = Map.empty<Nat, Text>();
        stages = Map.empty<Nat, Stage>();
      };
      owner = ?caller;
    };
    tournaments.add(id, tournament);
  };

  public shared ({ caller }) func updateTournamentName(id : Nat, newName : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tournaments");
    };
    switch (tournaments.get(id)) {
      case (null) { false };
      case (?tournament) {
        if (not canModifyTournament(caller, tournament)) {
          Runtime.trap("Unauthorized: Can only modify your own tournaments");
        };
        let updatedTournament : Tournament = {
          tournament with name = newName;
        };
        tournaments.add(id, updatedTournament);
        true;
      };
    };
  };

  public shared ({ caller }) func addGroupToTournament(tournamentId : Nat, groupId : Nat, groupName : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify tournaments");
    };
    switch (tournaments.get(tournamentId)) {
      case (null) { false };
      case (?tournament) {
        if (not canModifyTournament(caller, tournament)) {
          Runtime.trap("Unauthorized: Can only modify your own tournaments");
        };
        tournament.draws.groups.add(groupId, groupName);
        true;
      };
    };
  };

  public shared ({ caller }) func addStageToTournament(
    tournamentId : Nat,
    stageId : Nat,
    name : Text,
    stageType : StageType,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify tournaments");
    };
    switch (tournaments.get(tournamentId)) {
      case (null) { false };
      case (?tournament) {
        if (not canModifyTournament(caller, tournament)) {
          Runtime.trap("Unauthorized: Can only modify your own tournaments");
        };
        let stage : Stage = {
          id = stageId;
          name;
          stageType;
        };
        tournament.draws.stages.add(stageId, stage);
        true;
      };
    };
  };

  public query ({ caller }) func getTournament(id : Nat) : async ?TournamentView {
    switch (tournaments.get(id)) {
      case (null) { null };
      case (?tournament) { ?toTournamentView(tournament) };
    };
  };

  public query ({ caller }) func getAllTournaments() : async [(Nat, TournamentView)] {
    tournaments.toArray().map(
      func((id, t)) { (id, toTournamentView(t)) }
    );
  };

  public shared ({ caller }) func deleteTournament(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tournaments");
    };
    switch (tournaments.get(id)) {
      case (null) { false };
      case (?tournament) {
        if (not canModifyTournament(caller, tournament)) {
          Runtime.trap("Unauthorized: Can only delete your own tournaments");
        };
        tournaments.remove(id);
        true;
      };
    };
  };

  public shared ({ caller }) func addGroupToAllTournaments(groupId : Nat, groupName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can modify all tournaments");
    };
    let tournamentIds = tournaments.keys().toArray();
    for (id in tournamentIds.values()) {
      switch (tournaments.get(id)) {
        case (?tournament) {
          tournament.draws.groups.add(groupId, groupName);
        };
        case (null) {};
      };
    };
  };

  public shared ({ caller }) func addStageToAllTournaments(stageId : Nat, name : Text, stageType : StageType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can modify all tournaments");
    };
    let tournamentIds = tournaments.keys().toArray();
    for (id in tournamentIds.values()) {
      switch (tournaments.get(id)) {
        case (?tournament) {
          let stage : Stage = {
            id = stageId;
            name;
            stageType;
          };
          tournament.draws.stages.add(stageId, stage);
        };
        case (null) {};
      };
    };
  };

  public shared ({ caller }) func setProfilePrivacy(isPrivate : Bool) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage profiles");
    };
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile = {
          profile with isPrivate;
        };
        userProfiles.add(caller, updatedProfile);
        true;
      };
      case (null) {
        let newProfile : UserProfile = {
          id = caller;
          username = "Unknown";
          isPrivate;
          joinDate = Time.now();
        };
        userProfiles.add(caller, newProfile);
        true;
      };
    };
  };

  public shared ({ caller }) func updateUsername(newUsername : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update username");
    };
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile = {
          profile with username = newUsername;
        };
        userProfiles.add(caller, updatedProfile);
      };
      case (null) {
        let newProfile : UserProfile = {
          id = caller;
          username = newUsername;
          isPrivate = false;
          joinDate = Time.now();
        };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  public shared ({ caller }) func initializeNewProfile(isPrivate : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initialize profiles");
    };
    let newProfile : UserProfile = {
      id = caller;
      username = "Unknown";
      isPrivate;
      joinDate = Time.now();
    };
    userProfiles.add(caller, newProfile);
  };

  func hasPermission(caller : Principal, profileOwnerId : Principal) : Bool {
    caller == profileOwnerId or AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getUserProfile(userId : Principal) : async ?UserProfile {
    switch (userProfiles.get(userId)) {
      case (?profile) {
        if (profile.isPrivate) {
          if (not hasPermission(caller, userId)) {
            return null;
          };
        };
        ?profile;
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let updatedProfile = {
      profile with id = caller;
    };
    userProfiles.add(caller, updatedProfile);
  };
};
