// qazi-car-calc — lease + finance deal calculator with a deal-quality gauge.
// Single worker: serves the SPA at / and the shared math module at /calc.mjs.
// All scoring logic lives in calc.mjs (tested by tests/calc.test.mjs).

import CALC_SOURCE from './calc.mjs';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'qazi-car-calc' }), {
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.pathname === '/calc.mjs') {
      return new Response(CALC_SOURCE, {
        headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' },
      });
    }
    if (url.pathname === '/') {
      return new Response(PAGE_HTML, {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
      });
    }
    return new Response('Not found', { status: 404 });
  },
};

// NOTE: client <script> below is inside this template literal — it must not
// contain backticks or dollar-brace sequences.
const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Car Deal Gauge</title>
<style>
  :root {
    --bg: #0f1115; --card: #171a21; --card2: #1d212b; --line: #2a2f3a;
    --text: #e8eaf0; --muted: #9aa3b2; --accent: #f48120;
    --great: #22c55e; --good: #84cc16; --fair: #eab308; --weak: #f97316; --bad: #ef4444;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font-size: 26px; margin: 0 0 2px; letter-spacing: -0.02em; }
  .sub { color: var(--muted); margin: 0 0 20px; font-size: 14px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; }
  .tab { flex: 1; padding: 12px; text-align: center; background: var(--card);
    border: 1px solid var(--line); border-radius: 10px; cursor: pointer;
    font-weight: 600; color: var(--muted); user-select: none; }
  .tab.active { color: var(--text); border-color: var(--accent); background: var(--card2); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 880px) { .grid { grid-template-columns: 1fr; } }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
  .card h2 { font-size: 15px; margin: 0 0 14px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .field { margin-bottom: 11px; }
  .field label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  .field input, .field select { width: 100%; padding: 9px 10px; background: var(--card2);
    border: 1px solid var(--line); border-radius: 8px; color: var(--text); font-size: 15px; }
  .field input:focus, .field select:focus { outline: none; border-color: var(--accent); }
  .hint { font-size: 11px; color: var(--muted); margin-top: 3px; }
  .check { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); margin: -4px 0 11px; }
  .check input { width: auto; }
  .tlabel { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); margin-bottom: 4px; cursor: pointer; user-select: none; }
  .tlabel input { width: auto; margin: 0; accent-color: var(--accent); }
  .field input.off { opacity: 0.38; }
  .field.off-field .hint { color: var(--weak); }
  .btns { display: flex; gap: 8px; margin-top: 6px; }
  .btn { padding: 8px 14px; border-radius: 8px; border: 1px solid var(--line);
    background: var(--card2); color: var(--muted); cursor: pointer; font-size: 13px; }
  .btn:hover { color: var(--text); border-color: var(--accent); }
  .gaugebox { text-align: center; }
  .scorenum { font-size: 44px; font-weight: 800; letter-spacing: -0.03em; margin-top: -86px; }
  .verdict { font-size: 19px; font-weight: 800; letter-spacing: 0.04em; margin: 2px 0 14px; }
  .v-great { color: var(--great); } .v-good { color: var(--good); } .v-fair { color: var(--fair); }
  .v-weak { color: var(--weak); } .v-bad { color: var(--bad); }
  .bignums { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .bignum { background: var(--card2); border: 1px solid var(--line); border-radius: 10px; padding: 10px; }
  .bignum .k { font-size: 11px; color: var(--muted); }
  .bignum .v { font-size: 18px; font-weight: 700; margin-top: 2px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 14px; }
  .chip { font-size: 12px; padding: 4px 10px; border-radius: 99px; border: 1px solid var(--line); color: var(--muted); }
  .comp { margin-bottom: 10px; }
  .comp .top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
  .comp .w { color: var(--muted); font-size: 11px; }
  .bar { height: 7px; background: var(--card2); border-radius: 99px; overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 99px; }
  .comp .d { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .flag { padding: 9px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 8px; border: 1px solid; }
  .f-critical { border-color: var(--bad); color: #fca5a5; background: rgba(239,68,68,0.08); }
  .f-warn { border-color: var(--weak); color: #fdba74; background: rgba(249,115,22,0.07); }
  .f-info { border-color: #3b82f6; color: #93c5fd; background: rgba(59,130,246,0.07); }
  .empty { color: var(--muted); text-align: center; padding: 40px 10px; }
  details { margin-top: 16px; color: var(--muted); font-size: 13px; }
  details summary { cursor: pointer; color: var(--text); font-weight: 600; }
  details li { margin: 6px 0; }
  .foot { color: var(--muted); font-size: 12px; margin-top: 22px; text-align: center; }
  .seg { display: flex; gap: 0; margin-bottom: 11px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .seg button { flex: 1; padding: 8px; background: var(--card2); color: var(--muted); border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
  .seg button.on { background: var(--accent); color: #14100b; }
  .hidden { display: none; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Car Deal Gauge</h1>
  <p class="sub">Lease and finance deal checker. Defaults tuned for Irvine / Orange County, CA (7.75% tax, $85 doc fee cap, CA lease tax rules). Plug in the numbers from the dealer worksheet and the gauge tells you if it is a good deal.</p>

  <div class="tabs">
    <div class="tab active" id="tab-lease">Lease</div>
    <div class="tab" id="tab-finance">Finance</div>
  </div>

  <div class="grid">
    <div class="card">
      <h2 id="inputs-title">Lease inputs</h2>

      <div id="pane-lease">
        <div class="row">
          <div class="field"><label>MSRP (sticker) $</label><input id="l_msrp" type="number" step="100" placeholder="50000"></div>
          <div class="field"><label>Negotiated selling price $</label><input id="l_price" type="number" step="100" placeholder="46500"><div class="hint">Before any rebates. This is the number you negotiate.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Rebates / incentives $</label><input id="l_rebates" type="number" step="100" value="0"></div>
          <div class="field"><label>Down payment (cap reduction) $</label><input id="l_down" type="number" step="100" value="0"><div class="hint">$0 down is the smart lease structure.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Money factor</label><input id="l_mf" type="number" step="0.00001" placeholder="0.00225"><div class="hint" id="l_mf_hint">x2400 = APR. Ask the dealer or check Leasehackr forums.</div></div>
          <div class="field"><label>Residual %</label><input id="l_residual" type="number" step="0.5" placeholder="58"><div class="hint">% of MSRP, from the lease worksheet.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Term (months)</label><select id="l_term">
            <option>24</option><option>27</option><option>30</option><option>33</option>
            <option selected>36</option><option>39</option><option>42</option><option>48</option>
          </select></div>
          <div class="field"><label>Miles per year</label><select id="l_miles">
            <option>7500</option><option>10000</option><option selected>12000</option><option>15000</option>
          </select></div>
        </div>
        <div class="row">
          <div class="field"><label>Acquisition fee $</label><input id="l_acq" type="number" step="5" value="695"></div>
          <div class="field"><label>Doc fee $</label><input id="l_doc" type="number" step="5" value="85"><div class="hint">CA legal max is $85.</div></div>
        </div>
        <div class="row">
          <div class="field"><label class="tlabel"><input id="l_tax_on" type="checkbox" checked> Sales tax %</label><input id="l_tax" type="number" step="0.05" value="7.75"><div class="hint">Uncheck to exclude tax from the deal.</div></div>
          <div class="field"><label class="tlabel"><input id="l_reg_on" type="checkbox" checked> Registration fee $</label><input id="l_reg" type="number" step="5" value="0"><div class="hint">DMV registration + VLF.</div></div>
        </div>
        <div class="row">
          <div class="field"><label class="tlabel"><input id="l_plate_on" type="checkbox" checked> License / plate fee $</label><input id="l_plate" type="number" step="5" value="0"></div>
          <div class="field"></div>
        </div>
        <div class="check"><input id="l_gov_auto" type="checkbox" checked><label for="l_gov_auto">Auto-estimate registration + plate from price</label></div>
        <div class="btns">
          <button class="btn" id="l_example">Load example</button>
          <button class="btn" id="l_reset">Reset</button>
        </div>
      </div>

      <div id="pane-finance" class="hidden">
        <div class="seg">
          <button id="f_new" class="on">New car</button>
          <button id="f_used">Used car</button>
        </div>
        <div class="row">
          <div class="field"><label id="f_msrp_label">MSRP (sticker) $</label><input id="f_msrp" type="number" step="100" placeholder="43000"></div>
          <div class="field"><label>Negotiated price $</label><input id="f_price" type="number" step="100" placeholder="40000"></div>
        </div>
        <div class="row">
          <div class="field"><label>Rebates / incentives $</label><input id="f_rebates" type="number" step="100" value="0"><div class="hint">CA taxes the price BEFORE rebates.</div></div>
          <div class="field"><label>Trade-in equity $</label><input id="f_trade" type="number" step="100" value="0"><div class="hint">Negative if you owe more than it is worth.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Down payment $</label><input id="f_down" type="number" step="100" value="0"></div>
          <div class="field"><label>APR %</label><input id="f_apr" type="number" step="0.05" placeholder="6.5"></div>
        </div>
        <div class="row">
          <div class="field"><label>Term (months)</label><select id="f_term">
            <option>36</option><option>48</option><option selected>60</option><option>72</option><option>84</option>
          </select></div>
          <div class="field"><label>Your credit tier</label><select id="f_tier">
            <option value="superprime">Super prime (781+)</option>
            <option value="prime" selected>Prime (661-780)</option>
            <option value="nearprime">Near prime (601-660)</option>
            <option value="subprime">Subprime (501-600)</option>
            <option value="deepsub">Deep subprime (&lt;501)</option>
          </select></div>
        </div>
        <div class="row">
          <div class="field"><label>Benchmark APR % (market avg)</label><input id="f_bench" type="number" step="0.1"><div class="hint">Auto-filled from tier. Override if you have a better quote.</div></div>
          <div class="field"><label>Dealer add-ons $</label><input id="f_addons" type="number" step="50" value="0"><div class="hint">Etch, nitrogen, "protection". Should be $0.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Doc fee $</label><input id="f_doc" type="number" step="5" value="85"></div>
          <div class="field"><label class="tlabel"><input id="f_tax_on" type="checkbox" checked> Sales tax %</label><input id="f_tax" type="number" step="0.05" value="7.75"><div class="hint">Uncheck to exclude tax from the deal.</div></div>
        </div>
        <div class="row">
          <div class="field"><label class="tlabel"><input id="f_reg_on" type="checkbox" checked> Registration fee $</label><input id="f_reg" type="number" step="5" value="0"><div class="hint">DMV registration + VLF.</div></div>
          <div class="field"><label class="tlabel"><input id="f_plate_on" type="checkbox" checked> License / plate fee $</label><input id="f_plate" type="number" step="5" value="0"></div>
        </div>
        <div class="check"><input id="f_gov_auto" type="checkbox" checked><label for="f_gov_auto">Auto-estimate registration + plate from price</label></div>
        <div class="check"><input id="f_bench_auto" type="checkbox" checked><label for="f_bench_auto">Auto-fill benchmark APR from credit tier</label></div>
        <div class="btns">
          <button class="btn" id="f_example">Load example</button>
          <button class="btn" id="f_reset">Reset</button>
        </div>
      </div>
    </div>

    <div class="card gaugebox">
      <h2>Deal quality</h2>
      <div id="results">
        <div class="empty">Enter the deal numbers to see the gauge.</div>
      </div>
      <details id="how">
        <summary>How the score works</summary>
        <div id="how-lease">
          <ul>
            <li><b>Effective cost vs MSRP (40%)</b>: every dollar (payments, down, fees, taxes) divided by the term, as a % of MSRP. Under 1%/month is good, under 0.85% is great, 1.3%+ is weak.</li>
            <li><b>Discount off MSRP (25%)</b>: your negotiated price vs sticker, before incentives. 5%+ is solid, 10%+ is aggressive.</li>
            <li><b>Money factor (20%)</b>: MF x 2400 = APR equivalent. Under 5% is healthy in 2026; dealers mark this up for profit.</li>
            <li><b>Fees and structure (15%)</b>: doc fee over the CA $85 cap, marked-up acquisition fee, padded gov fees, big down payments (risk if the car is totaled).</li>
            <li><b>Critical flags cap the score at 49</b>: MF at 12%+ APR, paying 3%+ over MSRP, or effective cost of 2%+ of MSRP per month.</li>
          </ul>
        </div>
        <div id="how-finance" class="hidden">
          <ul>
            <li><b>APR vs your credit tier (30%)</b>: compared to current US market averages (Experian-style, editable). At or below average scores well.</li>
            <li><b>Discount (25%)</b>: new cars vs MSRP (4%+ off is solid in 2026); used cars vs fair market value (KBB/Edmunds).</li>
            <li><b>Loan term (15%)</b>: 48-60 months is healthy. 72+ bleeds interest and keeps you underwater.</li>
            <li><b>Loan-to-value (15%)</b>: financing under 90% of the price (10%+ down) protects you.</li>
            <li><b>Total interest burden (10%)</b>: lifetime interest as % of amount financed.</li>
            <li><b>Fees and add-ons (5%)</b>: doc fee over CA cap, padded gov fees, dealer add-ons.</li>
            <li><b>Critical flags cap the score at 49</b>: APR 4+ points above your tier, 120%+ LTV (negative equity), 84-month above-market loans, paying 5%+ over MSRP.</li>
          </ul>
        </div>
      </details>
    </div>
  </div>

  <p class="foot">CA math: lease payments and cap-cost reduction are taxed; purchase tax applies before rebates; doc fee taxable, capped at $85. Benchmarks are editable estimates, not quotes. Not financial advice; it is a negotiation gut-check.</p>
</div>

<script type="module">
import { CONFIG, estimateRegistration, estimatePlateFee, scoreLease, scoreFinance } from '/calc.mjs';

var $ = function (id) { return document.getElementById(id); };
var mode = 'lease';
var finUsed = false;

function money(x) {
  var neg = x < 0;
  var v = Math.abs(x);
  return (neg ? '-$' : '$') + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
function money2(x) {
  return '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : 0; }
function numOr(id, dflt) { var v = parseFloat($(id).value); return isFinite(v) ? v : dflt; }

// A toggleable line: returns its dollar value when checked, else 0, and dims
// the input + flips its hint to "excluded" colour when off. Keeps the typed
// value so re-checking restores it.
function togVal(onId, valId) {
  var on = $(onId).checked;
  var inp = $(valId);
  inp.classList.toggle('off', !on);
  if (inp.parentNode) inp.parentNode.classList.toggle('off-field', !on);
  return on ? num(valId) : 0;
}

var toneColor = { great: 'var(--great)', good: 'var(--good)', fair: 'var(--fair)', weak: 'var(--weak)', bad: 'var(--bad)' };

function arcPath(cx, cy, r, a0, a1) {
  var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  return 'M ' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A ' + r + ' ' + r + ' 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
}

function gaugeSvg(score, tone) {
  var cx = 200, cy = 185, r = 145;
  var bands = [
    [0, 40, 'var(--bad)'], [40, 55, 'var(--weak)'], [55, 70, 'var(--fair)'],
    [70, 85, 'var(--good)'], [85, 100, 'var(--great)'],
  ];
  var s = '<svg viewBox="0 0 400 215" style="width:100%;max-width:380px">';
  for (var i = 0; i < bands.length; i++) {
    var a0 = Math.PI + (bands[i][0] / 100) * Math.PI;
    var a1 = Math.PI + (bands[i][1] / 100) * Math.PI;
    s += '<path d="' + arcPath(cx, cy, r, a0 + 0.012, a1 - 0.012) + '" stroke="' + bands[i][2] + '" stroke-width="26" fill="none" stroke-linecap="butt" opacity="0.85"/>';
  }
  var deg = -90 + (score / 100) * 180;
  s += '<g transform="rotate(' + deg + ' ' + cx + ' ' + cy + ')">';
  s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - r + 34) + '" stroke="var(--text)" stroke-width="4" stroke-linecap="round"/>';
  s += '</g>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="9" fill="var(--text)"/>';
  s += '<text x="34" y="210" fill="var(--muted)" font-size="12">BAD</text>';
  s += '<text x="338" y="210" fill="var(--muted)" font-size="12">GREAT</text>';
  s += '</svg>';
  return s;
}

function renderResult(res, bigs, chips) {
  var html = '';
  html += gaugeSvg(res.score, res.verdict.tone);
  html += '<div class="scorenum" style="color:' + toneColor[res.verdict.tone] + '">' + res.score + '</div>';
  html += '<div class="verdict v-' + res.verdict.tone + '">' + res.verdict.label + '</div>';
  html += '<div class="bignums">';
  for (var i = 0; i < bigs.length; i++) {
    html += '<div class="bignum"><div class="k">' + bigs[i][0] + '</div><div class="v">' + bigs[i][1] + '</div></div>';
  }
  html += '</div>';
  html += '<div class="chips">';
  for (var c = 0; c < chips.length; c++) html += '<span class="chip">' + chips[c] + '</span>';
  html += '</div>';
  var order = { critical: 0, warn: 1, info: 2 };
  var flags = res.flags.slice().sort(function (a, b) { return order[a.level] - order[b.level]; });
  for (var f = 0; f < flags.length; f++) {
    html += '<div class="flag f-' + flags[f].level + '">' + flags[f].msg + '</div>';
  }
  html += '<div style="text-align:left;margin-top:14px">';
  for (var k = 0; k < res.components.length; k++) {
    var comp = res.components[k];
    var col = comp.score >= 85 ? 'var(--great)' : comp.score >= 70 ? 'var(--good)' : comp.score >= 55 ? 'var(--fair)' : comp.score >= 40 ? 'var(--weak)' : 'var(--bad)';
    html += '<div class="comp"><div class="top"><span>' + comp.label +
      ' <span class="w">(' + comp.weight + '%)</span></span><span style="color:' + col + ';font-weight:700">' + Math.round(comp.score) + '</span></div>' +
      '<div class="bar"><i style="width:' + Math.max(2, comp.score) + '%;background:' + col + '"></i></div>' +
      '<div class="d">' + comp.detail + '</div></div>';
  }
  html += '</div>';
  $('results').innerHTML = html;
}

function recalcLease() {
  var price = num('l_price');
  if ($('l_gov_auto').checked && price > 0) {
    $('l_reg').value = estimateRegistration(price);
    $('l_plate').value = estimatePlateFee(price);
  }
  var govFees = togVal('l_reg_on', 'l_reg') + togVal('l_plate_on', 'l_plate');
  var taxOn = $('l_tax_on').checked;
  $('l_tax').classList.toggle('off', !taxOn);
  var inputs = {
    msrp: num('l_msrp'), price: price, rebates: num('l_rebates'), down: num('l_down'),
    acqFee: num('l_acq'), docFee: num('l_doc'), govFees: govFees,
    mf: num('l_mf'), residualPct: num('l_residual'),
    term: num('l_term'), taxPct: taxOn ? numOr('l_tax', CONFIG.taxRateDefault) : 0,
  };
  var mfApr = inputs.mf * 2400;
  $('l_mf_hint').textContent = inputs.mf > 0
    ? ('= ' + mfApr.toFixed(2) + '% APR equivalent')
    : 'x2400 = APR. Ask the dealer or check Leasehackr forums.';
  var res = scoreLease(inputs);
  if (!res) {
    $('results').innerHTML = '<div class="empty">Enter MSRP, selling price, money factor, residual, and term.</div>';
    return;
  }
  var q = res.quote;
  renderResult(res, [
    [taxOn ? 'Monthly (with tax)' : 'Monthly (no tax)', money2(q.payment)],
    ['Drive-off cash', money(q.driveOff)],
    ['Total lease cost', money(q.totalCost)],
  ], [
    'Effective ' + money2(q.effectiveMonthly) + '/mo all-in',
    '1% rule: ' + q.effPct.toFixed(2) + '%',
    q.valueYears.toFixed(1) + ' value-years',
    'MF = ' + q.mfApr.toFixed(2) + '% APR',
  ]);
}

function recalcFinance() {
  var price = num('f_price');
  if ($('f_gov_auto').checked && price > 0) {
    $('f_reg').value = estimateRegistration(price);
    $('f_plate').value = estimatePlateFee(price);
  }
  if ($('f_bench_auto').checked) {
    var table = finUsed ? CONFIG.benchmarks.used : CONFIG.benchmarks.new;
    $('f_bench').value = table[$('f_tier').value];
  }
  var govFees = togVal('f_reg_on', 'f_reg') + togVal('f_plate_on', 'f_plate');
  var taxOn = $('f_tax_on').checked;
  $('f_tax').classList.toggle('off', !taxOn);
  var inputs = {
    isUsed: finUsed, msrp: num('f_msrp'), price: price, rebates: num('f_rebates'),
    tradeEquity: num('f_trade'), down: num('f_down'), apr: num('f_apr'),
    term: num('f_term'), benchmarkApr: num('f_bench'), docFee: num('f_doc'),
    govFees: govFees, addons: num('f_addons'), taxPct: taxOn ? numOr('f_tax', CONFIG.taxRateDefault) : 0,
  };
  var res = scoreFinance(inputs);
  if (!res) {
    $('results').innerHTML = '<div class="empty">Enter ' + (finUsed ? 'market value' : 'MSRP') + ', price, APR, and term.</div>';
    return;
  }
  var q = res.quote;
  renderResult(res, [
    ['Monthly payment', money2(q.monthly)],
    ['Amount financed', money(q.amountFinanced)],
    ['Total interest', money(q.totalInterest)],
  ], [
    'Out the door: ' + money(q.amountFinanced + inputs.down + inputs.rebates + inputs.tradeEquity),
    'LTV ' + q.ltv.toFixed(0) + '%',
    'APR ' + (q.aprDelta >= 0 ? '+' : '') + q.aprDelta.toFixed(1) + ' vs market',
  ]);
}

function recalc() {
  if (mode === 'lease') recalcLease(); else recalcFinance();
  save();
}

// ------------------------------------------------------------- wiring ----
var LEASE_IDS = ['l_msrp','l_price','l_rebates','l_down','l_mf','l_residual','l_term','l_miles','l_acq','l_doc','l_reg','l_plate','l_tax'];
var FIN_IDS = ['f_msrp','f_price','f_rebates','f_trade','f_down','f_apr','f_term','f_tier','f_bench','f_addons','f_doc','f_reg','f_plate','f_tax'];
var TOGGLE_IDS = ['l_tax_on','l_reg_on','l_plate_on','f_tax_on','f_reg_on','f_plate_on'];

function save() {
  var data = { mode: mode, finUsed: finUsed, v: {} };
  var ids = LEASE_IDS.concat(FIN_IDS);
  for (var i = 0; i < ids.length; i++) data.v[ids[i]] = $(ids[i]).value;
  data.l_gov_auto = $('l_gov_auto').checked;
  data.f_gov_auto = $('f_gov_auto').checked;
  data.f_bench_auto = $('f_bench_auto').checked;
  for (var t = 0; t < TOGGLE_IDS.length; t++) data[TOGGLE_IDS[t]] = $(TOGGLE_IDS[t]).checked;
  try { localStorage.setItem('qcc_v1', JSON.stringify(data)); } catch (e) {}
}

function load() {
  var raw = null;
  try { raw = localStorage.getItem('qcc_v1'); } catch (e) {}
  if (!raw) return;
  try {
    var data = JSON.parse(raw);
    var ids = LEASE_IDS.concat(FIN_IDS);
    for (var i = 0; i < ids.length; i++) {
      if (data.v && data.v[ids[i]] !== undefined) $(ids[i]).value = data.v[ids[i]];
    }
    if (data.l_gov_auto !== undefined) $('l_gov_auto').checked = data.l_gov_auto;
    if (data.f_gov_auto !== undefined) $('f_gov_auto').checked = data.f_gov_auto;
    if (data.f_bench_auto !== undefined) $('f_bench_auto').checked = data.f_bench_auto;
    for (var t = 0; t < TOGGLE_IDS.length; t++) {
      if (data[TOGGLE_IDS[t]] !== undefined) $(TOGGLE_IDS[t]).checked = data[TOGGLE_IDS[t]];
    }
    if (data.finUsed) setUsed(true);
    if (data.mode === 'finance') setMode('finance');
  } catch (e) {}
}

function setMode(m) {
  mode = m;
  $('tab-lease').classList.toggle('active', m === 'lease');
  $('tab-finance').classList.toggle('active', m === 'finance');
  $('pane-lease').classList.toggle('hidden', m !== 'lease');
  $('pane-finance').classList.toggle('hidden', m !== 'finance');
  $('how-lease').classList.toggle('hidden', m !== 'lease');
  $('how-finance').classList.toggle('hidden', m !== 'finance');
  $('inputs-title').textContent = m === 'lease' ? 'Lease inputs' : 'Finance inputs';
  recalc();
}

function setUsed(used) {
  finUsed = used;
  $('f_new').classList.toggle('on', !used);
  $('f_used').classList.toggle('on', used);
  $('f_msrp_label').textContent = used ? 'Fair market value (KBB/Edmunds) $' : 'MSRP (sticker) $';
}

$('tab-lease').addEventListener('click', function () { setMode('lease'); });
$('tab-finance').addEventListener('click', function () { setMode('finance'); });
$('f_new').addEventListener('click', function () { setUsed(false); recalc(); });
$('f_used').addEventListener('click', function () { setUsed(true); recalc(); });

var all = LEASE_IDS.concat(FIN_IDS);
for (var i = 0; i < all.length; i++) {
  $(all[i]).addEventListener('input', recalc);
  $(all[i]).addEventListener('change', recalc);
}
$('l_reg').addEventListener('input', function () { $('l_gov_auto').checked = false; });
$('l_plate').addEventListener('input', function () { $('l_gov_auto').checked = false; });
$('f_reg').addEventListener('input', function () { $('f_gov_auto').checked = false; });
$('f_plate').addEventListener('input', function () { $('f_gov_auto').checked = false; });
$('f_bench').addEventListener('input', function () { $('f_bench_auto').checked = false; });
$('l_gov_auto').addEventListener('change', recalc);
$('f_gov_auto').addEventListener('change', recalc);
$('f_bench_auto').addEventListener('change', recalc);
for (var ti = 0; ti < TOGGLE_IDS.length; ti++) $(TOGGLE_IDS[ti]).addEventListener('change', recalc);

function setToggles(prefix) {
  $(prefix + '_tax_on').checked = true;
  $(prefix + '_reg_on').checked = true;
  $(prefix + '_plate_on').checked = true;
}
$('l_example').addEventListener('click', function () {
  $('l_msrp').value = 58000; $('l_price').value = 52200; $('l_rebates').value = 1500;
  $('l_down').value = 0; $('l_mf').value = 0.00180; $('l_residual').value = 60;
  $('l_term').value = 36; $('l_acq').value = 695; $('l_doc').value = 85;
  $('l_tax').value = 7.75; $('l_gov_auto').checked = true; setToggles('l');
  recalc();
});
$('l_reset').addEventListener('click', function () {
  for (var i = 0; i < LEASE_IDS.length; i++) $(LEASE_IDS[i]).value = '';
  $('l_rebates').value = 0; $('l_down').value = 0; $('l_acq').value = 695;
  $('l_doc').value = 85; $('l_tax').value = 7.75; $('l_term').value = 36;
  $('l_reg').value = 0; $('l_plate').value = 0; $('l_gov_auto').checked = true; setToggles('l');
  recalc();
});
$('f_example').addEventListener('click', function () {
  setUsed(false);
  $('f_msrp').value = 43000; $('f_price').value = 39900; $('f_rebates').value = 1000;
  $('f_trade').value = 0; $('f_down').value = 4000; $('f_apr').value = 5.9;
  $('f_term').value = 60; $('f_tier').value = 'prime'; $('f_addons').value = 0;
  $('f_doc').value = 85; $('f_tax').value = 7.75;
  $('f_gov_auto').checked = true; $('f_bench_auto').checked = true; setToggles('f');
  recalc();
});
$('f_reset').addEventListener('click', function () {
  for (var i = 0; i < FIN_IDS.length; i++) $(FIN_IDS[i]).value = '';
  $('f_rebates').value = 0; $('f_trade').value = 0; $('f_down').value = 0;
  $('f_addons').value = 0; $('f_doc').value = 85; $('f_tax').value = 7.75;
  $('f_term').value = 60; $('f_tier').value = 'prime'; $('f_reg').value = 0; $('f_plate').value = 0;
  $('f_gov_auto').checked = true; $('f_bench_auto').checked = true; setToggles('f');
  recalc();
});

load();
recalc();
</script>
</body>
</html>`;
