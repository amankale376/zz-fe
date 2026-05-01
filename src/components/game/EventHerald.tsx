// Top-center "herald" toasts driven off state.log — one smooth pop-up per new
// log entry, classified by event kind (with matching icon, color, and SFX).
// Up to 3 stack at once; auto-dismiss after ~4 seconds; click to dismiss now.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameState, LogEntry } from "@/game/types";
import { playSfx } from "@/lib/sound";
import {
  Dices,
  Coins,
  Building2,
  Handshake,
  Swords,
  Megaphone,
  Vote,
  ScrollText,
  Crown,
  Flame,
  Snowflake,
  Info,
} from "lucide-react";

type EventKind =
  | "roll"
  | "buy"
  | "rent"
  | "office"
  | "alliance"
  | "betray"
  | "propaganda"
  | "mobilize"
  | "election"
  | "policy"
  | "victory"
  | "freeze"
  | "chance"
  | "info";

type HeraldItem = {
  id: string;
  kind: EventKind;
  text: string;
  ts: number;
};

const KIND_META: Record<
  EventKind,
  { label: string; icon: typeof Info; accent: string; glow: string }
> = {
  roll:       { label: "Dice",       icon: Dices,      accent: "#f5dfa8", glow: "rgba(245,223,168,0.45)" },
  buy:        { label: "Acquired",   icon: Coins,      accent: "#fcd34d", glow: "rgba(252,211,77,0.5)" },
  rent:       { label: "Tribute",    icon: Coins,      accent: "#a3e635", glow: "rgba(163,230,53,0.4)" },
  office:     { label: "Office",     icon: Building2,  accent: "#d4a562", glow: "rgba(212,165,98,0.5)" },
  alliance:   { label: "Alliance",   icon: Handshake,  accent: "#60a5fa", glow: "rgba(96,165,250,0.5)" },
  betray:     { label: "Betrayal",   icon: Swords,     accent: "#f87171", glow: "rgba(248,113,113,0.6)" },
  propaganda: { label: "Propaganda", icon: Megaphone,  accent: "#f472b6", glow: "rgba(244,114,182,0.5)" },
  mobilize:   { label: "Mobilize",   icon: Flame,      accent: "#fb923c", glow: "rgba(251,146,60,0.5)" },
  election:   { label: "Election",   icon: Vote,       accent: "#c4b5fd", glow: "rgba(196,181,253,0.5)" },
  policy:     { label: "Policy",     icon: ScrollText, accent: "#f9a8d4", glow: "rgba(249,168,212,0.5)" },
  victory:    { label: "Throne",     icon: Crown,      accent: "#facc15", glow: "rgba(250,204,21,0.7)" },
  freeze:     { label: "Lobby",      icon: Snowflake,  accent: "#7dd3fc", glow: "rgba(125,211,252,0.5)" },
  chance:     { label: "Chance",     icon: ScrollText, accent: "#fde68a", glow: "rgba(253,230,138,0.5)" },
  info:       { label: "Chronicle",  icon: Info,       accent: "#e2d6b5", glow: "rgba(226,214,181,0.35)" },
};

function classify(entry: LogEntry): EventKind {
  const t = entry.text.toLowerCase();
  if (/roll(ed)?|dice/.test(t)) return "roll";
  if (/bought|purchased|acquired|campaign cost/.test(t)) return "buy";
  if (/paid.*tribute|paid.*rent|rent/.test(t)) return "rent";
  if (/office|chhatri|built/.test(t)) return "office";
  if (/proposed alliance|forged an alliance|forge alliance|allied/.test(t)) return "alliance";
  if (/betray|traitor/.test(t)) return "betray";
  if (/propaganda/.test(t)) return "propaganda";
  if (/mobilize|extra move/.test(t)) return "mobilize";
  if (/election|voted|tally|won the election/.test(t)) return "election";
  if (/policy|demonetiz|president|tax hike|jail bharo|land reform|free press|subsidy|audit/.test(t)) return "policy";
  if (/victory|won the game|throne|prime minister/.test(t)) return "victory";
  if (/frozen|lobby|lobbied/.test(t)) return "freeze";
  if (/chance/.test(t)) return "chance";
  return "info";
}

function kindToSfx(kind: EventKind) {
  switch (kind) {
    case "roll": return null; // dice sound handled by dice animation
    case "buy": return "buy";
    case "rent": return "buy";
    case "office": return "office";
    case "alliance": return "alliance";
    case "betray": return "betray";
    case "propaganda": return "notify";
    case "mobilize": return "notify";
    case "election": return "election";
    case "policy": return "policy";
    case "victory": return "victory";
    case "freeze": return "notify";
    case "chance": return "policy";
    default: return null;
  }
}

export function EventHerald({ state }: { state: GameState }) {
  const [items, setItems] = useState<HeraldItem[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const initedRef = useRef(false);

  // On mount, mark all existing log ids as "seen" so we don't blast old history.
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    state.log.forEach((l) => seenRef.current.add(l.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch log for new entries
  useEffect(() => {
    const fresh: HeraldItem[] = [];
    for (const l of state.log) {
      if (seenRef.current.has(l.id)) continue;
      seenRef.current.add(l.id);
      const kind = classify(l);
      fresh.push({ id: l.id, kind, text: l.text, ts: l.ts });
      const sfx = kindToSfx(kind);
      if (sfx) playSfx(sfx as never, 0.55);
    }
    if (fresh.length === 0) return;
    setItems((prev) => [...prev, ...fresh].slice(-4)); // keep last 4
    // Schedule dismissals
    fresh.forEach((f) => {
      const lifetime = f.kind === "victory" ? 6000 : f.kind === "betray" ? 5000 : 3800;
      window.setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== f.id));
      }, lifetime);
    });
  }, [state.log]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {items.map((it, idx) => {
          const meta = KIND_META[it.kind];
          const Icon = meta.icon;
          const big = it.kind === "victory" || it.kind === "betray" || it.kind === "election";
          return (
            <motion.button
              key={it.id}
              type="button"
              onClick={() => setItems((prev) => prev.filter((i) => i.id !== it.id))}
              initial={{ y: -24, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -18, opacity: 0, scale: 0.96, transition: { duration: 0.22 } }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              style={{
                zIndex: 60 + idx,
                boxShadow: `0 18px 40px -14px rgba(0,0,0,0.8), 0 0 22px -8px ${meta.glow}`,
                borderColor: `${meta.accent}55`,
              }}
              className={`pointer-events-auto flex items-center gap-3 rounded-full border bg-[rgba(14,10,6,0.82)] pr-5 pl-3 py-2 backdrop-blur-md text-parchment text-left ${
                big ? "min-w-[360px]" : "min-w-[280px]"
              } max-w-[560px]`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `linear-gradient(145deg, ${meta.accent}, ${meta.accent}55)`,
                  boxShadow: `0 0 14px -4px ${meta.glow}`,
                }}
              >
                <Icon className="h-[18px] w-[18px] text-[#1a120a]" />
              </span>
              <div className="flex flex-col leading-tight">
                <span
                  className="font-display text-[9.5px] uppercase tracking-[0.3em]"
                  style={{ color: meta.accent }}
                >
                  {meta.label}
                </span>
                <span
                  className={`font-serif-elegant italic ${
                    big ? "text-[15px]" : "text-[13px]"
                  } text-parchment/95`}
                >
                  {it.text}
                </span>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
