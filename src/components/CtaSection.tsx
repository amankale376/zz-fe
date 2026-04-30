import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import emblem from "@/assets/emblem-seal.png";

export const CtaSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-lamp opacity-60" />
      <div className="container mx-auto max-w-3xl text-center relative">
        <img
          src={emblem}
          alt=""
          width={120}
          height={120}
          className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-8 drop-shadow-[0_0_30px_hsl(var(--crimson-deep)/0.6)] animate-flicker"
        />
        <h2 className="font-display text-4xl md:text-6xl text-parchment mb-6 leading-tight">
          The Throne
          <span className="block gradient-text-brass italic font-serif">awaits its claimant.</span>
        </h2>
        <p className="font-serif-elegant italic text-lg md:text-xl text-parchment/70 mb-12 max-w-xl mx-auto leading-relaxed">
          Gather two to six players. Set the table. Light the lamp. The first move belongs to whoever dares to take it.
        </p>
        <Button
          variant="brass"
          size="xl"
          onClick={() => navigate(user ? "/lobby" : "/auth")}
        >
          {user ? "Enter the Lobby" : "Take Your Seat"}
        </Button>
      </div>
    </section>
  );
};
