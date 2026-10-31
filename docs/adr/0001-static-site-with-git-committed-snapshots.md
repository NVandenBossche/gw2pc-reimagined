# 0001 — Static site with live browser fetches and git-committed Snapshots

Date: 2026-10-31
Status: Accepted

## Context

The original gw2pc runs Django on AWS Lambda and keeps no history. This rebuild is for one person who wants to open it from several computers and a phone, at no cost and with nothing to operate. It also needs price history so it can show trends, which gw2pc never had.

## Decision

- Host as a static site on **GitHub Pages** from a **public** repository.
- **Live prices** are fetched by the browser straight from the official GW2 API, which allows cross-origin requests. There is no backend.
- **History** comes from a scheduled GitHub Action that writes **Snapshots** as JSON files and commits them to the repository. It runs hourly for the 9 single items, the T5 set, the T6 set and the Gem price, and daily for Tradeable legendaries. Hourly data older than 30 days is reduced to one point per day.
- The pricing core is written in TypeScript and shared by the site and the Action, so a Snapshot is computed exactly like the live number on screen.
- There is no backfill from third-party history such as DataWars2. Trends show "collecting history" until 7 days of data exist.

## Alternatives considered

- **Keep the gw2pc stack (Django + Lambda):** it costs money, needs AWS credentials and operations work, and offers nothing a static site can't do here.
- **A backend with a database** (like `gw2-economy-dagger`): it has to be hosted and kept running, which is too much for about 12 hourly numbers.
- **A private repo:** it needs a paid plan, and the published site would be public anyway. Nothing in the project is secret.
- **Backfilling from DataWars2:** its history is the lowest sell price, not the OTC price at depth. Mixed in, it would quietly break parity with gw2pc.com.

## Consequences

- GitHub's cron is best-effort, so Snapshots can arrive late or occasionally not at all. Charts must tolerate gaps.
- The repository grows with history. Thinning old hourly data to daily keeps the growth small.
- Each scheduled run commits to the default branch, so the git log fills with automated commits.
- No secrets can be used in the browser. Any future feature that needs an API key must keep the key on the viewer's device only.
