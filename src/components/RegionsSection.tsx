const regions = [
  { name: "North", required: "4 of 6", title: "Political Heartland", body: "Your votes count as 1.5× in every election.", accent: "saffron" },
  { name: "West", required: "3 of 5", title: "Industrial Hub", body: "Build Offices for ₹1,000 instead of ₹2,000.", accent: "brass" },
  { name: "South", required: "3 of 5", title: "Tech Corridor", body: "Earn ₹500 each time an opponent lands on Chance or Niti.", accent: "emerald" },
  { name: "East", required: "3 of 5", title: "Resource Rich", body: "Your rent collection cannot be halved by any effect.", accent: "crimson" },
  { name: "NE + Central", required: "4 of 7", title: "Special Status", body: "Pay ₹0 rent when landing on states in this region.", accent: "brass" },
];

export const RegionsSection = () => {
  return (
    <section id="regions" className="relative py-32 px-6 bg-gradient-ink">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <p className="font-display text-brass text-xs tracking-[0.5em] uppercase mb-4">Chapter II</p>
          <h2 className="font-display text-4xl md:text-6xl text-parchment mb-6">
            Regional <span className="gradient-text-brass italic font-serif">Synergies</span>
          </h2>
          <p className="font-serif-elegant italic text-parchment/60 max-w-xl mx-auto text-lg">
            Control the majority of states in a region to unlock a passive global power that follows you across the board.
          </p>
        </div>

        <div className="space-y-px bg-brass/15">
          {regions.map((r, i) => (
            <div
              key={r.name}
              className="grid md:grid-cols-12 gap-6 bg-card p-8 md:p-10 items-center group hover:bg-muted transition-all duration-500"
            >
              <div className="md:col-span-2">
                <div className="font-display text-2xl md:text-3xl text-brass tracking-wider">{r.name}</div>
                <div className="font-serif-elegant italic text-parchment/50 text-sm mt-1">{r.required} states</div>
              </div>
              <div className="md:col-span-1 hidden md:flex justify-center">
                <span className="text-brass/40 text-xl">✦</span>
              </div>
              <div className="md:col-span-9">
                <h3 className="font-display text-xl text-parchment uppercase tracking-widest mb-2">{r.title}</h3>
                <p className="font-serif-elegant text-lg text-parchment/75 italic leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
