import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-warroom.jpg";

export const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden vignette grain">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="A dimly lit war room with a map of India and brass tokens"
          width={1920}
          height={1088}
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/60 to-ink" />
        <div className="absolute inset-0 bg-gradient-lamp" />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl pt-32 pb-20">
        <p className="font-display text-brass text-xs md:text-sm tracking-[0.5em] uppercase mb-8 animate-fade-up animate-flicker">
          ✦  A Game of Land, Loyalty &amp; Lies  ✦
        </p>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-parchment leading-[0.95] mb-8 engraved animate-fade-up" style={{ animationDelay: "0.15s" }}>
          Zameen
          <span className="block gradient-text-brass italic font-serif font-semibold mt-2">
            Zindabad
          </span>
        </h1>

        <p className="font-serif-elegant text-lg md:text-2xl text-parchment/80 italic max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: "0.3s" }}>
          Twenty-eight states. Three currencies. One throne.
          <br />
          <span className="text-brass/80">Forge alliances. Betray them. Win the people — or buy them.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <Button
            variant="brass"
            size="xl"
            onClick={() => navigate(user ? "/lobby" : "/auth")}
          >
            {user ? "Enter the Lobby" : "Begin Your Campaign"}
          </Button>
          <Button variant="ornate" size="xl" asChild>
            <a href="#mechanics">View the Rulebook</a>
          </Button>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-brass/50 text-xs font-display tracking-[0.4em] uppercase">
        <div className="flex flex-col items-center gap-3">
          <span>Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-brass/60 to-transparent" />
        </div>
      </div>
    </section>
  );
};
