import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { GameState } from "@/game/types";
import { POLICIES } from "@/game/policies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findState } from "@/game/states";
import { regionsControlled } from "@/game/engine";
import { CrestEmblem, SEAT_PALETTE } from "./CrestMeeple";
import { playSfx } from "@/lib/sound";
import { toast } from "sonner";

type Props = {
  state: GameState;
  mySeat: number | null;
  onVote: (targetSeat: number) => void;
  onTally: () => void;
  onPickPolicy: (policyId: string, targetSeat?: number, targetStateId?: string) => void;
};

export function ElectionPolicyPanel({ state, mySeat, onVote, onTally, onPickPolicy }: Props) {
  const [pickTarget, setPickTarget] = useState("");
  const [pickState, setPickState] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (state.election.active) {
    const votesBy = state.election.votesBy ?? {};
    const alivePlayers = state.players.filter((p) => !p.bankrupt);
    const candidates = alivePlayers;
    const myVote = mySeat ? votesBy[mySeat] : undefined;

    // Tally per candidate with North-synergy 1.5x bonus (per rulebook)
    const tally: Record<number, number> = {};
    for (const p of candidates) tally[p.seat] = 0;
    for (const [voterSeatStr, votedSeat] of Object.entries(votesBy)) {
      const voterSeat = Number(voterSeatStr);
      const voter = state.players.find((p) => p.seat === voterSeat);
      if (!voter) continue;
      const baseVotes = Math.max(0, voter.votes + (voter.traitorRoundsLeft > 0 ? -2 : 0));
      const northSynergy = regionsControlled(state, voterSeat).includes("north");
      const weight = Math.max(1, Math.round(baseVotes * (northSynergy ? 1.5 : 1)));
      tally[votedSeat] = (tally[votedSeat] ?? 0) + weight;
    }
    const maxTally = Math.max(1, ...Object.values(tally));
    const votedCount = Object.keys(votesBy).length;
    const totalVoters = alivePlayers.length;
    const remaining = Math.max(0, totalVoters - votedCount);
    const allVoted = remaining === 0;

    const handleVote = async (seat: number) => {
      if (!mySeat || submitting) return;
      if (myVote === seat) {
        toast.info("You've already cast that vote.");
        return;
      }
      setSubmitting(true);
      try {
        await Promise.resolve(onVote(seat));
        playSfx("notify", 0.5);
      } finally {
        setTimeout(() => setSubmitting(false), 300);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="relative overflow-hidden rounded-sm border border-brass/40 bg-gradient-to-br from-brass/10 via-card to-card p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, rgba(245,223,168,0.5), transparent 50%)",
          }}
        />
        <div className="relative flex items-center justify-between mb-3">
          <h3 className="font-display text-brass text-sm tracking-[0.3em] uppercase">
            Election in Progress
          </h3>
          <span className="font-display text-[10px] tracking-widest uppercase text-parchment/60">
            {remaining === 0 ? "All votes cast" : `${remaining} of ${totalVoters} pending`}
          </span>
        </div>

        <p className="relative font-serif-elegant italic text-parchment/70 text-xs mb-3">
          Cast your vote. Each voter contributes their state-votes; the{" "}
          <span className="text-brass">North synergy</span> multiplies by{" "}
          <span className="text-brass">1.5×</span>. Traitor Badge subtracts 2.
        </p>

        <div className="relative grid grid-cols-1 gap-2">
          {candidates.map((p) => {
            const count = tally[p.seat] ?? 0;
            const pct = Math.round((count / maxTally) * 100);
            const isMyVote = myVote === p.seat;
            const palette = SEAT_PALETTE[(p.seat - 1) % SEAT_PALETTE.length];
            const northSyn = regionsControlled(state, p.seat).includes("north");
            const isLeader = count === maxTally && count > 0;
            return (
              <button
                key={p.seat}
                disabled={!mySeat || submitting}
                onClick={() => handleVote(p.seat)}
                className={`relative w-full text-left rounded-sm border transition-all overflow-hidden ${
                  isMyVote
                    ? "border-brass shadow-[0_0_0_1px_rgba(212,165,98,0.6),0_0_26px_-6px_rgba(212,165,98,0.6)]"
                    : "border-brass/25 hover:border-brass/60"
                } bg-[rgba(18,13,8,0.6)]`}
              >
                {/* tally bar */}
                <motion.span
                  key={`bar-${p.seat}-${count}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 160, damping: 22 }}
                  className="absolute inset-y-0 left-0 rounded-sm"
                  style={{
                    background: `linear-gradient(90deg, ${palette.fill}22, ${palette.fill}44)`,
                  }}
                />
                <div className="relative flex items-center gap-3 px-3 py-2.5">
                  <CrestEmblem seat={p.seat} size={22} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-parchment text-[13px] truncate">
                        {p.displayName}
                      </span>
                      {northSyn && (
                        <span className="font-display text-[8.5px] tracking-widest uppercase text-amber-300">
                          ×1.5
                        </span>
                      )}
                      {p.traitorRoundsLeft > 0 && (
                        <span className="font-display text-[8.5px] tracking-widest uppercase text-rose-300">
                          −2
                        </span>
                      )}
                      {isLeader && (
                        <span className="font-display text-[8.5px] tracking-widest uppercase text-brass">
                          Leading
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-parchment/60">
                      {p.votes} base votes · {count} weighted
                    </div>
                  </div>
                  {isMyVote && (
                    <motion.span
                      className="font-display text-[9.5px] tracking-widest uppercase text-brass"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      ✓ Your vote
                    </motion.span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          variant="brass"
          size="sm"
          className="relative w-full mt-3"
          disabled={submitting}
          onClick={() => {
            if (!allVoted) {
              toast.info(`${remaining} voter${remaining === 1 ? "" : "s"} haven't voted yet — tallying anyway.`);
            }
            onTally();
            playSfx("election", 0.6);
          }}
        >
          {allVoted ? "Tally Votes" : `Tally Early (${votedCount}/${totalVoters})`}
        </Button>
      </motion.div>
    );
  }

  if (state.policy.active) {
    const isWinner = mySeat === state.policy.winnerSeat;
    const winnerName = state.players.find((p) => p.seat === state.policy.winnerSeat)?.displayName;
    const choices = state.policy.choices ?? [];
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="bg-brass/5 border border-brass/40 p-4 rounded-sm"
      >
        <h3 className="font-display text-brass text-sm tracking-widest uppercase mb-2">Policy choice</h3>
        <p className="font-serif-elegant italic text-parchment/70 text-xs mb-3">
          {isWinner ? "You won the election. Choose a policy." : `${winnerName} is choosing a policy...`}
        </p>
        {isWinner && (
          <div className="space-y-2">
            {choices.map((id) => {
              const p = POLICIES[id];
              return (
                <div key={id} className="border border-brass/30 p-2 rounded-sm">
                  <div className="font-display text-parchment text-sm">{p.name}</div>
                  <div className="text-[11px] text-parchment/60">{p.description}</div>
                  {id === "jail_bharo" ? (
                    <div className="flex gap-2 mt-2">
                      <Select value={pickTarget} onValueChange={setPickTarget}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Target" /></SelectTrigger>
                        <SelectContent>
                          {state.players
                            .filter((pp) => pp.seat !== state.policy.winnerSeat && !pp.bankrupt)
                            .map((pp) => (
                              <SelectItem key={pp.seat} value={String(pp.seat)}>{pp.displayName}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="brass" disabled={!pickTarget} onClick={() => { onPickPolicy(id, Number(pickTarget)); setPickTarget(""); }}>
                        Apply
                      </Button>
                    </div>
                  ) : id === "presidents_rule" ? (
                    <div className="flex gap-2 mt-2">
                      <Select value={pickState} onValueChange={setPickState}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {Object.values(state.ownership)
                            .filter((ownership) => ownership.ownerSeat !== null)
                            .map((ownership) => (
                              <SelectItem key={ownership.stateId} value={ownership.stateId}>
                                {findState(ownership.stateId)?.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="brass" disabled={!pickState} onClick={() => { onPickPolicy(id, undefined, pickState); setPickState(""); }}>
                        Apply
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="brass" className="mt-2" onClick={() => onPickPolicy(id)}>
                      Apply
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  return null;
}
