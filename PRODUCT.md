# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Vite + React + TypeScript, static build deployed to GitHub Pages (public repo `gw2pc-reimagined`). Chosen with the user in the design session; see `docs/adr/0001-static-site-with-git-committed-snapshots.md`.

## Users
One Guild Wars 2 player (the owner) who trades on the Overflow Discord (OTC trades) and checks prices often, on several computers and on a phone. Trade partners may open shared links but are not a designed-for audience in v1.

## Product Purpose
Reproduce gw2pc.com's OTC prices exactly, so the numbers quoted in Discord match, and add what gw2pc lacks: a Payment calculator (gold to materials and back), Flip ROI, all tradeable legendaries, and price trends. Success: the owner can see what things cost, what they trade for OTC, and where the economy is heading, in a few seconds.

## Positioning
A single-purpose, gw2pc-compatible price sheet with trends and a payment calculator. Every number is traceable to the same depth-and-ratio rules gw2pc uses; the vocabulary is in `GLOSSARY.md`.

## Operating Context
Used mid-trade, often on a phone, often while chatting in Discord. Prices come live from the official GW2 API in the browser; history comes from hourly and daily Snapshots committed by a GitHub Action. Page data refreshes every 5 minutes.

## Capabilities and Constraints
- OTC price = Depth price at an item's Standard depth × Standard ratio (90% Sell; legendaries 85% Sell with a dynamic depth rule). Must match gw2pc.com within 1%.
- Pages: home (key cards MC / Ecto / T6 set / Gem price, Payment calculator, Economy index), `/pay`, nine single-item pages, T5 and T6 set pages, `/leg`.
- Item tables: Depth rows; columns 100% Buy, 85% Sell, 90% Sell, 100% Sell, Flip ROI. No 90% column on `/leg`.
- Money is integer copper; display as `12g 05s 03c` (silver-rounded `12g 05s` on `/leg`).
- No API keys, accounts or backend in v1. No data from third-party price sites.
- Open: none for v1.

## Brand Commitments
Name: GW2PC Reimagined. Credit Cirdan / otc-cirdan (original gw2pc, GPLv3) in README and footer.
