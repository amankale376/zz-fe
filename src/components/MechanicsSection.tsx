import { Coins, Vote, TrendingUp, Swords, Eye, Crown } from "lucide-react";

const mechanics = [
  {
    icon: Coins,
    title: "Tri-Currency Warfare",
    body: "Master Rupees for property, Influence for grip on each state, and Votes for elections every three rounds.",
  },
  {
    icon: TrendingUp,
    title: "Stronghold Powers",
    body: "Push past 80 Influence in Delhi, Mumbai or Bengaluru to unlock veto, finance and intelligence abilities.",
  },
  {
    icon: Swords,
    title: "Alliances & Betrayal",
    body: "Pool votes with one ally — or break the pact for a +25 Influence surge and the dreaded Traitor Badge.",
  },
  {
    icon: Eye,
    title: "Secret Manifestos",
    body: "A hidden objective worth +100 Influence. Are you the Socialist, the Disruptor — or the Kingmaker?",
  },
  {
    icon: Vote,
    title: "Elections & Policy",
    body: "Win the seat and choose Tax Hike, Jail Bharo or Land Reform. Tied votes? Highest Influence rules.",
  },
  {
    icon: Crown,
    title: "Three Roads to Victory",
    body: "Hold 14 states, win 3 elections, or end Round 10 with the highest total Influence.",
  },
];

export const MechanicsSection = () => {
  return (
    <section id="mechanics" className="relative py-32 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <p className="font-display text-brass text-xs tracking-[0.5em] uppercase mb-4">Chapter I</p>
          <h2 className="font-display text-4xl md:text-6xl text-parchment mb-6">
            The <span className="gradient-text-brass italic font-serif">Game</span> of Power
          </h2>
          <div className="ornate-divider max-w-md mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-brass/15">
          {mechanics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="group bg-card p-10 transition-all duration-500 hover:bg-muted relative overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-lamp opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-sm bg-ink border border-brass/30 flex items-center justify-center mb-6 group-hover:border-brass group-hover:shadow-lamp transition-all">
                    <Icon className="w-6 h-6 text-brass" />
                  </div>
                  <h3 className="font-display text-xl text-parchment mb-3 tracking-wide">{m.title}</h3>
                  <p className="font-serif-elegant text-base text-parchment/70 leading-relaxed">{m.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
