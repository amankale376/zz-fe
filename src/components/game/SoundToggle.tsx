import { useEffect, useState } from "react";
import { Volume2, VolumeX, Music, Music2 } from "lucide-react";
import {
  isMuted,
  isMusicEnabled,
  setMuted,
  setMusicEnabled,
  startMusic,
} from "@/lib/sound";

export function SoundToggle() {
  const [muted, setMutedState] = useState(false);
  const [music, setMusicState] = useState(true);

  useEffect(() => {
    setMutedState(isMuted());
    setMusicState(isMusicEnabled());
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
        onClick={() => {
          const next = !muted;
          setMuted(next);
          setMutedState(next);
        }}
        className="px-2 py-1.5 border border-brass/30 bg-card text-brass hover:border-brass transition-colors rounded-sm"
        title={muted ? "Unmute SFX" : "Mute SFX"}
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        aria-label={music ? "Stop music" : "Play music"}
        onClick={() => {
          const next = !music;
          setMusicEnabled(next);
          setMusicState(next);
          if (next) startMusic();
        }}
        className="px-2 py-1.5 border border-brass/30 bg-card text-brass hover:border-brass transition-colors rounded-sm"
        title={music ? "Pause music" : "Play music"}
      >
        {music ? <Music className="w-3.5 h-3.5" /> : <Music2 className="w-3.5 h-3.5 opacity-50" />}
      </button>
    </div>
  );
}
