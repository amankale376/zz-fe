# Zameen Zindabad: Chanakya Edition Rulebook

**Theme:** *In the halls of power, money is just fuel—Influence is the engine.*

## I. SETUP & THE SECRET START

1. **Assign Roles:** Every player receives a **Secret Manifesto** (hidden objective).
2. **Starting Capital:** Each player starts with **₹15,000** and **0 Influence**.
3. **The Seat of Power:** Everyone starts at **"Chunav HQ"** (Square 00).
4. **Influence Markers:** Players use their color-coded tokens to track influence levels on each state tile.

---

## II. THE ANATOMY OF A TURN

A turn is divided into three distinct phases: **Lobbying**, **The Campaign**, and **Consolidation**.

### Phase 1: Lobbying (Pre-Roll)

Before you roll the dice, you may perform **one** Tactical Action (if you have the Influence to spend):

* **Mobilize (20 Infl):** Spend 20 Influence from any state you control to add +1 to +6 to your next roll.
  - Implementation: `chanakyaMobilize()` → sets `diceBonus` applied in `rollDice()`
  
* **Propaganda (50 Infl):** Target a state's opponent; reduce the owner's influence there by 20.
  - Implementation: `chanakyaPropaganda()` → `bumpInfluence(..., -20)`
  - East Synergy: Immune to Propaganda

### Phase 2: The Campaign (The Move)

Roll the dice (with optional bonus) and move your token. Where you land dictates your action:

* **Unowned State:** Pay the "Campaign Cost" (The price on the tile).
  - Gain **60 Influence** immediately to become the Owner.
  - Implementation: Direct ownership in `onLand()`, no separate purchase UI needed
  
* **Opponent's State:** You are entering hostile territory. You do not pay "Rent"—you pay **"Damage Control"**:
    * *If it's a normal state (60-79 Infl):* Pay **₹2,000** to the owner.
    * *If it's a Stronghold (80+ Infl):* Pay **₹3,000** AND lose 10 Influence in your own strongest state.
  - Implementation: `chanakyaDamageControl()`
  
* **Your Own State:** You may **"Re-invest"**: 
  - Optional: Pay **₹1,000** to gain **+10 Influence**.
  - Implementation: Returns `pendingPurchase` with price 1000, handled by `buyPendingState()`

### Phase 3: Consolidation (Post-Move)

* **Building Offices:** If you own a state, you may build an **Office (HQ)** for the listed price.
  - Increases the "Damage Control" fee for others by **50%**.
  - Implementation: `buildOffice()` → `hasOffice: true`, applied in `chanakyaDamageControl()`
  
* **Regional Synergy Check:** Check if you now hold enough states to trigger a **Regional Power** (see Section III).

---

## III. REGIONAL SYNERGIES (THE MAP STRATEGY)

Owning the board is about clusters, not just single states.

| Region | Benefit (Passive) | Logic |
| :--- | :--- | :--- |
| **North** | **Vote Multiplier:** Your votes count as **1.5x**. | The heart of the Lok Sabha. |
| **West** | **Industrial Rebate:** Offices cost **50% less** (₹1,000 vs ₹2,000). | The corporate funding hub. |
| **South** | **Intel:** Peek at the next 2 Chance cards. | The tech-savvy data center. |
| **East** | **Iron Grip:** Your states cannot be "Lobbied" by others (immunity to Propaganda). | Resource-rich stability. |
| **NE/Central** | **Special Status:** **No Damage Control** costs here. | Difficult terrain, high autonomy. |

Implementation:
- `regionsControlled()` → determines which synergies apply
- Applied in `buildOffice()`, `chanakyaDamageControl()`, `chanakyaPropaganda()`

---

## IV. THE ELECTION CYCLE (EVERY 3 ROUNDS)

When the "Round" counter hits 3, 6, and 9, the board pauses for the **Election Phase**.

1. **The Count:** Every state you own provides **1 Vote**. Strongholds (80+ Infl) provide **2 Votes**.
   - Implementation: `calculateVotes()` → updated in `recalcInfluenceTotals()`

