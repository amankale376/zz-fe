// Heraldic 3-D-looking crest meeples used as player tokens (pawns).
// Pseudo-3D stack: ground shadow → tiered plinth → pawn body → upright shield
// face. Hover / active lift gives it a sense of volume without needing WebGL.

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
      <path
        d="M12 1 L22.6 4.2 V12 Q22.6 19 12 23 Q1.4 19 1.4 12 V4.2 Z"
        fill={`url(#${id}-rim)`}
        stroke="#2e1e09"
        strokeWidth="0.6"
      />
      <path
        d="M12 2.4 L21.3 5.2 V12 Q21.3 18.2 12 21.6 Q2.7 18.2 2.7 12 V5.2 Z"
        fill={`url(#${id})`}
        stroke={c.stroke}
        strokeWidth="0.6"
      />
      <path
        d="M12 3.8 L20 6.2 V12 Q20 17.3 12 20.3 Q4 17.3 4 12 V6.2 Z"
        fill="none"
        stroke="rgba(254,243,199,0.55)"
        strokeWidth="0.5"
      />
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

// ---- The 3-D pawn --------------------------------------------------------

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
  const width = size * 1.55;
  const height = size * 2.4;
  const shieldSize = size * 1.25;
  const domeId = `dome-${seat}`;
  const bodyId = `body-${seat}`;
  const baseId = `base-${seat}`;

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ scale: 0, y: -18, rotateX: -28 }}
      animate={{
        scale: 1,
        y: isCurrent ? [0, -3, 0] : 0,
        rotateX: -6,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        y: isCurrent
          ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          : { type: "spring", stiffness: 260, damping: 20 },
      }}
      style={{
        width,
        height,
        transformStyle: "preserve-3d",
        filter: isCurrent
          ? `drop-shadow(0 0 12px ${c.glow}) drop-shadow(0 10px 6px rgba(0,0,0,0.8))`
          : "drop-shadow(0 6px 5px rgba(0,0,0,0.75))",
      }}
      className="relative shrink-0"
      title={title}
    >
      <svg
        viewBox="0 0 60 90"
        width={width}
        height={height}
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id={baseId} cx="0.5" cy="0.35" r="0.65">
            <stop offset="0" stopColor="#f5dfa8" />
            <stop offset="0.55" stopColor={c.fill} />
            <stop offset="1" stopColor={c.stroke} />
          </radialGradient>
          <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={c.stroke} />
            <stop offset="0.45" stopColor={c.fill} />
            <stop offset="0.58" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="0.75" stopColor={c.fill} />
            <stop offset="1" stopColor={c.stroke} />
          </linearGradient>
          <linearGradient id={domeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7e7b6" />
            <stop offset="0.55" stopColor="#d4a562" />
            <stop offset="1" stopColor="#6b4419" />
          </linearGradient>
          <radialGradient id={`${domeId}-sheen`} cx="0.35" cy="0.3" r="0.35">
            <stop offset="0" stopColor="rgba(255,250,220,0.95)" />
            <stop offset="1" stopColor="rgba(255,250,220,0)" />
          </radialGradient>
        </defs>

        {/* Ambient floor shadow — oval, blurred */}
        <ellipse cx="30" cy="86" rx="22" ry="3.2" fill="rgba(0,0,0,0.55)">
          <animate
            attributeName="rx"
            values="22;20;22"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Bottom disc — gold rim */}
        <ellipse
          cx="30"
          cy="80"
          rx="22"
          ry="5.5"
          fill={`url(#${baseId})`}
          stroke="#2e1e09"
          strokeWidth="1"
        />
        <ellipse
          cx="30"
          cy="78.2"
          rx="22"
          ry="4.5"
          fill={`url(#${baseId})`}
          stroke="#2e1e09"
          strokeWidth="0.8"
        />
        <ellipse cx="30" cy="77.4" rx="20" ry="3.4" fill={c.fill} opacity="0.55" />

        {/* Tapered pawn body — silhouette built from a single path */}
        <path
          d="M14 76
             C 14 68 18 66 19 60
             C 20 52 22 48 24 44
             C 25 41 26 38 26 35
             L 34 35
             C 34 38 35 41 36 44
             C 38 48 40 52 41 60
             C 42 66 46 68 46 76
             Z"
          fill={`url(#${bodyId})`}
          stroke="#1a0f04"
          strokeWidth="1"
        />

        {/* Horizontal collar band */}
        <rect
          x="22"
          y="35"
          width="16"
          height="3.4"
          rx="0.8"
          fill={`url(#${domeId})`}
          stroke="#2e1e09"
          strokeWidth="0.8"
        />

        {/* Neck */}
        <rect
          x="27"
          y="30"
          width="6"
          height="5"
          rx="0.8"
          fill={`url(#${bodyId})`}
          stroke="#1a0f04"
          strokeWidth="0.8"
        />

        {/* Onion chhatri head */}
        <path
          d="M20 30
             C 20 18 26 12 30 10
             C 34 12 40 18 40 30 Z"
          fill={`url(#${domeId})`}
          stroke="#2e1e09"
          strokeWidth="0.9"
        />
        <ellipse
          cx="26"
          cy="20"
          rx="4"
          ry="8"
          fill={`url(#${domeId}-sheen)`}
        />
        {/* Finial */}
        <line x1="30" y1="10" x2="30" y2="4" stroke="#2e1e09" strokeWidth="0.9" />
        <circle
          cx="30"
          cy="6.2"
          r="1.5"
          fill={`url(#${domeId})`}
          stroke="#2e1e09"
          strokeWidth="0.5"
        />
        <circle cx="30" cy="3.2" r="0.9" fill="#f7e7b6" stroke="#2e1e09" strokeWidth="0.3" />

        {/* Body vertical highlight strip */}
        <path
          d="M28 38 C 27 52 28 66 28 74"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Heraldic shield plaque floating on the body */}
      <div
        className="absolute left-1/2"
        style={{
          top: "36%",
          width: shieldSize,
          height: shieldSize,
          transform: "translateX(-50%) rotateX(-6deg)",
          filter: `drop-shadow(0 ${size * 0.1}px ${size * 0.08}px rgba(0,0,0,0.6))`,
        }}
      >
        <CrestEmblem seat={seat} size={shieldSize} />
      </div>

      {/* Active-turn glow halo */}
      {isCurrent && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -size * 0.1,
            width: size * 2.1,
            height: size * 0.6,
            borderRadius: "9999px",
            background: `radial-gradient(ellipse at center, ${c.glow}, transparent 70%)`,
            animation: "zz-meeple-halo 1.8s ease-in-out infinite",
          }}
        />
      )}
    </motion.div>
  );
}

export { CrestEmblem };
