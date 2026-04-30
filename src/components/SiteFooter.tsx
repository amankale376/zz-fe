export const SiteFooter = () => {
  return (
    <footer className="border-t border-brass/15 py-10 px-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display text-brass/60 text-xs tracking-[0.3em] uppercase">
          Zameen Zindabad · Est. 2026
        </div>
        <div className="font-serif-elegant italic text-parchment/40 text-sm">
          A game of land, loyalty &amp; lies.
        </div>
      </div>
    </footer>
  );
};
