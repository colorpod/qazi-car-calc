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
  .gauge-wrap { position: relative; width: 100%; max-width: 360px; margin: 4px auto 14px; }
  .gauge-wrap svg { display: block; width: 100%; }
  .gauge-read { position: absolute; left: 0; right: 0; bottom: 4px; text-align: center; pointer-events: none; }
  .scorenum { font-size: 46px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
  .scorenum small { font-size: 15px; font-weight: 600; color: var(--muted); }
  .verdict { font-size: 19px; font-weight: 800; letter-spacing: 0.04em; margin: 4px 0 14px; }
  .readout { padding: 9px 10px; background: var(--card2); border: 1px solid var(--line); border-radius: 8px; color: var(--text); font-size: 14px; min-height: 38px; display: flex; align-items: center; }
  .readout.muted { color: var(--muted); }
  .lever { background: var(--card2); border: 1px solid var(--line); border-radius: 10px; padding: 11px 12px; margin-bottom: 11px; }
  .lever .leverrow { display: flex; gap: 8px; margin-top: 8px; }
  .lever input, .lever select { flex: 1; width: 100%; padding: 9px 10px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; color: var(--text); font-size: 15px; }
  .lever input:focus, .lever select:focus { outline: none; border-color: var(--accent); }
  .lever .off { opacity: 0.4; }
  .solvebox { background: rgba(244,129,32,0.08); border: 1px solid var(--accent); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 13px; color: var(--text); }
  .solvebox b { color: var(--accent); }
  .exitbox { background: var(--card2); border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 8px; padding: 11px 13px; margin-bottom: 12px; text-align: left; }
  .exit-h { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 8px; }
  .exit-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 14px; margin: 5px 0; }
  .exit-row span { color: var(--muted); }
  .exit-row b { color: var(--text); font-weight: 700; white-space: nowrap; }
  .exit-row small { color: var(--muted); font-weight: 500; font-size: 11px; }
  .exit-note { font-size: 12px; color: var(--muted); margin-top: 8px; line-height: 1.4; }
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
  <p class="sub">Lease and finance deal checker. Enter your ZIP and it pulls the right sales tax, DMV fees, and doc-fee cap for your state; market APR is auto-set for your credit tier, new/used, and term. Plug in the dealer worksheet and the gauge tells you if it is a good deal. Defaults to Irvine, CA.</p>

  <div class="tabs">
    <div class="tab active" id="tab-lease">Lease</div>
    <div class="tab" id="tab-finance">Finance</div>
  </div>

  <div class="grid">
    <div class="card">
      <h2 id="inputs-title">Lease inputs</h2>

      <div id="pane-lease">
        <div class="row">
          <div class="field"><label>ZIP code</label><input id="l_zip" type="text" inputmode="numeric" maxlength="5" placeholder="92618"></div>
          <div class="field"><label>Detected location</label><div id="l_loc" class="readout">—</div></div>
        </div>
        <div class="lever">
          <label class="tlabel"><input id="l_target_on" type="checkbox"> Solve for a target monthly payment</label>
          <div class="leverrow">
            <input id="l_target" type="number" step="10" placeholder="600 ($/mo max)" class="off" disabled>
            <select id="l_solvefor" class="off" disabled>
              <option value="down">&rarr; find down payment</option>
              <option value="price">&rarr; find max price</option>
            </select>
          </div>
          <div class="hint" id="l_target_hint">Enter the car price + your max $/mo; we solve the down payment.</div>
        </div>
        <div class="row">
          <div class="field"><label>MSRP (sticker) $</label><input id="l_msrp" type="number" step="100" placeholder="50000"></div>
          <div class="field"><label id="l_price_label">Negotiated selling price $</label><input id="l_price" type="number" step="100" placeholder="46500"><div class="hint" id="l_price_hint">Before any rebates. This is the number you negotiate.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Rebates / incentives $</label><input id="l_rebates" type="number" step="100" value="0"></div>
          <div class="field"><label id="l_down_label">Down payment (cap reduction) $</label><input id="l_down" type="number" step="100" value="0"><div class="hint">$0 down is the smart lease structure.</div></div>
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
          <div class="field"><label>Doc fee $</label><input id="l_doc" type="number" step="5" value="85"><div class="hint" id="l_doc_hint">CA legal max is $85.</div></div>
        </div>
        <div class="row">
          <div class="field"><label class="tlabel"><input id="l_tax_on" type="checkbox" checked> Sales tax %</label><input id="l_tax" type="number" step="0.05" value="7.75"><div class="hint">Uncheck to exclude tax.</div></div>
          <div class="field"><label class="tlabel"><input id="l_reg_on" type="checkbox" checked> Registration &amp; DMV fees $</label><input id="l_reg" type="number" step="5" value="0"><div class="hint">Title, plates, VLF.</div></div>
        </div>
        <div class="check"><input id="l_zipauto" type="checkbox" checked><label for="l_zipauto">Auto-fill tax + DMV fees from ZIP</label></div>
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
          <div class="field"><label>ZIP code</label><input id="f_zip" type="text" inputmode="numeric" maxlength="5" placeholder="92618"></div>
          <div class="field"><label>Detected location</label><div id="f_loc" class="readout">—</div></div>
        </div>
        <div class="lever">
          <label class="tlabel"><input id="f_target_on" type="checkbox"> Solve for a target monthly payment</label>
          <div class="leverrow">
            <input id="f_target" type="number" step="10" placeholder="550 ($/mo max)" class="off" disabled>
            <select id="f_solvefor" class="off" disabled>
              <option value="down">&rarr; find down payment</option>
              <option value="price">&rarr; find max price</option>
            </select>
          </div>
          <div class="hint" id="f_target_hint">Enter the car price + your max $/mo; we solve the down payment.</div>
        </div>
        <div class="row">
          <div class="field"><label id="f_msrp_label">MSRP (sticker) $</label><input id="f_msrp" type="number" step="100" placeholder="43000"></div>
          <div class="field"><label id="f_price_label">Negotiated price $</label><input id="f_price" type="number" step="100" placeholder="40000"></div>
        </div>
        <div class="row">
          <div class="field"><label>Rebates / incentives $</label><input id="f_rebates" type="number" step="100" value="0"><div class="hint">Taxed before rebates in most states.</div></div>
          <div class="field"><label>Trade-in equity $</label><input id="f_trade" type="number" step="100" value="0"><div class="hint">Negative if you owe more than it is worth.</div></div>
        </div>
        <div class="row">
          <div class="field"><label id="f_down_label">Down payment $</label><input id="f_down" type="number" step="100" value="0"></div>
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
          <div class="field"><label>Benchmark APR % (market avg)</label><input id="f_bench" type="number" step="0.1"><div class="hint" id="f_bench_hint">Auto-filled for your tier, new/used, and term.</div></div>
          <div class="field"><label>Dealer add-ons $</label><input id="f_addons" type="number" step="50" value="0"><div class="hint">Etch, nitrogen, "protection". Should be $0.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Doc fee $</label><input id="f_doc" type="number" step="5" value="85"><div class="hint" id="f_doc_hint">CA legal max is $85.</div></div>
          <div class="field"><label class="tlabel"><input id="f_tax_on" type="checkbox" checked> Sales tax %</label><input id="f_tax" type="number" step="0.05" value="7.75"><div class="hint">Uncheck to exclude tax.</div></div>
        </div>
        <div class="row">
          <div class="field"><label class="tlabel"><input id="f_reg_on" type="checkbox" checked> Registration &amp; DMV fees $</label><input id="f_reg" type="number" step="5" value="0"><div class="hint">Title, plates, VLF.</div></div>
          <div class="field"><label>Sell / pay off after (months)</label><input id="f_exit" type="number" step="6" placeholder="e.g. 24"><div class="hint">Optional: interest by then vs the full loan.</div></div>
        </div>
        <div class="check"><input id="f_zipauto" type="checkbox" checked><label for="f_zipauto">Auto-fill tax + DMV fees from ZIP</label></div>
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
            <li><b>Fees and add-ons (5%)</b>: doc fee over your state's cap, padded gov fees, dealer add-ons.</li>
            <li><b>Critical flags cap the score at 49</b>: APR 4+ points above your tier, 120%+ LTV (negative equity), 84-month above-market loans, paying 5%+ over MSRP.</li>
          </ul>
        </div>
      </details>
    </div>
  </div>

  <p class="foot">Tax + DMV fees and the doc-fee cap come from your ZIP's state (California metros are rate-accurate; other states use a representative combined rate). Lease payments and cap-cost reduction are taxed; tax applies before rebates; most states credit a trade-in against tax (CA does not). Benchmarks are editable estimates, not quotes. Not financial advice; it is a negotiation gut-check.</p>
