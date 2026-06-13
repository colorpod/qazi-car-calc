import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONFIG, lerpCurve, estimateRegistration, verdictFor,
  leaseQuote, scoreLease, financeQuote, scoreFinance,
  marketApr, bestBankApr, resolveZip, docFeeCapForState,
  solveLeasePrice, solveFinancePrice, solveLeaseDown, solveFinanceDown,
  amortizeThrough, financeEarlyExit, affordabilityPayment, AFFORDABILITY, VEHICLES,
} from '../calc.mjs';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || '') + ' got ' + a + ' want ' + b + ' ±' + tol);

test('lerpCurve interpolates and clamps', () => {
  const c = [[0, 0], [10, 100]];
  assert.equal(lerpCurve(c, 5), 50);
  assert.equal(lerpCurve(c, -5), 0);
  assert.equal(lerpCurve(c, 50), 100);
  const c2 = [[1, 100], [2, 50], [4, 0]];
  assert.equal(lerpCurve(c2, 3), 25);
});

test('verdict bands', () => {
  assert.equal(verdictFor(92).label, 'GREAT DEAL');
  assert.equal(verdictFor(85).label, 'GREAT DEAL');
  assert.equal(verdictFor(84).label, 'GOOD DEAL');
  assert.equal(verdictFor(70).label, 'GOOD DEAL');
  assert.equal(verdictFor(60).label, 'FAIR DEAL');
  assert.equal(verdictFor(45).label, 'BELOW AVERAGE');
  assert.equal(verdictFor(20).label, 'BAD DEAL');
});

test('registration estimate is state-aware', () => {
  assert.equal(estimateRegistration(40000, 'CA'), Math.round(190 + 0.0065 * 40000));
  assert.equal(estimateRegistration(40000, 'TX'), 150); // generic flat
  assert.equal(estimateRegistration(40000, 'CO'), Math.round(120 + 0.021 * 40000));
  assert.equal(estimateRegistration(0, 'CA'), 0);
});

test('market APR is term-aware and new/used aware', () => {
  // Same tier: used > new, longer term > shorter.
  assert.ok(marketApr(true, 'prime', 60) > marketApr(false, 'prime', 60));
  assert.ok(marketApr(false, 'prime', 84) > marketApr(false, 'prime', 36));
  assert.equal(marketApr(false, 'prime', 60), CONFIG.benchmarks.new.prime);
  assert.equal(marketApr(false, 'bogus', 60), null);
  // Price does NOT enter the model — same call, same result.
  assert.equal(marketApr(false, 'superprime', 72), marketApr(false, 'superprime', 72));
});

test('best-bank barometer is below the mainstream-bank average', () => {
  for (const used of [false, true]) {
    for (const tier of ['superprime', 'prime', 'nearprime', 'subprime', 'deepsub']) {
      assert.ok(bestBankApr(used, tier, 60) < marketApr(used, tier, 60),
        'top-bank should beat the average for ' + tier + (used ? ' used' : ' new'));
    }
  }
  assert.equal(bestBankApr(false, 'prime', 60), CONFIG.benchmarksBest.new.prime);
  assert.ok(bestBankApr(false, 'prime', 84) > bestBankApr(false, 'prime', 36)); // term-aware
  assert.equal(bestBankApr(false, 'bogus', 60), null);
});

test('ZIP resolves to state, tax, doc cap, trade-credit', () => {
  const irvine = resolveZip('92618');
  assert.equal(irvine.state, 'CA');
  assert.equal(irvine.taxRate, 7.75);
  assert.equal(irvine.docCap, 85);
  assert.equal(irvine.tradeCredit, false); // CA does not credit trade-ins
  const longBeach = resolveZip('90802');
  assert.equal(longBeach.state, 'CA');
  assert.ok(longBeach.taxRate > 7.75, 'LA metro higher than OC');
  const austin = resolveZip('78701');
  assert.equal(austin.state, 'TX');
  assert.equal(austin.tradeCredit, true);
  assert.equal(austin.docCap, 225);
  assert.equal(resolveZip('abcde'), null);
  assert.equal(resolveZip('1234'), null);
  assert.equal(docFeeCapForState('CA'), 85);
  assert.equal(docFeeCapForState('FL'), null);
});

