import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import emblem from "@/assets/emblem-seal.png";
import { apiFetch } from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();
  const { user, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) navigate("/lobby");
  }, [user, navigate]);

  const enterAsGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) return toast.error("Choose a name to enter the room.");
    setLoading(true);

    try {
      const res = await apiFetch<{ token: string; user: { id: string; displayName: string } }>("/auth/guest", {
        method: "POST",
        body: JSON.stringify({ displayName: name }),
      });
      setAuth(res.token, res.user);
    } catch (err) {
      setLoading(false);
      return toast.error((err as Error).message || "Could not enter the room.");
    }

    setLoading(false);
    toast.success(`Welcome, ${name}.`);
    navigate("/lobby");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-gradient-ink relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-lamp opacity-60" />
      <div className="absolute inset-0 vignette grain" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex flex-col items-center gap-4 mb-10">
          <img
            src={emblem}
            alt=""
            width={72}
            height={72}
            className="w-18 h-18 drop-shadow-[0_0_20px_hsl(var(--brass)/0.4)] animate-flicker"
          />
          <div className="text-center">
            <div className="font-display text-brass text-xs tracking-[0.4em] uppercase">Zameen</div>
            <div className="font-display text-parchment text-sm tracking-[0.5em] uppercase">Zindabad</div>
          </div>
        </Link>

        <div className="bg-card border border-brass/30 shadow-deep p-8 md:p-10">
          <p className="font-display text-brass text-xs tracking-[0.4em] uppercase text-center mb-2">
            Take Your Seat
          </p>
          <h1 className="font-display text-2xl text-parchment text-center mb-8">
            Choose your <span className="italic font-serif gradient-text-brass">alias</span>
          </h1>

          <form onSubmit={enterAsGuest} className="space-y-6">
            <div>
              <Label className="font-display text-xs tracking-widest uppercase text-parchment/70">
                Display Name
              </Label>
              <Input
                required
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={24}
                className="mt-2 bg-ink border-brass/30 text-parchment focus:border-brass text-center font-display tracking-widest"
                placeholder="The Architect"
              />
              <p className="font-serif-elegant italic text-xs text-parchment/50 mt-2 text-center">
                No email, no password. Just you and the board.
              </p>
            </div>

            <Button type="submit" variant="brass" size="lg" className="w-full" disabled={loading}>
              {loading ? "Lighting the lamp..." : "Enter the Room"}
            </Button>
          </form>
        </div>

        <Link
          to="/"
          className="block text-center mt-6 font-display text-xs text-parchment/50 tracking-widest uppercase hover:text-brass transition-colors"
        >
          ← Back to the war room
        </Link>
      </div>
    </div>
  );
};

export default Auth;