</div>

<script type="module">
import { CONFIG, estimateRegistration, resolveZip, marketApr, solveLeasePrice, solveFinancePrice, solveLeaseDown, solveFinanceDown, financeEarlyExit, scoreLease, scoreFinance } from '/calc.mjs';

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
// the input when off. Keeps the typed value so re-checking restores it.
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

// Bold semicircle dial: thick glowing color segments, a bright position marker
// punched into the arc, and the big score + verdict centered in the bowl. No
// sweeping needle, so nothing ever crosses the number.
function gaugeSvg(score, verdict) {
  var cx = 150, cy = 158, r = 122, sw = 26;
  var tone = toneColor[verdict.tone];
  var bands = [
    [0, 40, 'var(--bad)'], [40, 55, 'var(--weak)'], [55, 70, 'var(--fair)'],
    [70, 85, 'var(--good)'], [85, 100, 'var(--great)'],
  ];
  var s = '<svg viewBox="0 0 300 192" xmlns="http://www.w3.org/2000/svg">';
  s += '<defs><filter id="gg" x="-30%" y="-30%" width="160%" height="160%">';
  s += '<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  // Dark track, then the glowing color bands on top of it.
  s += '<path d="' + arcPath(cx, cy, r, Math.PI, 2 * Math.PI) + '" stroke="var(--card2)" stroke-width="' + (sw + 4) + '" fill="none" stroke-linecap="round"/>';
  s += '<g filter="url(#gg)">';
  for (var i = 0; i < bands.length; i++) {
    var a0 = Math.PI + (bands[i][0] / 100) * Math.PI;
    var a1 = Math.PI + (bands[i][1] / 100) * Math.PI;
    s += '<path d="' + arcPath(cx, cy, r, a0 + 0.016, a1 - 0.016) + '" stroke="' + bands[i][2] + '" stroke-width="' + sw + '" fill="none" stroke-linecap="round"/>';
  }
  s += '</g>';
  // Position marker punched into the band at the score angle.
  var sc = Math.max(0, Math.min(100, score));
  var ang = Math.PI + (sc / 100) * Math.PI;
  var mx = (cx + r * Math.cos(ang)).toFixed(1), my = (cy + r * Math.sin(ang)).toFixed(1);
  s += '<circle cx="' + mx + '" cy="' + my + '" r="14" fill="var(--bg)"/>';
  s += '<circle cx="' + mx + '" cy="' + my + '" r="9" fill="#fff"/>';
  s += '<circle cx="' + mx + '" cy="' + my + '" r="4.5" fill="' + tone + '"/>';
  // Big score + verdict in the bowl.
  s += '<text x="' + cx + '" y="140" text-anchor="middle" font-size="54" font-weight="800" fill="' + tone + '">' + sc;
  s += '<tspan font-size="21" font-weight="600" fill="var(--muted)" dx="2">/100</tspan></text>';
  s += '<text x="' + cx + '" y="167" text-anchor="middle" font-size="17" font-weight="800" letter-spacing="1.4" fill="' + tone + '">' + verdict.label + '</text>';
  s += '<text x="18" y="186" fill="var(--muted)" font-size="12" font-weight="600">BAD</text>';
  s += '<text x="282" y="186" text-anchor="end" fill="var(--muted)" font-size="12" font-weight="600">GREAT</text>';
  s += '</svg>';
  return s;
}

