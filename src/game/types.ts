import type { Region } from "./states";

export type ManifestoId = "socialist" | "expansionist" | "kingmaker" | "disruptor";

export type PolicyId =
  | "demonetization"  // ₹30k+ players lose half their cash
  | "presidents_rule"  // PM chooses one state to become unowned
  | "subsidy_south"    // South region owners gain ₹2,000
  | "tax_hike"
  | "land_reform"
  | "audit"
  | "jail_bharo"
  | "subsidy"
  | "free_press";

export type TacticalActionId = "mobilize" | "propaganda";

export type PlayerState = {
  seat: number;
  userId: string;
  displayName: string;
  rupees: number;
  position: number;
  votes: number; // votes accumulated this election cycle (1 per state owned)
  totalInfluence: number; // sum across owned states (used for tie-break + supremacy)
  electionsWon: number;
  manifesto: ManifestoId;
  manifestoComplete: boolean;
  inJail: number; // turns remaining in jail
  allianceWith: number | null; // seat
  traitorRoundsLeft: number; // 0 = no badge
  betrayalCount: number;
  bankrupt: boolean;
  diceBonus: number; // temporary bonus from Mobilize action (0..6)
};

export type StateOwnership = {
  stateId: string;
  ownerSeat: number | null;
  influence: Record<number, number>; // seat -> influence (0..100)
  hasOffice: boolean;
  frozenUntilRound: number; // 0 = not frozen
};

export type LogEntry = {
  id: string;
  ts: number;
  seat?: number;
  text: string;
};

export type ElectionState = {
  active: boolean;
  votesBy: Record<number, number>; // seat (voter) -> seat (voted-for)
  startedAt: number;
  deadline: number; // ms timestamp
};

export type PolicyState = {
  active: boolean;
  winnerSeat: number | null;
  choices: PolicyId[];
};

export type PendingPurchase = {
  seat: number;
  stateId: string;
  price: number;
};

export type PendingTacticalAction = {
  seat: number;
  action: TacticalActionId;
  targetState?: string; // for propaganda
};

export type GameState = {
  version: number;
  players: PlayerState[];
  ownership: Record<string, StateOwnership>; // stateId -> ownership
  diceRoll: [number, number] | null;
  hasRolledThisTurn: boolean;
  hasUsedCapabilityThisTurn: boolean;
  hasUsedTacticalActionThisTurn: boolean; // Chanakya: one per turn pre-roll
  pendingPurchase: PendingPurchase | null;
  pendingTacticalAction: PendingTacticalAction | null;
  election: ElectionState;
  policy: PolicyState;
  log: LogEntry[];
  rngSeed: number;
};
