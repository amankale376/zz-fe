// Heraldic crest shields used as player tokens (meeples).
// Each seat gets a unique emblem on a colored shield.

import { motion } from "framer-motion";

export const SEAT_PALETTE: { fill: string; stroke: string; glow: string }[] = [
  { fill: "#10b981", stroke: "#064e3b", glow: "rgba(16,185,129,0.7)" }, // emerald — Lion
  { fill: "#f43f5e", stroke: "#7f1d1d", glow: "rgba(244,63,94,0.7)" },  // rose — Hawk
  { fill: "#0ea5e9", stroke: "#0c4a6e", glow: "rgba(14,165,233,0.7)" }, // sky — Lotus
  { fill: "#f59e0b", stroke: "#78350f", glow: "rgba(245,158,11,0.7)" }, // amber — Tiger
  { fill: "#8b5cf6", stroke: "#3b0764", glow: "rgba(139,92,246,0.7)" }, // violet — Elephant
  { fill: "#ec4899", stroke: "#831843", glow: "rgba(236,72,153,0.7)" }, // pink — Cobra
];

export const SEAT_CREST_NAME = ["Lion", "Hawk", "Lotus", "Tiger", "Elephant", "Cobra"];

function CrestEmblem({ seat, size = 16 }: { seat: number; size?: number }) {
  const idx = (seat - 1) % SEAT_PALETTE.length;
  const c = SEAT_PALETTE[idx];
  const id = `crest-${seat}`;

  // Tiny SVG glyphs per seat
  const glyph = (() => {
    switch (idx) {
      case 0: // Lion — radiating mane
        return (
          <g fill="#fef3c7">
            <circle cx="12" cy="12" r="3.2" />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <rect
                  key={i}
                  x="11.2"
                  y="5"
                  width="1.6"
                  height="3.2"
                  rx="0.6"
                  transform={`rotate(${(a * 180) / Math.PI} 12 12)`}
                />
              );
            })}
          </g>
        );
      case 1: // Hawk — chevron wings
        return (
          <g fill="none" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round">
            <path d="M5 13 L12 8 L19 13" />
            <path d="M7 16 L12 12 L17 16" />
          </g>
        );
      case 2: // Lotus — five petals
        return (
          <g fill="#fef3c7">
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="12"
                cy="8"
                rx="1.6"
                ry="3.2"
                transform={`rotate(${deg} 12 12)`}
              />
            ))}
            <circle cx="12" cy="12" r="1.4" fill={c.stroke} />
          </g>
        );
      case 3: // Tiger — claw stripes
        return (
          <g stroke="#fef3c7" strokeWidth="1.4" strokeLinecap="round" fill="none">
            <path d="M7 7 Q9 11 7 16" />
            <path d="M12 6 Q14 11 12 17" />
            <path d="M17 7 Q15 11 17 16" />
          </g>
        );
      case 4: // Elephant — tusks + trunk
        return (
          <g fill="#fef3c7">
            <circle cx="12" cy="11" r="3.2" />
            <path d="M12 14 Q12 17 9 18" stroke="#fef3c7" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <rect x="8.5" y="13" width="1" height="2.6" rx="0.4" />
            <rect x="14.5" y="13" width="1" height="2.6" rx="0.4" />
          </g>
        );
      default: // Cobra — coiled S with hood
        return (
          <g fill="none" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round">
            <path d="M9 17 Q15 14 12 11 Q9 8 14 6" />
            <ellipse cx="14" cy="6" rx="2.4" ry="1.4" fill="#fef3c7" />
          </g>
        );
    }
  })();

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.fill} />
          <stop offset="1" stopColor={c.stroke} />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5dfa8" />
          <stop offset="0.55" stopColor="#d4a562" />
          <stop offset="1" stopColor="#6b4419" />
        </linearGradient>
      </defs>
      {/* Outer gold filigree rim */}
      <path
        d="M12 1 L22.6 4.2 V12 Q22.6 19 12 23 Q1.4 19 1.4 12 V4.2 Z"
        fill={`url(#${id}-rim)`}
        stroke="#2e1e09"
        strokeWidth="0.6"
      />
      {/* Shield face */}
      <path
        d="M12 2.4 L21.3 5.2 V12 Q21.3 18.2 12 21.6 Q2.7 18.2 2.7 12 V5.2 Z"
        fill={`url(#${id})`}
        stroke={c.stroke}
        strokeWidth="0.6"
      />
      {/* Inner hairline */}
      <path
        d="M12 3.8 L20 6.2 V12 Q20 17.3 12 20.3 Q4 17.3 4 12 V6.2 Z"
        fill="none"
        stroke="rgba(254,243,199,0.55)"
        strokeWidth="0.5"
      />
      {/* Top crest notch */}
      <path
        d="M10.4 2.9 Q12 1.6 13.6 2.9 L12 3.6 Z"
        fill="#f5dfa8"
        stroke="#2e1e09"
        strokeWidth="0.3"
      />
      {glyph}
    </svg>
  );
}

