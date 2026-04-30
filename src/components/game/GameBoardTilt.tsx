import type { GameState } from "@/game/types";
import { GameBoardGrid } from "./GameBoardGrid";

export function GameBoardTilt({
  state,
  currentTurnSeat,
  currentRound,
}: {
  state: GameState;
  currentTurnSeat: number;
  currentRound: number;
}) {
  return (
    <div className="relative w-full max-w-[920px] mx-auto h-[540px] sm:h-[620px] md:h-[700px]">
      <div className="absolute inset-x-0 top-0" style={{ perspective: "1650px" }}>
        <div
          className="origin-top will-change-transform"
          style={{
            // Reduce skew so side boxes/text remain readable.
            transform: "rotateX(42deg) translateY(0%) scale(0.89)",
            transformStyle: "preserve-3d",
            filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.5))",
          }}
        >
          <GameBoardGrid state={state} currentTurnSeat={currentTurnSeat} currentRound={currentRound} />
        </div>
      </div>
    </div>
  );
}

