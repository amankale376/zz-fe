# Zameen Zindabad — Asset Refresh (Mughal Royal)

## Original Problem Statement
> "can you update the assets of this screen it looks horrible"
> (Screen: in-game room at localhost:8080/room/... — board game `Zameen Zindabad`)

## User Choices (captured via ask_human)
- Update: dice visuals, province tile icons/badges, coin/token imagery (all assets)
- Style: dark moody / royal Indian aesthetic, cleaner
- Mood: **Mughal royal**
- Images: copyright-free (→ used Gemini Nano Banana to generate custom royalty-free assets)
- Codebase: https://github.com/amankale376/zz-fe (cloned into /app)

## Stack
- Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Framer Motion
- No backend in this repo (user runs a separate backend locally on :8080)

## What's been implemented (Jan 2026)
### New/Regenerated image assets (Gemini Nano Banana)
- `src/assets/hero-warroom.jpg` — central board background (antique Mughal parchment map of India on carved dark wood, gold filigree corners, oil-lamp glow)
- `src/assets/emblem-seal.png` — royal gold medallion seal
- `src/assets/parchment-texture.jpg` — aged ivory parchment
- `src/assets/mughal-coin.png` — ornate gold mohur (available for future currency UI)
- `src/assets/mughal-chhatri.png` — Mughal dome emblem (reference; actual in-game mark is an SVG re-implementation)

### SVG refreshes
- `src/components/game/OfficeMark.tsx` — redesigned from generic temple to proper **Mughal chhatri**: onion dome, stepped plinth, four pillars, gold finial, owner's pennant banner.
- `src/components/game/GameBoardGrid.tsx`
  - `DieFace` — ivory face + gold-filigree outer rim, paisley corner hints, richer brown pips with inset shadows.
  - Central map overlay softened (was 74% black; now warm gradient) so the new Mughal parchment is visible.
  - Title text got drop-shadows for readability, `32 Provinces · 5 Regions · 1 Throne` bumped to parchment/70.
- `src/components/game/CrestMeeple.tsx` — heraldic shields now have a **gold filigree outer rim**, inner hairline, and top crest notch for a regal look.

### Tooling
- `scripts/generate_assets.py` — one-off Python script (uses `emergentintegrations` + `EMERGENT_LLM_KEY`) that regenerates all five images. Re-runnable any time the art needs a refresh.

## Verification
- `yarn tsc --noEmit` ✅ clean
- `yarn build` ✅ succeeds (dist/ emits updated hero-warroom.jpg @ ~900KB, etc.)

## Backlog / Next Actions
- P2 — Wire `mughal-coin.png` into price labels (`₹3k` etc.) as a small coin icon before the number.
- P2 — Use `parchment-texture.jpg` as the background for the Chronicle / side panels.
- P2 — Replace unicode glyphs in corner tiles (★ ? ⚖ ✦) with matching Mughal SVGs.
- P3 — Preload hero image (it's ~900KB; fine for desktop, but `<link rel="preload">` in `index.html` would smooth first paint).
