// Reacts to game state changes and fires the *non-log-based* SFX cues.
// Log-based events (buy, office, betrayal, election, policy, victory...) are
// fired by <EventHerald/> when their toast pops up, so we skip them here to
// avoid double-firing. This hook still handles:
//   • dice rattle (plays *during* the tumble, before any log entry appears)
//   • pending-purchase notification for the target seat
//   • turn-cue when it becomes your turn

import { useEffect, useRef } from "react";
import type { GameState } from "@/game/types";
import { playSfx, primeAudioOnFirstGesture, startMusic } from "@/lib/sound";

type Args = {
  state: GameState;
  phase: string;
  pendingPurchaseSeat: number | null | undefined;
  mySeat: number | null;
  currentTurnSeat: number;
};

export function useGameSfx({
  state,
  pendingPurchaseSeat,
  mySeat,
  currentTurnSeat,
}: Args) {
  const initRef = useRef(false);
  const lastDiceRef = useRef<string | null>(null);
  const lastPendingRef = useRef<number | null | undefined>(pendingPurchaseSeat);
  const lastTurnRef = useRef<number | null>(null);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    primeAudioOnFirstGesture();
    startMusic();
    lastDiceRef.current = state.diceRoll
      ? `${state.diceRoll[0]},${state.diceRoll[1]},${state.log.length}`
      : null;
    lastTurnRef.current = currentTurnSeat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dice rattle — right when the new roll lands in state
  useEffect(() => {
    const sig = state.diceRoll
      ? `${state.diceRoll[0]},${state.diceRoll[1]},${state.log.length}`
      : null;
    if (sig && sig !== lastDiceRef.current) {
      lastDiceRef.current = sig;
      playSfx("dice", 0.55);
    }
  }, [state.diceRoll, state.log.length]);

  // Pending purchase — notify the affected seat only
  useEffect(() => {
    const prev = lastPendingRef.current;
    if (pendingPurchaseSeat && pendingPurchaseSeat !== prev) {
      if (mySeat && pendingPurchaseSeat === mySeat) playSfx("notify", 0.55);
    }
    lastPendingRef.current = pendingPurchaseSeat;
  }, [pendingPurchaseSeat, mySeat]);

  // Your-turn cue
  useEffect(() => {
    if (lastTurnRef.current !== currentTurnSeat) {
      if (mySeat && currentTurnSeat === mySeat) playSfx("turn", 0.5);
      lastTurnRef.current = currentTurnSeat;
    }
  }, [currentTurnSeat, mySeat]);
}