test('state doc-fee cap drives the flag', () => {
  const ca = scoreFinance({
    isUsed: false, msrp: 40000, price: 40000, down: 0, apr: 6, term: 60,
    benchmarkApr: 6.6, docFee: 300, govFees: 0, taxPct: 7.75, docFeeCap: 85, stateLabel: 'California',
  });
  assert.ok(ca.flags.some(f => f.msg.includes('legal cap of $85')));
  // No-cap state: $300 doc fee is legal, so no over-cap flag.
  const fl = scoreFinance({
    isUsed: false, msrp: 40000, price: 40000, down: 0, apr: 6, term: 60,
    benchmarkApr: 6.6, docFee: 300, govFees: 0, taxPct: 7.0, docFeeCap: null, stateLabel: 'Florida',
  });
  assert.equal(fl.flags.some(f => f.msg.includes('legal cap')), false);
});

test('trade-in tax credit lowers tax outside CA', () => {
  const base = {
    isUsed: false, msrp: 40000, price: 40000, tradeEquity: 10000, down: 0,
    apr: 6, term: 60, benchmarkApr: 6.6, docFee: 0, govFees: 0, taxPct: 7.0,
  };
  const noCredit = financeQuote({ ...base, taxTradeCredit: false });
  const credit = financeQuote({ ...base, taxTradeCredit: true });
  close(noCredit.salesTax - credit.salesTax, 10000 * 0.07, 0.01, 'trade credit saves tax');
  assert.equal(credit.tradeTaxSaved > 0, true);
  const scored = scoreFinance({ ...base, taxTradeCredit: true });
  assert.ok(scored.flags.some(f => f.msg.includes('credits the trade-in')));
});

test('toggling tax and fees off lowers cost', () => {
  const base = {
    msrp: 50000, price: 46000, rebates: 0, down: 0, acqFee: 695,
    docFee: 85, govFees: 600, mf: 0.00225, residualPct: 58, term: 36, taxPct: 7.75,
  };
  const withTax = leaseQuote(base);
  const noTax = leaseQuote({ ...base, taxPct: 0 });
  assert.ok(noTax.totalCost < withTax.totalCost, 'no-tax lease should cost less');
  const noFees = leaseQuote({ ...base, govFees: 0 });
  assert.ok(noFees.driveOff < withTax.driveOff, 'dropping gov fees lowers drive-off');
});

test('solve for target monthly payment (lease + finance)', () => {
  const leaseIn = {
    msrp: 50000, rebates: 0, down: 0, acqFee: 695, docFee: 85, govFees: 600,
    mf: 0.00200, residualPct: 58, term: 36, taxPct: 7.75,
  };
  const lp = solveLeasePrice(leaseIn, 600);
  const lq = leaseQuote({ ...leaseIn, price: lp });
  close(lq.payment, 600, 1.0, 'solved lease price hits target payment');

  const finIn = {
    isUsed: false, msrp: 45000, rebates: 0, tradeEquity: 0, down: 4000, apr: 6.0,
    term: 60, docFee: 85, govFees: 595, addons: 0, taxPct: 7.75,
  };
  const fp = solveFinancePrice(finIn, 550);
  const fq = financeQuote({ ...finIn, price: fp });
  close(fq.monthly, 550, 1.0, 'solved finance price hits target payment');
  assert.equal(solveFinancePrice(finIn, 0), null);

  // With a trade-in in a trade-credit state, the solve must still hit target.
  const tradeIn = { ...finIn, tradeEquity: 10000, taxTradeCredit: true };
  const tp = solveFinancePrice(tradeIn, 550);
  const tq = financeQuote({ ...tradeIn, price: tp });
  close(tq.monthly, 550, 1.0, 'trade-credit solve still hits target');
});

