import { useEffect, useState, useCallback, useRef } from "react";
import { initGame, normalizeGameState } from "@/game/engine";
import type { GameState } from "@/game/types";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export type RoomRow = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: "lobby" | "in_progress" | "finished";
  phase: "playing" | "election" | "policy" | "finished";
  max_players: number;
  current_round: number;
  current_turn_seat: number;
  winner_id: string | null;
  win_reason: string | null;
  game_state: GameState | Record<string, never>;
  started_at: string | null;
  created_at: string;
};

export type RoomPlayerRow = {
  id: string;
  room_id: string;
  user_id: string;
  seat: number;
  joined_at: string;
};

export function useRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<(RoomPlayerRow & { display_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!roomId) return;
    const res = await apiFetch<{ room: RoomRow; players: (RoomPlayerRow & { display_name: string })[] }>(
      `/rooms/${roomId}`,
    );
    setRoom(res.room);
    setPlayers(res.players);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    fetchAll().catch(() => {});

    const socket = getSocket();
    const onUpdate = (snap: { room: RoomRow | null; players: (RoomPlayerRow & { display_name: string })[] }) => {
      if (!mounted) return;
      if (!snap?.room) {
        setRoom(null);
        setPlayers([]);
        setLoading(false);
        return;
      }
      setRoom(snap.room);
      setPlayers(snap.players ?? []);
      setLoading(false);
    };
    socket.on("room:update", onUpdate);
    socket.emit("room:join", roomId);

    // Polling fallback in case websocket drops
    const poll = setInterval(() => {
      fetchAll().catch(() => {});
    }, 3000);
    return () => {
      mounted = false;
      socket.off("room:update", onUpdate);
      clearInterval(poll);
    };
  }, [roomId, fetchAll]);

  return { room, players, loading, refresh: fetchAll };
}

export function gameStateFromRow(row: RoomRow): GameState | null {
  const gs = row.game_state as GameState | Record<string, never>;
  if (!gs || !("players" in gs)) return null;
  return normalizeGameState(gs as GameState);
}

// Save the new state to the row (atomic-ish update).
export async function persistGameState(roomId: string, patch: Record<string, unknown>) {
  await apiFetch(`/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function sendGameAction(roomId: string, action: Record<string, unknown>) {
  await apiFetch(`/rooms/${roomId}/actions`, {
    method: "POST",
    body: JSON.stringify(action),
  });
}

// Helper: serialize a busy in-flight write so concurrent clicks don't clobber.
export function useGameWriter(roomId: string | undefined) {
  const busy = useRef(false);
  const run = useCallback(
    async (fn: () => Promise<void>) => {
      if (!roomId || busy.current) return;
      busy.current = true;
      try {
        await fn();
      } finally {
        busy.current = false;
      }
    },
    [roomId],
  );
  return run;
}

export function buildInitialGameState(
  players: { seat: number; user_id: string; display_name: string }[],
): GameState {
  return initGame(
    players.map((p) => ({ seat: p.seat, userId: p.user_id, displayName: p.display_name })),
  );
}
