// 28 Indian states + 4 special tiles = 32 board tiles
// Order them around the board clockwise.

export type Region = "north" | "west" | "south" | "east" | "ne_central";

export type StateTile = {
  id: string;
  name: string;
  region: Region;
  price: number; // ₹ to buy first foothold
  baseRent: number; // ₹ rent at owner status (60+ infl). Stronghold (80+) = 2x.
  isSpecial?: false;
};

export type SpecialTile = {
  id: string;
  name: string;
  kind: "hq" | "chance" | "niti" | "jail";
  isSpecial: true;
};

export type Tile = StateTile | SpecialTile;

// 28 Indian states grouped for synergies
const STATES: StateTile[] = [
  // North (6)
  { id: "delhi", name: "Delhi", region: "north", price: 4000, baseRent: 500 },
  { id: "punjab", name: "Punjab", region: "north", price: 2800, baseRent: 280 },
  { id: "haryana", name: "Haryana", region: "north", price: 2600, baseRent: 260 },
  { id: "uttarakhand", name: "Uttarakhand", region: "north", price: 2200, baseRent: 220 },
  { id: "himachal", name: "Himachal Pradesh", region: "north", price: 2000, baseRent: 200 },
  { id: "uttar_pradesh", name: "Uttar Pradesh", region: "north", price: 3000, baseRent: 320 },

  // West (5)
  { id: "maharashtra", name: "Maharashtra", region: "west", price: 4200, baseRent: 520 },
  { id: "gujarat", name: "Gujarat", region: "west", price: 3600, baseRent: 400 },
  { id: "rajasthan", name: "Rajasthan", region: "west", price: 2400, baseRent: 240 },
  { id: "goa", name: "Goa", region: "west", price: 2000, baseRent: 240 },
  { id: "j_k", name: "Jammu & Kashmir", region: "west", price: 2200, baseRent: 220 },

  // South (5)
  { id: "karnataka", name: "Karnataka", region: "south", price: 3800, baseRent: 440 },
  { id: "tamil_nadu", name: "Tamil Nadu", region: "south", price: 3600, baseRent: 420 },
  { id: "kerala", name: "Kerala", region: "south", price: 2800, baseRent: 300 },
  { id: "andhra", name: "Andhra Pradesh", region: "south", price: 3000, baseRent: 320 },
  { id: "telangana", name: "Telangana", region: "south", price: 3200, baseRent: 360 },

  // East (5)
  { id: "west_bengal", name: "West Bengal", region: "east", price: 3400, baseRent: 380 },
  { id: "odisha", name: "Odisha", region: "east", price: 2400, baseRent: 240 },
  { id: "bihar", name: "Bihar", region: "east", price: 2400, baseRent: 240 },
  { id: "jharkhand", name: "Jharkhand", region: "east", price: 2200, baseRent: 220 },
  { id: "sikkim", name: "Sikkim", region: "east", price: 1800, baseRent: 180 },

  // NE + Central (7)
  { id: "assam", name: "Assam", region: "ne_central", price: 2400, baseRent: 240 },
  { id: "meghalaya", name: "Meghalaya", region: "ne_central", price: 1800, baseRent: 180 },
  { id: "manipur", name: "Manipur", region: "ne_central", price: 1800, baseRent: 180 },
  { id: "nagaland", name: "Nagaland", region: "ne_central", price: 1800, baseRent: 180 },
  { id: "tripura", name: "Tripura", region: "ne_central", price: 1800, baseRent: 180 },
  { id: "madhya_pradesh", name: "Madhya Pradesh", region: "ne_central", price: 3000, baseRent: 320 },
  { id: "chhattisgarh", name: "Chhattisgarh", region: "ne_central", price: 2400, baseRent: 240 },
];

export const ALL_STATES: StateTile[] = STATES;

// Build the board: 32 tiles. Inject 4 special tiles around the loop.
const SPECIALS: SpecialTile[] = [
  { id: "hq", name: "Chunav HQ", kind: "hq", isSpecial: true },
  { id: "chance_1", name: "Chance", kind: "chance", isSpecial: true },
  { id: "niti", name: "Niti Aayog", kind: "niti", isSpecial: true },
  { id: "chance_2", name: "Chance", kind: "chance", isSpecial: true },
];

// Interleave: HQ at 0, then 7 states, chance, 7 states, niti, 7 states, chance, 7 states
function buildBoard(): Tile[] {
  const tiles: Tile[] = [];
  tiles.push(SPECIALS[0]); // 0: HQ
  tiles.push(...STATES.slice(0, 7)); // 1..7
  tiles.push(SPECIALS[1]); // 8: chance
  tiles.push(...STATES.slice(7, 14)); // 9..15
  tiles.push(SPECIALS[2]); // 16: niti
  tiles.push(...STATES.slice(14, 21)); // 17..23
  tiles.push(SPECIALS[3]); // 24: chance
  tiles.push(...STATES.slice(21, 28)); // 25..31
  return tiles;
}

export const BOARD: Tile[] = buildBoard();
export const BOARD_SIZE = BOARD.length;

export const REGION_LABELS: Record<Region, string> = {
  north: "North",
  west: "West",
  south: "South",
  east: "East",
  ne_central: "NE + Central",
};

export const REGION_THRESHOLDS: Record<Region, { required: number; total: number }> = {
  north: { required: 4, total: 6 },
  west: { required: 3, total: 5 },
  south: { required: 3, total: 5 },
  east: { required: 3, total: 5 },
  ne_central: { required: 4, total: 7 },
};

export function tileAt(index: number): Tile {
  return BOARD[((index % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE];
}

export function statesByRegion(region: Region): StateTile[] {
  return STATES.filter((s) => s.region === region);
}

export function findState(stateId: string): StateTile | undefined {
  return STATES.find((s) => s.id === stateId);
}
