import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import { Users, Plus, LogIn, Crown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { primeAudioOnFirstGesture } from "@/lib/sound";

type Room = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: "lobby" | "in_progress" | "finished";
  max_players: number;
  player_count?: number;
};

const Lobby = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    primeAudioOnFirstGesture();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const fetchRooms = async () => {
    try {
      const data = await apiFetch<Room[]>("/rooms?status=lobby");
      setRooms(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRooms();
    const poll = setInterval(fetchRooms, 2000);
    return () => {
      clearInterval(poll);
    };
  }, [user]);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ id: string; code: string }>("/rooms", {
        method: "POST",
        body: JSON.stringify({ name: roomName || "A Quiet Coup" }),
      });
      setLoading(false);
      toast.success("Room sealed. Share the code.");
      navigate(`/room/${res.id}`);
    } catch (err) {
      setLoading(false);
      toast.error((err as Error).message ?? "Could not create room");
    }
  };

  const joinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ id: string }>("/rooms/join", {
        method: "POST",
        body: JSON.stringify({ code: joinCode.toUpperCase() }),
      });
      setLoading(false);
      navigate(`/room/${res.id}`);
    } catch (err) {
      setLoading(false);
      const msg = (err as Error).message;
      toast.error(msg === "room_not_found" ? "No active room with that code." : msg);
    }
  };

  const joinRoom = async (room: Room) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ id: string }>("/rooms/join", {
        method: "POST",
        body: JSON.stringify({ code: room.code }),
      });
      setLoading(false);
      navigate(`/room/${res.id}`);
    } catch (err) {
      setLoading(false);
      toast.error((err as Error).message ?? "Could not join room");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-brass tracking-widest uppercase text-sm animate-flicker">Lighting the lamp...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 pt-32 pb-20 max-w-6xl">
        <div className="text-center mb-16">
          <p className="font-display text-brass text-xs tracking-[0.5em] uppercase mb-3">The Antechamber</p>
          <h1 className="font-display text-4xl md:text-6xl text-parchment mb-4">
            The <span className="gradient-text-brass italic font-serif">Lobby</span>
          </h1>
          <p className="font-serif-elegant italic text-parchment/60 text-lg">
            Forge a new room or slip into one already in session.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Create */}
          <form onSubmit={createRoom} className="bg-card border border-brass/30 p-8 shadow-deep">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-ink border border-brass/40 flex items-center justify-center rounded-sm">
                <Plus className="w-4 h-4 text-brass" />
              </div>
              <h2 className="font-display text-xl text-parchment uppercase tracking-widest">Host a Game</h2>
            </div>
            <Label className="font-display text-xs tracking-widest uppercase text-parchment/70">Room Name</Label>
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={40}
              className="mt-2 mb-6 bg-ink border-brass/30 text-parchment"
              placeholder="A Quiet Coup"
            />
            <Button type="submit" variant="brass" size="lg" className="w-full" disabled={loading}>
              Light the Lamp
            </Button>
          </form>

          {/* Join */}
          <form onSubmit={joinByCode} className="bg-card border border-brass/30 p-8 shadow-deep">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-ink border border-crimson/40 flex items-center justify-center rounded-sm">
                <LogIn className="w-4 h-4 text-crimson" />
              </div>
              <h2 className="font-display text-xl text-parchment uppercase tracking-widest">Join by Code</h2>
            </div>
            <Label className="font-display text-xs tracking-widest uppercase text-parchment/70">Six-Letter Cipher</Label>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="mt-2 mb-6 bg-ink border-brass/30 text-parchment font-display tracking-[0.4em] text-center text-lg uppercase"
              placeholder="XXXXXX"
            />
            <Button type="submit" variant="crimson" size="lg" className="w-full" disabled={loading || joinCode.length !== 6}>
              Slip Inside
            </Button>
          </form>
        </div>

        {/* Open rooms */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-parchment uppercase tracking-widest">Open Tables</h2>
            <div className="ornate-divider flex-1 mx-6" />
            <span className="font-display text-xs text-brass/60 tracking-widest uppercase">{rooms.length}</span>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-16 border border-brass/15 border-dashed">
              <p className="font-serif-elegant italic text-parchment/50 text-lg">
                No tables lit. Be the first to strike a match.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => joinRoom(r)}
                  className="text-left bg-card border border-brass/20 p-6 hover:border-brass/60 hover:shadow-lamp transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-lg text-parchment group-hover:text-brass transition-colors">
                        {r.name}
                      </h3>
                      <div className="font-display text-xs text-brass/60 tracking-[0.3em] mt-1">
                        {r.code}
                      </div>
                    </div>
                    {r.host_id === user.id && (
                      <Crown className="w-4 h-4 text-brass" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-display tracking-widest uppercase text-parchment/60">
                    <Users className="w-3.5 h-3.5" />
                    <span>{r.player_count} / {r.max_players} seated</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Lobby;
