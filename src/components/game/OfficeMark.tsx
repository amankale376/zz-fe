// A detailed office building mark placed on owned tiles when the player builds an office.
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
      className="relative drop-shadow-[0_0_6px_rgba(212,165,98,0.65)]"
      aria-label="Office"
    >
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <defs>
          <linearGradient id="bld-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9d5a8" />
            <stop offset="1" stopColor="#a07a3b" />
          </linearGradient>
          <linearGradient id="bld-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d4a562" />
            <stop offset="1" stopColor="#7a5320" />
          </linearGradient>
        </defs>
        {/* Base shadow */}
        <ellipse cx="16" cy="29" rx="10" ry="1.6" fill="rgba(0,0,0,0.45)" />
        {/* Body */}
        <rect x="6" y="12" width="20" height="16" rx="1" fill="url(#bld-body)" stroke="#3b2a13" strokeWidth="0.8" />
        {/* Pillars */}
        <rect x="8.5" y="14" width="1.4" height="12" fill="#3b2a13" opacity="0.7" />
        <rect x="15.3" y="14" width="1.4" height="12" fill="#3b2a13" opacity="0.7" />
        <rect x="22.1" y="14" width="1.4" height="12" fill="#3b2a13" opacity="0.7" />
        {/* Windows */}
        <rect x="11" y="17" width="3" height="3" fill="#1a1a1a" />
        <rect x="18" y="17" width="3" height="3" fill="#1a1a1a" />
        <rect x="11" y="22" width="3" height="3" fill="#1a1a1a" />
        <rect x="18" y="22" width="3" height="3" fill="#1a1a1a" />
        {/* Steps */}
        <rect x="5" y="27" width="22" height="1.2" fill="#5a401b" />
        <rect x="4" y="28.2" width="24" height="1.2" fill="#3b2a13" />
        {/* Roof / pediment */}
        <polygon points="4,12 16,4 28,12" fill="url(#bld-roof)" stroke="#3b2a13" strokeWidth="0.8" />
        <polygon points="13,9 16,6 19,9" fill="#fef3c7" opacity="0.85" />
        {/* Flag pole + flag in owner's color */}
        <line x1="16" y1="6" x2="16" y2="0.5" stroke="#3b2a13" strokeWidth="0.6" />
        <motion.polygon
          points="16,1 22,2.6 16,4"
          fill={ownerColor}
          stroke="#3b2a13"
          strokeWidth="0.4"
          style={{ transformOrigin: "16px 2.5px" }}
          animate={{ rotate: [0, 4, 0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
}
