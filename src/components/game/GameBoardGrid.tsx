import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BOARD, findState } from "@/game/states";
import type { GameState } from "@/game/types";
import { CrestMeeple, SEAT_PALETTE } from "./CrestMeeple";
import { OfficeMark } from "./OfficeMark";
import { playSfx } from "@/lib/sound";
import heroWarroom from "@/assets/hero-warroom.jpg";

// Back-compat color/ring/text maps used elsewhere
const SEAT_COLORS = SEAT_PALETTE.map((p) => "");
SEAT_PALETTE.forEach((p, i) => {
  // we don't really use Tailwind classes for these anymore; consumers reference colors via SEAT_PALETTE.
  // but PlayerList references SEAT_COLORS as Tailwind class — provide Tailwind equivalents:
  SEAT_COLORS[i] = [
    "bg-emerald-500",
    "bg-rose-500",
    "bg-sky-500",
    "bg-amber-400",
    "bg-violet-500",
    "bg-pink-500",
  ][i];
});
const SEAT_RING = [
  "ring-emerald-400",
  "ring-rose-400",
  "ring-sky-400",
  "ring-amber-300",
  "ring-violet-400",
  "ring-pink-400",
];
const SEAT_TEXT = [
  "text-emerald-300",
  "text-rose-300",
  "text-sky-300",
  "text-amber-200",
  "text-violet-300",
  "text-pink-300",
];

const REGION_BAND: Record<string, string> = {
  north: "bg-amber-500",
  west: "bg-emerald-500",
  south: "bg-sky-500",
  east: "bg-rose-500",
  ne_central: "bg-violet-500",
};

const REGION_GLOW: Record<string, string> = {
  north: "shadow-[0_0_18px_-4px_rgba(245,158,11,0.55)]",
  west: "shadow-[0_0_18px_-4px_rgba(16,185,129,0.55)]",
  south: "shadow-[0_0_18px_-4px_rgba(14,165,233,0.55)]",
  east: "shadow-[0_0_18px_-4px_rgba(244,63,94,0.55)]",
  ne_central: "shadow-[0_0_18px_-4px_rgba(139,92,246,0.55)]",
};

type Props = {
  state: GameState;
  currentTurnSeat: number;
  currentRound: number;
};

const TOTAL_TILES = 32;

function gridPositionFor(idx: number): { col: number; row: number; orient: "h" | "v" | "corner" } {
  if (idx === 0) return { col: 9, row: 9, orient: "corner" };
  if (idx === 8) return { col: 1, row: 9, orient: "corner" };
  if (idx === 16) return { col: 1, row: 1, orient: "corner" };
  if (idx === 24) return { col: 9, row: 1, orient: "corner" };
  if (idx >= 1 && idx <= 7) return { col: 9 - idx, row: 9, orient: "h" };
  if (idx >= 9 && idx <= 15) return { col: 1, row: 9 - (idx - 8), orient: "v" };
  if (idx >= 17 && idx <= 23) return { col: 1 + (idx - 16), row: 1, orient: "h" };
  return { col: 9, row: 1 + (idx - 24), orient: "v" };
}

// Step-by-step animation: keep a per-seat displayed position that advances 1 tile at a time.
function useDisplayPositions(state: GameState) {
  const [displayed, setDisplayed] = useState<Record<number, number>>(() =>
    Object.fromEntries(state.players.map((p) => [p.seat, p.position]))
  );
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout> | null>>({});

  useEffect(() => {
    state.players.forEach((p) => {
      const current = displayed[p.seat] ?? p.position;
      if (current === p.position) return;
      // advance toward target one tile at a time
      const t = timersRef.current[p.seat];
      if (t) clearTimeout(t);
      timersRef.current[p.seat] = setTimeout(() => {
        setDisplayed((prev) => {
          const cur = prev[p.seat] ?? current;
          if (cur === p.position) return prev;
          const next = (cur + 1) % TOTAL_TILES;
          return { ...prev, [p.seat]: next };
        });
        playSfx("step", 0.35);
      }, 220);
    });
    // ensure new players are tracked
    state.players.forEach((p) => {
      if (!(p.seat in displayed)) {
        setDisplayed((prev) => ({ ...prev, [p.seat]: p.position }));
      }
    });
    return () => {
      // do not clear all timers on each render — only clear when component unmounts
    };
  }, [state.players.map((p) => `${p.seat}:${p.position}`).join("|"), displayed]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => t && clearTimeout(t));
    };
  }, []);

  return displayed;
}

