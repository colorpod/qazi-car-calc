import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONFIG, lerpCurve, estimateRegistration, verdictFor,
  leaseQuote, scoreLease, financeQuote, scoreFinance,
  marketApr, resolveZip, docFeeCapForState, solveLeasePrice, solveFinancePrice,
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

test('CA rebate tax rule: rebate does not reduce sales tax', () => {
  const base = { isUsed: false, msrp: 40000, price: 40000, down: 0, apr: 6, term: 60, benchmarkApr: 6.6, docFee: 0, govFees: 0, taxPct: 7.75 };
  const noRebate = financeQuote({ ...base, rebates: 0 });
  const withRebate = financeQuote({ ...base, rebates: 5000 });
  close(noRebate.salesTax, withRebate.salesTax, 0.001, 'tax unchanged by rebate');
  close(noRebate.amountFinanced - withRebate.amountFinanced, 5000, 0.001, 'rebate reduces principal');
});

test('config sanity', () => {
  assert.equal(CONFIG.taxRateDefault, 7.75);
  assert.equal(CONFIG.docFeeCap, 85);
  assert.ok(CONFIG.benchmarks.new.prime < CONFIG.benchmarks.used.prime);
});