test('solve for down payment hits target on a known car (lease + finance)', () => {
  const leaseIn = {
    msrp: 55000, price: 51000, rebates: 0, acqFee: 695, docFee: 85, govFees: 600,
    mf: 0.00220, residualPct: 58, term: 36, taxPct: 7.75,
  };
  const ld = solveLeaseDown(leaseIn, 600);
  const lq = leaseQuote({ ...leaseIn, down: ld });
  close(lq.payment, 600, 1.0, 'solved lease down hits target payment');

  const finIn = {
    isUsed: false, msrp: 50000, price: 48000, rebates: 0, tradeEquity: 0, apr: 6.0,
    term: 60, docFee: 85, govFees: 595, addons: 0, taxPct: 7.75,
  };
  const fd = solveFinanceDown(finIn, 600);
  const fq = financeQuote({ ...finIn, down: fd });
  close(fq.monthly, 600, 1.0, 'solved finance down hits target payment');

  // Trade-credit state: down solve still exact.
  const fd2 = solveFinanceDown({ ...finIn, tradeEquity: 8000, taxTradeCredit: true }, 600);
  const fq2 = financeQuote({ ...finIn, tradeEquity: 8000, taxTradeCredit: true, down: fd2 });
  close(fq2.monthly, 600, 1.0, 'down solve exact with trade credit');

  // A generous target on a cheap car => negative down (no money needed).
  const cheap = solveFinanceDown({ ...finIn, price: 12000 }, 600);
  assert.ok(cheap < 0, 'cheap car under target needs no down, got ' + cheap);
  assert.equal(solveFinanceDown(finIn, 0), null);
  assert.equal(solveLeaseDown({ ...leaseIn, price: 0 }, 600), null);
});

test('lease math: standard CA example', () => {
  const q = leaseQuote({
    msrp: 50000, price: 46000, rebates: 1000, down: 1000, acqFee: 695,
    docFee: 85, govFees: 600, mf: 0.00225, residualPct: 58, term: 36, taxPct: 7.75,
  });
  close(q.adjCap, 44695, 0.01, 'adjCap');
  close(q.residualDollar, 29000, 0.01, 'residual');
  close(q.monthlyDep, 435.97, 0.01, 'dep');
  close(q.monthlyRent, 165.81, 0.01, 'rent');
  close(q.payment, 648.42, 0.01, 'payment');
  close(q.capReductionTax, 155, 0.01, 'capRedTax');
  close(q.driveOff, 2495.01, 0.05, 'driveOff');
  close(q.effectiveMonthly, 699.72, 0.05, 'effective');
  close(q.mfApr, 5.4, 0.001, 'mfApr');
  close(q.effPct, 1.399, 0.005, 'effPct');
  close(q.valueYears, 5.95, 0.01, 'valueYears');
});

test('lease scoring: strong deal scores GREAT', () => {
  const s = scoreLease({
    msrp: 60000, price: 53400, rebates: 3000, down: 0, acqFee: 695,
    docFee: 85, govFees: 700, mf: 0.00125, residualPct: 62, term: 36, taxPct: 7.75,
  });
  assert.ok(s.score >= 85, 'score ' + s.score);
  assert.equal(s.verdict.label, 'GREAT DEAL');
  assert.equal(s.critical, false);
});

test('lease scoring: marked-up MF triggers critical cap', () => {
  const s = scoreLease({
    msrp: 50000, price: 49500, rebates: 0, down: 3000, acqFee: 1295,
    docFee: 499, govFees: 700, mf: 0.00510, residualPct: 55, term: 36, taxPct: 7.75,
  });
  assert.ok(s.critical, 'should be critical');
  assert.ok(s.score <= 49, 'score capped, got ' + s.score);
  assert.ok(s.flags.some(f => f.level === 'critical'));
  assert.ok(s.flags.some(f => f.msg.includes('legal cap')));
});

test('lease scoring: huge down payment is not a good deal', () => {
  const s = scoreLease({
    msrp: 67000, price: 67000, rebates: 0, down: 12786, acqFee: 695,
    docFee: 85, govFees: 700, mf: 0.00160, residualPct: 58, term: 36, taxPct: 7.75,
  });
  assert.ok(s.critical, 'huge lease down should be critical');
  assert.ok(s.score <= 49, 'score capped, got ' + s.score);
  assert.ok(s.flags.some(f => f.msg.includes('huge lease down payment')));
});

test('lease: invalid inputs return null', () => {
  assert.equal(leaseQuote({ msrp: 0, price: 1, term: 36, residualPct: 58, mf: 0.001, taxPct: 7.75 }), null);
  assert.equal(scoreLease({ msrp: 50000, price: 46000, term: 0, residualPct: 58, mf: 0.001, taxPct: 7.75 }), null);
});

