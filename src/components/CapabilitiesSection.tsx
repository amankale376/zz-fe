import { Zap, Snowflake, Megaphone } from "lucide-react";

const caps = [
  { icon: Zap, name: "Mobilize", cost: "20 Infl", body: "Forgo your roll and surge an extra 1–6 spaces across the board." },
  { icon: Snowflake, name: "Lobby", cost: "40 Infl", body: "Freeze a state for one full round — untouchable, unchallengeable." },
  { icon: Megaphone, name: "Propaganda", cost: "50 Infl", body: "Quietly bleed 20 Influence from a rival in a neighboring state." },
];

export const CapabilitiesSection = () => {
  return (
    <section className="relative py-32 px-6 bg-gradient-ink border-y border-brass/15">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-display text-brass text-xs tracking-[0.5em] uppercase mb-4">Chapter IV</p>
            <h2 className="font-display text-4xl md:text-5xl text-parchment mb-6 leading-tight">
              Tactical
              <span className="block gradient-text-brass italic font-serif">State Capabilities</span>
            </h2>
            <p className="font-serif-elegant text-lg text-parchment/70 italic leading-relaxed mb-8">
              Once per turn, spend Influence from your states to break the rules of movement. The board is yours to bend — at a price.
            </p>
            <div className="flex items-center gap-3 text-brass/60 text-xs font-display tracking-[0.3em] uppercase">
              <div className="h-px w-12 bg-brass/40" />
              <span>One per turn</span>
            </div>
          </div>

          <div className="space-y-4">
            {caps.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.name}
                  className="group flex gap-6 p-6 border border-brass/20 hover:border-brass/60 hover:bg-card transition-all duration-500"
                >
                  <div className="w-14 h-14 shrink-0 bg-ink border border-brass/40 flex items-center justify-center rounded-sm group-hover:shadow-lamp transition-all">
                    <Icon className="w-6 h-6 text-brass" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h3 className="font-display text-xl text-parchment uppercase tracking-widest">{c.name}</h3>
                      <span className="font-display text-xs text-crimson tracking-widest uppercase">{c.cost}</span>
                    </div>
                    <p className="font-serif-elegant text-base text-parchment/70 italic">{c.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
