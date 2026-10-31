# GW2PC Reimagined

A personal Guild Wars 2 price sheet for OTC trading. It reproduces the numbers on [gw2pc.com](https://gw2pc.com) and adds a payment calculator, flip ROI, every tradeable legendary, and price trends.

- **OTC prices match gw2pc.com.** Same depth walk, same ratios, same legendary depth rule. A weekly check compares the highlighted values and opens an issue if any differ by more than 1%.
- **Payment calculator.** Turn a gold amount into Ecto, Mystic Coins, T6 sets or raw gold (or a mix with a filler), and value what you receive.
- **Trends.** An hourly GitHub Action records Snapshots of each item's OTC price into `data/`; the site reads them. History needs about a week before trends show.
- **No backend, no API keys.** A static site; prices come live from the official GW2 API in your browser.

The vocabulary (OTC price, Standard depth, Payment mix, Snapshot…) is in [GLOSSARY.md](GLOSSARY.md). The architecture decision is in [docs/adr/](docs/adr/).

## Develop

```
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # core unit tests
pnpm build        # static site in dist/
pnpm snapshot     # record hourly Snapshots into data/
pnpm discover     # refresh data/legendaries.json from the API
pnpm parity       # compare with gw2pc.com
```

`src/core` is plain TypeScript with no DOM; the site and the scripts share it, so a Snapshot is computed exactly like the live number on screen.

## Credit and licence

Created from the rules of [gw2pc.com](https://gw2pc.com) by **Cirdan** ([otc-cirdan/gw2pc](https://github.com/otc-cirdan/gw2pc)), made for the Overflow Discord. This project is a derivative work and is released under the **GNU GPL v3** like the original. See [LICENSE](LICENSE).
