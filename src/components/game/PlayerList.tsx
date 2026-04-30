import { MANIFESTOS } from "@/game/manifestos";
import { regionsControlled, statesOwnedBy } from "@/game/engine";
import { REGION_LABELS } from "@/game/states";
import type { GameState } from "@/game/types";
import { CrestEmblem, SEAT_CREST_NAME } from "./CrestMeeple";
import { Crown, Coins, Award, Users } from "lucide-react";

type Props = {
  state: GameState;
  currentTurnSeat: number;
  mySeat: number | null;
};

export function PlayerList({ state, currentTurnSeat, mySeat }: Props) {
  return (
    <div className="space-y-2">
      <div className="font-display text-[10px] tracking-[0.35em] uppercase text-brass/70 px-1">
        Players
      </div>
      {state.players.map((p) => {
        const owned = statesOwnedBy(state, p.seat).length;
        const regions = regionsControlled(state, p.seat);
        const isYou = p.seat === mySeat;
        const isTurn = p.seat === currentTurnSeat;
        return (
          <div
            key={p.seat}
            className={`px-2.5 py-2 border rounded-sm transition-all ${
              isTurn
                ? "border-brass bg-gradient-to-br from-brass/10 to-transparent shadow-[0_0_24px_-8px_rgba(212,165,98,0.45)]"
                : "border-brass/25 bg-card"
            } ${p.bankrupt ? "opacity-40" : ""}`}
          >
            <div className="flex items-center gap-2">
              <CrestEmblem seat={p.seat} size={18} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-display text-parchment text-[13px] truncate leading-tight">{p.displayName}</span>
                <span className="font-display text-[8px] tracking-widest uppercase text-brass/60 leading-tight">
                  House of {SEAT_CREST_NAME[(p.seat - 1) % SEAT_CREST_NAME.length]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isYou && <span className="text-[9px] font-display tracking-widest text-brass uppercase">You</span>}
                {isTurn && <Crown className="w-3.5 h-3.5 text-brass drop-shadow-[0_0_4px_rgba(212,165,98,0.8)]" />}
              </div>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] font-serif-elegant text-parchment/90">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-brass" />₹{p.rupees.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-brass" />{owned} states
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3 text-brass" />Inf {p.totalInfluence}
              </span>
              <span>🗳 {p.electionsWon} won</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[9.5px] font-display tracking-wide uppercase">
              {regions.length > 0 && (
                <span className="text-emerald-300">✦ {regions.map((r) => REGION_LABELS[r]).join(" · ")}</span>
              )}
              {p.allianceWith !== null && (
                <span className="text-sky-300">⚭ Seat {p.allianceWith}</span>
              )}
              {p.traitorRoundsLeft > 0 && (
                <span className="text-rose-300">⚠ Traitor {p.traitorRoundsLeft}r</span>
              )}
              {p.inJail > 0 && (
                <span className="text-yellow-300">⛓ Jail {p.inJail}t</span>
              )}
            </div>
            {isYou && (
              <div className="text-[9.5px] text-brass/90 mt-1 italic font-serif-elegant border-t border-brass/15 pt-1">
                Manifesto · {MANIFESTOS[p.manifesto].name}
                {p.manifestoComplete && " ✓"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