function renderResult(res, bigs, chips, note, extra) {
  var html = '';
  html += '<div class="gauge-wrap">' + gaugeSvg(res.score, res.verdict) + '</div>';
  if (note) html += '<div class="solvebox">' + note + '</div>';
  html += '<div class="bignums">';
  for (var i = 0; i < bigs.length; i++) {
    html += '<div class="bignum"><div class="k">' + bigs[i][0] + '</div><div class="v">' + bigs[i][1] + '</div></div>';
  }
  html += '</div>';
  html += '<div class="chips">';
  for (var c = 0; c < chips.length; c++) html += '<span class="chip">' + chips[c] + '</span>';
  html += '</div>';
  if (extra) html += extra;
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

// Resolve the ZIP, update the detected-location readout + doc-fee hint, and
// return the location object (or null).
function resolveAndLabel(prefix) {
  var loc = resolveZip($(prefix + '_zip').value);
  var lbl = $(prefix + '_loc');
  var dh = $(prefix + '_doc_hint');
  if (loc) {
    lbl.textContent = loc.region + ' · ' + loc.taxRate.toFixed(2) + '% tax';
    lbl.classList.remove('muted');
    if (dh) dh.textContent = loc.docCap != null
      ? (loc.name + ' legal max is $' + loc.docCap + '.')
      : (loc.name + ' has no doc-fee cap, so it is negotiable.');
  } else {
    lbl.textContent = $(prefix + '_zip').value ? 'Unrecognized ZIP — using entered values' : '—';
    lbl.classList.add('muted');
  }
  return loc;
}

// Wire the lever UI: enable the target + solve-for controls, and make whichever
// field is being solved (price OR down payment) read-only, the other editable.
function setTargetUI(prefix, on, solveFor) {
  var t = $(prefix + '_target');
  t.disabled = !on; t.classList.toggle('off', !on);
  var sel = $(prefix + '_solvefor');
  sel.disabled = !on; sel.classList.toggle('off', !on);
  var solvingPrice = on && solveFor === 'price';
  var solvingDown = on && solveFor === 'down';
  var p = $(prefix + '_price');
  p.readOnly = solvingPrice; p.classList.toggle('off', solvingPrice);
  var d = $(prefix + '_down');
  d.readOnly = solvingDown; d.classList.toggle('off', solvingDown);
  var pl = $(prefix + '_price_label');
  if (pl) pl.textContent = solvingPrice
    ? (prefix === 'l' ? 'Selling price (solved) $' : 'Price (solved) $')
    : (prefix === 'l' ? 'Negotiated selling price $' : 'Negotiated price $');
  var dl = $(prefix + '_down_label');
  if (dl) dl.textContent = solvingDown
    ? 'Down payment (solved) $'
    : (prefix === 'l' ? 'Down payment (cap reduction) $' : 'Down payment $');
  var hint = $(prefix + '_target_hint');
  if (hint) hint.textContent = !on
    ? 'Lock a monthly payment and we solve the rest.'
    : (solveFor === 'down'
        ? 'Enter the car price + your max $/mo; we solve the down payment.'
        : 'Enter your down + max $/mo; we solve the highest car price.');
}

function recalcLease() {
  var loc = resolveAndLabel('l');
  var zipauto = $('l_zipauto').checked;
  if (loc && zipauto) $('l_tax').value = loc.taxRate;
  var taxOn = $('l_tax_on').checked;
  $('l_tax').classList.toggle('off', !taxOn);
  var taxPct = taxOn ? numOr('l_tax', CONFIG.taxRateDefault) : 0;
  var state = loc ? loc.state : 'CA';
  var docCap = loc ? loc.docCap : CONFIG.docFeeCap;
  var stateLabel = loc ? loc.name : 'California';

  var targetOn = $('l_target_on').checked;
  var solveFor = $('l_solvefor').value;
  setTargetUI('l', targetOn, solveFor);
  var note = null;
  // Auto-estimate registration from the price whenever price is a known input.
  if (zipauto && (!targetOn || solveFor === 'down') && num('l_price') > 0) {
    $('l_reg').value = estimateRegistration(num('l_price'), state);
  }
  if (targetOn && solveFor === 'price') {
    var solved = solveLeasePrice({
      msrp: num('l_msrp'), residualPct: num('l_residual'), mf: num('l_mf'),
      term: num('l_term'), acqFee: num('l_acq'), down: num('l_down'),
      rebates: num('l_rebates'), taxPct: taxPct,
    }, num('l_target'));
    if (solved && solved > 0) {
      $('l_price').value = solved;
      note = 'To stay at ' + money(num('l_target')) + '/mo, pay at most <b>' + money(solved) + '</b> for the car (selling price, before tax + fees).';
    } else {
      $('l_price').value = '';
      note = 'That payment is not reachable with these terms. Lower the money factor, shorten the term, or raise the target.';
    }
  } else if (targetOn && solveFor === 'down') {
    var dn = solveLeaseDown({
      msrp: num('l_msrp'), price: num('l_price'), residualPct: num('l_residual'),
      mf: num('l_mf'), term: num('l_term'), acqFee: num('l_acq'),
      rebates: num('l_rebates'), taxPct: taxPct,
    }, num('l_target'));
    if (dn == null) {
      note = 'Enter the car price (plus MSRP, money factor, residual, term) and we solve the down payment.';
    } else if (dn <= 0) {
      $('l_down').value = 0;
      note = 'At ' + money(num('l_target')) + '/mo you need <b>$0 down</b> — even nothing down lands under your target.';
    } else {
      $('l_down').value = Math.round(dn);
      note = 'To hit ' + money(num('l_target')) + '/mo on this car, put about <b>' + money(dn) + '</b> down.';
    }
  }
  var price = num('l_price');
  var govFees = togVal('l_reg_on', 'l_reg');

  var inputs = {
    msrp: num('l_msrp'), price: price, rebates: num('l_rebates'), down: num('l_down'),
    acqFee: num('l_acq'), docFee: num('l_doc'), govFees: govFees,
    mf: num('l_mf'), residualPct: num('l_residual'), term: num('l_term'),
    taxPct: taxPct, docFeeCap: docCap, stateLabel: stateLabel,
  };
  var mfApr = inputs.mf * 2400;
  $('l_mf_hint').textContent = inputs.mf > 0
    ? ('= ' + mfApr.toFixed(2) + '% APR equivalent')
    : 'x2400 = APR. Ask the dealer or check Leasehackr forums.';
  var res = scoreLease(inputs);
  if (!res) {
    $('results').innerHTML = '<div class="empty">' + (note ? '<div class="solvebox" style="text-align:left">' + note + '</div>' : '') +
      'Enter MSRP, ' + (targetOn ? 'target payment' : 'selling price') + ', money factor, residual, and term.</div>';
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
  ], note);
}

