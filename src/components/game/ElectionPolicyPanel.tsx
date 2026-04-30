import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameState } from "@/game/types";
import { POLICIES } from "@/game/policies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findState } from "@/game/states";

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

  if (state.election.active) {
    const votesBy = state.election.votesBy ?? {};
    const myVote = mySeat ? votesBy[mySeat] : undefined;
    return (
      <div className="bg-brass/5 border border-brass/40 p-4 rounded-sm">
        <h3 className="font-display text-brass text-sm tracking-widest uppercase mb-3">Election in progress</h3>
        <p className="font-serif-elegant italic text-parchment/70 text-xs mb-3">
          Vote for a player. North synergy = 1.5x. Non-voters distributed randomly.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {state.players.filter((p) => !p.bankrupt).map((p) => (
            <Button
              key={p.seat}
              variant={myVote === p.seat ? "brass" : "ornate"}
              size="sm"
              onClick={() => mySeat && onVote(p.seat)}
              disabled={!mySeat}
            >
              {p.displayName} ({p.votes}v)
            </Button>
          ))}
        </div>
        <Button variant="brass" size="sm" className="w-full mt-3" onClick={onTally}>
          Tally votes
        </Button>
      </div>
    );
  }

  if (state.policy.active) {
    const isWinner = mySeat === state.policy.winnerSeat;
    const winnerName = state.players.find((p) => p.seat === state.policy.winnerSeat)?.displayName;
    const choices = state.policy.choices ?? [];
    return (
      <div className="bg-brass/5 border border-brass/40 p-4 rounded-sm">
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
      </div>
    );
  }

  return null;
}
