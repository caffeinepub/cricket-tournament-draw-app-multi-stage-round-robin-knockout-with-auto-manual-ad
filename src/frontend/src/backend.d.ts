import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface TournamentView {
    owner?: Principal;
    name: string;
    creationDate: Time;
    draws: DrawsView;
}
export interface DrawsView {
    stages: Array<[bigint, StageView]>;
    groups: Array<[bigint, string]>;
}
export interface RoundRobinStageConfig {
    id: bigint;
    advancementRuleWinner: AdvancementType;
    advancementRuleRunnerUp: AdvancementType;
}
export type StageType = {
    __kind__: "Knockout";
    Knockout: null;
} | {
    __kind__: "RoundRobin";
    RoundRobin: RoundRobinStageConfig;
};
export interface StageView {
    id: bigint;
    name: string;
    stageType: StageType;
}
export type AdvancementType = {
    __kind__: "KnockoutEntry";
    KnockoutEntry: KnockoutEntryType;
} | {
    __kind__: "NextStage";
    NextStage: bigint;
};
export interface UserProfile {
    id: Principal;
    username: string;
    joinDate: Time;
    isPrivate: boolean;
}
export enum KnockoutEntryType {
    PreQuarterfinals = "PreQuarterfinals",
    Semifinals = "Semifinals",
    Quarterfinals = "Quarterfinals"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGroupToAllTournaments(groupId: bigint, groupName: string): Promise<void>;
    addGroupToTournament(tournamentId: bigint, groupId: bigint, groupName: string): Promise<boolean>;
    addStageToAllTournaments(stageId: bigint, name: string, stageType: StageType): Promise<void>;
    addStageToTournament(tournamentId: bigint, stageId: bigint, name: string, stageType: StageType): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createTournament(id: bigint, name: string): Promise<void>;
    deleteTournament(id: bigint): Promise<boolean>;
    getAllTournaments(): Promise<Array<[bigint, TournamentView]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTournament(id: bigint): Promise<TournamentView | null>;
    getUserProfile(userId: Principal): Promise<UserProfile | null>;
    initializeNewProfile(isPrivate: boolean): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setProfilePrivacy(isPrivate: boolean): Promise<boolean>;
    updateTournamentName(id: bigint, newName: string): Promise<boolean>;
    updateUsername(newUsername: string): Promise<void>;
}