function recalcFinance() {
  var loc = resolveAndLabel('f');
  var zipauto = $('f_zipauto').checked;
  if (loc && zipauto) $('f_tax').value = loc.taxRate;
  var taxOn = $('f_tax_on').checked;
  $('f_tax').classList.toggle('off', !taxOn);
  var taxPct = taxOn ? numOr('f_tax', CONFIG.taxRateDefault) : 0;
  var state = loc ? loc.state : 'CA';
  var docCap = loc ? loc.docCap : CONFIG.docFeeCap;
  var stateLabel = loc ? loc.name : 'California';
  var tradeCredit = loc ? loc.tradeCredit : false;

  if ($('f_bench_auto').checked) {
    var b = marketApr(finUsed, $('f_tier').value, num('f_term'));
    if (b != null) $('f_bench').value = b;
  }
  $('f_bench_hint').textContent = 'Market avg for your tier/term (' + CONFIG.benchmarksAsOf + '). Override with a real quote.';

  var targetOn = $('f_target_on').checked;
  var solveFor = $('f_solvefor').value;
  setTargetUI('f', targetOn, solveFor);
  var note = null;
  // Auto-estimate registration from the price whenever price is a known input.
  if (zipauto && (!targetOn || solveFor === 'down') && num('f_price') > 0) {
    $('f_reg').value = estimateRegistration(num('f_price'), state);
  }
  var govFees = togVal('f_reg_on', 'f_reg');
  if (targetOn && solveFor === 'price') {
    var solved = solveFinancePrice({
      docFee: num('f_doc'), govFees: govFees, addons: num('f_addons'),
      down: num('f_down'), rebates: num('f_rebates'), tradeEquity: num('f_trade'),
      taxPct: taxPct, apr: num('f_apr'), term: num('f_term'), taxTradeCredit: tradeCredit,
    }, num('f_target'));
    if (solved && solved > 0) {
      $('f_price').value = solved;
      note = 'To stay at ' + money(num('f_target')) + '/mo, pay at most <b>' + money(solved) + '</b> for the car (before tax + fees).';
    } else {
      $('f_price').value = '';
      note = 'That payment is not reachable with these terms. Raise the down payment, extend the term, or lift the target.';
    }
  } else if (targetOn && solveFor === 'down') {
    var dn = solveFinanceDown({
      price: num('f_price'), docFee: num('f_doc'), govFees: govFees, addons: num('f_addons'),
      rebates: num('f_rebates'), tradeEquity: num('f_trade'), taxPct: taxPct,
      apr: num('f_apr'), term: num('f_term'), taxTradeCredit: tradeCredit,
    }, num('f_target'));
    if (dn == null) {
      note = 'Enter the car price, APR, and term and we solve the down payment.';
    } else if (dn <= 0) {
      $('f_down').value = 0;
      note = 'At ' + money(num('f_target')) + '/mo you need <b>$0 down</b> — even nothing down lands under your target.';
    } else {
      $('f_down').value = Math.round(dn);
      note = 'To hit ' + money(num('f_target')) + '/mo on this car, put about <b>' + money(dn) + '</b> down.';
    }
  }

  var inputs = {
    isUsed: finUsed, msrp: num('f_msrp'), price: num('f_price'), rebates: num('f_rebates'),
    tradeEquity: num('f_trade'), down: num('f_down'), apr: num('f_apr'),
    term: num('f_term'), benchmarkApr: num('f_bench'), docFee: num('f_doc'),
    govFees: govFees, addons: num('f_addons'), taxPct: taxPct,
    docFeeCap: docCap, stateLabel: stateLabel, taxTradeCredit: tradeCredit,
  };
  var res = scoreFinance(inputs);
  if (!res) {
    $('results').innerHTML = '<div class="empty">' + (note ? '<div class="solvebox" style="text-align:left">' + note + '</div>' : '') +
      'Enter ' + (finUsed ? 'market value' : 'MSRP') + ', ' + (targetOn ? 'target payment' : 'price') + ', APR, and term.</div>';
    return;
  }
  var q = res.quote;
  // Optional "what if I sell / pay off early?" panel.
  var exitHtml = '';
  var exitMo = num('f_exit');
  if (exitMo >= 1) {
    var ex = financeEarlyExit(inputs, exitMo);
    if (ex && ex.exitMonth < ex.term) {
      exitHtml = '<div class="exitbox">' +
        '<div class="exit-h">If you sell or pay off at month ' + ex.exitMonth + ' of ' + ex.term + '</div>' +
        '<div class="exit-row"><span>Interest paid by then</span><b>' + money(ex.interestPaid) + '</b></div>' +
        '<div class="exit-row"><span>Share of the loan&rsquo;s total interest</span><b>' + Math.round(ex.interestShare) + '% <small>(in ' + Math.round(ex.termShare) + '% of the term)</small></b></div>' +
        '<div class="exit-row"><span>Payoff balance to clear it</span><b>' + money(ex.balance) + '</b></div>' +
        '<div class="exit-note">Loan interest is front-loaded: you pay ' + Math.round(ex.interestShare) + '% of the lifetime interest in the first ' + Math.round(ex.termShare) + '% of the term. Selling early means you barely dented the principal.</div>' +
        '</div>';
    }
  }
  renderResult(res, [
    ['Monthly payment', money2(q.monthly)],
    ['Amount financed', money(q.amountFinanced)],
    ['Total interest', money(q.totalInterest)],
  ], [
    'Out the door: ' + money(q.amountFinanced + inputs.down + inputs.rebates + inputs.tradeEquity),
    'LTV ' + q.ltv.toFixed(0) + '%',
    'APR ' + (q.aprDelta >= 0 ? '+' : '') + q.aprDelta.toFixed(1) + ' vs market',
  ], note, exitHtml);
}

