// Core game engine — pure functions operating on GameState snapshots.
// All multiplayer mutations go through these to keep behavior consistent.
import { ALL_STATES, BOARD, BOARD_SIZE, REGION_THRESHOLDS, findState, tileAt } from "./states";
import type { Region } from "./states";
import { ALL_MANIFESTOS } from "./manifestos";
import type {
  GameState,
  LogEntry,
  ManifestoId,
  PlayerState,
  PolicyId,
  StateOwnership,
} from "./types";

// ---------- RNG (seeded, deterministic across replicas) ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFromState(state: GameState) {
  return mulberry32(state.rngSeed);
}

function nextSeed(state: GameState): number {
  const r = rngFromState(state);
  // advance seed by drawing one number
  return Math.floor(r() * 0xffffffff);
}

// ---------- helpers ----------
let logCounter = 0;
function makeLog(text: string, seat?: number): LogEntry {
  logCounter += 1;
  return {
    id: `${Date.now().toString(36)}-${logCounter}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    seat,
    text,
  };
}

function pushLog(state: GameState, text: string, seat?: number): GameState {
  return { ...state, log: [...state.log, makeLog(text, seat)].slice(-200) };
}

export function getPlayer(state: GameState, seat: number): PlayerState | undefined {
  return state.players.find((p) => p.seat === seat);
}

function updatePlayer(state: GameState, seat: number, fn: (p: PlayerState) => PlayerState): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.seat === seat ? fn(p) : p)),
  };
}

function updateOwnership(
  state: GameState,
  stateId: string,
  fn: (o: StateOwnership) => StateOwnership,
): GameState {
  const existing = state.ownership[stateId] ?? {
    stateId,
    ownerSeat: null,
    influence: {},
    hasOffice: false,
    frozenUntilRound: 0,
  };
  return {
    ...state,
    ownership: { ...state.ownership, [stateId]: fn({ ...existing, influence: existing.influence ?? {} }) },
  };
}

function isAdjacentToPosition(position: number, stateId: string): boolean {
  const left = tileAt(position - 1);
  const right = tileAt(position + 1);
  return (!left.isSpecial && left.id === stateId) || (!right.isSpecial && right.id === stateId);
}

function normalizeInfluence(value: unknown): Record<number, number> {
  if (!value || typeof value !== "object") return {};
  const influence: Record<number, number> = {};
  for (const [seat, amount] of Object.entries(value as Record<string, unknown>)) {
    const seatNumber = Number(seat);
    const amountNumber = Number(amount);
    if (Number.isFinite(seatNumber) && Number.isFinite(amountNumber)) {
      influence[seatNumber] = Math.max(0, Math.min(100, amountNumber));
    }
  }
  return influence;
}

export function normalizeGameState(state: GameState): GameState {
  const rawOwnership = state.ownership ?? {};
  const ownership: Record<string, StateOwnership> = {};

  for (const tile of ALL_STATES) {
    const existing = rawOwnership[tile.id] as Partial<StateOwnership> | undefined;
    const influence = normalizeInfluence(existing?.influence);
    if (
      Object.keys(influence).length === 0 &&
      typeof existing?.ownerSeat === "number" &&
      existing.ownerSeat > 0
    ) {
      influence[existing.ownerSeat] = 60;
    }
    const ownerSeat =
      typeof existing?.ownerSeat === "number" && (influence[existing.ownerSeat] ?? 0) >= 60
        ? existing.ownerSeat
        : null;
    ownership[tile.id] = {
      stateId: tile.id,
      ownerSeat,
      influence,
      hasOffice: Boolean(existing?.hasOffice && ownerSeat !== null),
      frozenUntilRound:
        typeof existing?.frozenUntilRound === "number" && Number.isFinite(existing.frozenUntilRound)
          ? existing.frozenUntilRound
          : 0,
    };
  }

  return recalcInfluenceTotals({
    ...state,
    ownership,
    diceRoll: state.diceRoll ?? null,
    hasRolledThisTurn: Boolean(state.hasRolledThisTurn),
    hasUsedCapabilityThisTurn: Boolean(state.hasUsedCapabilityThisTurn),
    hasUsedTacticalActionThisTurn: Boolean(state.hasUsedTacticalActionThisTurn),
    pendingPurchase: state.pendingPurchase ?? null,
    pendingTacticalAction: state.pendingTacticalAction ?? null,
    election: {
      active: Boolean(state.election?.active),
      votesBy: state.election?.votesBy ?? {},
      startedAt: state.election?.startedAt ?? 0,
      deadline: state.election?.deadline ?? 0,
    },
    policy: {
      active: Boolean(state.policy?.active),
      winnerSeat: state.policy?.winnerSeat ?? null,
      choices: state.policy?.choices ?? [],
    },
    log: Array.isArray(state.log) ? state.log : [],
    rngSeed: typeof state.rngSeed === "number" ? state.rngSeed : 1,
  });
}

// ---------- influence + ownership math ----------
export function totalInfluenceForSeat(state: GameState, seat: number): number {
  let total = 0;
  for (const o of Object.values(state.ownership)) {
    total += o.influence?.[seat] ?? 0;
  }
  return total;
}

export function statesOwnedBy(state: GameState, seat: number): string[] {
  return Object.values(state.ownership)
    .filter((o) => o.ownerSeat === seat)
    .map((o) => o.stateId);
}

export function regionsControlled(state: GameState, seat: number): Region[] {
  const owned = statesOwnedBy(state, seat);
  const counts: Record<string, number> = {};
  for (const id of owned) {
    const s = findState(id);
    if (!s) continue;
    counts[s.region] = (counts[s.region] ?? 0) + 1;
  }
  const out: Region[] = [];
  for (const region of Object.keys(REGION_THRESHOLDS) as Region[]) {
    if ((counts[region] ?? 0) >= REGION_THRESHOLDS[region].required) out.push(region);
  }
  return out;
}

function recalcInfluenceTotals(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      totalInfluence: totalInfluenceForSeat(state, p.seat),
      votes: calculateVotes(state, p.seat),
    })),
  };
}

// Chanakya: 1 vote per state owned + 2 votes per stronghold (80+ influence)
function calculateVotes(state: GameState, seat: number): number {
  let votes = 0;
  for (const own of Object.values(state.ownership)) {
    if (own.ownerSeat === seat) {
      const inf = own.influence?.[seat] ?? 0;
      votes += inf >= 80 ? 2 : 1;
    }
  }
  return votes;
}

// ---------- init ----------
export function initGame(seedPlayers: { seat: number; userId: string; displayName: string }[]): GameState {
  // Assign manifestos randomly (one per player, can repeat if more than 4 players)
  const seed = Math.floor(Math.random() * 0xffffffff);
  const rng = mulberry32(seed);

  const ownership: Record<string, StateOwnership> = {};
  for (const s of ALL_STATES) {
    ownership[s.id] = {
      stateId: s.id,
      ownerSeat: null,
      influence: {},
      hasOffice: false,
      frozenUntilRound: 0,
    };
  }

  const manifestoPool = [...ALL_MANIFESTOS];
  // shuffle
  for (let i = manifestoPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [manifestoPool[i], manifestoPool[j]] = [manifestoPool[j], manifestoPool[i]];
  }

  const players: PlayerState[] = seedPlayers
    .sort((a, b) => a.seat - b.seat)
    .map((p, idx) => ({
      seat: p.seat,
      userId: p.userId,
      displayName: p.displayName,
      rupees: 15000,
      position: 0,
      votes: 0,
      totalInfluence: 0,
      electionsWon: 0,
      manifesto: manifestoPool[idx % manifestoPool.length] as ManifestoId,
      manifestoComplete: false,
      inJail: 0,
      allianceWith: null,
      traitorRoundsLeft: 0,
      betrayalCount: 0,
      bankrupt: false,
      diceBonus: 0,
    }));

  return {
    version: 1,
    players,
    ownership,
    diceRoll: null,
    hasRolledThisTurn: false,
    hasUsedCapabilityThisTurn: false,
    hasUsedTacticalActionThisTurn: false,
    pendingPurchase: null,
    pendingTacticalAction: null,
    election: { active: false, votesBy: {}, startedAt: 0, deadline: 0 },
    policy: { active: false, winnerSeat: null, choices: [] },
    log: [makeLog("The chamber is sealed. Round 1 begins.")],
    rngSeed: seed,
  };
}

// ---------- dice ----------
export function rollDice(state: GameState, seat: number, currentRound: number): GameState {
  if (state.election.active || state.policy.active) return state;
  if (state.hasRolledThisTurn) return state;
  const player = getPlayer(state, seat);
  if (!player || player.bankrupt) return state;

  // jail handling
  if (player.inJail > 0) {
    let s = updatePlayer(state, seat, (p) => ({ ...p, inJail: p.inJail - 1 }));
    s = pushLog(s, `${player.displayName} is in jail (${player.inJail - 1} turn(s) left). Skip.`, seat);
    return { ...s, hasRolledThisTurn: true };
  }

  const rng = rngFromState(state);
  const d1 = Math.floor(rng() * 6) + 1;
  const d2 = Math.floor(rng() * 6) + 1;
  const newSeed = nextSeed(state);

  const bonus = player.diceBonus;
  const totalRoll = d1 + d2 + bonus;
  let s: GameState = { ...state, rngSeed: newSeed, diceRoll: [d1, d2], hasRolledThisTurn: true };
  
  if (bonus > 0) {
    s = pushLog(s, `${player.displayName} rolled ${d1} + ${d2} + ${bonus} (Mobilize) = ${totalRoll}.`, seat);
  } else {
    s = pushLog(s, `${player.displayName} rolled ${d1} + ${d2} = ${totalRoll}.`, seat);
  }
  
  // Reset tactical action for next turn
  s = updatePlayer(s, seat, (pl) => ({ ...pl, diceBonus: 0 }));
  s = { ...s, hasUsedTacticalActionThisTurn: false };
  s = movePlayer(s, seat, totalRoll, currentRound);
  return s;
}

function movePlayer(state: GameState, seat: number, steps: number, currentRound: number): GameState {
  const p = getPlayer(state, seat);
  if (!p) return state;
  const oldPos = p.position;
  const newPos = (oldPos + steps) % BOARD_SIZE;
  const passedHQ = oldPos + steps >= BOARD_SIZE;

  let s = updatePlayer(state, seat, (pl) => ({ ...pl, position: newPos }));

  if (passedHQ) {
    // Maharashtra stronghold: ₹3000 instead of ₹2000
    const own = state.ownership["maharashtra"];
    const maharashtraStronghold = own && own.ownerSeat === seat && (own.influence[seat] ?? 0) >= 80;
    const salary = maharashtraStronghold ? 3000 : 2000;
    s = updatePlayer(s, seat, (pl) => ({ ...pl, rupees: pl.rupees + salary }));
    s = pushLog(s, `${p.displayName} passed Chunav HQ. Collected ₹${salary}.`, seat);
  }

  s = onLand(s, seat, newPos, currentRound);
  return s;
}

// ---------- landing ----------
function onLand(state: GameState, seat: number, position: number, currentRound: number): GameState {
  const tile = tileAt(position);
  const p = getPlayer(state, seat);
  if (!p) return state;

  if (tile.isSpecial) {
    if (tile.kind === "hq") return state;
    if (tile.kind === "chance" || tile.kind === "niti") {
      // South synergy: ₹500 to south-majority opponents
      let s = state;
      for (const opp of state.players) {
        if (opp.seat === seat || opp.bankrupt) continue;
        if (regionsControlled(state, opp.seat).includes("south")) {
          s = updatePlayer(s, opp.seat, (pl) => ({ ...pl, rupees: pl.rupees + 500 }));
          s = pushLog(s, `Tech Corridor: ${opp.displayName} earns ₹500.`, opp.seat);
        }
      }
      // Apply a small chance effect
      const rng = mulberry32(s.rngSeed);
      const roll = rng();
      const newSeed = Math.floor(rng() * 0xffffffff);
      s = { ...s, rngSeed: newSeed };
      if (roll < 0.33) {
        s = updatePlayer(s, seat, (pl) => ({ ...pl, rupees: pl.rupees + 1000 }));
        s = pushLog(s, `${p.displayName} drew a favourable card. +₹1,000.`, seat);
      } else if (roll < 0.66) {
        s = updatePlayer(s, seat, (pl) => ({ ...pl, inJail: 2 }));
        s = pushLog(s, `${p.displayName} drew Scandal and was sent to the Inquiry Commission for 2 turns.`, seat);
      } else {
        // tiny influence boost in a random owned state
        const owned = statesOwnedBy(s, seat);
        if (owned.length) {
          const pick = owned[Math.floor(rng() * owned.length)];
          s = bumpInfluence(s, pick, seat, 5);
          s = pushLog(s, `${p.displayName} drew Rally. +5 influence in ${findState(pick)?.name}.`, seat);
        } else {
          s = pushLog(s, `${p.displayName} drew an empty card.`, seat);
        }
      }
      return recalcInfluenceTotals(s);
    }
    return state;
  }

  // It's a state tile.
  const stateTile = findState(tile.id);
  if (!stateTile) return state;
  const own = state.ownership[tile.id];
  if (!own) return state;

  // Frozen state: nothing happens
  if (own.frozenUntilRound >= currentRound) {
    return pushLog(state, `${stateTile.name} is locked down by Lobby. Nothing happens.`, seat);
  }

  // Unowned -> offer purchase with 60 influence automatically
  if (own.ownerSeat === null) {
    // Chanakya: Buying a state gives you 60 influence and ownership
    const cost = stateTile.price;
    if (p.rupees < cost) {
      return pushLog(
        state,
        `${p.displayName} cannot afford the ₹${cost} Campaign Cost for ${stateTile.name}.`,
        seat,
      );
    }
    
    let s = updatePlayer(state, seat, (pl) => ({ ...pl, rupees: pl.rupees - cost }));
    s = updateOwnership(s, stateTile.id, (o) => ({
      ...o,
      ownerSeat: seat,
      influence: { ...o.influence, [seat]: 60 },
      hasOffice: false,
    }));
    s = pushLog(s, `${p.displayName} paid ₹${cost} Campaign Cost in ${stateTile.name}. Gained 60 Influence.`, seat);
    return recalcInfluenceTotals(s);
  }

  // Owned by self -> offer re-invest option
  if (own.ownerSeat === seat) {
    return {
      ...state,
      pendingPurchase: {
        seat,
        stateId: stateTile.id,
        price: 1000, // flag for re-invest mode
      },
    };
  }

  // Owned by other -> Damage Control (Chanakya)
  return chanakyaDamageControl(state, seat, stateTile.id, currentRound);
}

function bumpInfluence(state: GameState, stateId: string, seat: number, delta: number): GameState {
  return updateOwnership(state, stateId, (o) => {
    const cur = o.influence[seat] ?? 0;
    const next = Math.max(0, Math.min(100, cur + delta));
    const newInf = { ...o.influence, [seat]: next };
    // ownership transfer at 60+ if higher than current owner
    let ownerSeat = o.ownerSeat;
    let topSeat = ownerSeat;
    let topVal = ownerSeat !== null ? newInf[ownerSeat] ?? 0 : -1;
    for (const k of Object.keys(newInf)) {
      const s = Number(k);
      const v = newInf[s];
      if (v >= 60 && v > topVal) {
        topVal = v;
        topSeat = s;
      }
    }
    if (topSeat !== ownerSeat) ownerSeat = topSeat;
    return { ...o, influence: newInf, ownerSeat };
  });
}

// ---------- chanakya damage control ----------
// Chanakya Edition: "Damage Control" instead of rent
// - Normal (60-79 Infl): ₹2,000
// - Stronghold (80+ Infl): ₹3,000 + lose 10 Influence in own strongest state
// - NE/Central: No damage control costs at all
// - East synergy: Cannot be lobbied (immunity to Propaganda, but not Damage Control)
function chanakyaDamageControl(state: GameState, seat: number, stateId: string, currentRound: number): GameState {
  const own = state.ownership[stateId];
  if (!own || own.ownerSeat === null || own.ownerSeat === seat) return state;
  const tile = findState(stateId);
  if (!tile) return state;

  const payer = getPlayer(state, seat);
  const owner = getPlayer(state, own.ownerSeat);
  if (!payer || !owner) return state;

  if (owner.inJail > 0) {
    return pushLog(
      state,
      `Inquiry Commission: ${owner.displayName} cannot collect Damage Control for ${tile.name}.`,
      seat,
    );
  }

  // NE+Central: No Damage Control costs here.
  if (tile.region === "ne_central") {
    return pushLog(state, `Special Status: ${payer.displayName} pays no Damage Control in ${tile.name}.`, seat);
  }

  const ownerInf = own.influence[own.ownerSeat] ?? 0;
  let damageControl = 0;
  let strengthPenalty = 0;

  if (ownerInf >= 80) {
    // Stronghold: ₹3,000 + lose 10 influence in own strongest state
    damageControl = 3000;
    strengthPenalty = 10;
  } else if (ownerInf >= 60) {
    // Normal: ₹2,000
    damageControl = 2000;
  } else {
    damageControl = 2000;
  }

  // Apply office increase (+50%)
  if (own.hasOffice) {
    damageControl = Math.floor(damageControl * 1.5);
  }

  let s = settlePayment(state, seat, owner.seat, damageControl);
  const actualPay = Math.min(damageControl, Math.max(0, payer.rupees + liquidatableValue(state, seat)));
  s = pushLog(
    s,
    `${payer.displayName} paid ₹${actualPay} Damage Control to ${owner.displayName} for ${tile.name}.`,
    seat,
  );

  // If stronghold, payer loses 10 influence in their strongest owned state
  if (strengthPenalty > 0) {
    const payerOwned = statesOwnedBy(s, seat);
    if (payerOwned.length > 0) {
      // Find strongest
      let strongestState = payerOwned[0];
      let strongestInf = s.ownership[strongestState].influence[seat] ?? 0;
      for (const stId of payerOwned) {
        const inf = s.ownership[stId].influence[seat] ?? 0;
        if (inf > strongestInf) {
          strongestInf = inf;
          strongestState = stId;
        }
      }
      s = bumpInfluence(s, strongestState, seat, -strengthPenalty);
      const stateName = findState(strongestState)?.name;
      s = pushLog(s, `${payer.displayName} lost 10 influence in ${stateName} (Stronghold penalty).`, seat);
    }
  }

  return recalcInfluenceTotals(s);
}

function liquidatableValue(state: GameState, seat: number): number {
  let total = 0;
  for (const o of Object.values(state.ownership)) {
    if ((o.influence[seat] ?? 0) <= 0) continue;
    const tile = findState(o.stateId);
    if (tile) total += Math.floor(tile.price * 0.5);
  }
  return total;
}

function sellStrongestInfluence(state: GameState, seat: number): { state: GameState; recovered: number; stateName: string } | null {
  let strongestId: string | null = null;
  let strongestInfluence = 0;
  for (const o of Object.values(state.ownership)) {
    const influence = o.influence[seat] ?? 0;
    if (influence > strongestInfluence) {
      strongestInfluence = influence;
      strongestId = o.stateId;
    }
  }
  if (!strongestId || strongestInfluence <= 0) return null;
  const tile = findState(strongestId);
  if (!tile) return null;
  const recovered = Math.floor(tile.price * 0.5);
  let next = updateOwnership(state, strongestId, (o) => {
    const influence = { ...o.influence, [seat]: 0 };
    let ownerSeat = o.ownerSeat;
    let hasOffice = o.hasOffice;
    if (ownerSeat === seat) {
      ownerSeat = null;
      hasOffice = false;
      let bestInfluence = 0;
      for (const key of Object.keys(influence)) {
        const candidateSeat = Number(key);
        const candidateInfluence = influence[candidateSeat] ?? 0;
        if (candidateInfluence >= 60 && candidateInfluence > bestInfluence) {
          ownerSeat = candidateSeat;
          bestInfluence = candidateInfluence;
        }
      }
    }
    return { ...o, ownerSeat, hasOffice, influence };
  });
  next = updatePlayer(next, seat, (p) => ({ ...p, rupees: p.rupees + recovered }));
  return { state: next, recovered, stateName: tile.name };
}

function settlePayment(state: GameState, payerSeat: number, recipientSeat: number, amount: number): GameState {
  let s = state;
  const payer = getPlayer(s, payerSeat);
  const recipient = getPlayer(s, recipientSeat);
  if (!payer || !recipient || amount <= 0) return s;

  while ((getPlayer(s, payerSeat)?.rupees ?? 0) < amount) {
    const sale = sellStrongestInfluence(s, payerSeat);
    if (!sale) break;
    s = sale.state;
    const updatedPayer = getPlayer(s, payerSeat);
    s = pushLog(
      s,
      `${updatedPayer?.displayName ?? payer.displayName} sold Influence in ${sale.stateName} for ₹${sale.recovered}.`,
      payerSeat,
    );
  }

  const available = getPlayer(s, payerSeat)?.rupees ?? 0;
  const paid = Math.min(available, amount);
  s = updatePlayer(s, payerSeat, (p) => ({ ...p, rupees: p.rupees - paid }));
  s = updatePlayer(s, recipientSeat, (p) => ({ ...p, rupees: p.rupees + paid }));
  if (paid < amount) {
    s = updatePlayer(s, payerSeat, (p) => ({ ...p, bankrupt: true, rupees: 0 }));
    s = pushLog(s, `${payer.displayName} defaulted and is eliminated from the machine.`, payerSeat);
  }
  return recalcInfluenceTotals(s);
}

// ---------- buy ----------
export function buyPendingState(state: GameState, seat: number): GameState {
  const pending = state.pendingPurchase;
  if (!pending || pending.seat !== seat) return state;
  const p = getPlayer(state, seat);
  if (!p || p.rupees < pending.price) return state;

  const own = state.ownership[pending.stateId];
  const tile = findState(pending.stateId);
  if (!own || !tile) return state;

  // Chanakya: Check if this is a re-invest (landing on own state)
  if (own.ownerSeat === seat && pending.price === 1000) {
    // Re-invest: Pay ₹1,000 → gain +10 Influence
    let s: GameState = {
      ...state,
      pendingPurchase: null,
      players: state.players.map((pl) =>
        pl.seat === seat ? { ...pl, rupees: pl.rupees - 1000 } : pl,
      ),
    };
    s = bumpInfluence(s, pending.stateId, seat, 10);
    s = pushLog(s, `${p.displayName} re-invested in ${tile.name}. +10 Influence (₹1,000).`, seat);
    return recalcInfluenceTotals(s);
  }

  // Legacy: Normal purchase (shouldn't be reached in Chanakya flow, but keeping for compatibility)
  let s: GameState = {
    ...state,
    pendingPurchase: null,
    players: state.players.map((pl) =>
      pl.seat === seat ? { ...pl, rupees: pl.rupees - pending.price } : pl,
    ),
  };
  s = updateOwnership(s, pending.stateId, (o) => ({
    ...o,
    ownerSeat: seat,
    influence: { ...o.influence, [seat]: Math.max(o.influence[seat] ?? 0, 60) },
  }));
  s = pushLog(s, `${p.displayName} bought ${tile.name} for ₹${pending.price}.`, seat);
  return recalcInfluenceTotals(s);
}

export function declinePurchase(state: GameState, seat: number): GameState {
  if (!state.pendingPurchase || state.pendingPurchase.seat !== seat) return state;
  return { ...state, pendingPurchase: null };
}

// ---------- build office ----------
export function buildOffice(state: GameState, seat: number, stateId: string): GameState {
  const own = state.ownership[stateId];
  const p = getPlayer(state, seat);
  if (!own || !p || own.ownerSeat !== seat || own.hasOffice) return state;
  const cost = regionsControlled(state, seat).includes("west") ? 1000 : 2000;
  if (p.rupees < cost) return state;

  let s = updatePlayer(state, seat, (pl) => ({ ...pl, rupees: pl.rupees - cost }));
  s = updateOwnership(s, stateId, (o) => ({ ...o, hasOffice: true }));
  s = pushLog(s, `${p.displayName} built an Office in ${findState(stateId)?.name} (₹${cost}).`, seat);
  return s;
}

// ---------- capabilities ----------
export function useMobilize(state: GameState, seat: number, currentRound: number): GameState {
  return chanakyaMobilize(state, seat);
}

export function useLobby(state: GameState, seat: number, stateId: string, currentRound: number): GameState {
  return state;
}

export function usePropaganda(state: GameState, seat: number, targetSeat: number, stateId: string): GameState {
  return chanakyaPropaganda(state, seat, stateId);
}

function drainInfluence(state: GameState, seat: number, amount: number): GameState {
  // Take influence from owned states proportionally
  const owned = Object.values(state.ownership).filter((o) => (o.influence[seat] ?? 0) > 0);
  if (!owned.length) return state;
  const total = owned.reduce((sum, o) => sum + (o.influence[seat] ?? 0), 0);
  if (total < amount) return state;
  let remaining = amount;
  let s = state;
  for (let i = 0; i < owned.length; i++) {
    const o = owned[i];
    const share = i === owned.length - 1 ? remaining : Math.min(o.influence[seat] ?? 0, Math.ceil((amount * (o.influence[seat] ?? 0)) / total));
    remaining -= share;
    s = updateOwnership(s, o.stateId, (oo) => ({
      ...oo,
      influence: { ...oo.influence, [seat]: Math.max(0, (oo.influence[seat] ?? 0) - share) },
    }));
  }
  // Recompute owner if anyone fell below 60
  s = {
    ...s,
    ownership: Object.fromEntries(
      Object.entries(s.ownership).map(([id, o]) => {
        let owner = o.ownerSeat;
        if (owner !== null && (o.influence[owner] ?? 0) < 60) {
          // find next highest
          let best = -1;
          let bestSeat: number | null = null;
          for (const k of Object.keys(o.influence)) {
            const ks = Number(k);
            const v = o.influence[ks];
            if (v >= 60 && v > best) {
              best = v;
              bestSeat = ks;
            }
          }
          owner = bestSeat;
        }
        return [id, { ...o, ownerSeat: owner }];
      }),
    ),
  };
  return s;
}

// ---------- alliances ----------
export function proposeAlliance(state: GameState, seat: number, target: number): GameState {
  // Simple: instant accept (simplification for MVP). Both sides must be allianceless and not traitors.
  const a = getPlayer(state, seat);
  const b = getPlayer(state, target);
  if (!a || !b || a.allianceWith !== null || b.allianceWith !== null) return state;
  if (a.traitorRoundsLeft > 0 || b.traitorRoundsLeft > 0) return state;
  let s = updatePlayer(state, seat, (p) => ({ ...p, allianceWith: target }));
  s = updatePlayer(s, target, (p) => ({ ...p, allianceWith: seat }));
  s = pushLog(s, `${a.displayName} and ${b.displayName} forged an alliance.`, seat);
  return s;
}

export function betrayAlliance(state: GameState, seat: number): GameState {
  const a = getPlayer(state, seat);
  if (!a || a.allianceWith === null) return state;
  const b = getPlayer(state, a.allianceWith);
  if (!b) return state;

  // +25 influence in your weakest owned state
  const owned = statesOwnedBy(state, seat);
  let weakestId: string | null = null;
  let weakestVal = Infinity;
  for (const id of owned) {
    const v = state.ownership[id].influence[seat] ?? 0;
    if (v < weakestVal) {
      weakestVal = v;
      weakestId = id;
    }
  }
  let s = state;
  if (weakestId) s = bumpInfluence(s, weakestId, seat, 25);
  s = updatePlayer(s, seat, (p) => ({
    ...p,
    allianceWith: null,
    traitorRoundsLeft: 2,
    betrayalCount: p.betrayalCount + 1,
  }));
  s = updatePlayer(s, b.seat, (p) => ({ ...p, allianceWith: null }));
  s = pushLog(s, `${a.displayName} BETRAYED ${b.displayName}! Traitor Badge applied.`, seat);
  return recalcInfluenceTotals(s);
}

// ---------- end turn ----------
export function endTurn(state: GameState, currentRound: number, currentSeat: number): {
  state: GameState;
  nextSeat: number;
  nextRound: number;
  triggerElection: boolean;
} {
  // resolve any auto-decline of pending
  let s = state;
  if (s.pendingPurchase && s.pendingPurchase.seat === currentSeat) {
    s = { ...s, pendingPurchase: null };
  }
  s = { ...s, hasRolledThisTurn: false, hasUsedCapabilityThisTurn: false, hasUsedTacticalActionThisTurn: false, diceRoll: null };

  // Decrement traitor rounds (only when their own turn ends)
  s = updatePlayer(s, currentSeat, (p) => ({
    ...p,
    traitorRoundsLeft: Math.max(0, p.traitorRoundsLeft - 1),
  }));

  // Figure out next seat
  const seats = s.players.filter((p) => !p.bankrupt).map((p) => p.seat).sort((a, b) => a - b);
  if (seats.length === 0) return { state: s, nextSeat: currentSeat, nextRound: currentRound, triggerElection: false };
  const idx = seats.indexOf(currentSeat);
  const nextIdx = (idx + 1) % seats.length;
  const nextSeat = seats[nextIdx];
  let nextRound = currentRound;
  let triggerElection = false;
  if (nextIdx === 0) {
    nextRound = currentRound + 1;
    s = pushLog(s, `--- Round ${nextRound} begins ---`);
    if (nextRound % 3 === 0) triggerElection = true;
  }
  return { state: s, nextSeat, nextRound, triggerElection };
}

// ---------- chanakya tactical actions (pre-roll) ----------
// These are executed BEFORE rolling the dice
export function chanakyaMobilize(state: GameState, seat: number): GameState {
  if (state.hasRolledThisTurn) return state;
  if (state.hasUsedTacticalActionThisTurn) return state;
  const p = getPlayer(state, seat);
  if (!p || p.bankrupt || p.totalInfluence < 20) return state;

  // Spend 20 influence
  let s = drainInfluence(state, seat, 20);
  
  // Generate random bonus 1-6
  const rng = mulberry32(s.rngSeed);
  const bonus = Math.floor(rng() * 6) + 1;
  const newSeed = Math.floor(rng() * 0xffffffff);
  
  s = { ...s, rngSeed: newSeed };
  s = updatePlayer(s, seat, (pl) => ({ ...pl, diceBonus: bonus }));
  s = { ...s, hasUsedTacticalActionThisTurn: true };
  s = pushLog(s, `${p.displayName} mobilizes! Next roll gets +${bonus} (costs 20 Influence).`, seat);
  return recalcInfluenceTotals(s);
}

export function chanakyaPropaganda(state: GameState, seat: number, targetStateId: string): GameState {
  if (state.hasRolledThisTurn) return state;
  if (state.hasUsedTacticalActionThisTurn) return state;
  const p = getPlayer(state, seat);
  if (!p || p.bankrupt || p.totalInfluence < 50) return state;

  const targetTile = findState(targetStateId);
  if (!targetTile) return state;
  if (!isAdjacentToPosition(p.position, targetStateId)) {
    return pushLog(state, `${p.displayName} can only target an adjacent state with Propaganda.`, seat);
  }
  
  const own = state.ownership[targetStateId];
  if (!own || own.ownerSeat === null || own.ownerSeat === seat) return state;
  
  // Check East synergy: states cannot be lobbied (Propaganda immunity)
  const owner = getPlayer(state, own.ownerSeat);
  if (!owner) return state;
  const ownerRegions = regionsControlled(state, own.ownerSeat);
  if (ownerRegions.includes("east")) {
    return pushLog(state, `East Synergy: ${targetTile.name} cannot be lobbied. Propaganda fails.`, seat);
  }

  // Spend 50 influence and reduce target owner's influence by 20
  let s = drainInfluence(state, seat, 50);
  s = bumpInfluence(s, targetStateId, own.ownerSeat, -20);
  s = { ...s, hasUsedTacticalActionThisTurn: true };
  s = pushLog(s, `${p.displayName} runs Propaganda in ${targetTile.name}! ${owner.displayName} loses 20 influence (costs 50 Influence).`, seat);
  return recalcInfluenceTotals(s);
}

// ---------- elections ----------
export function startElection(state: GameState): GameState {
  return {
    ...state,
    election: {
      active: true,
      votesBy: {},
      startedAt: Date.now(),
      deadline: Date.now() + 60_000,
    },
  };
}

export function castVote(state: GameState, voterSeat: number, targetSeat: number): GameState {
  if (!state.election.active) return state;
  const voter = getPlayer(state, voterSeat);
  const target = getPlayer(state, targetSeat);
  if (!voter || !target || voter.bankrupt) return state;
  return {
    ...state,
    election: { ...state.election, votesBy: { ...state.election.votesBy, [voterSeat]: targetSeat } },
  };
}

export function tallyElection(state: GameState): GameState {
  if (!state.election.active) return state;
  const totals: Record<number, number> = {};
  for (const p of state.players) totals[p.seat] = 0;

  for (const [voterSeatStr, targetSeat] of Object.entries(state.election.votesBy)) {
    const voterSeat = Number(voterSeatStr);
    const voter = getPlayer(state, voterSeat);
    if (!voter) continue;
    let weight = voter.votes; // 1 per state owned
    if (regionsControlled(state, voterSeat).includes("north")) weight = Math.floor(weight * 1.5);
    totals[targetSeat] = (totals[targetSeat] ?? 0) + weight;
  }

  // Auto-distribute votes for non-voters: random non-leader
  const nonVoters = state.players.filter(
    (p) => !p.bankrupt && state.election.votesBy[p.seat] === undefined,
  );
  for (const nv of nonVoters) {
    const candidates = state.players.filter((p) => !p.bankrupt && p.seat !== nv.seat);
    if (!candidates.length) continue;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    let weight = nv.votes;
    if (regionsControlled(state, nv.seat).includes("north")) weight = Math.floor(weight * 1.5);
    totals[target.seat] = (totals[target.seat] ?? 0) + weight;
  }

  // Determine winner
  let topVotes = -1;
  let candidates: number[] = [];
  for (const [seatStr, v] of Object.entries(totals)) {
    const seat = Number(seatStr);
    if (v > topVotes) {
      topVotes = v;
      candidates = [seat];
    } else if (v === topVotes) {
      candidates.push(seat);
    }
  }
  // tie-break by influence
  let winner = candidates[0];
  let bestInf = -1;
  for (const c of candidates) {
    const inf = totalInfluenceForSeat(state, c);
    if (inf > bestInf) {
      bestInf = inf;
      winner = c;
    }
  }
  const winnerName = getPlayer(state, winner)?.displayName ?? "Someone";
  let s = updatePlayer(state, winner, (p) => ({ ...p, electionsWon: p.electionsWon + 1 }));
  s = pushLog(s, `Election winner: ${winnerName} (${topVotes} votes).`);

  return {
    ...s,
    election: { active: false, votesBy: {}, startedAt: 0, deadline: 0 },
    policy: { active: true, winnerSeat: winner, choices: ["demonetization", "presidents_rule", "subsidy_south"] },
  };
}

export function applyPolicy(state: GameState, policyId: PolicyId, targetSeat?: number, targetStateId?: string): GameState {
  if (!state.policy.active || !state.policy.winnerSeat) return state;
  const winner = state.policy.winnerSeat;
  const winnerP = getPlayer(state, winner);
  if (!winnerP) return state;

  let s = state;
  switch (policyId) {
    case "demonetization": {
      for (const p of s.players) {
        if (p.bankrupt || p.rupees <= 30000) continue;
        s = updatePlayer(s, p.seat, (pl) => ({ ...pl, rupees: Math.floor(pl.rupees / 2) }));
      }
      s = pushLog(s, `Policy: Demonetization. Players above ₹30,000 lose half their cash.`);
      break;
    }
    case "presidents_rule": {
      if (!targetStateId || !s.ownership[targetStateId]) return state;
      const target = findState(targetStateId);
      s = updateOwnership(s, targetStateId, (o) => ({
        ...o,
        ownerSeat: null,
        influence: {},
        hasOffice: false,
      }));
      s = pushLog(s, `Policy: President's Rule. ${target?.name ?? "A state"} becomes Unowned.`);
      break;
    }
    case "subsidy_south": {
      const paidSeats = new Set<number>();
      for (const own of Object.values(s.ownership)) {
        if (own.ownerSeat === null || paidSeats.has(own.ownerSeat)) continue;
        const tile = findState(own.stateId);
        if (tile?.region !== "south") continue;
        paidSeats.add(own.ownerSeat);
        s = updatePlayer(s, own.ownerSeat, (p) => ({ ...p, rupees: p.rupees + 2000 }));
      }
      s = pushLog(s, `Policy: Subsidy Drop. South state owners gain ₹2,000.`);
      break;
    }
    case "tax_hike": {
      s = updatePlayer(s, winner, (p) => ({ ...p, rupees: Math.max(0, p.rupees - 1000) }));
      for (const p of s.players) {
        if (p.seat === winner || p.bankrupt) continue;
        const pay = Math.min(1000, p.rupees);
        s = updatePlayer(s, p.seat, (pl) => ({ ...pl, rupees: pl.rupees - pay }));
        s = updatePlayer(s, winner, (pl) => ({ ...pl, rupees: pl.rupees + pay }));
      }
      s = pushLog(s, `Policy: Tax Hike. ${winnerP.displayName} collects from all.`);
      break;
    }
    case "land_reform": {
      for (const p of s.players) {
        const owned = statesOwnedBy(s, p.seat);
        if (!owned.length) continue;
        let weakest = owned[0];
        let val = s.ownership[weakest].influence[p.seat] ?? 0;
        for (const id of owned) {
          const v = s.ownership[id].influence[p.seat] ?? 0;
          if (v < val) {
            val = v;
            weakest = id;
          }
        }
        s = bumpInfluence(s, weakest, p.seat, 10);
      }
      s = pushLog(s, `Policy: Land Reform. Everyone gains +10 influence in their weakest state.`);
      break;
    }
    case "audit": {
      const opps = s.players.filter((p) => p.seat !== winner && !p.bankrupt);
      if (opps.length) {
        const richest = [...opps].sort((a, b) => b.rupees - a.rupees)[0];
        const loss = Math.min(2000, richest.rupees);
        s = updatePlayer(s, richest.seat, (p) => ({ ...p, rupees: p.rupees - loss }));
        s = pushLog(s, `Policy: Audit. ${richest.displayName} loses ₹${loss}.`);
      }
      break;
    }
    case "jail_bharo": {
      if (typeof targetSeat === "number") {
        s = updatePlayer(s, targetSeat, (p) => ({ ...p, inJail: 1 }));
        const t = getPlayer(s, targetSeat);
        s = pushLog(s, `Policy: Jail Bharo. ${t?.displayName} sent to jail.`);
      }
      break;
    }
    case "subsidy": {
      for (const p of s.players) {
        if (p.bankrupt) continue;
        s = updatePlayer(s, p.seat, (pl) => ({ ...pl, rupees: pl.rupees + 1500 }));
      }
      s = pushLog(s, `Policy: Subsidy. Everyone +₹1,500.`);
      break;
    }
    case "free_press": {
      s = { ...s, players: s.players.map((p) => ({ ...p, traitorRoundsLeft: 0 })) };
      s = pushLog(s, `Policy: Free Press. All Traitor Badges cleared.`);
      break;
    }
  }

  // Anti-hoarding: Tax/Audit double-trigger if anyone holds >40k
  for (const p of s.players) {
    if (p.rupees > 40000 && (policyId === "tax_hike" || policyId === "audit")) {
      const extra = Math.min(1000, p.rupees);
      s = updatePlayer(s, p.seat, (pl) => ({ ...pl, rupees: pl.rupees - extra }));
      s = pushLog(s, `Anti-Hoarding: ${p.displayName} pays an extra ₹${extra}.`);
    }
  }

  return { ...s, policy: { active: false, winnerSeat: null, choices: [] } };
}

