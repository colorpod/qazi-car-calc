# qazi-car-calc — Car Deal Gauge

Lease + finance deal checker with a 0-100 quality gauge. One page, two tabs.
Plug in the numbers from a dealer worksheet and it tells you if the deal is
great, good, fair, below average, or bad, and exactly why.

- **Live:** https://qazi-car-calc.waqasqazi.workers.dev
- **Stack:** single Cloudflare Worker (`worker.js`) serving an inline SPA.
  All deal math lives in `calc.mjs` (pure functions, no DOM), served to the
  browser at `/calc.mjs` and unit-tested in Node.

## Files

| File | What |
|---|---|
| `worker.js` | Worker + the whole UI (HTML/CSS/JS template literal) |
| `calc.mjs` | Deal math + scoring. The only place rules live |
| `tests/calc.test.mjs` | `node --test` suite over the math |
| `.github/workflows/deploy.yml` | Deploy on push to main (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` repo secrets) |

## Location-aware (ZIP → tax + fees)

Enter a ZIP and the calculator resolves your state and pulls:

- **Sales tax** for that state. California is resolved at metro level (Orange
  County 7.75%, LA 9.5%, SF 8.625%, Oakland 10.25%, etc.); other states use a
  representative statewide combined vehicle-tax rate. The detected location +
  rate is shown, and every value is editable, so nothing is hidden.
- **Registration & DMV fees** — a single estimated bundle (registration, title,
  plates, and any value-based fee like CA's VLF). Most states are a flat
  estimate; CA/CO/MN/NE are value-based.
- **Doc-fee cap** — flagged against that state's legal cap (CA $85, TX $225, NY
  $175, etc.). States with no cap (FL, many others) flag only egregious fees.
- **Trade-in tax credit** — most states deduct your trade-in from the taxable
  price (modeled, with the tax saved shown); **California does not**, which is
  why it matters the moment you shop out of state.

Defaults to Irvine (92618). Tax math: leases are taxed on each payment AND on
cap-cost reduction; purchase tax applies to the price **before** rebates.

### One government bill, not three

When you buy a car the government charges **sales tax** and the **registration/
DMV bundle** (title + plates + VLF are all part of that one bill, not separate
line items). The dealer **doc fee** is separate but it is a dealer charge.

### Excluding tax and fees

Sales tax and the registration/DMV bundle each have a checkbox. Uncheck either
to drop it from the calculation (the typed value is kept, so re-checking
restores it). Useful for out-of-state buys, comparing the vehicle-plus-financing
cost in isolation, or when you've handled a fee elsewhere. With tax unchecked
the lease payment is labeled "(no tax)".

## Market APR (auto-filled)

The benchmark is what you could realistically get from a **mainstream bank**
(Ally, Wells Fargo, Chase, Bank of America, Capital One) — not a blended
industry average that includes captive lenders, buy-here-pay-here, or credit
unions. It auto-sets for your **credit tier**, **new vs used**, AND **loan term**
(72 months prices higher than 36). Loan *amount* ($20k vs $100k) barely moves
APR at the same tier, so it is not a dimension.

- **Benchmark = the average across those banks** — drives the score (at the
  average you are "at market"; below is better).
- **Top-bank target = the best rate the top-tier banks (Chase/BofA tier) offer**
  for your credit — the barometer to aim for and negotiate toward. Shown in the
  benchmark hint and as a results chip.

Override the benchmark with a real quote any time.

## Logo

`assets/brand/qazi-repo-logo*` — a cream speedometer gauge on the suite's orange
squircle, matching the Qazi Agent OS house style (run `node scripts/gen-logo.mjs`
to regenerate from `qazi-repo-logo.svg`; needs the `sharp` devDependency). The
worker serves it at `/icon.png` (favicon + apple-touch-icon + header mark).

## Affordability picker (finance)

The finance tab leads with an affordability hero: enter your **gross monthly
income**, pick an appetite — **Conservative** (8% of income), **Comfortable**
(12%), or **Aggressive / car-guy** (18%) — and it fills your target monthly
payment, then solves the car price you can afford (or the down payment). The
percentages live in `AFFORDABILITY` / `affordabilityPayment` in calc.mjs.

## APR is required

The finance tab will not show a score until you enter the APR — an empty APR
field turns red and the result area says so. Without it the math would assume
0% and flash a fake "great deal"; a real 0% promo still works if you type `0`.

## Mobile-first

Single centered app column (~460px) on every screen, 16px inputs (no iOS
zoom), big tap targets, and a terse score breakdown (label + score + bar).
Defaults to Finance + Used car on first load.

## Solve for a target payment

Flip on **"Solve for a target monthly payment"**, type your max $/mo, and pick
what to solve for:

- **Find down payment** (default) — you enter the car price; it solves the cash
  you need to put down to hit that payment. "I want *this* car at $500/mo — how
  much down?" If even $0 down already lands under your target, it says so.
- **Find max price** — you enter your down; it solves the highest car price that
  hits the payment. "I don't want to go past $600/mo — what's the most I can pay?"

The deal math is linear in both price and down payment, so each inverse is exact
(the resulting monthly lands on your target to the dollar). Works on both tabs.

## Sell / pay off early (finance)

Enter a month in **"Sell / pay off after (months)"** and the finance results show
what happens if you don't go the distance:

- **Interest paid by then** and its **share of the loan's lifetime interest** vs
  the share of the *term* elapsed. On a 72-month loan, selling at month 24 can
  mean you've already paid ~54% of the total interest in just 33% of the term.
- **Payoff balance** — what you'd still owe to clear the loan and sell the car.

This exposes amortization front-loading: early payments are mostly interest, so
selling early means you barely dented the principal. Uses a standard
amortization schedule (`amortizeThrough` / `financeEarlyExit` in calc.mjs).

## Lease scoring (0-100)

| Component | Weight | Rule |
|---|---|---|
| Effective cost vs MSRP | 40% | Total of ALL money out (payments, down, fees, taxes on everything) divided by term, as % of MSRP. 0.65% → 100, 0.8% → 90, 1.0% → 70, 1.25% → 50, 1.5% → 32, 2.0% → 10. This is the 1% rule plus the Leasehackr "value years" idea (MSRP / 12×effective payment) in one number — it can't be gamed by moving money into the down payment. |
| Discount off MSRP | 25% | Negotiated price vs sticker, before incentives. 10% off → 100, 7% → 85, 5% → 70, 3% → 55, 0% → 25, over sticker → 5-10. |
| Money factor | 20% | MF × 2400 = APR equivalent. ≤3% → 100, 5% → 85, 6% → 70, 7.5% → 50, 9% → 30, 11%+ → 10. Dealers mark MF up over the captive buy rate; always ask. |
| Fees & structure | 15% | Starts at 100. Doc fee over the state cap −30. Acquisition fee over $1,095 −25. Gov fees over 2.5% of price −20. Down payment over $2,000 −15 (lease down payments evaporate if the car is totaled). Residual outside 45-70% −10 (sanity check). |

**Critical flags cap the score at 49** (one of these means it cannot be a
good deal): MF ≥ 12% APR equivalent · paying > 3% over MSRP · effective cost
≥ 2% of MSRP per month.

## Finance scoring (0-100)

| Component | Weight | Rule |
|---|---|---|
| APR vs credit tier | 30% | Compared to current US averages by tier (Experian-style, mid-2026: new car super prime 5.2%, prime 6.6%, near prime 9.6%, subprime 13.2%, deep subprime 15.9%; used car higher). Auto-filled, editable. At benchmark → 80, 1pt below → 90+, 2pts above → 45, 5pts above → 10. |
| Discount | 25% | New: vs MSRP before incentives (4% off → 70, 9%+ → 100, over sticker → ≤35). Used: vs fair market value from KBB/Edmunds (at market → 60, 5% under → 85, 10% under → 100). |
| Loan term | 15% | 36mo → 100, 48 → 90, 60 → 75, 72 → 45, 84 → 15. Long terms = more interest + years underwater. |
| Loan-to-value | 15% | Amount financed ÷ price. ≤80% → 95+, 90% → 85, 100% → 65, 110% → 40, 125% → 12. |
| Total interest burden | 10% | Lifetime interest ÷ amount financed. 5% → 95, 10% → 80, 20% → 45, 40% → 10. |
| Fees & add-ons | 5% | Doc over the state cap −40, gov fees over 2.5% −20, dealer add-ons over $500 −30. |

**Critical flags cap the score at 49**: APR 4+ points above tier average ·
LTV ≥ 120% (negative equity rolled in) · 84-month term at 2+ points above
market · paying 5%+ over MSRP on a new car.

## Verdict bands

85-100 **GREAT DEAL** · 70-84 **GOOD DEAL** · 55-69 **FAIR DEAL** ·
40-54 **BELOW AVERAGE** · 0-39 **BAD DEAL**

## Why you can trust the number

- Every formula is in `calc.mjs` with unit tests (`npm test`), including a
  hand-computed CA lease worksheet and CA rebate-tax behavior.
- The gauge can't be fooled by payment games: lease quality keys off the
  *effective* monthly (down payment and fees spread across the term), and
  finance quality penalizes term-stretching and negative-equity roll-ins.
- Anything that should kill a deal (marked-up money factor, 120% LTV,
  over-sticker pricing) caps the score below "good" no matter how pretty the
  monthly payment looks.

## Develop / deploy

```bash
npm test                 # node --test tests/
npx wrangler dev         # local preview
npx wrangler deploy      # needs wrangler OAuth or CLOUDFLARE_API_TOKEN
```

Pushes to `main` auto-deploy via GitHub Actions once the repo secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set (same values as
the `colorpod/link` repo). Until then, deploys can be dispatched from the
`deploy-car-calc.yml` workflow in `colorpod/link`.
