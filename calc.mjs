// qazi-car-calc — deal math + scoring. Pure functions, no DOM.
// Runs in Node (tests) and the browser (served at /calc.mjs).
//
// Conventions: money in dollars, rates in percent unless named *Pct-free,
// money factor as the raw decimal (e.g. 0.00225). California rules baked in:
//  - lease: use tax applies to each monthly payment AND to cap-cost reduction
//  - purchase: sales tax on the full negotiated price BEFORE rebates
//  - dealer doc fee is taxable and capped at $85 statewide

export const CONFIG = {
  taxRateDefault: 7.75,        // Irvine / Orange County combined rate
  docFeeCap: 85,               // CA statutory max document processing charge
  acqFeeTypical: 695,
  acqFeeHigh: 1095,            // above this is a marked-up acquisition fee
  govFeeRate: 0.012,           // CA DMV estimate: ~1.2% of price (VLF + reg)
  govFeeBase: 115,
  // Average auto-loan APR by credit tier, Experian-style, mid-2026.
  // Editable in the UI; these are fallbacks, not gospel.
  benchmarks: {
    new:  { superprime: 5.2, prime: 6.6, nearprime: 9.6, subprime: 13.2, deepsub: 15.9 },
    used: { superprime: 6.9, prime: 9.1, nearprime: 14.0, subprime: 18.9, deepsub: 21.6 },
  },
  tierLabels: {
    superprime: 'Super prime (781+)',
    prime: 'Prime (661-780)',
    nearprime: 'Near prime (601-660)',
    subprime: 'Subprime (501-600)',
    deepsub: 'Deep subprime (<501)',
  },
};

