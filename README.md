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

## Local rules baked in (Irvine / Orange County, CA)

- Sales tax default **7.75%** (editable per calculation).
- **CA lease taxation**: use tax is charged on each monthly payment AND on
  cap-cost reduction (down payment + rebates). Both are modeled.
- **CA purchase taxation**: sales tax applies to the negotiated price
  **before** manufacturer rebates. The rebate reduces what you finance, not
  what you're taxed on.
- **Doc fee**: taxable, legal cap **$85** statewide. Anything above gets
  flagged.
- **DMV/government fees**: auto-estimated at ~1.2% of price + $115
  (VLF + registration). Editable; padded fees above 2.5% of price get flagged.

## Lease scoring (0-100)

| Component | Weight | Rule |
|---|---|---|
| Effective cost vs MSRP | 40% | Total of ALL money out (payments, down, fees, taxes on everything) divided by term, as % of MSRP. 0.65% → 100, 0.8% → 90, 1.0% → 70, 1.25% → 50, 1.5% → 32, 2.0% → 10. This is the 1% rule plus the Leasehackr "value years" idea (MSRP / 12×effective payment) in one number — it can't be gamed by moving money into the down payment. |
| Discount off MSRP | 25% | Negotiated price vs sticker, before incentives. 10% off → 100, 7% → 85, 5% → 70, 3% → 55, 0% → 25, over sticker → 5-10. |
| Money factor | 20% | MF × 2400 = APR equivalent. ≤3% → 100, 5% → 85, 6% → 70, 7.5% → 50, 9% → 30, 11%+ → 10. Dealers mark MF up over the captive buy rate; always ask. |
| Fees & structure | 15% | Starts at 100. Doc fee over $85 −30. Acquisition fee over $1,095 −25. Gov fees over 2.5% of price −20. Down payment over $2,000 −15 (lease down payments evaporate if the car is totaled). Residual outside 45-70% −10 (sanity check). |

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
| Fees & add-ons | 5% | Doc over $85 −40, gov fees over 2.5% −20, dealer add-ons over $500 −30. |

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
