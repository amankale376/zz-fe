# Zameen Zindabad — Gameplay Polish Pass (v2)

## Original Problem Statement
> "there are lots of issues with animation of dice roll, meeple moving and
>  meeple is not 3d as well ... voting logic is not working ... events which
>  occur during game play should be shown on the screen like a very smooth
>  pop up ... sounds needs to be improved"
> (+ rulebook v2.0 attached — gameplay must respect rules)

## Stack
- Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Framer Motion
- No backend in this repo (user runs the game backend locally on :8080)

## What's been implemented (Jan 2026)

### Gameplay polish v2
- **`src/lib/sound.ts`** — rewritten as a fully procedural Web Audio engine.
  No CDN dependencies. 13 cues: dice / diceLand / step (tabla tap) / buy (coin
  clink) / office (hammer + bell) / notify / betray (low gong + string slide) /
  victory (shehnai flourish) / election (gavel + chord) / policy (page flip) /
  alliance (rising third) / error / turn. Background music ducks under SFX.
  Falls back to tamboura-style synth drone if `/audio/bgm.mp3` fails.

- **`src/components/game/CrestMeeple.tsx`** — volumetric pawn silhouette with
  tiered plinth → tapered body → onion chhatri head → finial; gold rim + body
  highlight strip + animated halo. Idle "breath" float on active seat.

- **`src/components/game/GameBoardGrid.tsx`**
  - Dice now tumble for ~1.2 s with a 5-keyframe multi-axis rotation + arc + a
    morphing ground shadow; larger 68 px size; paired die staggered by 140 ms;
    `diceLand` thunk fires exactly when they settle.
  - Per-step delay for meeple motion bumped to 320 ms; each step plays the
    tabla-tap `step` SFX. Framer layoutId handles smooth tween between tiles.

- **`src/components/game/EventHerald.tsx`** *(new)* — top-center "herald" toast
  system driven off `state.log`. Classifies each entry into 13 kinds
  (roll/buy/rent/office/alliance/betray/propaganda/mobilize/election/policy/
  victory/freeze/chance/info) with matching icon, accent color, glow, and
  layered SFX. Stacks up to 4; betrayal/election stay longer; victory/betray
  render as a "decree" variant. Plays the appropriate cue on appearance.

- **`src/components/game/ElectionPolicyPanel.tsx`** — polished voting UI:
  - Live per-candidate **weighted tally bar** with North-synergy 1.5× and
    Traitor −2 correctly reflected
  - Selected-vote pulse; double-vote-spam guard; "Leading" badge
  - Tally button shows `n/total` remaining voters; warns if tallying early
  - SFX on cast + gavel strike on tally

- **`src/hooks/useGameSfx.ts`** — trimmed to avoid double-fire with Herald.
  Now only owns: dice rattle, pending-purchase notify, and a turn-cue when it
  becomes your seat. Everything else flows through the Herald.

- **`src/components/game/GameBoard.tsx`** — mounts `<EventHerald/>` and passes
  `currentTurnSeat` into the sfx hook.

- **`src/index.css`** — added `@keyframes zz-meeple-halo` and
  `zz-herald-shimmer`.

### Verification
- `yarn tsc --noEmit` ✅
- `yarn build` ✅ (dist ~635 KB gz 200 KB)

## Backlog / Next Actions
- P2 — Show regional-synergy progress (e.g. `North 3/4`) and manifesto bonus
  preview next to each player card.
- P2 — Render jail "⛓" overlay + frozen tile border in matching SFX colors.
- P2 — Offer a real three.js meeple (optional toggle) for ultra-high-end look.
- P3 — Migrate bgm.mp3 to a short looping sitar-tabla track (10-15 s loop is
  small and will fit in `public/audio/`).
- P3 — Add keyboard shortcuts: `R` roll, `E` end turn, `B` buy, `D` decline.