function recalc() {
  if (mode === 'lease') recalcLease(); else recalcFinance();
  save();
}

// ------------------------------------------------------------- wiring ----
var LEASE_IDS = ['l_zip','l_target','l_solvefor','l_msrp','l_price','l_rebates','l_down','l_mf','l_residual','l_term','l_miles','l_acq','l_doc','l_reg','l_tax'];
var FIN_IDS = ['f_zip','f_target','f_solvefor','f_msrp','f_price','f_rebates','f_trade','f_down','f_apr','f_term','f_tier','f_bench','f_addons','f_doc','f_reg','f_tax','f_exit'];
var CHECK_IDS = ['l_zipauto','f_zipauto','f_bench_auto','l_tax_on','l_reg_on','f_tax_on','f_reg_on','l_target_on','f_target_on'];

function save() {
  var data = { mode: mode, finUsed: finUsed, v: {} };
  var ids = LEASE_IDS.concat(FIN_IDS);
  for (var i = 0; i < ids.length; i++) data.v[ids[i]] = $(ids[i]).value;
  for (var t = 0; t < CHECK_IDS.length; t++) data[CHECK_IDS[t]] = $(CHECK_IDS[t]).checked;
  try { localStorage.setItem('qcc_v2', JSON.stringify(data)); } catch (e) {}
}

