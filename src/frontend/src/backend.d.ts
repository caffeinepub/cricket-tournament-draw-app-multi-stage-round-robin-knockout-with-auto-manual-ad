import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Stage {
    id: bigint;
    name: string;
    stageType: StageType;
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
export type AdvancementType = {
    __kind__: "KnockoutEntry";
    KnockoutEntry: KnockoutEntryType;
} | {
    __kind__: "NextStage";
    NextStage: bigint;
};
export enum KnockoutEntryType {
    PreQuarterfinals = "PreQuarterfinals",
    Semifinals = "Semifinals",
    Quarterfinals = "Quarterfinals"
}
export interface backendInterface {
    addGroup(id: bigint, name: string): Promise<void>;
    addStage(id: bigint, name: string, stageType: StageType): Promise<void>;
    getAllStages(): Promise<Array<[bigint, Stage]>>;
    getStage(id: bigint): Promise<Stage | null>;
}
