import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { BOARD, findState } from "@/game/states";
import type { GameState } from "@/game/types";
import { SEAT_PALETTE } from "./CrestMeeple";

type Props = {
  state: GameState;
  currentTurnSeat: number;
  currentRound: number;
};

const TOTAL_TILES = 32;

function gridPositionFor(idx: number): { x: number; z: number } {
  // mirror the 2D board layout: 9x9 ring, center empty
  const step = 1.15;
  const toXZ = (col: number, row: number) => {
    // col,row are 1..9; center at (5,5)
    const x = (col - 5) * step;
    const z = (row - 5) * step;
    return { x, z };
  };
  if (idx === 0) return toXZ(9, 9);
  if (idx === 8) return toXZ(1, 9);
  if (idx === 16) return toXZ(1, 1);
  if (idx === 24) return toXZ(9, 1);
  if (idx >= 1 && idx <= 7) return toXZ(9 - idx, 9);
  if (idx >= 9 && idx <= 15) return toXZ(1, 9 - (idx - 8));
  if (idx >= 17 && idx <= 23) return toXZ(1 + (idx - 16), 1);
  return toXZ(9, 1 + (idx - 24));
}

function regionColor(region: string) {
  return (
    {
      north: "#f59e0b",
      west: "#10b981",
      south: "#0ea5e9",
      east: "#f43f5e",
      ne_central: "#8b5cf6",
    }[region] ?? "#d4a562"
  );
}

