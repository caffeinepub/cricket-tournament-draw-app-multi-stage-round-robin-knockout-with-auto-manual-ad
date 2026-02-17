import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
    addStage(id: bigint, name: string): Promise<void>;
    createRoundRobinStageConfig(stageId: bigint, advancementRuleWinner: AdvancementType, advancementRuleRunnerUp: AdvancementType): Promise<void>;
}
