// Mughal chhatri (domed pavilion) mark placed on owned tiles when the player builds an office.
// Animates in with a "stamp" effect when first appearing.

import { motion } from "framer-motion";

export function OfficeMark({
  ownerColor,
  size = 22,
}: {
  ownerColor: string;
  size?: number;
}) {
  return (
    <motion.div
      initial={{ scale: 2.2, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
      style={{ width: size, height: size }}
      className="relative drop-shadow-[0_0_6px_rgba(212,165,98,0.7)]"
      aria-label="Office"
    >
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <defs>
          <linearGradient id="dome-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5dfa8" />
            <stop offset="0.55" stopColor="#d4a562" />
            <stop offset="1" stopColor="#7a5320" />
          </linearGradient>
          <linearGradient id="base-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#caa05a" />
            <stop offset="1" stopColor="#5a3d15" />
          </linearGradient>
          <radialGradient id="dome-shine" cx="0.35" cy="0.25" r="0.6">
            <stop offset="0" stopColor="rgba(255,246,214,0.9)" />
            <stop offset="1" stopColor="rgba(255,246,214,0)" />
          </radialGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="16" cy="29.2" rx="10" ry="1.4" fill="rgba(0,0,0,0.55)" />

        {/* Stepped plinth */}
        <rect x="5.5" y="26" width="21" height="2" rx="0.4" fill="url(#base-grad)" stroke="#2e1e09" strokeWidth="0.4" />
        <rect x="6.8" y="24.2" width="18.4" height="1.9" rx="0.4" fill="url(#base-grad)" stroke="#2e1e09" strokeWidth="0.4" />

        {/* Four slender pillars */}
        <rect x="8.2" y="16" width="1.3" height="8.3" fill="url(#base-grad)" stroke="#2e1e09" strokeWidth="0.3" />
        <rect x="13"  y="16" width="1.3" height="8.3" fill="url(#base-grad)" stroke="#2e1e09" strokeWidth="0.3" />
        <rect x="17.7" y="16" width="1.3" height="8.3" fill="url(#base-grad)" stroke="#2e1e09" strokeWidth="0.3" />
        <rect x="22.5" y="16" width="1.3" height="8.3" fill="url(#base-grad)" stroke="#2e1e09" strokeWidth="0.3" />

        {/* Pillar capitals (top band) */}
        <rect x="7.4" y="15" width="17.2" height="1.2" rx="0.3" fill="url(#dome-grad)" stroke="#2e1e09" strokeWidth="0.4" />

        {/* Cornice under dome */}
        <rect x="6.4" y="13.6" width="19.2" height="1.4" rx="0.3" fill="url(#base-grad)" stroke="#2e1e09" strokeWidth="0.4" />

        {/* Onion dome body */}
        <path
          d="M9.5 13.6
             C 9.5 8.5 11.8 6.5 16 6
             C 20.2 6.5 22.5 8.5 22.5 13.6 Z"
          fill="url(#dome-grad)"
          stroke="#2e1e09"
          strokeWidth="0.5"
        />
        {/* Dome highlight */}
        <path
          d="M10.8 12.4 C 11.2 9.2 13 7.6 15.5 7.2 C 14 8.6 13 10.8 12.8 12.6 Z"
          fill="url(#dome-shine)"
          opacity="0.9"
        />

        {/* Dome neck */}
        <rect x="14.4" y="4.8" width="3.2" height="1.6" rx="0.3" fill="url(#dome-grad)" stroke="#2e1e09" strokeWidth="0.4" />

        {/* Finial */}
        <line x1="16" y1="4.8" x2="16" y2="1.2" stroke="#2e1e09" strokeWidth="0.55" />
        <circle cx="16" cy="3.4" r="0.75" fill="url(#dome-grad)" stroke="#2e1e09" strokeWidth="0.3" />

        {/* Banner flag in owner's color */}
        <motion.polygon
          points="16,1.2 21.4,2.6 16,4"
          fill={ownerColor}
          stroke="#2e1e09"
          strokeWidth="0.4"
          style={{ transformOrigin: "16px 2.6px" }}
          animate={{ rotate: [0, 4, 0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
}
