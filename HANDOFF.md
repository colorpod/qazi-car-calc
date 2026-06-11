# qazi-car-calc — Handoff

Canonical onboarding doc for any agent (Codex, Claude, Lucius) picking this up.
Read this first, then `README.md` for the scoring-rule tables. Everything here is
current as of 2026-06-11.

---

## 1. What it is

**Car Deal Gauge** — a lease + finance car-deal checker that scores a deal
0-100 with a gauge and tells you, line by line, whether it's good. Built for
Qazi (Irvine, CA), mobile-first, US-wide. One Cloudflare Worker, no framework,
no runtime dependencies.

- **Live:** https://qazi-car-calc.waqasqazi.workers.dev
- **Repo:** https://github.com/colorpod/qazi-car-calc (public)
- **Local:** `~/Projects/qazi-car-calc`
- **Operator:** Lucius (Qazi Agent OS). Coding agents are workers; Lucius is the
  control plane and is kept in the loop on changes.

## 2. Run / test / deploy

```bash
npm test                 # node --test tests/calc.test.mjs  (26 tests, the safety net)
npx wrangler dev --local # local preview on :8787 (compat date is pinned, see gotchas)
```

**Deploying is NOT `wrangler deploy` from this machine** — the Mac's wrangler
OAuth token is dead (expired 2026-05-21, refresh fails 400). Deploy through
GitHub Actions in a sibling repo that still has working Cloudflare secrets:

```bash
git push                                              # push to main first
gh workflow run deploy-car-calc.yml -R colorpod/link  # cross-repo deploy
gh run watch <id> -R colorpod/link --exit-status      # tests + deploy + live-verify
```

`colorpod/link` holds `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` and runs
`tests → deploy → curl-verify`. This repo's own `.github/workflows/deploy.yml`
auto-deploys on push but **skips gracefully** until those two secrets are added
here. To make this repo self-deploying, copy those secrets from `colorpod/link`.
Permanent fix: run `wrangler login` once on the Mac, then update this doc.

## 3. Architecture / file map

| File | Role |
|---|---|
| `worker.js` (~1000 lines) | The whole thing. Worker `fetch` + the entire SPA as one HTML template literal (CSS + inline `<script type="module">`). Serves `/`, `/calc.mjs`, `/icon.png` (+favicon aliases), `/health`. |
| `calc.mjs` (~700 lines) | **All math, scoring, and data. The source of truth.** Pure functions, no DOM. The browser imports it at `/calc.mjs`; Node imports the same file in tests. Never fork the math into the HTML. |
| `tests/calc.test.mjs` | `node --test` suite over calc.mjs. Hand-computed CA examples + every rule/edge. Keep it green. |
| `scripts/gen-logo.mjs` | Generates the repo logo PNG set from an SVG (needs the `sharp` devDependency). |
| `assets/brand/qazi-repo-logo*` | Suite-style icon, 8 PNG sizes + base + SVG source. |
| `wrangler.toml` | `name=qazi-car-calc`, serves `**/*.mjs` as Text (so calc.mjs loads as a string), `compatibility_date = 2026-04-01`. |

**Key trick:** `worker.js` imports `calc.mjs` as raw text (via the wrangler
`[[rules]]` Text glob) and serves it at `/calc.mjs`; the page does
`import { ... } from '/calc.mjs'`. So one file is both the tested Node module and
the browser module — they can never drift.

## 4. calc.mjs API (what to call, not how it's implemented)

- `CONFIG` — tax default, doc cap, acquisition-fee thresholds, `benchmarks`
  (mainstream-bank APR avg by tier, new/used), `benchmarksBest` (top-bank
  barometer), `benchmarkTermAdj`, tier labels.
- `verdictFor(score)` → `{label, tone}` (great/good/fair/weak/bad bands).
- `lerpCurve(points, x)` — piecewise-linear interpolation; all scoring curves use it.
- **Lease:** `leaseQuote(i)` → numbers; `scoreLease(i)` → `{score, verdict,
  components[], flags[], quote, critical}`. Inverses: `solveLeasePrice(i, pay)`,
  `solveLeaseDown(i, pay)`.
- **Finance:** `financeQuote(i)`, `scoreFinance(i)` (same shape). Inverses:
  `solveFinancePrice(i, pay)`, `solveFinanceDown(i, pay)`.
- **Amortization / early exit:** `amortizeThrough(af, apr, term, k)`,
  `financeEarlyExit(i, exitMonth)` → interest-paid-by-then vs lifetime, payoff balance.