function abbreviate(name: string) {
  const parts = name
    .replace(/&/g, "AND")
    .replace(/PRADESH/gi, "")
    .replace(/JAMMU/gi, "J&K")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const joined = parts.join(" ");
  if (joined.length <= 12) return joined.toUpperCase();
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`.toUpperCase().slice(0, 12);
  return joined.toUpperCase().slice(0, 12);
}

function makeBoardTexture(state: GameState) {
  const size = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d_canvas_unavailable");

  // background
  ctx.fillStyle = "#0b0c11";
  ctx.fillRect(0, 0, size, size);

  // subtle vignette
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.72);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const pad = 120;
  const boardSize = size - pad * 2;
  const cell = boardSize / 9;

  // board frame
  ctx.fillStyle = "#11131a";
  ctx.fillRect(pad - 34, pad - 34, boardSize + 68, boardSize + 68);
  ctx.strokeStyle = "rgba(212,165,98,0.25)";
  ctx.lineWidth = 6;
  ctx.strokeRect(pad - 34, pad - 34, boardSize + 68, boardSize + 68);

  // inner surface (parchment tone to match your current art)
  ctx.fillStyle = "#cbb89a";
  ctx.fillRect(pad + cell, pad + cell, cell * 7, cell * 7);

  // center title
  ctx.fillStyle = "rgba(20,16,14,0.9)";
  ctx.font = "64px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Zameen Zindabad", size / 2, size / 2);

  // helpers to draw tiles
  const toXY = (col: number, row: number) => ({
    x: pad + (col - 1) * cell,
    y: pad + (9 - row) * cell,
  });
  const drawTile = (col: number, row: number, fill: string) => {
    const { x, y } = toXY(col, row);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 6, y + 6, cell - 12, cell - 12);
    ctx.strokeStyle = "rgba(212,165,98,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 6, y + 6, cell - 12, cell - 12);
    return { x, y };
  };

  const seatFill = (seat: number) => SEAT_PALETTE[(seat - 1) % SEAT_PALETTE.length].fill;
  const iconFor = (kind: string) => ({ hq: "★", chance: "?", niti: "⚖", jail: "✦" } as const)[kind as any] ?? "◆";

  // draw perimeter tiles based on board index mapping
  const gridPos = (idx: number): { col: number; row: number; orient: "h" | "v" | "corner" } => {
    if (idx === 0) return { col: 9, row: 9, orient: "corner" };
    if (idx === 8) return { col: 1, row: 9, orient: "corner" };
    if (idx === 16) return { col: 1, row: 1, orient: "corner" };
    if (idx === 24) return { col: 9, row: 1, orient: "corner" };
    if (idx >= 1 && idx <= 7) return { col: 9 - idx, row: 9, orient: "h" };
    if (idx >= 9 && idx <= 15) return { col: 1, row: 9 - (idx - 8), orient: "v" };
    if (idx >= 17 && idx <= 23) return { col: 1 + (idx - 16), row: 1, orient: "h" };
    return { col: 9, row: 1 + (idx - 24), orient: "v" };
  };

  ctx.font = "22px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  BOARD.forEach((tile, idx) => {
    const pos = gridPos(idx);
    if (pos.col >= 2 && pos.col <= 8 && pos.row >= 2 && pos.row <= 8) return;

    if (tile.isSpecial) {
      const { x, y } = drawTile(pos.col, pos.row, "#0f1016");
      ctx.fillStyle = "rgba(212,165,98,0.95)";
      ctx.font = "88px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(iconFor(tile.kind), x + cell / 2, y + cell / 2 - 10);

      ctx.fillStyle = "rgba(231,220,200,0.8)";
      ctx.font = "20px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(tile.name.toUpperCase(), x + 14, y + cell - 38);
      return;
    }

    const st = findState(tile.id);
    if (!st) return;
    const own = state.ownership[st.id];
    const fill = regionColor(st.region);
    const { x, y } = drawTile(pos.col, pos.row, fill);

    // owner stripe
    if (own?.ownerSeat) {
      ctx.fillStyle = seatFill(own.ownerSeat);
      if (pos.orient === "h") ctx.fillRect(x + 8, y + cell - 16, cell - 16, 8);
      else ctx.fillRect(x + cell - 16, y + 8, 8, cell - 16);
    }

    // state label
    ctx.fillStyle = "rgba(15,15,20,0.82)";
    ctx.font = "20px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(abbreviate(st.name), x + 14, y + 14);

    // price
    ctx.fillStyle = "rgba(10,10,12,0.65)";
    ctx.font = "18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText(`₹${(st.price / 1000).toFixed(st.price % 1000 === 0 ? 0 : 1)}k`, x + 14, y + cell - 42);

    // office mark (simple)
    if (own?.hasOffice) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.arc(x + cell - 28, y + 28, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = own?.ownerSeat ? seatFill(own.ownerSeat) : "#d4a562";
      ctx.beginPath();
      ctx.arc(x + cell - 28, y + 28, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function BoardBase() {
  const parchment = useTexture("/src/assets/parchment-texture.jpg");
  parchment.wrapS = parchment.wrapT = THREE.RepeatWrapping;
  parchment.repeat.set(2.25, 2.25);
  parchment.anisotropy = 8;

  return (
    <group>
      {/* Table/felt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#08080b" roughness={1} />
      </mesh>

      {/* Board slab */}
      <mesh position={[0, -0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[15.2, 0.22, 15.2]} />
        <meshStandardMaterial color="#0f1016" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Inner frame */}
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <boxGeometry args={[13.8, 0.12, 13.8]} />
        <meshStandardMaterial color="#1a1b22" roughness={0.75} metalness={0.08} />
      </mesh>

      {/* Center surface (textured) - keep smaller so perimeter tiles read */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.095, 0]} receiveShadow>
        <planeGeometry args={[9.2, 9.2]} />
        <meshStandardMaterial map={parchment} color="#cbb89a" roughness={0.95} metalness={0} />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.11, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.52}
        color="#2a1f16"
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
      >
        Zameen Zindabad
      </Text>
    </group>
  );
}

function Token({ seat, position, isCurrent }: { seat: number; position: number; isCurrent: boolean }) {
  const { x, z } = gridPositionFor(position);
  const palette = SEAT_PALETTE[(seat - 1) % SEAT_PALETTE.length];
  return (
    <group position={[x, 0.28 + (isCurrent ? 0.05 : 0), z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.22, 16]} />
        <meshStandardMaterial color={palette.fill} roughness={0.25} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <coneGeometry args={[0.12, 0.18, 12]} />
        <meshStandardMaterial color={palette.ring} roughness={0.2} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Scene({ state, currentTurnSeat, currentRound }: Props) {
  const boardTex = useMemo(() => makeBoardTexture(state), [state]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[9, 12, 8]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-7, 7, -6]} intensity={0.55} />
      <spotLight position={[0, 14, 0]} intensity={0.75} angle={0.45} penumbra={0.9} castShadow />

      <BoardBase />

      {/* Printed board (2D content baked into texture) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.108, 0]} receiveShadow>
        <planeGeometry args={[13.2, 13.2]} />
        <meshStandardMaterial map={boardTex} roughness={0.9} metalness={0.02} />
      </mesh>

      {state.players
        .filter((p) => !p.bankrupt)
        .map((p) => (
          <Token key={p.seat} seat={p.seat} position={p.position % TOTAL_TILES} isCurrent={p.seat === currentTurnSeat} />
        ))}

      <ContactShadows position={[0, -0.155, 0]} opacity={0.55} blur={2.6} far={14} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={7.5}
        maxDistance={14.5}
        minPolarAngle={0.75}
        maxPolarAngle={1.1}
        target={new THREE.Vector3(0, 0, 0)}
      />
    </>
  );
}

export function GameBoard3D(props: Props) {
  return (
    <div className="w-full max-w-[980px] mx-auto aspect-[16/10] bg-card/40 border border-brass/20 rounded-md overflow-hidden shadow-deep">
      <Canvas shadows camera={{ position: [10.5, 10.5, 10.5], fov: 42 }}>
        <Scene {...props} />
      </Canvas>
      <div className="px-3 py-2 text-[10px] font-display tracking-widest uppercase text-parchment/50 border-t border-brass/15 bg-background/40">
        3D board · drag to rotate · scroll to zoom · round {props.currentRound}
      </div>
    </div>
  );
}