function CornerTile({
  idx,
  name,
  kind,
  tokens,
  currentTurnSeat,
}: {
  idx: number;
  name: string;
  kind: string;
  tokens: { seat: number; displayName: string }[];
  currentTurnSeat: number;
}) {
  const ICON: Record<string, string> = { hq: "★", chance: "?", niti: "⚖", jail: "✦" };
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-card to-background border border-brass/40 flex flex-col items-center justify-center p-2 overflow-hidden">
      <div className="absolute top-1 left-1.5 font-display text-[9px] tracking-widest text-brass/50">
        {idx.toString().padStart(2, "0")}
      </div>
      <div className="text-3xl text-brass/80 mb-1">{ICON[kind] ?? "◆"}</div>
      <div className="font-display uppercase text-[10px] tracking-[0.15em] text-parchment text-center leading-tight px-1">
        {name}
      </div>
      <TokenStack tokens={tokens} currentTurnSeat={currentTurnSeat} corner />
    </div>
  );
}

function PerimeterTile({
  idx,
  name,
  region,
  price,
  hasOffice,
  ownerSeat,
  frozenUntilRound,
  currentRound,
  tokens,
  currentTurnSeat,
  orient,
}: {
  idx: number;
  name: string;
  region: keyof typeof REGION_BAND;
  price: number;
  hasOffice: boolean;
  ownerSeat: number | null;
  frozenUntilRound: number;
  currentRound: number;
  tokens: { seat: number; displayName: string }[];
  currentTurnSeat: number;
  orient: "h" | "v";
}) {
  const ownerColor = ownerSeat
    ? SEAT_PALETTE[(ownerSeat - 1) % SEAT_PALETTE.length].fill
    : "#d4a562";
  const ownerBg = ownerSeat
    ? SEAT_COLORS[(ownerSeat - 1) % SEAT_COLORS.length]
    : "";
  const isFrozen = frozenUntilRound > currentRound;

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-card to-background border border-brass/30 ${
        ownerSeat ? REGION_GLOW[region] : ""
      } overflow-hidden flex ${orient === "h" ? "flex-col" : "flex-row"}`}
    >
      <div
        className={`${REGION_BAND[region]} ${
          orient === "h" ? "h-2.5 w-full" : "w-2.5 h-full"
        } shrink-0`}
      />

      <div className={`flex-1 p-1.5 flex flex-col ${orient === "v" ? "justify-between" : "gap-0.5"}`}>
        <div className="flex items-start justify-between gap-1">
          <span className="font-display text-[8px] tracking-widest text-brass/50 leading-none">
            {idx.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="font-display uppercase text-[10px] leading-[1.1] tracking-wide text-parchment line-clamp-2">
          {name}
        </div>

        <div className="font-mono text-[8.5px] text-parchment/60 mt-auto">
          ₹{(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k
        </div>
      </div>

      {/* Owner stripe */}
      {ownerSeat && (
        <div
          className={`absolute ${
            orient === "h" ? "bottom-0 inset-x-0 h-[3px]" : "top-0 bottom-0 right-0 w-[3px]"
          } ${ownerBg}`}
        />
      )}

      {/* Office mark */}
      {hasOffice && (
        <div className="absolute top-1 right-1 z-10">
          <OfficeMark ownerColor={ownerColor} size={20} />
        </div>
      )}

      {isFrozen && (
        <div className="absolute inset-0 bg-sky-400/15 backdrop-blur-[0.5px] flex items-center justify-center">
          <span className="text-sky-200 text-[9px] font-display tracking-widest">FROZEN</span>
        </div>
      )}

      <TokenStack tokens={tokens} currentTurnSeat={currentTurnSeat} />
    </div>
  );
}

function TokenStack({
  tokens,
  currentTurnSeat,
  corner = false,
}: {
  tokens: { seat: number; displayName: string }[];
  currentTurnSeat: number;
  corner?: boolean;
}) {
  if (tokens.length === 0) return null;
  return (
    <div
      className={`absolute ${
        corner ? "bottom-1.5 left-1/2 -translate-x-1/2" : "bottom-0.5 left-1/2 -translate-x-1/2"
      } flex -space-x-2 z-10`}
    >
      <AnimatePresence>
        {tokens.map((p) => (
          <CrestMeeple
            key={p.seat}
            layoutId={`token-${p.seat}`}
            seat={p.seat}
            isCurrent={p.seat === currentTurnSeat}
            size={24}
            title={p.displayName}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function GameBoardGrid({ state, currentTurnSeat, currentRound }: Props) {
  const round = currentRound;
  const displayed = useDisplayPositions(state);
  return (
    <div className="relative w-full max-w-[980px] mx-auto aspect-square">
      <div className="grid grid-cols-9 grid-rows-9 gap-1 w-full h-full p-2 bg-gradient-to-br from-background via-card/60 to-background border border-brass/30 rounded-md shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div
          className="col-start-2 col-end-9 row-start-2 row-end-9 border border-brass/20 rounded-sm flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(6,10,18,0.74), rgba(6,10,18,0.74)), url(${heroWarroom})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(212,165,98,0.4), transparent 60%)",
            }}
          />
          <div className="font-display text-[10px] tracking-[0.4em] text-brass/60 uppercase">Bharat</div>
          <div className="font-serif-elegant italic text-4xl md:text-5xl text-parchment mt-1">
            Zameen Zindabad
          </div>
          <div className="mt-2 font-display text-[14px] md:text-[16px] tracking-widest text-parchment/40 uppercase">
            32 Provinces · 5 Regions · 1 Throne
          </div>
          <CenterDice state={state} />
          <CenterRegionLegend />
        </div>

        {BOARD.map((tile, idx) => {
          const stateTile = !tile.isSpecial ? findState(tile.id) : null;
          const own = stateTile ? state.ownership[stateTile.id] : null;
          const tokens = state.players
            .filter((p) => (displayed[p.seat] ?? p.position) === idx && !p.bankrupt)
            .map((p) => ({ seat: p.seat, displayName: p.displayName }));
          const pos = gridPositionFor(idx);
          const cellStyle = { gridColumn: pos.col, gridRow: pos.row } as const;

          if (tile.isSpecial) {
            return (
              <div key={`${tile.id}-${idx}`} style={cellStyle} className="relative">
                <CornerTile
                  idx={idx}
                  name={tile.name}
                  kind={tile.kind}
                  tokens={tokens}
                  currentTurnSeat={currentTurnSeat}
                />
              </div>
            );
          }
          if (!stateTile) return null;
          return (
            <div key={`${tile.id}-${idx}`} style={cellStyle} className="relative">
              <PerimeterTile
                idx={idx}
                name={stateTile.name}
                region={stateTile.region}
                price={stateTile.price}
                hasOffice={!!own?.hasOffice}
                ownerSeat={own?.ownerSeat ?? null}
                frozenUntilRound={own?.frozenUntilRound ?? 0}
                currentRound={round}
                tokens={tokens}
                currentTurnSeat={currentTurnSeat}
                orient={pos.orient === "v" ? "v" : "h"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CenterDice({ state }: { state: GameState }) {
  if (!state.diceRoll) return null;
  const [a, b] = state.diceRoll;
  return (
    <motion.div
      key={`${a}-${b}-${state.log.length}`}
      initial={{ scale: 0.78, y: -18, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className="mt-5 flex gap-4"
    >
      <Die value={a} delay={0} />
      <Die value={b} delay={0.08} />
    </motion.div>
  );
}

const DIE_SIZE = 56;
const DIE_HALF = DIE_SIZE / 2;

const DIE_FACE_TRANSFORMS: Record<number, string> = {
  1: `translateZ(${DIE_HALF}px)`,
  2: `rotateY(90deg) translateZ(${DIE_HALF}px)`,
  3: `rotateX(90deg) translateZ(${DIE_HALF}px)`,
  4: `rotateX(-90deg) translateZ(${DIE_HALF}px)`,
  5: `rotateY(-90deg) translateZ(${DIE_HALF}px)`,
  6: `rotateY(180deg) translateZ(${DIE_HALF}px)`,
};

const DIE_FINAL_ROTATION: Record<number, { rotateX: number; rotateY: number }> = {
  1: { rotateX: 0, rotateY: 0 },
  2: { rotateX: 0, rotateY: -90 },
  3: { rotateX: -90, rotateY: 0 },
  4: { rotateX: 90, rotateY: 0 },
  5: { rotateX: 0, rotateY: 90 },
  6: { rotateX: 0, rotateY: 180 },
};

const PIP_LAYOUT: Record<number, { col: number; row: number }[]> = {
  1: [{ col: 2, row: 2 }],
  2: [{ col: 1, row: 1 }, { col: 3, row: 3 }],
  3: [{ col: 1, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 3 }],
  4: [{ col: 1, row: 1 }, { col: 3, row: 1 }, { col: 1, row: 3 }, { col: 3, row: 3 }],
  5: [{ col: 1, row: 1 }, { col: 3, row: 1 }, { col: 2, row: 2 }, { col: 1, row: 3 }, { col: 3, row: 3 }],
  6: [{ col: 1, row: 1 }, { col: 3, row: 1 }, { col: 1, row: 2 }, { col: 3, row: 2 }, { col: 1, row: 3 }, { col: 3, row: 3 }],
};

function Die({ value, delay }: { value: number; delay: number }) {
  const finalRotation = DIE_FINAL_ROTATION[value] ?? DIE_FINAL_ROTATION[1];
  return (
    <div
      className="relative"
      style={{ width: DIE_SIZE, height: DIE_SIZE, perspective: 720 }}
      aria-label={`Rolled ${value}`}
    >
      <div className="absolute -bottom-3 left-1/2 h-3 w-14 -translate-x-1/2 rounded-full bg-black/45 blur-sm" />
      <motion.div
        className="relative h-full w-full transform-gpu"
        style={{ transformStyle: "preserve-3d" }}
        initial={{
          rotateX: finalRotation.rotateX + 540,
          rotateY: finalRotation.rotateY - 720,
          rotateZ: delay ? 135 : -135,
          y: -26,
        }}
        animate={{
          rotateX: finalRotation.rotateX,
          rotateY: finalRotation.rotateY,
          rotateZ: 0,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 92,
          damping: 14,
          mass: 0.8,
          delay,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <DieFace key={face} value={face} />
        ))}
      </motion.div>
    </div>
  );
}

function DieFace({ value }: { value: number }) {
  return (
    <div
      className="absolute inset-0 grid grid-cols-3 grid-rows-3 rounded-xl border border-brass/40 bg-parchment p-2 shadow-[inset_0_2px_8px_rgba(255,255,255,0.7),inset_0_-8px_14px_rgba(70,45,20,0.22)]"
      style={{
        transform: DIE_FACE_TRANSFORMS[value],
        backfaceVisibility: "hidden",
        background:
          "linear-gradient(145deg, #fff8e7 0%, #ead9b8 52%, #c9a978 100%)",
      }}
    >
      {PIP_LAYOUT[value].map((pip, idx) => (
        <span
          key={`${value}-${idx}`}
          className="m-auto block h-2.5 w-2.5 rounded-full bg-ink shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_1px_1px_rgba(255,255,255,0.25)]"
          style={{ gridColumn: pip.col, gridRow: pip.row }}
        />
      ))}
    </div>
  );
}

function CenterRegionLegend() {
  const items: { label: string; cls: string }[] = [
    { label: "North", cls: "bg-amber-500" },
    { label: "West", cls: "bg-emerald-500" },
    { label: "South", cls: "bg-sky-500" },
    { label: "East", cls: "bg-rose-500" },
    { label: "NE+Central", cls: "bg-violet-500" },
  ];
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-wrap gap-3 justify-center px-3">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${i.cls}`} />
          <span className="font-display text-[8.5px] tracking-widest uppercase text-parchment/60">
            {i.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export { SEAT_COLORS, SEAT_RING, SEAT_TEXT };
