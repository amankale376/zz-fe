import type { PolicyId } from "./types";

export const POLICIES: Record<
  PolicyId,
  { name: string; description: string }
> = {
  demonetization: {
    name: "Demonetization",
    description: "Every player with over ₹30,000 loses half their cash.",
  },
  presidents_rule: {
    name: "President's Rule",
    description: "The Prime Minister chooses one state to become Unowned.",
  },
  subsidy_south: {
    name: "Subsidy Drop",
    description: "Every owner of a South region state gains ₹2,000.",
  },
  tax_hike: {
    name: "Tax Hike",
    description: "You lose ₹1,000. Every other player pays you ₹1,000.",
  },
  land_reform: {
    name: "Land Reform",
    description: "All players gain +10 influence in their lowest-influence owned state.",
  },
  audit: {
    name: "Audit",
    description: "The wealthiest opponent loses ₹2,000 to the bank.",
  },
  jail_bharo: {
    name: "Jail Bharo",
    description: "Send any one opponent of your choice to jail for 1 turn.",
  },
  subsidy: {
    name: "Subsidy",
    description: "Every player receives ₹1,500 from the bank.",
  },
  free_press: {
    name: "Free Press",
    description: "All current Traitor Badges are cleared.",
  },
};

export const ALL_POLICIES: PolicyId[] = [
  "demonetization",
  "presidents_rule",
  "subsidy_south",
  "tax_hike",
  "land_reform",
  "audit",
  "jail_bharo",
  "subsidy",
  "free_press",
];
