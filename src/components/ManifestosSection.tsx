import { Heart, Map, Crown, Skull } from "lucide-react";
import emblem from "@/assets/emblem-seal.png";

const manifestos = [
  { icon: Heart, name: "The Socialist", goal: "End the game with no player holding more than ₹20,000." },
  { icon: Map, name: "The Expansionist", goal: "Control at least one state in every single region." },
  { icon: Crown, name: "The Kingmaker", goal: "Ensure your Alliance partner wins at least 2 Elections." },
  { icon: Skull, name: "The Disruptor", goal: "Betray an alliance twice — while holding 5+ states." },
];

export const ManifestosSection = () => {
  return (
    <section id="manifestos" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-lamp opacity-50" />

      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center mb-20">
          <p className="font-display text-crimson text-xs tracking-[0.5em] uppercase mb-4">Chapter III · Sealed Orders</p>
          <h2 className="font-display text-4xl md:text-6xl text-parchment mb-6">
            Secret <span className="gradient-text-brass italic font-serif">Manifestos</span>
          </h2>
          <p className="font-serif-elegant italic text-parchment/60 max-w-2xl mx-auto text-lg">
            At dawn you receive a hidden objective. Fulfill it by Round 10 and earn a thunderous +100 Influence — but reveal nothing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {manifestos.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={m.name}
                className="relative group"
              >
                {/* Wax seal */}
                <div className="absolute -top-4 -right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-12">
                  <img src={emblem} alt="" width={64} height={64} className="w-16 h-16 drop-shadow-[0_8px_16px_hsl(var(--crimson-deep)/0.8)]" />
                </div>

                <div className="relative bg-card border border-brass/25 p-10 transition-all duration-500 group-hover:border-brass/60 group-hover:shadow-deep overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22none%22 stroke=%22%23000%22 stroke-width=%220.5%22/%3E%3C/svg%3E")' }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 border border-crimson/40 bg-crimson-deep/30 flex items-center justify-center rounded-sm">
                        <Icon className="w-5 h-5 text-crimson" />
                      </div>
                      <div className="ornate-divider flex-1" />
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl text-parchment mb-4 tracking-wide">{m.name}</h3>
                    <p className="font-serif-elegant text-lg text-parchment/75 italic leading-relaxed">{m.goal}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
