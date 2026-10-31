# GW2PC Reimagined

A personal price-check site for Guild Wars 2 that reproduces gw2pc.com's numbers for over-the-counter trading and adds an overview of the wider economy.

## Language

**OTC trade**:
A player-to-player trade arranged outside the Trading Post, typically on the Overflow Discord, priced using gw2pc.com numbers.
_Avoid_: Direct trade, P2P trade

**Depth**:
A quantity N of units counted into one side of the Trading Post order book, cheapest sell listing first or highest buy order first.
_Avoid_: Volume, quantity

**Depth price**:
The unit price of the Nth unit on one side of the order book at a given **Depth**.
_Avoid_: TP price, market price

**OTC ratio**:
A percentage applied to a **Depth price** on one side of the book, such as 90% Sell or 100% Buy.
_Avoid_: Discount, cut

**OTC price**:
The price quoted for an **OTC trade**: the **Depth price** at an item's **Standard depth** multiplied by its **Standard ratio**. It always matches the figure gw2pc.com shows for the same item.
_Avoid_: Fair price, gw2pc price

**Standard depth**:
The one **Depth** per item at which its **OTC price** is read, for example 2000 for Ectos and 2500 for Mystic Coins. For a **Tradeable legendary** it is not fixed: it starts at 1 and moves to 2, then 3, only while each step raises the price by more than 45 gold.
_Avoid_: Highlight depth

**Standard ratio**:
The one **OTC ratio** per item used for its **OTC price**: 90% Sell for most items and 85% Sell for legendaries.
_Avoid_: Highlight ratio

**T6 set**:
One stack of 250 of each of the eight T6 materials, Crystalline Dust included. This is the unit used in **OTC trades**. It differs from the owner's T6 holdings report, which leaves Dust out.
_Avoid_: T6 bundle

**Gem price**:
The gold needed to buy 400 gems through the currency exchange.
_Avoid_: Gem rate, gold-to-gem ratio

**Snapshot**:
A recorded **OTC price** for a tracked item at one moment in time. Material and set prices are recorded hourly and **Tradeable legendary** prices daily. Hourly snapshots older than 30 days are reduced to one per day.
_Avoid_: Sample, tick, history point

**Economy index**:
The equally weighted change in the **OTC prices** of Mystic Coins, Ecto and a **T6 set**, set to 100 at the first **Snapshot**. The **Gem price** is shown next to it but is not part of it.
_Avoid_: Market index, basket

**Tradeable legendary**:
A legendary-rarity weapon or legendary item that can be listed on the Trading Post. It covers **Gen 1**, **Gen 3**, Klobjarne Geirr, Wages of Stars and the Aetheric Anchor. Gen 2 legendaries are account-bound and excluded.

**Gen 1 legendary**:
One of the original core-game legendary weapons, such as Eternity, Bolt or The Bifrost.

**Gen 3 legendary**:
One of the Aurene's legendary weapons from End of Dragons, such as Aurene's Fang.
_Avoid_: Gen 2.5

**Flippable**:
True when the 100% Buy **Depth price** is below the 85% Sell **Depth price** at the same **Depth**. Buying through a buy order and reselling through a sell listing then makes a profit after Trading Post fees.
_Avoid_: Profitable, arbitrage

**Flip ROI**:
The profit from a flip as a share of the money spent, calculated as (85% Sell − 100% Buy) ÷ 100% Buy at one **Depth**. It is only shown when the item is **Flippable**.
_Avoid_: Margin, spread

**Payment**:
A gold amount owed in an **OTC trade** and settled in items, each valued at its **OTC price**. A payment can be valued in either direction: gold to items when paying, items to gold when receiving.
_Avoid_: Price, cost

**Raw gold**:
Coins handed over directly as part of a **Payment**, not converted into items.
_Avoid_: Cash, liquid gold

**Payment mix**:
A **Payment** split across several units: whole T6 sets, **Ecto stacks**, individual Mystic Coins and **Raw gold**. A payment made entirely in Ecto, entirely in Mystic Coins or entirely in raw gold is not a mix.
_Avoid_: Combo, bundle

**Filler**:
The single line of a **Payment mix** whose quantity is worked out instead of entered, covering whatever the other lines leave unpaid. It is **Raw gold** unless another item is chosen. Any difference left by rounding to whole units is waived.
_Avoid_: Remainder, top-up

**Ecto stack**:
250 Globs of Ectoplasm. In a **Payment mix**, Ecto is paid only in whole stacks. When the whole payment is in Ecto, it is paid in individual units.

## Example dialogue

> **Dev:** "Someone wants 2000 Ectos. What do I quote?"
> **Owner:** "The **OTC price**, which is 90% Sell at the **Standard depth** of 2000, times 2000. If gw2pc.com says something different, we're wrong."
