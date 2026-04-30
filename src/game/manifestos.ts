import type { ManifestoId } from "./types";

export const MANIFESTOS: Record<ManifestoId, { name: string; description: string }> = {
  socialist: {
    name: "The Socialist",
    description: "End the game with no player (including yourself) holding more than ₹20,000.",
  },
  expansionist: {
    name: "The Expansionist",
    description: "Control at least one state in every single region.",
  },
  kingmaker: {
    name: "The Kingmaker",
    description: "Have your alliance partner win at least 2 elections.",
  },
  disruptor: {
    name: "The Disruptor",
    description: "Betray an alliance at least twice while holding 5+ states.",
  },
};

export const ALL_MANIFESTOS: ManifestoId[] = [
  "socialist",
  "expansionist",
  "kingmaker",
  "disruptor",
];
