import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import { Crown, Users, Copy, LogOut } from "lucide-react";
import emblem from "@/assets/emblem-seal.png";
import { useRoom, gameStateFromRow, sendGameAction } from "@/hooks/useGame";
import { GameBoard } from "@/components/game/GameBoard";
import { SoundToggle } from "@/components/game/SoundToggle";
import { apiFetch } from "@/lib/api";

const Room = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { room, players, loading } = useRoom(id);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading && id && !room) {
      toast.error("Room no longer exists.");
      navigate("/lobby");
    }
  }, [loading, room, id, navigate]);

  const mySeat = useMemo(() => {
    if (!user) return null;
    return players.find((p) => p.user_id === user.id)?.seat ?? null;
  }, [players, user]);

  const leave = async () => {
    if (!user || !id || !room) return;
    await apiFetch(`/rooms/${id}/leave`, { method: "POST" });
    navigate("/lobby");
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    toast.success("Code copied.");
  };

  const startGame = async () => {
    if (!room || !user || room.host_id !== user.id) return;
    if (players.length < 2) return toast.error("Need at least 2 players.");
    try {
      await sendGameAction(room.id, { type: "start_game" });
      toast.success("The game begins.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading || !room || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-brass tracking-widest uppercase text-sm animate-flicker">Sealing the chamber...</p>
      </div>
    );
  }

  const isHost = room.host_id === user.id;
  const gs = gameStateFromRow(room);

  // ---- IN GAME ----
  if (room.status === "in_progress" && gs) {
    const turnPlayer = gs.players.find((p) => p.seat === room.current_turn_seat);
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-3 sm:px-6 pt-24 pb-12 max-w-[1400px]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-1">
            <div>
              <p className="font-display text-brass text-[10px] tracking-[0.5em] uppercase">
                Round {room.current_round} / 10 · {room.name}
              </p>
              <h1 className="font-serif-elegant italic text-3xl md:text-4xl text-parchment leading-tight">
                {turnPlayer ? `${turnPlayer.displayName}'s move` : "Awaiting move"}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs font-display tracking-widest uppercase">
              <SoundToggle />
              <span className="px-3 py-1.5 border border-brass/40 bg-card text-brass">
                Phase · {room.phase}
              </span>
              <span className="px-3 py-1.5 border border-brass/30 bg-card text-parchment">
                Seat {room.current_turn_seat}
              </span>
            </div>
          </div>
          <GameBoard room={room} state={gs} mySeat={mySeat} />
        </main>
      </div>
    );
  }

  // ---- FINISHED ----
  if (room.status === "finished") {
    const winnerName = players.find((p) => p.user_id === room.winner_id)?.display_name ?? "Unknown";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-lg px-6">
          <p className="font-display text-brass text-xs tracking-[0.5em] uppercase mb-3">The dust settles</p>
          <h1 className="font-display text-5xl text-parchment mb-4">
            <span className="gradient-text-brass italic font-serif">{winnerName}</span> wins
          </h1>
          <p className="font-serif-elegant italic text-parchment/60 mb-8">{room.win_reason}</p>
          <Button variant="brass" size="lg" onClick={() => navigate("/lobby")}>Return to Lobby</Button>
        </div>
      </div>
    );
  }

  // ---- LOBBY (waiting room) ----
  const seats = Array.from({ length: room.max_players }, (_, i) => i + 1);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 pt-32 pb-20 max-w-5xl">
        <div className="text-center mb-12">
          <p className="font-display text-brass text-xs tracking-[0.5em] uppercase mb-3">Sealed Chamber</p>
          <h1 className="font-display text-4xl md:text-5xl text-parchment mb-6">{room.name}</h1>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-3 bg-card border border-brass/40 px-6 py-3 hover:border-brass transition-all group"
          >
            <span className="font-display text-2xl text-brass tracking-[0.5em]">{room.code}</span>
            <Copy className="w-4 h-4 text-brass/60 group-hover:text-brass" />
          </button>
          <p className="font-serif-elegant italic text-parchment/50 text-sm mt-3">
            Share this code with up to {room.max_players - 1} fellow conspirators.
          </p>
        </div>

        <div className="bg-card border border-brass/25 p-8 md:p-10 shadow-deep mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-brass" />
              <h2 className="font-display text-lg text-parchment uppercase tracking-widest">
                Players · {players.length} / {room.max_players}
              </h2>
            </div>
            <div className="ornate-divider flex-1 mx-6" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {seats.map((seat) => {
              const p = players.find((pl) => pl.seat === seat);
              const isYou = p?.user_id === user.id;
              const isThisHost = p?.user_id === room.host_id;
              return (
                <div
                  key={seat}
                  className={`flex items-center gap-4 p-5 border transition-all ${
                    p ? "border-brass/40 bg-ink" : "border-brass/15 border-dashed bg-transparent"
                  }`}
                >
                  <div className="w-10 h-10 shrink-0 bg-background border border-brass/30 flex items-center justify-center rounded-sm font-display text-brass">
                    {seat}
                  </div>
                  <div className="flex-1 min-w-0">
                    {p ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-parchment truncate">{p.display_name}</span>
                          {isThisHost && <Crown className="w-3.5 h-3.5 text-brass shrink-0" />}
                        </div>
                        {isYou && <span className="font-serif-elegant italic text-xs text-brass/70">You</span>}
                      </>
                    ) : (
                      <span className="font-serif-elegant italic text-parchment/30">Empty seat</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isHost && (
            <Button variant="brass" size="lg" onClick={startGame} disabled={players.length < 2}>
              Begin the Game
            </Button>
          )}
          {!isHost && (
            <p className="font-serif-elegant italic text-parchment/50 text-sm">Waiting for the host to begin...</p>
          )}
          <Button variant="ornate" size="lg" onClick={leave}>
            <LogOut className="w-4 h-4" />
            {isHost ? "Dissolve Room" : "Leave Table"}
          </Button>
        </div>

        <div className="text-center mt-16">
          <img src={emblem} alt="" width={48} height={48} className="w-12 h-12 mx-auto opacity-40 animate-flicker" />
        </div>
      </main>
    </div>
  );
};

export default Room;
