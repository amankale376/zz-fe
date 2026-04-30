import { useState } from "react";
import type { GameState } from "@/game/types";
import { GameBoardTilt } from "./GameBoardTilt";
import { PlayerList } from "./PlayerList";
import { ActionPanel } from "./ActionPanel";
import { ElectionPolicyPanel } from "./ElectionPolicyPanel";
import type { RoomRow } from "@/hooks/useGame";
import { sendGameAction } from "@/hooks/useGame";
import { toast } from "sonner";

import { useGameSfx } from "@/hooks/useGameSfx";

type Props = {
  room: RoomRow;
  state: GameState;
  mySeat: number | null;
};

export function GameBoard({ room, state, mySeat }: Props) {
  const isMyTurn = mySeat === room.current_turn_seat;
  const [playersOpen, setPlayersOpen] = useState(false);
  useGameSfx({
    state,
    phase: room.phase,
    pendingPurchaseSeat: state.pendingPurchase?.seat ?? null,
    mySeat,
  });

  async function dispatch(action: Record<string, unknown>) {
    try {
      await sendGameAction(room.id, action);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // Action handlers
  const onRoll = async () => {
    if (!isMyTurn) return;
    await dispatch({ type: "roll" });
  };
  const onBuy = async () => {
    if (!mySeat) return;
    await dispatch({ type: "buy_pending" });
  };
  const onDecline = async () => {
    if (!mySeat) return;
    await dispatch({ type: "decline_purchase" });
  };
  const onBuildOffice = async (id: string) => {
    if (!mySeat) return;
    await dispatch({ type: "build_office", stateId: id });
  };
  const onMobilize = async () => {
    if (!mySeat) return;
    await dispatch({ type: "mobilize" });
  };
  const onPropaganda = async (target: number, id: string) => {
    if (!mySeat) return;
    await dispatch({ type: "propaganda", stateId: id });
  };
  const onProposeAlliance = async (target: number) => {
    if (!mySeat) return;
    await dispatch({ type: "propose_alliance", targetSeat: target });
  };
  const onBetray = async () => {
    if (!mySeat) return;
    await dispatch({ type: "betray_alliance" });
  };
  const onEndTurn = async () => {
    if (!isMyTurn) return;
    await dispatch({ type: "end_turn" });
  };
  const onVote = async (target: number) => {
    if (!mySeat) return;
    await dispatch({ type: "cast_vote", targetSeat: target });
  };
  const onTally = async () => {
    await dispatch({ type: "tally_election" });
  };
  const onPickPolicy = async (id: string, targetSeat?: number, targetStateId?: string) => {
    await dispatch({ type: "apply_policy", policyId: id, targetSeat, targetStateId });
  };

  return (
    <div className="relative space-y-4">
      {/* Top-center controls (replaces mechanics/regions/manifestos links) */}
      <div className="hidden md:flex justify-center fixed left-1/2 -translate-x-1/2 top-6 z-40 pointer-events-none">
        <div className="w-[860px] max-w-[92vw] grid grid-cols-2 gap-2 items-start pointer-events-auto">
          <div>
            {mySeat !== null && (
              <ActionPanel
                state={state}
                mySeat={mySeat}
                isMyTurn={isMyTurn}
                actions={{
                  onRoll, onBuy, onDecline, onBuildOffice,
                  onMobilize, onPropaganda,
                  onProposeAlliance, onBetray, onEndTurn,
                }}
              />
            )}
          </div>

          <div className="bg-card border border-brass/35 rounded-sm p-2 shadow-deep">
            <button
              type="button"
              onClick={() => setPlayersOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-display text-[10px] tracking-[0.35em] uppercase text-brass/70">
                Players
              </span>
              <span className="font-display text-[9px] tracking-widest uppercase text-parchment/50">
                {playersOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {playersOpen && (
              <div className="mt-2">
                <PlayerList state={state} currentTurnSeat={room.current_turn_seat} mySeat={mySeat} />
              </div>
            )}
          </div>
        </div>
      </div>

      <GameBoardTilt
        state={state}
        currentTurnSeat={room.current_turn_seat}
        currentRound={room.current_round}
      />
      <ElectionPolicyPanel
        state={state}
        mySeat={mySeat}
        onVote={onVote}
        onTally={onTally}
        onPickPolicy={onPickPolicy}
      />
      <div className="bg-card/60 backdrop-blur-sm border border-brass/20 px-4 py-3 rounded-sm max-h-44 overflow-y-auto text-[12px] font-serif-elegant text-parchment/80 space-y-1 shadow-inner">
        <div className="font-display text-[10px] tracking-[0.3em] uppercase text-brass/70 mb-1.5">
          Chronicle
        </div>
        {state.log.slice(-30).reverse().map((l) => (
          <div key={l.id} className="leading-relaxed">· {l.text}</div>
        ))}
        {state.log.length === 0 && (
          <div className="text-parchment/40 italic">The board awaits its first move…</div>
        )}
      </div>
    </div>
  );
}