// ---------- manifestos & win check ----------
export function checkManifestoComplete(state: GameState, seat: number): boolean {
  const p = getPlayer(state, seat);
  if (!p) return false;
  switch (p.manifesto) {
    case "socialist":
      return state.players.every((pl) => pl.rupees <= 20000);
    case "expansionist": {
      const owned = statesOwnedBy(state, seat).map((id) => findState(id)?.region).filter(Boolean);
      const set = new Set(owned);
      return set.size >= 5;
    }
    case "kingmaker": {
      if (p.allianceWith === null) return false;
      const ally = getPlayer(state, p.allianceWith);
      return !!ally && ally.electionsWon >= 2;
    }
    case "disruptor":
      return p.betrayalCount >= 2 && statesOwnedBy(state, seat).length >= 5;
  }
}

export function checkWin(
  state: GameState,
  currentRound: number,
): { winnerSeat: number; reason: string } | null {
  for (const p of state.players) {
    if (p.bankrupt) continue;
    const owned = statesOwnedBy(state, p.seat).length;
    if (owned >= 14) return { winnerSeat: p.seat, reason: "Majority Government (14+ states)" };
    if (p.electionsWon >= 3) return { winnerSeat: p.seat, reason: "Democratic Victory (3 elections)" };
  }
  if (currentRound > 10) {
    let best = state.players[0];
    let bestScore = -1;
    for (const p of state.players) {
      const manif = checkManifestoComplete(state, p.seat) ? 100 : 0;
      const score = totalInfluenceForSeat(state, p.seat) + manif;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    return { winnerSeat: best.seat, reason: "Influence Supremacy (10 rounds)" };
  }
  return null;
}

// ---------- bankruptcy ----------
export function checkBankruptcy(state: GameState): GameState {
  let s = state;
  for (const p of s.players) {
    if (p.bankrupt || p.rupees >= 0) continue;
    // Sell offices + states at 50%
    let recovered = 0;
    for (const o of Object.values(s.ownership)) {
      if (o.ownerSeat !== p.seat) continue;
      const tile = findState(o.stateId);
      if (!tile) continue;
      const refund = Math.floor((tile.price * 0.5) + (o.hasOffice ? 500 : 0));
      recovered += refund;
      s = updateOwnership(s, o.stateId, (oo) => ({
        ...oo,
        ownerSeat: null,
        hasOffice: false,
        influence: {},
      }));
    }
    s = updatePlayer(s, p.seat, (pl) => ({ ...pl, rupees: pl.rupees + recovered }));
    if ((getPlayer(s, p.seat)?.rupees ?? 0) < 0) {
      s = updatePlayer(s, p.seat, (pl) => ({ ...pl, bankrupt: true, rupees: 0 }));
      s = pushLog(s, `${p.displayName} is BANKRUPT and eliminated.`);
    } else {
      s = pushLog(s, `${p.displayName} liquidated holdings for ₹${recovered}.`);
    }
  }
  return recalcInfluenceTotals(s);
}

// ---------- chanakya final scoring ----------
export type FinalScore = {
  seat: number;
  displayName: string;
  totalPoints: number;
  breakdown: {
    states: number;
    strongholds: number;
    rupees: number;
    elections: number;
    manifesto: number;
  };
};

export function calculateChanakyaFinalScores(state: GameState): FinalScore[] {
  const scores: FinalScore[] = state.players.map((p) => {
    // Reset diceBonus each round (cleanup)
    const playerState = { ...p, diceBonus: 0 };

    // Count states and strongholds
    let stateCount = 0;
    let strongholdCount = 0;
    for (const own of Object.values(state.ownership)) {
      if (own.ownerSeat === p.seat) {
        stateCount += 1;
        if ((own.influence[p.seat] ?? 0) >= 80) {
          strongholdCount += 1;
        }
      }
    }

    const statePoints = stateCount * 50;
    const strongholdPoints = strongholdCount * 100;
    const rupeesPoints = Math.floor(p.rupees / 1000) * 5;
    const electionPoints = p.electionsWon * 200;
    const manifestoPoints = p.manifestoComplete ? 500 : 0;

    const totalPoints = statePoints + strongholdPoints + rupeesPoints + electionPoints + manifestoPoints;

    return {
      seat: p.seat,
      displayName: p.displayName,
      totalPoints,
      breakdown: {
        states: statePoints,
        strongholds: strongholdPoints,
        rupees: rupeesPoints,
        elections: electionPoints,
        manifesto: manifestoPoints,
      },
    };
  });

  // Sort by total points descending
  return scores.sort((a, b) => b.totalPoints - a.totalPoints);
}