// Piecewise-linear interpolation over [x, y] points sorted by x ascending.
// Clamps outside the range.
export function lerpCurve(points, x) {
  if (!isFinite(x)) return 0;
  if (x <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return last[1];
}

export function estimateGovFees(price) {
  if (!(price > 0)) return 0;
  return Math.round(CONFIG.govFeeRate * price + CONFIG.govFeeBase);
}

export function verdictFor(score) {
  if (score >= 85) return { label: 'GREAT DEAL', tone: 'great' };
  if (score >= 70) return { label: 'GOOD DEAL', tone: 'good' };
  if (score >= 55) return { label: 'FAIR DEAL', tone: 'fair' };
  if (score >= 40) return { label: 'BELOW AVERAGE', tone: 'weak' };
  return { label: 'BAD DEAL', tone: 'bad' };
}

// ---------------------------------------------------------------- LEASE ----

// i: { msrp, price, rebates, down, acqFee, docFee, govFees, mf, residualPct,
//      term, taxPct }
export function leaseQuote(i) {
  const taxRate = (i.taxPct || 0) / 100;
  if (!(i.msrp > 0) || !(i.price > 0) || !(i.term > 0) || !(i.residualPct > 0) || !(i.mf >= 0)) {
    return null;
  }
  const grossCap = i.price + (i.acqFee || 0);            // acq fee capitalized
  const capReduction = (i.down || 0) + (i.rebates || 0);
  const adjCap = grossCap - capReduction;
  const residualDollar = i.msrp * (i.residualPct / 100);
  const monthlyDep = (adjCap - residualDollar) / i.term;
  const monthlyRent = (adjCap + residualDollar) * i.mf;
  const basePayment = monthlyDep + monthlyRent;
  const monthlyTax = basePayment * taxRate;
  const payment = basePayment + monthlyTax;
  const capReductionTax = capReduction * taxRate;        // CA taxes cap reduction
  const docWithTax = (i.docFee || 0) * (1 + taxRate);    // CA doc fee is taxable
  const govFees = i.govFees || 0;
  // Cash needed at signing: down + first payment + doc + gov + tax on cap reduction
  const driveOff = (i.down || 0) + payment + docWithTax + govFees + capReductionTax;
  // Everything the lessee pays over the term (rebates are not out of pocket,
  // but the tax charged on them is):
  const totalCost = (i.down || 0) + docWithTax + govFees + capReductionTax + payment * i.term;
  const effectiveMonthly = totalCost / i.term;
  const mfApr = i.mf * 2400;
  const effPct = (effectiveMonthly / i.msrp) * 100;      // the "1% rule" number
  const valueYears = i.msrp / (12 * effectiveMonthly);   // Leasehackr-style score
  const discountPct = ((i.msrp - i.price) / i.msrp) * 100;
  return {
    grossCap, capReduction, adjCap, residualDollar, monthlyDep, monthlyRent,
    basePayment, monthlyTax, payment, capReductionTax, docWithTax, driveOff,
    totalCost, effectiveMonthly, mfApr, effPct, valueYears, discountPct,
  };
}

const LEASE_CURVES = {
  // effective monthly cost as % of MSRP (down payment and fees spread in)
  effPct:   [[0.65, 100], [0.8, 90], [1.0, 70], [1.25, 50], [1.5, 32], [2.0, 10]],
  // dealer discount off MSRP before incentives, %
  discount: [[-2, 5], [0, 25], [1, 35], [3, 55], [5, 70], [7, 85], [10, 100]],
  // money factor expressed as APR (mf * 2400), %
  mfApr:    [[3, 100], [4, 95], [5, 85], [6, 70], [7.5, 50], [9, 30], [11, 10]],
};

export function scoreLease(i) {
  const q = leaseQuote(i);
  if (!q) return null;
  const flags = [];
  const components = [];

  const effScore = lerpCurve(LEASE_CURVES.effPct, q.effPct);
  components.push({
    key: 'eff', label: 'Effective cost vs MSRP', score: effScore, weight: 40,
    detail: q.effPct.toFixed(2) + '% of MSRP per month, all-in (' +
      q.valueYears.toFixed(1) + ' value-years). Under 1% is good, under 0.85% is great.',
  });

  const discScore = lerpCurve(LEASE_CURVES.discount, q.discountPct);
  components.push({
    key: 'discount', label: 'Discount off MSRP', score: discScore, weight: 25,
    detail: q.discountPct.toFixed(1) + '% off sticker before incentives. 5%+ is solid, 10%+ is aggressive.',
  });

  const mfScore = lerpCurve(LEASE_CURVES.mfApr, q.mfApr);
  components.push({
    key: 'mf', label: 'Money factor (rate)', score: mfScore, weight: 20,
    detail: 'MF ' + i.mf.toFixed(5) + ' = ' + q.mfApr.toFixed(2) +
      '% APR equivalent. Dealers can mark this up; ask for the buy rate.',
  });

  let feeScore = 100;
  if ((i.docFee || 0) > CONFIG.docFeeCap) {
    feeScore -= 30;
    flags.push({ level: 'warn', msg: 'Doc fee $' + i.docFee + ' is over the CA legal cap of $' + CONFIG.docFeeCap + '.' });
  }
  if ((i.acqFee || 0) > CONFIG.acqFeeHigh) {
    feeScore -= 25;
    flags.push({ level: 'warn', msg: 'Acquisition fee $' + i.acqFee + ' looks marked up (typical $595-$' + CONFIG.acqFeeHigh + ').' });
  }
  if ((i.govFees || 0) > 0.025 * i.price) {
    feeScore -= 20;
    flags.push({ level: 'warn', msg: 'Government fees over 2.5% of price; check the worksheet for padded charges.' });
  }
  if ((i.down || 0) > 2000) {
    feeScore -= 15;
    flags.push({ level: 'warn', msg: 'Large down payment on a lease: if the car is totaled, that money is gone. Roll it into the payment instead.' });
  }
  if (i.residualPct < 45 || i.residualPct > 70) {
    feeScore -= 10;
    flags.push({ level: 'info', msg: 'Residual ' + i.residualPct + '% is outside the typical 45-70% range; double-check the worksheet.' });
  }
  feeScore = Math.max(0, feeScore);
  components.push({
    key: 'fees', label: 'Fees and structure', score: feeScore, weight: 15,
    detail: 'Doc fee, acquisition fee, government fees, and down-payment risk.',
  });

  // Critical flags cap the score: one of these means it cannot be a good deal.
  let critical = false;
  if (q.mfApr >= 12) {
    critical = true;
    flags.push({ level: 'critical', msg: 'Money factor equals ' + q.mfApr.toFixed(1) + '% APR. That is loan-shark territory for a lease.' });
  }
  if (i.price > i.msrp * 1.03) {
    critical = true;
    flags.push({ level: 'critical', msg: 'Paying more than 3% over MSRP. Walk unless this is a hyper-limited car.' });
  }
  if (q.effPct >= 2) {
    critical = true;
    flags.push({ level: 'critical', msg: 'Effective cost is 2%+ of MSRP per month. This lease is overpriced.' });
  }
  if (q.payment <= 0 || q.adjCap <= q.residualDollar * 0.5) {
    flags.push({ level: 'info', msg: 'Numbers look unusual; double-check inputs.' });
  }

  let score = 0, wsum = 0;
  for (const c of components) { score += c.score * c.weight; wsum += c.weight; }
  score = score / wsum;
  if (critical) score = Math.min(score, 49);
  score = Math.round(score);

  return { score, verdict: verdictFor(score), components, flags, quote: q, critical };
}

// -------------------------------------------------------------- FINANCE ----

// i: { isUsed, msrp (new: sticker; used: fair market value), price, rebates,
//      tradeEquity, down, apr, term, benchmarkApr, docFee, govFees, addons, taxPct }
export function financeQuote(i) {
  const taxRate = (i.taxPct || 0) / 100;
  if (!(i.msrp > 0) || !(i.price > 0) || !(i.term > 0) || !(i.apr >= 0)) return null;
  // CA: tax on the negotiated price (manufacturer rebates do NOT reduce the
  // taxable amount), doc fee taxable, government fees not.
  const salesTax = i.price * taxRate;
  const docWithTax = (i.docFee || 0) * (1 + taxRate);
  const addons = i.addons || 0;
  const amountFinanced = i.price + salesTax + docWithTax + (i.govFees || 0) + addons
    - (i.down || 0) - (i.rebates || 0) - (i.tradeEquity || 0);
  const r = i.apr / 100 / 12;
  const n = i.term;
  let monthly;
  if (amountFinanced <= 0) {
    monthly = 0;
  } else if (r === 0) {
    monthly = amountFinanced / n;
  } else {
    monthly = amountFinanced * r / (1 - Math.pow(1 + r, -n));
  }
  const totalPayments = monthly * n;
  const totalInterest = Math.max(0, totalPayments - Math.max(0, amountFinanced));
  const totalOutOfPocket = (i.down || 0) + totalPayments;
  const ltv = (Math.max(0, amountFinanced) / i.price) * 100;
  const interestBurden = amountFinanced > 0 ? (totalInterest / amountFinanced) * 100 : 0;
  const discountPct = ((i.msrp - i.price) / i.msrp) * 100;
  const aprDelta = i.apr - (i.benchmarkApr || 0);
  return {
    salesTax, docWithTax, amountFinanced, monthly, totalPayments, totalInterest,
    totalOutOfPocket, ltv, interestBurden, discountPct, aprDelta,
  };
}

const FIN_CURVES = {
  aprDelta:    [[-2, 100], [-0.5, 90], [0, 80], [1, 60], [2, 45], [3, 30], [5, 10]],
  discountNew: [[-3, 5], [0, 35], [2, 55], [4, 70], [6, 85], [9, 100]],
  discountUsed:[[-5, 10], [0, 60], [3, 75], [5, 85], [10, 100]],
  term:        [[36, 100], [48, 90], [60, 75], [72, 45], [84, 15]],
  ltv:         [[70, 100], [80, 95], [90, 85], [100, 65], [110, 40], [125, 12]],
  burden:      [[3, 100], [5, 95], [10, 80], [15, 60], [20, 45], [30, 25], [40, 10]],
};

export function scoreFinance(i) {
  const q = financeQuote(i);
  if (!q) return null;
  const flags = [];
  const components = [];

  const aprScore = lerpCurve(FIN_CURVES.aprDelta, q.aprDelta);
  components.push({
    key: 'apr', label: 'APR vs your credit tier', score: aprScore, weight: 30,
    detail: i.apr.toFixed(2) + '% vs ' + (i.benchmarkApr || 0).toFixed(1) +
      '% market average (' + (q.aprDelta >= 0 ? '+' : '') + q.aprDelta.toFixed(2) +
      ' pts). At or below average is where you want to be.',
  });

  const dCurve = i.isUsed ? FIN_CURVES.discountUsed : FIN_CURVES.discountNew;
  const dLabel = i.isUsed ? 'Price vs market value' : 'Discount off MSRP';
  const discScore = lerpCurve(dCurve, q.discountPct);
  components.push({
    key: 'discount', label: dLabel, score: discScore, weight: 25,
    detail: q.discountPct.toFixed(1) + (i.isUsed
      ? '% under market value. At-market is fair; 5%+ under is a win.'
      : '% off sticker before incentives. 4%+ is solid on most new cars in 2026.'),
  });

  const termScore = lerpCurve(FIN_CURVES.term, i.term);
  components.push({
    key: 'term', label: 'Loan term', score: termScore, weight: 15,
    detail: i.term + ' months. 48-60 is healthy; 72+ means more interest and years underwater.',
  });

  const ltvScore = lerpCurve(FIN_CURVES.ltv, q.ltv);
  components.push({
    key: 'ltv', label: 'Loan-to-value', score: ltvScore, weight: 15,
    detail: 'Financing ' + q.ltv.toFixed(0) + '% of the car’s price. Under 90% (10%+ down) protects you from being underwater.',
  });

  const burdenScore = lerpCurve(FIN_CURVES.burden, q.interestBurden);
  components.push({
    key: 'burden', label: 'Total interest burden', score: burdenScore, weight: 10,
    detail: '$' + Math.round(q.totalInterest).toLocaleString('en-US') + ' interest = ' +
      q.interestBurden.toFixed(1) + '% of the amount financed over the life of the loan.',
  });

  let feeScore = 100;
  if ((i.docFee || 0) > CONFIG.docFeeCap) {
    feeScore -= 40;
    flags.push({ level: 'warn', msg: 'Doc fee $' + i.docFee + ' is over the CA legal cap of $' + CONFIG.docFeeCap + '.' });
  }
  if ((i.govFees || 0) > 0.025 * i.price) {
    feeScore -= 20;
    flags.push({ level: 'warn', msg: 'Government fees over 2.5% of price; check for padded charges.' });
  }
  if ((i.addons || 0) > 500) {
    feeScore -= 30;
    flags.push({ level: 'warn', msg: '$' + i.addons + ' in dealer add-ons. Nitrogen, etch, protection packages: decline them.' });
  }
  feeScore = Math.max(0, feeScore);
  components.push({
    key: 'fees', label: 'Fees and add-ons', score: feeScore, weight: 5,
    detail: 'Doc fee, government fees, dealer add-ons.',
  });

  let critical = false;
  if (q.aprDelta >= 4) {
    critical = true;
    flags.push({ level: 'critical', msg: 'APR is 4+ points above the average for your credit tier. Get outside financing (credit union) before signing.' });
  }
  if (q.ltv >= 120) {
    critical = true;
    flags.push({ level: 'critical', msg: 'Financing 120%+ of the car’s value (negative equity rolled in). This loan starts deep underwater.' });
  }
  if (i.term >= 84 && q.aprDelta >= 2) {
    critical = true;
    flags.push({ level: 'critical', msg: '84-month loan at an above-market rate. Maximum interest, maximum underwater time.' });
  }
  if (!i.isUsed && i.price >= i.msrp * 1.05) {
    critical = true;
    flags.push({ level: 'critical', msg: 'Paying 5%+ over MSRP on a new car. Walk unless this is a hyper-limited model.' });
  }
  if (i.term >= 72 && !critical) {
    flags.push({ level: 'warn', msg: i.term + '-month term: you will likely owe more than the car is worth for years. Consider 60 or less.' });
  }
  if ((i.tradeEquity || 0) < 0) {
    flags.push({ level: 'warn', msg: 'Negative trade equity is being rolled into this loan.' });
  }
  if ((i.rebates || 0) > 0) {
    flags.push({ level: 'info', msg: 'CA taxes the price before rebates, so the rebate does not reduce your sales tax.' });
  }

  let score = 0, wsum = 0;
  for (const c of components) { score += c.score * c.weight; wsum += c.weight; }
  score = score / wsum;
  if (critical) score = Math.min(score, 49);
  score = Math.round(score);

  return { score, verdict: verdictFor(score), components, flags, quote: q, critical };
}
