// Reacts to game state changes and fires SFX cues.
// Also starts background music on first interaction.

import { useEffect, useRef } from "react";
import type { GameState } from "@/game/types";
import { playSfx, primeAudioOnFirstGesture, startMusic } from "@/lib/sound";

type Args = {
  state: GameState;
  phase: string;
  pendingPurchaseSeat: number | null | undefined;
  mySeat: number | null;
};

export function useGameSfx({ state, phase, pendingPurchaseSeat, mySeat }: Args) {
  const initRef = useRef(false);
  const lastDiceRef = useRef<string | null>(null);
  const lastLogIdRef = useRef<string | null>(null);
  const lastOfficesRef = useRef<number>(0);
  const lastPhaseRef = useRef<string>(phase);
  const lastPendingRef = useRef<number | null | undefined>(pendingPurchaseSeat);
  const lastBetrayalsRef = useRef<number>(0);

  // Prime audio + start music
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    primeAudioOnFirstGesture();
    startMusic();
    // baseline counters so we don't fire SFX on initial mount
    lastOfficesRef.current = countOffices(state);
    lastBetrayalsRef.current = state.players.reduce((s, p) => s + p.betrayalCount, 0);
    lastDiceRef.current = state.diceRoll ? state.diceRoll.join(",") : null;
    lastLogIdRef.current = state.log.length ? state.log[state.log.length - 1].id : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dice
  useEffect(() => {
    const sig = state.diceRoll ? `${state.diceRoll[0]},${state.diceRoll[1]},${state.log.length}` : null;
    if (sig && sig !== lastDiceRef.current) {
      lastDiceRef.current = sig;
      playSfx("dice", 0.55);
    }
  }, [state.diceRoll, state.log.length]);

  // Office built — count offices, increase = build
  useEffect(() => {
    const offices = countOffices(state);
    if (offices > lastOfficesRef.current) {
      playSfx("office", 0.6);
    }
    lastOfficesRef.current = offices;
  }, [state]);

  // Betrayal
  useEffect(() => {
    const total = state.players.reduce((s, p) => s + p.betrayalCount, 0);
    if (total > lastBetrayalsRef.current) playSfx("betray", 0.65);
    lastBetrayalsRef.current = total;
  }, [state]);

  // Pending purchase notification — when an offer becomes available to me
  useEffect(() => {
    const prev = lastPendingRef.current;
    if (pendingPurchaseSeat && pendingPurchaseSeat !== prev) {
      // notify the affected seat (this is rendered per-client, so only their tab fires)
      if (mySeat && pendingPurchaseSeat === mySeat) playSfx("buy", 0.55);
    }
    lastPendingRef.current = pendingPurchaseSeat;
  }, [pendingPurchaseSeat, mySeat]);

  // Phase change — election / policy
  useEffect(() => {
    if (lastPhaseRef.current !== phase) {
      if (phase === "election") playSfx("election", 0.55);
      if (phase === "finished") playSfx("victory", 0.7);
      lastPhaseRef.current = phase;
    }
  }, [phase]);

  // Generic notification — when a new log entry mentions alliance/propaganda/lobby targeting me
  useEffect(() => {
    const last = state.log[state.log.length - 1];
    if (!last) return;
    if (last.id === lastLogIdRef.current) return;
    lastLogIdRef.current = last.id;
    const text = last.text.toLowerCase();
    if (mySeat && text.includes("propose") && text.includes(`seat ${mySeat}`)) {
      playSfx("notify", 0.6);
    }
  }, [state.log, mySeat]);
}

function countOffices(s: GameState): number {
  return Object.values(s.ownership).filter((o) => o.hasOffice).length;
}