2. **The Horse Trading (60 Seconds):** Players may trade Rupees for Votes.
   - *Example: "I'll give you ₹5,000 to vote for me so I can pass the 'Tax Hike' policy against Player C."*
   - Implementation: UI component needed for vote trading

3. **The Winner:** The player with the most votes becomes **The Prime Minister** for the next 3 rounds.

4. **Policy Privilege:** The PM chooses one of three **Policy Cards**:
   - **Demonetization:** Everyone with over ₹30,000 loses half their cash.
   - **President's Rule:** Choose one state; it becomes "Unowned" immediately.
   - **Subsidy Drop:** All owners of "South" states gain ₹2,000.

---

## V. WINNING THE GAME

The game ends at the end of **Round 10** or if a **Majority (14 states)** is reached.

### Final Scoring (The Points Table)

| Asset | Influence Points |
| :--- | :--- |
| **Each State Controlled** | 50 pts |
| **Each Stronghold (80+ Infl)** | 100 pts |
| **Per ₹1,000 in Bank** | 5 pts |
| **Each Election Won** | 200 pts |
| **Secret Manifesto Met** | 500 pts |

Implementation: `calculateChanakyaFinalScores()` → returns `FinalScore[]` with breakdown

---

## VI. HOW TO PLAY: THE "POWER MOVES"

* **The Aggressor:** Focus on the **North Region** early. Even if you have fewer states, the 1.5x Vote Multiplier ensures you win every Election and control the Policy Cards.

* **The Corporate Giant:** Focus on the **West**. Build Offices everywhere. Your income from "Damage Control" will eventually let you "buy" the votes of poorer players during the Election Phase.

* **The Silent Kingmaker:** Focus on the **NE/Central** region. It's cheap to maintain. Use your saved cash to bribe the winning PM to pass policies that hurt your biggest rival.

---

## VII. EMERGENCY MECHANICS: BANKRUPTCY & SCANDALS

* **Defaulter Status:** If you cannot pay a fee, you must **"Sell Influence."** Drop a state's influence to 0 to gain 50% of its purchase price.
  - Implementation: Needs UI hook for bankruptcy flow
  
* **The Scandal (Chance Card):** If you draw a Scandal card, you are sent to the **"Inquiry Commission"** (Jail equivalent). 
  - To leave: Pay ₹2,000 or wait 2 turns. 
  - While in Inquiry: Cannot collect Damage Control fees.
  - Implementation: Part of existing jail/chance system

---

## Implementation Status

### ✅ Core Mechanics Implemented

- [x] Damage Control system (vs old rent)
- [x] Re-invest mechanic (own state bonus)
- [x] Automatic 60 influence on acquisition
- [x] Pre-roll tactical actions (Mobilize, Propaganda)
- [x] Vote calculation (1 per state, 2 per stronghold)
- [x] Regional synergies (partial)
- [x] Final scoring calculation
- [x] Office discount (West region)
- [x] Stronghold detection (80+ influence)

### ⚠️ Integration Needed

- [ ] UI for tactical actions menu (pre-roll)
- [ ] Regional synergy UI (showing which bonuses apply)
- [ ] Election phase UI (vote trading, policy selection)
- [ ] Bankruptcy flow (sell influence liquidation)
- [ ] Win condition enforcement (Round 10 / 14 states majority)
- [ ] Policy execution logic (Demonetization, President's Rule, Subsidy Drop)
- [ ] Vote multiplier for North region (calculated but not UI-visible)

---

## Code References

**Key Functions:**
- `chanakyaDamageControl()` - Hostile landing logic
- `chanakyaMobilize()` - Pre-roll +1-6 bonus
- `chanakyaPropaganda()` - Influence raid on opponent
- `calculateVotes()` - Voting power calculation
- `calculateChanakyaFinalScores()` - Final scoring
- `buyPendingState()` - Re-invest confirm (when price=1000)

**Key Types:**
- `TacticalActionId` - "mobilize" | "propaganda"
- `PlayerState.diceBonus` - Temporary +1-6 for next roll
- `FinalScore` - Breakdown of player's final points

