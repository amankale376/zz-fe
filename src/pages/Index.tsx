import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { MechanicsSection } from "@/components/MechanicsSection";
import { RegionsSection } from "@/components/RegionsSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { ManifestosSection } from "@/components/ManifestosSection";
import { CtaSection } from "@/components/CtaSection";
import { SiteFooter } from "@/components/SiteFooter";
import { primeAudioOnFirstGesture } from "@/lib/sound";

const Index = () => {
  useEffect(() => {
    primeAudioOnFirstGesture();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <h1 className="sr-only">Zameen Zindabad — A multiplayer political strategy board game</h1>
        <Hero />
        <MechanicsSection />
        <RegionsSection />
        <CapabilitiesSection />
        <ManifestosSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