- **Market APR:** `marketApr(isUsed, tier, term)` (avg, drives score),
  `bestBankApr(isUsed, tier, term)` (barometer shown to aim for).
- **Location:** `resolveZip(zip)` → `{state, name, region, taxRate, docCap,
  tradeCredit, taxCap, note}` or null; `docFeeCapForState(state)`;
  `estimateRegistration(price, state)`.
- **Affordability:** `AFFORDABILITY` (conservative 8% / comfortable 12% /
  aggressive 18% of gross monthly income), `affordabilityPayment(income, level,
  existingMonthly)`.
- **Inventory:** `VEHICLES` — array of `{mk, md, msrp, mf, res}`, sorted by make.

All score functions: weighted components, **critical flags cap the score at
49**, verdict from `verdictFor`. Full weight/curve tables are in `README.md`.

## 5. Feature → where the logic lives

| Feature | calc.mjs | worker.js |
|---|---|---|
| Deal score + gauge | `scoreLease`/`scoreFinance` | `gaugeSvg` (no needle — glowing dial, score punched in center), `renderResult` |
| ZIP → tax/DMV/doc-cap/trade-credit | `resolveZip`, `estimateRegistration`, `docFeeCapForState` | `resolveAndLabel`, fee toggles |
| Market APR + top-bank barometer | `marketApr`, `bestBankApr` | benchmark hint + "Top-bank rate" chip |
| Affordability picker (income → payment) | `affordabilityPayment`, `AFFORDABILITY` | `applyAffordability`, the `.afford` hero, level buttons |
| Existing car costs reduce the tier | `affordabilityPayment(…, existing)` | `f_existing` field, over-budget hint |
| Target-payment solve (down / max price) | `solve{Lease,Finance}{Price,Down}` | `applySolveFields`, `f_solvefor`/`l_solvefor` (default **down**) |
| Sell/pay-off-early analysis | `amortizeThrough`, `financeEarlyExit` | `.exitbox`, `f_exit` |
| **APR required** (no fake 0% deal) | — | gate in `recalcFinance` (blank `f_apr` → red + block) |
| Vehicle picker | `VEHICLES` | `populateVehicles`, `l_vehicle`/`f_vehicle` change handlers |
| Download offer image | — | `shareRows`/`buildShareSvg`/`downloadShare`, `setShare`, `#share_btn` |

## 6. Gotchas (these will bite you)

1. **`worker.js` HTML is one big backtick template literal.** Inside the inline
   `<script>` you **cannot** use backticks or `${...}` — use string concatenation.
2. **calc.mjs colors/CSS:** the share card SVG (`buildShareSvg`) must use explicit
   hex, because CSS `var(--…)` does not resolve in a standalone rasterized SVG.
   The logo is embedded in the card via `/icon.png` fetched to a data URL
   (`ensureIcon`) to avoid canvas tainting on `toBlob`.
3. **`compatibility_date = 2026-04-01`** — the bundled local workerd rejects
   newer dates. Don't bump it without checking `wrangler dev` still starts.
4. **iOS zoom:** form inputs are `font-size:16px` on purpose (smaller zooms on
   focus). `<select>` can be smaller (no zoom).
5. **`ICON_B64`** const in `worker.js` is the favicon/header/share logo (128px
   base64). If you regenerate the logo, re-inject it (a one-line Node `replace`).
6. **`localStorage` key is `qcc_v2`.** Bump it if the field set changes incompatibly.
7. **Single source of truth:** add scoring/data to `calc.mjs` + a test, never to
   the HTML. Mobile-first single column (~460px) on all screens.
8. **Numbers are representative, not live:** money factors, residuals, APR
   benchmarks, DMV estimates are current-ballpark and editable, labeled "confirm
   with the dealer." There is no live Edmunds/captive feed wired in.

## 7. Suite context (for Lucius)

Part of Qazi Agent OS. Per-repo logo convention is `assets/brand/qazi-repo-logo*`
(cream icon on the suite's vibrant orange squircle — this one is a speedometer).
Deploy + Cloudflare auth notes are in §2. The richer point-in-time notes live in
Claude's memory (`project_qazi-car-calc.md`, `wrangler-oauth-dead-actions-deploy.md`)
but **this file is the repo-committed canonical handoff** — prefer it.

## 8. Backlog / ideas

- Wire a live data source for money factors/residuals/APR (paid feed) to make the
  vehicle picker truly real-time.
- Expand `VEHICLES` (more trims/years) — keep sorted by make, add a test row.
- Optional self-deploy: add `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
  secrets to this repo so push-to-main deploys without the link-repo hop.
- Affordability could factor insurance/maintenance on the new car, not just payment.