test('finance math: standard CA example', () => {
  const q = financeQuote({
    isUsed: false, msrp: 43000, price: 40000, rebates: 1000, tradeEquity: 0,
    down: 4000, apr: 5.9, term: 60, benchmarkApr: 6.6,
    docFee: 85, govFees: 595, addons: 0, taxPct: 7.75,
  });
  close(q.salesTax, 3100, 0.01, 'salesTax');
  close(q.amountFinanced, 38786.59, 0.05, 'financed');
  close(q.monthly, 748.0, 1.0, 'monthly');
  close(q.totalInterest, 6095, 60, 'interest');
  close(q.discountPct, 6.98, 0.01, 'discount');
  close(q.aprDelta, -0.7, 0.001, 'aprDelta');
  assert.ok(q.ltv > 90 && q.ltv < 105, 'ltv ' + q.ltv);
});

test('finance: zero-APR loan', () => {
  const q = financeQuote({
    isUsed: false, msrp: 30000, price: 30000, down: 3000, apr: 0, term: 36,
    benchmarkApr: 6.6, docFee: 85, govFees: 0, taxPct: 0,
  });
  close(q.monthly, (30000 + 85 - 3000) / 36, 0.01, 'zero-apr monthly');
  close(q.totalInterest, 0, 0.01, 'no interest');
});

test('finance scoring: predatory loan capped below 50', () => {
  const s = scoreFinance({
    isUsed: true, msrp: 20000, price: 22000, rebates: 0, tradeEquity: -3000,
    down: 0, apr: 21, term: 72, benchmarkApr: 14.0,
    docFee: 85, govFees: 400, addons: 1500, taxPct: 7.75,
  });
  assert.ok(s.critical, 'critical');
  assert.ok(s.score <= 49, 'capped, got ' + s.score);
  assert.equal(verdictFor(s.score).tone === 'great', false);
});

test('finance scoring: healthy deal scores GOOD or better', () => {
  const s = scoreFinance({
    isUsed: false, msrp: 45000, price: 42000, rebates: 500, tradeEquity: 5000,
    down: 5000, apr: 5.2, term: 48, benchmarkApr: 6.6,
    docFee: 85, govFees: 620, addons: 0, taxPct: 7.75,
  });
  assert.ok(s.score >= 70, 'score ' + s.score);
  assert.equal(s.critical, false);
});

test('finance scoring: huge down payment does not fake a great deal', () => {
  const s = scoreFinance({
    isUsed: false, msrp: 67000, price: 67000, rebates: 0, tradeEquity: 0,
    down: 41118, apr: 6.3, term: 60, benchmarkApr: 8.4,
    docFee: 85, govFees: 1000, addons: 0, taxPct: 7.75,
  });
  assert.ok(s.critical, 'huge finance down should be critical');
  assert.ok(s.score <= 49, 'score capped, got ' + s.score);
  assert.ok(s.flags.some(f => f.msg.includes('massive amount down')));
});

test('CA rebate tax rule: rebate does not reduce sales tax', () => {
  const base = { isUsed: false, msrp: 40000, price: 40000, down: 0, apr: 6, term: 60, benchmarkApr: 6.6, docFee: 0, govFees: 0, taxPct: 7.75 };
  const noRebate = financeQuote({ ...base, rebates: 0 });
  const withRebate = financeQuote({ ...base, rebates: 5000 });
  close(noRebate.salesTax, withRebate.salesTax, 0.001, 'tax unchanged by rebate');
  close(noRebate.amountFinanced - withRebate.amountFinanced, 5000, 0.001, 'rebate reduces principal');
});

