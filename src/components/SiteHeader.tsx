import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { isMuted, setMuted } from "@/lib/sound";
import { Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import emblem from "@/assets/emblem-seal.png";

export const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => {
    const handleStorageChange = () => setMutedState(isMuted());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    setMutedState(newMuted);
  };

  return (
    <header className="absolute top-0 inset-x-0 z-30">
      <div className="container mx-auto flex items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={emblem}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 drop-shadow-[0_0_12px_hsl(var(--brass)/0.4)] transition-transform group-hover:rotate-6"
          />
          <div className="leading-none">
            <div className="font-display text-brass text-sm tracking-[0.3em] uppercase">Zameen</div>
            <div className="font-display text-parchment/80 text-xs tracking-[0.4em] uppercase">Zindabad</div>
          </div>
        </Link>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleMute} className="text-parchment/60 hover:text-parchment">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Button variant="ornate" size="sm" onClick={() => navigate("/lobby")}>
                Lobby
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-parchment/60 hover:text-parchment">
                Leave
              </Button>
            </>
          ) : (
            <Button variant="brass" size="sm" onClick={() => navigate("/auth")}>
              Play as Guest
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