function load() {
  var raw = null;
  try { raw = localStorage.getItem('qcc_v2'); } catch (e) {}
  if (raw) {
    try {
      var data = JSON.parse(raw);
      var ids = LEASE_IDS.concat(FIN_IDS);
      for (var i = 0; i < ids.length; i++) {
        if (data.v && data.v[ids[i]] !== undefined) $(ids[i]).value = data.v[ids[i]];
      }
      for (var t = 0; t < CHECK_IDS.length; t++) {
        if (data[CHECK_IDS[t]] !== undefined) $(CHECK_IDS[t]).checked = data[CHECK_IDS[t]];
      }
      if (data.finUsed) setUsed(true);
      if (data.mode === 'finance') setMode('finance');
    } catch (e) {}
  }
  // Default ZIP to Irvine so tax + DMV fees are pre-dialed.
  if (!$('l_zip').value) $('l_zip').value = '92618';
  if (!$('f_zip').value) $('f_zip').value = '92618';
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
// Manual edits stop the ZIP/benchmark auto-fill from overwriting.
$('l_tax').addEventListener('input', function () { $('l_zipauto').checked = false; });
$('l_reg').addEventListener('input', function () { $('l_zipauto').checked = false; });
$('f_tax').addEventListener('input', function () { $('f_zipauto').checked = false; });
$('f_reg').addEventListener('input', function () { $('f_zipauto').checked = false; });
$('f_bench').addEventListener('input', function () { $('f_bench_auto').checked = false; });
// Keep the two ZIP fields in sync so location is set once.
$('l_zip').addEventListener('input', function () { $('f_zip').value = $('l_zip').value; });
$('f_zip').addEventListener('input', function () { $('l_zip').value = $('f_zip').value; });
for (var ci = 0; ci < CHECK_IDS.length; ci++) $(CHECK_IDS[ci]).addEventListener('change', recalc);

$('l_example').addEventListener('click', function () {
  $('l_zip').value = '92618'; $('f_zip').value = '92618';
  $('l_msrp').value = 58000; $('l_price').value = 52200; $('l_rebates').value = 1500;
  $('l_down').value = 0; $('l_mf').value = 0.00180; $('l_residual').value = 60;
  $('l_term').value = 36; $('l_acq').value = 695; $('l_doc').value = 85;
  $('l_target_on').checked = false; $('l_solvefor').value = 'down'; $('l_zipauto').checked = true;
  $('l_tax_on').checked = true; $('l_reg_on').checked = true;
  recalc();
});
$('l_reset').addEventListener('click', function () {
  for (var i = 0; i < LEASE_IDS.length; i++) $(LEASE_IDS[i]).value = '';
  $('l_zip').value = '92618'; $('l_rebates').value = 0; $('l_down').value = 0;
  $('l_acq').value = 695; $('l_doc').value = 85; $('l_tax').value = 7.75;
  $('l_term').value = 36; $('l_reg').value = 0;
  $('l_target_on').checked = false; $('l_solvefor').value = 'down'; $('l_zipauto').checked = true;
  $('l_tax_on').checked = true; $('l_reg_on').checked = true;
  recalc();
});
$('f_example').addEventListener('click', function () {
  setUsed(false);
  $('f_zip').value = '92618'; $('l_zip').value = '92618';
  $('f_msrp').value = 43000; $('f_price').value = 39900; $('f_rebates').value = 1000;
  $('f_trade').value = 0; $('f_down').value = 4000; $('f_apr').value = 5.9;
  $('f_term').value = 60; $('f_tier').value = 'prime'; $('f_addons').value = 0;
  $('f_doc').value = 85; $('f_exit').value = 24;
  $('f_target_on').checked = false; $('f_solvefor').value = 'down'; $('f_zipauto').checked = true;
  $('f_bench_auto').checked = true; $('f_tax_on').checked = true; $('f_reg_on').checked = true;
  recalc();
});
$('f_reset').addEventListener('click', function () {
  for (var i = 0; i < FIN_IDS.length; i++) $(FIN_IDS[i]).value = '';
  $('f_zip').value = '92618'; $('f_rebates').value = 0; $('f_trade').value = 0;
  $('f_down').value = 0; $('f_addons').value = 0; $('f_doc').value = 85; $('f_tax').value = 7.75;
  $('f_term').value = 60; $('f_tier').value = 'prime'; $('f_reg').value = 0;
  $('f_target_on').checked = false; $('f_solvefor').value = 'down'; $('f_zipauto').checked = true;
  $('f_bench_auto').checked = true; $('f_tax_on').checked = true; $('f_reg_on').checked = true;
  recalc();
});

load();
recalc();
</script>
</body>
</html>`;