test('amortization: interest is front-loaded, balance closes at term', () => {
  const af = 30000, apr = 6, term = 60;
  const full = amortizeThrough(af, apr, term, term);
  close(full.balance, 0, 0.5, 'balance ~0 at end of term');
  // total interest over the full term
  const totalInt = full.interestPaid;
  const half = amortizeThrough(af, apr, term, 30); // halfway in time
  assert.ok(half.interestPaid / totalInt > 0.5, 'over half the interest paid in the first half');
  assert.ok(half.balance > 0 && half.balance < af, 'balance between 0 and principal');
  // zero-APR: interest is always 0, principal linear
  const z = amortizeThrough(12000, 0, 24, 12);
  close(z.interestPaid, 0, 0.01, 'no interest at 0 APR');
  close(z.balance, 6000, 0.01, 'half paid down at 0 APR');
  assert.equal(amortizeThrough(0, 6, 60, 12), null);
  assert.equal(amortizeThrough(30000, 6, 60, 0), null);
});

test('early exit: interest share exceeds time share on a long loan', () => {
  const i = {
    isUsed: false, msrp: 45000, price: 42000, rebates: 0, tradeEquity: 0, down: 4000,
    apr: 7.5, term: 72, benchmarkApr: 7.2, docFee: 85, govFees: 595, addons: 0, taxPct: 7.75,
  };
  const ex = financeEarlyExit(i, 24);
  assert.equal(ex.exitMonth, 24);
  assert.equal(ex.term, 72);
  assert.ok(ex.interestShare > ex.termShare, 'interest front-loaded: ' + ex.interestShare.toFixed(0) + '% interest in ' + ex.termShare.toFixed(0) + '% of term');
  assert.ok(ex.balance > 0, 'still owe a payoff balance');
  // selling at the very end leaves ~no balance and ~all the interest paid
  const end = financeEarlyExit(i, 72);
  close(end.balance, 0, 1, 'no balance at full term');
  close(end.interestShare, 100, 0.5, 'all interest paid at full term');
  assert.equal(financeEarlyExit(i, 0), null);
});

test('affordability payment scales with income and appetite', () => {
  assert.equal(affordabilityPayment(10000, 'conservative'), 800);
  assert.equal(affordabilityPayment(10000, 'comfortable'), 1200);
  assert.equal(affordabilityPayment(10000, 'aggressive'), 1800);
  assert.ok(affordabilityPayment(10000, 'aggressive') > affordabilityPayment(10000, 'conservative'));
  assert.equal(affordabilityPayment(0, 'comfortable'), null);
  assert.equal(affordabilityPayment(10000, 'bogus'), null);
  assert.ok(AFFORDABILITY.conservative.pct < AFFORDABILITY.aggressive.pct);
});

test('existing car costs come off every tier', () => {
  // $9k income, comfortable = $1,080 budget, minus $600 current = $480 for new.
  assert.equal(affordabilityPayment(9000, 'comfortable', 600), 1080 - 600);
  // Comes off all three tiers equally.
  assert.equal(affordabilityPayment(9000, 'conservative', 600), Math.round(9000 * 0.08) - 600);
  assert.equal(affordabilityPayment(9000, 'aggressive', 600), Math.round(9000 * 0.18) - 600);
  // Existing costs exceeding the budget => non-positive (no room).
  assert.ok(affordabilityPayment(9000, 'conservative', 900) <= 0);
  // Blank/zero existing behaves like before.
  assert.equal(affordabilityPayment(9000, 'comfortable', 0), affordabilityPayment(9000, 'comfortable'));
});

test('vehicle inventory is well-formed', () => {
  assert.ok(VEHICLES.length >= 20, 'has a decent roster');
  for (const v of VEHICLES) {
    assert.ok(v.mk && v.md, 'make + model present');
    assert.ok(v.msrp > 5000 && v.msrp < (v.used ? 450000 : 200000), 'plausible MSRP: ' + v.md);
    assert.ok(v.mf >= 0 && v.mf < 0.01, 'plausible money factor: ' + v.md);
    assert.ok(v.res > 30 && v.res < 80, 'plausible residual: ' + v.md);
  }
  // Sorted by make so the grouped <select> builds clean optgroups.
  const makes = VEHICLES.map(v => v.mk);
  assert.deepEqual(makes, makes.slice().sort((a, b) => a.localeCompare(b)), 'sorted by make');
});

test('config sanity', () => {
  assert.equal(CONFIG.taxRateDefault, 7.75);
  assert.equal(CONFIG.docFeeCap, 85);
  assert.ok(CONFIG.benchmarks.new.prime < CONFIG.benchmarks.used.prime);
});