export function CrestMeeple({
  seat,
  isCurrent,
  size = 18,
  layoutId,
  title,
}: {
  seat: number;
  isCurrent?: boolean;
  size?: number;
  layoutId?: string;
  title?: string;
}) {
  const idx = (seat - 1) % SEAT_PALETTE.length;
  const c = SEAT_PALETTE[idx];
  const width = size * 1.45;
  const height = size * 1.85;
  const shieldSize = size * 1.18;
  return (
    <motion.div
      layoutId={layoutId}
      initial={{ scale: 0, y: -14, rotateX: -28, rotateZ: -8 }}
      animate={{ scale: 1, y: isCurrent ? -2 : 0, rotateX: -8, rotateZ: 0 }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 19 }}
      style={{
        width,
        height,
        transformStyle: "preserve-3d",
        filter: isCurrent
          ? `drop-shadow(0 0 9px ${c.glow}) drop-shadow(0 8px 5px rgba(0,0,0,0.72))`
          : "drop-shadow(0 5px 4px rgba(0,0,0,0.68))",
      }}
      className={`relative shrink-0 ${isCurrent ? "animate-pulse" : ""}`}
      title={title}
    >
      {/* Ground shadow */}
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full bg-black/55 blur-[2px]"
        style={{
          width: size * 1.55,
          height: size * 0.45,
        }}
      />

      {/* Raised plinth */}
      <div
        className="absolute left-1/2 rounded-full"
        style={{
          bottom: size * 0.06,
          width: size * 1.32,
          height: size * 0.48,
          transform: "translateX(-50%) rotateX(58deg)",
          borderRadius: "999px",
          background: `radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.55), transparent 35%), linear-gradient(145deg, ${c.fill}, ${c.stroke} 72%)`,
          boxShadow: `0 ${size * 0.12}px ${size * 0.28}px rgba(0,0,0,0.65), inset 0 ${size * 0.08}px ${size * 0.1}px rgba(255,255,255,0.24), inset 0 -${size * 0.12}px ${size * 0.14}px rgba(0,0,0,0.28)`,
        }}
      />
      <div
        className="absolute left-1/2"
        style={{
          bottom: size * 0.21,
          width: size * 0.78,
          height: size * 0.52,
          transform: "translateX(-50%)",
          borderRadius: `${size * 0.18}px ${size * 0.18}px ${size * 0.08}px ${size * 0.08}px`,
          background: `linear-gradient(90deg, ${c.stroke}, ${c.fill} 42%, ${c.stroke})`,
          boxShadow: "inset 0 2px 2px rgba(255,255,255,0.25), inset 0 -3px 4px rgba(0,0,0,0.35)",
        }}
      />

      {/* Upright heraldic shield with faux thickness */}
      <div
        className="absolute left-1/2"
        style={{
          bottom: size * 0.46,
          width: shieldSize,
          height: shieldSize,
          transform: "translateX(-50%) rotateX(-14deg) translateZ(12px)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(50% 0%, 92% 14%, 92% 54%, 50% 100%, 8% 54%, 8% 14%)",
            background: `linear-gradient(135deg, ${c.stroke}, rgba(0,0,0,0.72))`,
            transform: `translate(${size * 0.14}px, ${size * 0.16}px)`,
            filter: "blur(0.15px)",
            opacity: 0.9,
          }}
        />
        <div
          className="absolute inset-0 rounded-sm"
          style={{
            transform: "translateZ(8px)",
            filter: `drop-shadow(0 ${size * 0.12}px ${size * 0.09}px rgba(0,0,0,0.55))`,
          }}
        >
          <CrestEmblem seat={seat} size={shieldSize} />
        </div>
        <div
          className="absolute left-[19%] top-[12%] h-[38%] w-[18%] rounded-full bg-white/35 blur-[1px]"
          style={{ transform: "rotate(25deg) translateZ(10px)" }}
        />
      </div>
    </motion.div>
  );
}

export { CrestEmblem };
