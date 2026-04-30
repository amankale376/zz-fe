import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GameState } from "@/game/types";
import { findState, tileAt } from "@/game/states";
import { statesOwnedBy } from "@/game/engine";

type Actions = {
  onRoll: () => void;
  onBuy: () => void;
  onDecline: () => void;
  onBuildOffice: (stateId: string) => void;
  onMobilize: () => void;
  onPropaganda: (targetSeat: number, stateId: string) => void;
  onProposeAlliance: (target: number) => void;
  onBetray: () => void;
  onEndTurn: () => void;
};

type Props = {
  state: GameState;
  mySeat: number;
  isMyTurn: boolean;
  actions: Actions;
};

export function ActionPanel({ state, mySeat, isMyTurn, actions }: Props) {
  const me = state.players.find((p) => p.seat === mySeat);
  const [propState, setPropState] = useState("");
  const [allyTarget, setAllyTarget] = useState("");
  const [open, setOpen] = useState(true);

  if (!me) return null;
  const myStates = statesOwnedBy(state, mySeat);
  const opponents = state.players.filter((p) => p.seat !== mySeat && !p.bankrupt);
  const pending = state.pendingPurchase && state.pendingPurchase.seat === mySeat ? state.pendingPurchase : null;
  const adjacentStateIds = [tileAt(me.position - 1), tileAt(me.position + 1)]
    .filter((tile) => !tile.isSpecial)
    .map((tile) => tile.id);
  const propagandaTargets = adjacentStateIds
    .map((stateId) => state.ownership[stateId])
    .filter((ownership) => ownership?.ownerSeat !== null && ownership.ownerSeat !== mySeat);

  // Auto-open on your turn (or when a purchase prompt appears)
  useEffect(() => {
    if (isMyTurn || pending) setOpen(true);
    else setOpen(false);
  }, [isMyTurn, !!pending]);

  const canRoll = isMyTurn && !state.hasRolledThisTurn && !pending;
  const canEndTurn = isMyTurn && !pending;
  const canBuy = !!pending && me.rupees >= pending.price;
  const canDecline = !!pending;

  const glowClass = useMemo(
    () =>
      [
        "relative",
        "before:absolute before:inset-0 before:rounded-[inherit]",
        "before:transition-opacity",
        "before:shadow-[0_0_0_1px_rgba(212,165,98,0.55),0_0_18px_-4px_rgba(212,165,98,0.55)]",
        "focus-visible:ring-2 focus-visible:ring-brass/60",
      ].join(" "),
    [],
  );

  const activeGlow =
    "before:opacity-100 shadow-[0_0_0_1px_rgba(212,165,98,0.55),0_0_22px_-6px_rgba(212,165,98,0.75)]";
  const inactiveGlow = "before:opacity-0";

  return (
    <div className="space-y-3 bg-card border border-brass/35 rounded-sm p-4 shadow-deep">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div
          className={`text-[11px] tracking-[0.35em] uppercase font-display ${
            isMyTurn ? "text-brass" : "text-parchment/50"
          }`}
        >
          {isMyTurn ? "▸ Your turn" : "Awaiting other player"}
        </div>
        <div className="font-display text-[10px] tracking-widest uppercase text-parchment/50">
          {open ? "Collapse" : "Expand"}
        </div>
      </button>

      {/* Keep primary actions visible even when collapsed */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="brass"
          size="sm"
          onClick={actions.onRoll}
          disabled={!canRoll}
          className={`${glowClass} ${canRoll ? activeGlow : inactiveGlow}`}
        >
          🎲 Roll {state.diceRoll ? `(${state.diceRoll[0]}+${state.diceRoll[1]})` : ""}
        </Button>
        <Button
          variant="ornate"
          size="sm"
          onClick={actions.onEndTurn}
          disabled={!canEndTurn}
          className={`${glowClass} ${canEndTurn ? activeGlow : inactiveGlow}`}
        >
          End Turn
        </Button>
      </div>

      {open && (
        <>
          {pending && (
            <div className="p-3 border border-brass/40 bg-brass/5 rounded-sm">
              <p className="text-parchment text-sm font-display">
                Buy {findState(pending.stateId)?.name} for ₹{pending.price}?
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="brass"
                  onClick={actions.onBuy}
                  disabled={!canBuy}
                  className={`${glowClass} ${canBuy ? activeGlow : inactiveGlow}`}
                >
                  Buy
                </Button>
                <Button
                  size="sm"
                  variant="ornate"
                  onClick={actions.onDecline}
                  disabled={!canDecline}
                  className={`${glowClass} ${canDecline ? activeGlow : inactiveGlow}`}
                >
                  Decline
                </Button>
              </div>
            </div>
          )}

          {/* Build office */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ornate"
                size="sm"
                disabled={!isMyTurn || myStates.length === 0}
                className={`w-full ${glowClass} ${
                  isMyTurn && myStates.length > 0 ? activeGlow : inactiveGlow
                }`}
              >
                Build Office
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Build Office</DialogTitle></DialogHeader>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {myStates.map((id) => {
                  const o = state.ownership[id];
                  const tile = findState(id);
                  return (
                    <Button
                      key={id}
                      variant="ornate"
                      size="sm"
                      className="w-full justify-between"
                      disabled={o.hasOffice}
                      onClick={() => actions.onBuildOffice(id)}
                    >
                      <span>{tile?.name}</span>
                      <span>{o.hasOffice ? "Built" : "₹2,000"}</span>
                    </Button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Capabilities */}
          <div className="border-t border-brass/20 pt-2">
            <div className="text-[10px] tracking-widest uppercase text-parchment/60 mb-1">Tactical Actions</div>
            <div className="grid grid-cols-1 gap-1.5">
              <Button
                variant="ornate"
                size="sm"
                disabled={!isMyTurn || state.hasRolledThisTurn || state.hasUsedTacticalActionThisTurn || me.totalInfluence < 20 || me.traitorRoundsLeft > 0}
                onClick={actions.onMobilize}
                className={`${glowClass} ${
                  isMyTurn && !state.hasRolledThisTurn && !state.hasUsedTacticalActionThisTurn && me.totalInfluence >= 20 && me.traitorRoundsLeft === 0
                    ? activeGlow
                    : inactiveGlow
                }`}
              >
                Mobilize (20 Inf)
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ornate"
                    size="sm"
                    disabled={!isMyTurn || state.hasRolledThisTurn || state.hasUsedTacticalActionThisTurn || me.totalInfluence < 50 || me.traitorRoundsLeft > 0 || propagandaTargets.length === 0}
                    className={`${glowClass} ${
                      isMyTurn && !state.hasRolledThisTurn && !state.hasUsedTacticalActionThisTurn && me.totalInfluence >= 50 && me.traitorRoundsLeft === 0 && propagandaTargets.length > 0
                        ? activeGlow
                        : inactiveGlow
                    }`}
                  >
                    Propaganda (50 Inf)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Reduce adjacent owner influence</DialogTitle></DialogHeader>
                  <Select value={propState} onValueChange={setPropState}>
                    <SelectTrigger><SelectValue placeholder="Adjacent opponent state" /></SelectTrigger>
                    <SelectContent>
                      {propagandaTargets.map((o) => (
                        <SelectItem key={o.stateId} value={o.stateId}>{findState(o.stateId)?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="brass"
                    disabled={!propState}
                    onClick={() => {
                      actions.onPropaganda(state.ownership[propState]?.ownerSeat ?? 0, propState);
                      setPropState("");
                    }}
                    className={`${glowClass} ${propState ? activeGlow : inactiveGlow}`}
                  >
                    Confirm
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Alliance */}
          <div className="border-t border-brass/20 pt-2">
            <div className="text-[10px] tracking-widest uppercase text-parchment/60 mb-1">Alliances</div>
            {me.allianceWith === null ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ornate"
                    size="sm"
                    className={`w-full ${glowClass} ${
                      me.traitorRoundsLeft === 0 ? activeGlow : inactiveGlow
                    }`}
                    disabled={me.traitorRoundsLeft > 0}
                  >
                    Propose Alliance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Propose Alliance</DialogTitle></DialogHeader>
                  <Select value={allyTarget} onValueChange={setAllyTarget}>
                    <SelectTrigger><SelectValue placeholder="Pick partner" /></SelectTrigger>
                    <SelectContent>
                      {opponents.filter((p) => p.allianceWith === null && p.traitorRoundsLeft === 0).map((p) => (
                        <SelectItem key={p.seat} value={String(p.seat)}>{p.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="brass"
                    disabled={!allyTarget}
                    onClick={() => { actions.onProposeAlliance(Number(allyTarget)); setAllyTarget(""); }}
                    className={`${glowClass} ${allyTarget ? activeGlow : inactiveGlow}`}
                  >
                    Forge alliance
                  </Button>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                variant="ornate"
                size="sm"
                className={`w-full ${glowClass} ${activeGlow}`}
                onClick={actions.onBetray}
              >
                Betray (+25 inf, get Traitor Badge)
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
