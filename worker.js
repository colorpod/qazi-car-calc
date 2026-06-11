// qazi-car-calc — lease + finance deal calculator with a deal-quality gauge.
// Single worker: serves the SPA at / and the shared math module at /calc.mjs.
// All scoring logic lives in calc.mjs (tested by tests/calc.test.mjs).

import CALC_SOURCE from './calc.mjs';

// Repo logo (128px PNG, suite house style) served at /icon.png + favicon.
const ICON_B64 = "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";

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
    if (url.pathname === '/icon.png' || url.pathname === '/favicon.ico' || url.pathname === '/apple-touch-icon.png') {
      return new Response(Uint8Array.from(atob(ICON_B64), c => c.charCodeAt(0)), {
        headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' },
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
<link rel="icon" type="image/png" href="/icon.png">
<link rel="apple-touch-icon" href="/icon.png">
<meta name="theme-color" content="#ec6204">
<style>
  :root {
    --bg: #0f1115; --card: #171a21; --card2: #1d212b; --line: #2a2f3a;
    --text: #e8eaf0; --muted: #9aa3b2; --accent: #f48120;
    --great: #22c55e; --good: #84cc16; --fair: #eab308; --weak: #f97316; --bad: #ef4444;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  /* Mobile-first: a single centered app column on every screen. */
  .wrap { max-width: 460px; margin: 0 auto; padding: 18px 14px 56px; }
  h1 { font-size: 22px; margin: 0; letter-spacing: -0.02em; }
  .brand { display: flex; align-items: center; gap: 11px; margin-bottom: 6px; }
  .brand-logo { width: 40px; height: 40px; border-radius: 10px; flex: none; box-shadow: 0 2px 8px rgba(0,0,0,0.35); }
  .sub { color: var(--muted); margin: 0 0 16px; font-size: 13px; line-height: 1.4; }
  .tabs { display: flex; gap: 8px; margin-bottom: 14px; }
  .tab { flex: 1; padding: 13px; text-align: center; background: var(--card);
    border: 1px solid var(--line); border-radius: 12px; cursor: pointer;
    font-weight: 700; font-size: 15px; color: var(--muted); user-select: none; }
  .tab.active { color: #14100b; border-color: var(--accent); background: var(--accent); }
  .grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 16px; }
  .card h2 { font-size: 12px; margin: 0 0 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .field { margin-bottom: 12px; }
  .field label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 5px; }
  .field input, .field select { width: 100%; padding: 12px 12px; background: var(--card2);
    border: 1px solid var(--line); border-radius: 10px; color: var(--text); font-size: 16px; }
  .field input:focus, .field select:focus { outline: none; border-color: var(--accent); }
  .hint { font-size: 11px; color: var(--muted); margin-top: 4px; line-height: 1.35; }
  .check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); margin: -2px 0 12px; }
  .check input { width: auto; width: 18px; height: 18px; accent-color: var(--accent); }
  .tlabel { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); margin-bottom: 5px; cursor: pointer; user-select: none; }
  .tlabel input { width: 18px; height: 18px; margin: 0; accent-color: var(--accent); }
  .field input.off, .field select.off { opacity: 0.4; }
  .field.off-field .hint { color: var(--weak); }
  .field input.req { border-color: var(--bad); background: rgba(239,68,68,0.07); }
  .btns { display: flex; gap: 8px; margin-top: 8px; }
  .btn { flex: 1; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--line);
    background: var(--card2); color: var(--muted); cursor: pointer; font-size: 14px; font-weight: 600; }
  .btn:active { background: var(--line); }
  .share-btn { width: 100%; margin-top: 14px; padding: 14px; font-size: 15px; font-weight: 800;
    color: #14100b; background: var(--accent); border: none; border-radius: 12px; cursor: pointer; }
  .share-btn:active { filter: brightness(0.92); }
  .share-btn:disabled { opacity: 0.45; cursor: default; background: var(--card2); color: var(--muted); }
  .share-note { text-align: center; font-size: 12px; color: var(--muted); margin: 7px 0 0; }
  /* Affordability hero */
  .afford { background: linear-gradient(160deg, #20242e, #191c24); border: 1px solid var(--line);
    border-radius: 14px; padding: 14px; margin-bottom: 13px; }
  .afford .lab { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .afford > input { width: 100%; padding: 13px 12px; background: var(--card); border: 1px solid var(--line);
    border-radius: 10px; color: var(--text); font-size: 18px; font-weight: 700; }
  .afford > input:focus { outline: none; border-color: var(--accent); }
  .levels { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; margin: 11px 0 4px; }
  .level { padding: 10px 6px; border-radius: 11px; border: 1px solid var(--line); background: var(--card);
    cursor: pointer; text-align: center; user-select: none; }
  .level .t { font-size: 13px; font-weight: 700; color: var(--text); }
  .level .s { font-size: 10px; color: var(--muted); margin-top: 2px; }
  .level.on { border-color: var(--accent); background: rgba(244,129,32,0.14); }
  .level.on .t { color: var(--accent); }
  .recbox { margin-top: 11px; background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    padding: 11px 12px; display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .recbox .rk { font-size: 12px; color: var(--muted); }
  .recbox .rv { font-size: 22px; font-weight: 800; color: var(--accent); }
  .recbox .rv small { font-size: 12px; color: var(--muted); font-weight: 600; }
  .readout { padding: 12px; background: var(--card2); border: 1px solid var(--line); border-radius: 10px; color: var(--text); font-size: 13px; min-height: 47px; display: flex; align-items: center; }
  .readout.muted { color: var(--muted); }
  .lever { background: var(--card2); border: 1px solid var(--line); border-radius: 12px; padding: 12px; margin-bottom: 12px; }
  .lever .leverrow { display: flex; gap: 8px; margin-top: 9px; }
  .lever input, .lever select { flex: 1; width: 100%; padding: 12px 11px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; color: var(--text); font-size: 16px; }
  .lever input:focus, .lever select:focus { outline: none; border-color: var(--accent); }
  .lever .off { opacity: 0.4; }
  .solvebox { background: rgba(244,129,32,0.08); border: 1px solid var(--accent); border-radius: 10px; padding: 11px 13px; margin-bottom: 12px; font-size: 13.5px; color: var(--text); line-height: 1.4; }
  .solvebox b { color: var(--accent); }
  .exitbox { background: var(--card2); border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 10px; padding: 12px 13px; margin-bottom: 12px; text-align: left; }
  .exit-h { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 9px; }
  .exit-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 14px; margin: 6px 0; }
  .exit-row span { color: var(--muted); }
  .exit-row b { color: var(--text); font-weight: 700; white-space: nowrap; }
  .exit-row small { color: var(--muted); font-weight: 500; font-size: 11px; }
  .exit-note { font-size: 12px; color: var(--muted); margin-top: 9px; line-height: 1.45; }
  .gaugebox { text-align: center; }
  .gauge-wrap { position: relative; width: 100%; max-width: 340px; margin: 0 auto 12px; }
  .gauge-wrap svg { display: block; width: 100%; }
  .v-great { color: var(--great); } .v-good { color: var(--good); } .v-fair { color: var(--fair); }
  .v-weak { color: var(--weak); } .v-bad { color: var(--bad); }
  .bignums { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 13px; }
  .bignum { background: var(--card2); border: 1px solid var(--line); border-radius: 12px; padding: 11px 8px; text-align: center; }
  .bignum .k { font-size: 10.5px; color: var(--muted); }
  .bignum .v { font-size: 17px; font-weight: 800; margin-top: 3px; letter-spacing: -0.01em; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 14px; }
  .chip { font-size: 12px; padding: 5px 11px; border-radius: 99px; border: 1px solid var(--line); color: var(--muted); }
  /* Terse score rows */
  .comp { margin-bottom: 9px; }
  .comp .top { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; margin-bottom: 5px; }
  .comp .top .lbl { color: var(--text); }
  .comp .top .sc { font-weight: 800; font-size: 14px; }
  .bar { height: 8px; background: var(--card2); border-radius: 99px; overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 99px; }
  .flag { padding: 11px 13px; border-radius: 10px; font-size: 13.5px; margin-bottom: 8px; border: 1px solid; line-height: 1.4; }
  .f-critical { border-color: var(--bad); color: #fca5a5; background: rgba(239,68,68,0.08); }
  .f-warn { border-color: var(--weak); color: #fdba74; background: rgba(249,115,22,0.07); }
  .f-info { border-color: #3b82f6; color: #93c5fd; background: rgba(59,130,246,0.07); }
  .empty { color: var(--muted); text-align: center; padding: 30px 14px; font-size: 14px; line-height: 1.5; }
  .empty.req { color: #fca5a5; border: 1px dashed var(--bad); border-radius: 12px; background: rgba(239,68,68,0.05); }
  .empty.req b { color: #fecaca; }
  details { margin-top: 14px; color: var(--muted); font-size: 13px; }
  details summary { cursor: pointer; color: var(--muted); font-weight: 600; font-size: 12px; }
  details li { margin: 6px 0; }
  .foot { color: var(--muted); font-size: 11.5px; margin-top: 20px; text-align: center; line-height: 1.45; }
  .seg { display: flex; gap: 0; margin-bottom: 12px; border: 1px solid var(--line); border-radius: 11px; overflow: hidden; }
  .seg button { flex: 1; padding: 12px 8px; background: var(--card2); color: var(--muted); border: none; cursor: pointer; font-size: 14px; font-weight: 700; }
  .seg button.on { background: var(--accent); color: #14100b; }
  .hidden { display: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="brand"><img class="brand-logo" src="/icon.png" alt="Car Deal Gauge" width="46" height="46"><h1>Car Deal Gauge</h1></div>
  <p class="sub">Score any car deal 0-100. Enter your income and the dealer's numbers; tax, DMV fees, and market APR auto-fill from your ZIP and credit.</p>

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
        <div class="afford">
          <div class="lab">Gross monthly income</div>
          <input id="f_income" type="text" inputmode="numeric" placeholder="$10,000">
          <div class="field" style="margin:11px 0 0"><label>Current car payments + insurance ($/mo)</label><input id="f_existing" type="text" inputmode="numeric" placeholder="0 — blank if this is your only car"></div>
          <div class="levels">
            <div class="level" data-level="conservative"><div class="t">Conservative</div><div class="s">Safe</div></div>
            <div class="level" data-level="comfortable"><div class="t">Comfortable</div><div class="s">Balanced</div></div>
            <div class="level" data-level="aggressive"><div class="t">Aggressive</div><div class="s">Car guy</div></div>
          </div>
          <input type="hidden" id="f_level" value="">
          <div class="row" style="margin:12px 0 0;align-items:end">
            <div class="field" style="margin:0"><label>Target monthly payment $</label><input id="f_target" type="number" step="10" placeholder="auto"></div>
            <div class="field" style="margin:0"><label>Then solve for</label><select id="f_solvefor">
              <option value="price">Max car price</option>
              <option value="down">Down payment</option>
            </select></div>
          </div>
          <div class="hint" id="f_target_hint">Pick a level (or type a payment) and we solve what you can afford.</div>
        </div>
        <div class="row">
          <div class="field"><label>ZIP code</label><input id="f_zip" type="text" inputmode="numeric" maxlength="5" placeholder="92618"></div>
          <div class="field"><label>Detected location</label><div id="f_loc" class="readout">—</div></div>
        </div>
        <div class="seg">
          <button id="f_new">New car</button>
          <button id="f_used" class="on">Used car</button>
        </div>
        <div class="row">
          <div class="field"><label id="f_msrp_label">Fair market value (KBB/Edmunds) $</label><input id="f_msrp" type="number" step="100" placeholder="22000"></div>
          <div class="field"><label id="f_price_label">Negotiated price $</label><input id="f_price" type="number" step="100" placeholder="20000"></div>
        </div>
        <div class="row">
          <div class="field"><label>APR %</label><input id="f_apr" type="number" step="0.05" placeholder="required"><div class="hint" id="f_apr_hint">Required — use the lender's real rate.</div></div>
          <div class="field"><label>Term (months)</label><select id="f_term">
            <option>36</option><option>48</option><option selected>60</option><option>72</option><option>84</option>
          </select></div>
        </div>
        <div class="row">
          <div class="field"><label>Your credit tier</label><select id="f_tier">
            <option value="superprime">Super prime (781+)</option>
            <option value="prime" selected>Prime (661-780)</option>
            <option value="nearprime">Near prime (601-660)</option>
            <option value="subprime">Subprime (501-600)</option>
            <option value="deepsub">Deep subprime (&lt;501)</option>
          </select></div>
          <div class="field"><label>Benchmark APR % (bank avg)</label><input id="f_bench" type="number" step="0.1"><div class="hint" id="f_bench_hint">Auto-filled for your tier/term.</div></div>
        </div>
        <div class="row">
          <div class="field"><label id="f_down_label">Down payment $</label><input id="f_down" type="number" step="100" value="0"></div>
          <div class="field"><label>Trade-in equity $</label><input id="f_trade" type="number" step="100" value="0"><div class="hint">Negative if you owe more than it's worth.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Rebates / incentives $</label><input id="f_rebates" type="number" step="100" value="0"><div class="hint">Taxed before rebates in most states.</div></div>
          <div class="field"><label>Dealer add-ons $</label><input id="f_addons" type="number" step="50" value="0"><div class="hint">Etch, nitrogen, "protection". $0.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Doc fee $</label><input id="f_doc" type="number" step="5" value="85"><div class="hint" id="f_doc_hint">CA legal max is $85.</div></div>
          <div class="field"><label class="tlabel"><input id="f_tax_on" type="checkbox" checked> Sales tax %</label><input id="f_tax" type="number" step="0.05" value="7.75"><div class="hint">Uncheck to exclude.</div></div>
        </div>
        <div class="row">
          <div class="field"><label class="tlabel"><input id="f_reg_on" type="checkbox" checked> Registration &amp; DMV fees $</label><input id="f_reg" type="number" step="5" value="0"><div class="hint">Title, plates, VLF.</div></div>
          <div class="field"><label>Sell / pay off after (mo)</label><input id="f_exit" type="number" step="6" placeholder="e.g. 24"><div class="hint">Interest by then vs full loan.</div></div>
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
      <button class="share-btn" id="share_btn" disabled>&#8595;&nbsp; Download offer image</button>
      <p class="share-note">A clean snapshot of these exact numbers to send the dealer.</p>
    </div>
  </div>

  <p class="foot">Tax + DMV fees and the doc-fee cap come from your ZIP's state (California metros are rate-accurate; other states use a representative combined rate). Lease payments and cap-cost reduction are taxed; tax applies before rebates; most states credit a trade-in against tax (CA does not). Benchmarks are editable estimates, not quotes. Not financial advice; it is a negotiation gut-check.</p>
</div>

<script type="module">
import { CONFIG, estimateRegistration, resolveZip, marketApr, bestBankApr, solveLeasePrice, solveFinancePrice, solveLeaseDown, solveFinanceDown, financeEarlyExit, affordabilityPayment, AFFORDABILITY, scoreLease, scoreFinance } from '/calc.mjs';

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
function parseMoney(id) { var v = ($(id).value || '').replace(/[^0-9.]/g, ''); var n = parseFloat(v); return isFinite(n) ? n : 0; }

// Income + appetite level (minus existing car costs) -> target payment + highlights.
function applyAffordability() {
  var income = parseMoney('f_income');
  var existing = parseMoney('f_existing');
  var level = $('f_level').value;
  var nodes = document.querySelectorAll('#pane-finance .level');
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].classList.toggle('on', nodes[i].getAttribute('data-level') === level);
  }
  var budget = 0, target = null, overBudget = false;
  if (income > 0 && level) {
    budget = Math.round(income * AFFORDABILITY[level].pct);
    target = affordabilityPayment(income, level, existing);
    if (target > 0) { $('f_target').value = target; }
    else { overBudget = true; $('f_target').value = ''; }
  }
  return { income: income, existing: existing, level: level, budget: budget, target: target, overBudget: overBudget };
}

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
    html += '<div class="comp"><div class="top"><span class="lbl">' + comp.label +
      '</span><span class="sc" style="color:' + col + '">' + Math.round(comp.score) + '</span></div>' +
      '<div class="bar"><i style="width:' + Math.max(2, comp.score) + '%;background:' + col + '"></i></div></div>';
  }
  html += '</div>';
  $('results').innerHTML = html;
}

// ---------------------------------------------------- shareable offer card ----
var SHARE = { bg: '#0f1115', panel: '#1d212b', line: '#2a2f3a', text: '#e8eaf0', muted: '#9aa3b2', accent: '#f48120' };
var VCOL = { great: '#22c55e', good: '#84cc16', fair: '#eab308', weak: '#f97316', bad: '#ef4444' };
var shareData = null;
var ICON_DATAURL = null;

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function setShare(d) { shareData = d; var b = $('share_btn'); if (b) b.disabled = !d; }

function shareRows(d) {
  var rows = [], i = d.inputs, q = d.q;
  if (d.type === 'finance') {
    var taxTotal = q.salesTax + (q.docWithTax - i.docFee);
    var outDoor = q.amountFinanced + i.down + i.rebates + i.tradeEquity;
    rows.push(['Vehicle price', money(i.price)]);
    rows.push(['Doc fee', money(i.docFee)]);
    rows.push(['Sales tax (' + i.taxPct.toFixed(2) + '%)', money(taxTotal)]);
    rows.push(['Registration / DMV fees', money(i.govFees)]);
    if (i.addons > 0) rows.push(['Dealer add-ons', money(i.addons)]);
    rows.push(['Out-the-door price', money(outDoor), 'mid']);
    if (i.down > 0) rows.push(['Down payment', '- ' + money(i.down)]);
    if (i.rebates > 0) rows.push(['Rebates / incentives', '- ' + money(i.rebates)]);
    if (i.tradeEquity) rows.push(['Trade-in equity', (i.tradeEquity >= 0 ? '- ' : '+ ') + money(Math.abs(i.tradeEquity))]);
    rows.push(['Amount financed', money(q.amountFinanced), 'mid']);
    rows.push(['Rate / term', i.apr.toFixed(2) + '% APR   ' + i.term + ' mo']);
    rows.push(['Monthly payment', money2(q.monthly), 'big']);
    rows.push(['Total interest', money(q.totalInterest)]);
    rows.push(['Total of payments', money(q.totalPayments)]);
  } else {
    rows.push(['MSRP', money(i.msrp)]);
    rows.push(['Selling price', money(i.price)]);
    rows.push(['Money factor', i.mf.toFixed(5) + '  (' + q.mfApr.toFixed(2) + '% APR)']);
    rows.push(['Residual', i.residualPct.toFixed(0) + '%  (' + money(q.residualDollar) + ')']);
    rows.push(['Term', i.term + ' mo']);
    if (i.down > 0) rows.push(['Down / cap reduction', money(i.down)]);
    rows.push(['Acquisition fee', money(i.acqFee)]);
    rows.push(['Doc fee', money(i.docFee)]);
    rows.push(['Sales tax', i.taxPct.toFixed(2) + '%']);
    rows.push(['Monthly (with tax)', money2(q.payment), 'big']);
    rows.push(['Due at signing', money(q.driveOff)]);
    rows.push(['Effective $/mo all-in', money2(q.effectiveMonthly)]);
    rows.push(['Total lease cost', money(q.totalCost), 'mid']);
  }
  return rows;
}

function buildShareSvg(d) {
  var W = 800, padX = 48, rowH = 44, top = 212;
  var rows = shareRows(d);
  var H = top + rows.length * rowH + 96 + (d.type === 'finance' && d.bestBank != null ? 28 : 0);
  var v = d.res.verdict, vc = VCOL[v.tone];
  var dealType = d.type === 'finance' ? ('Finance · ' + (d.finUsed ? 'Used' : 'New') + ' car') : 'Lease';
  var locline = dealType + (d.region ? '   ·   ' + d.region : '');
  var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  var lx = padX + (ICON_DATAURL ? 70 : 0);
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
  s += '<rect width="' + W + '" height="' + H + '" fill="' + SHARE.bg + '"/>';
  s += '<rect width="' + W + '" height="6" fill="' + SHARE.accent + '"/>';
  if (ICON_DATAURL) s += '<image href="' + ICON_DATAURL + '" x="' + padX + '" y="38" width="54" height="54"/>';
  s += '<text x="' + lx + '" y="66" fill="' + SHARE.text + '" font-family="sans-serif" font-size="27" font-weight="800">Car Deal Gauge</text>';
  s += '<text x="' + lx + '" y="90" fill="' + SHARE.muted + '" font-family="sans-serif" font-size="14">Offer summary · ' + esc(date) + '</text>';
  s += '<text x="' + (W - padX) + '" y="60" text-anchor="end" fill="' + vc + '" font-family="sans-serif" font-size="40" font-weight="800">' + d.res.score + '<tspan font-size="16" fill="' + SHARE.muted + '">/100</tspan></text>';
  s += '<text x="' + (W - padX) + '" y="86" text-anchor="end" fill="' + vc + '" font-family="sans-serif" font-size="15" font-weight="800" letter-spacing="1">' + esc(v.label) + '</text>';
  s += '<text x="' + padX + '" y="134" fill="' + SHARE.muted + '" font-family="sans-serif" font-size="15">' + esc(locline) + '</text>';
  if (d.type === 'finance' && d.affLabel) {
    s += '<text x="' + padX + '" y="160" fill="' + SHARE.accent + '" font-family="sans-serif" font-size="14" font-weight="700">' + esc(d.affLabel) + ' budget' + (d.target > 0 ? '  ·  target ' + money(d.target) + '/mo' : '') + '</text>';
  }
  s += '<line x1="' + padX + '" y1="180" x2="' + (W - padX) + '" y2="180" stroke="' + SHARE.line + '"/>';
  var y = top;
  for (var r = 0; r < rows.length; r++) {
    var lab = rows[r][0], val = rows[r][1], emph = rows[r][2];
    var big = emph === 'big', mid = emph === 'mid';
    if (big || mid) s += '<rect x="' + (padX - 14) + '" y="' + (y - 27) + '" width="' + (W - 2 * padX + 28) + '" height="' + (rowH - 4) + '" rx="9" fill="' + SHARE.panel + '"/>';
    s += '<text x="' + padX + '" y="' + y + '" fill="' + (big ? SHARE.text : SHARE.muted) + '" font-family="sans-serif" font-size="' + (big ? 17 : 15) + '" font-weight="' + (big ? 700 : 400) + '">' + esc(lab) + '</text>';
    s += '<text x="' + (W - padX) + '" y="' + y + '" text-anchor="end" fill="' + (big ? vc : SHARE.text) + '" font-family="sans-serif" font-size="' + (big ? 21 : mid ? 17 : 16) + '" font-weight="' + (big ? 800 : mid ? 700 : 500) + '">' + esc(val) + '</text>';
    y += rowH;
  }
  if (d.type === 'finance' && d.bestBank != null) {
    y += 4;
    s += '<text x="' + padX + '" y="' + y + '" fill="' + SHARE.muted + '" font-family="sans-serif" font-size="13">Market check: bank APR for this credit/term ~' + d.benchAvg.toFixed(1) + '%, top banks ~' + d.bestBank.toFixed(1) + '%.</text>';
    y += 20;
  }
  s += '<line x1="' + padX + '" y1="' + (H - 50) + '" x2="' + (W - padX) + '" y2="' + (H - 50) + '" stroke="' + SHARE.line + '"/>';
  s += '<text x="' + padX + '" y="' + (H - 26) + '" fill="' + SHARE.muted + '" font-family="sans-serif" font-size="12">Estimate only, not an offer · Car Deal Gauge — qazi-car-calc.waqasqazi.workers.dev</text>';
  s += '</svg>';
  return { svg: s, w: W, h: H };
}

// Cache the logo as a data URL so it embeds in the rasterized PNG.
function ensureIcon(cb) {
  if (ICON_DATAURL !== null) return cb();
  fetch('/icon.png').then(function (r) { return r.blob(); }).then(function (b) {
    var fr = new FileReader();
    fr.onload = function () { ICON_DATAURL = fr.result; cb(); };
    fr.onerror = function () { ICON_DATAURL = ''; cb(); };
    fr.readAsDataURL(b);
  }).catch(function () { ICON_DATAURL = ''; cb(); });
}

function downloadShare() {
  if (!shareData) return;
  ensureIcon(function () {
    var built = buildShareSvg(shareData);
    var url = URL.createObjectURL(new Blob([built.svg], { type: 'image/svg+xml;charset=utf-8' }));
    var img = new Image();
    img.onload = function () {
      var scale = 2;
      var c = document.createElement('canvas');
      c.width = built.w * scale; c.height = built.h * scale;
      var ctx = c.getContext('2d'); ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob(function (png) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(png);
        a.download = 'car-deal-offer.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      }, 'image/png');
    };
    img.onerror = function () { URL.revokeObjectURL(url); alert('Could not generate the image.'); };
    img.src = url;
  });
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

// Make whichever field is being solved (price OR down) read-only + dimmed, the
// other editable, and relabel both.
function applySolveFields(prefix, on, solveFor) {
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
}

// Lease lever: the checkbox enables the target + solve-for controls.
function setTargetUI(prefix, on, solveFor) {
  var t = $(prefix + '_target');
  t.disabled = !on; t.classList.toggle('off', !on);
  var sel = $(prefix + '_solvefor');
  sel.disabled = !on; sel.classList.toggle('off', !on);
  applySolveFields(prefix, on, solveFor);
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
    setShare(null);
    $('results').innerHTML = '<div class="empty">' + (note ? '<div class="solvebox" style="text-align:left">' + note + '</div>' : '') +
      'Enter MSRP, ' + (targetOn ? 'target payment' : 'selling price') + ', money factor, residual, and term.</div>';
    return;
  }
  var q = res.quote;
  setShare({ type: 'lease', inputs: inputs, q: q, res: res, region: loc ? loc.region : '' });
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
  var aff = applyAffordability();
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

  var bestBank = bestBankApr(finUsed, $('f_tier').value, num('f_term'));
  if ($('f_bench_auto').checked) {
    var b = marketApr(finUsed, $('f_tier').value, num('f_term'));
    if (b != null) $('f_bench').value = b;
  }
  $('f_bench_hint').textContent = 'Mainstream-bank avg (' + CONFIG.benchmarksLenders + ') for your tier/term.' +
    (bestBank != null ? ' Top banks: ~' + bestBank.toFixed(1) + '%.' : '') + ' Override with a quote.';

  var solveFor = $('f_solvefor').value;
  var targetOn = $('f_target').value.trim() !== '' && num('f_target') > 0;
  applySolveFields('f', targetOn, solveFor);
  if (aff.overBudget) {
    $('f_target_hint').textContent = 'Your ' + money(aff.existing) + '/mo in current car costs already use your ' +
      AFFORDABILITY[aff.level].label + ' budget (' + money(aff.budget) + '). Pick a higher appetite or trim costs.';
  } else {
    $('f_target_hint').textContent = targetOn
      ? (solveFor === 'price' ? 'We solve the highest car price for this payment.' : 'Enter the car price; we solve the down payment for this payment.')
      : 'Pick a level (or type a payment) and we solve what you can afford.';
  }

  // APR is required — without it the math assumes 0% and shows a fake great deal.
  var aprRaw = $('f_apr').value.trim();
  var aprEntered = aprRaw !== '' && isFinite(parseFloat(aprRaw));
  $('f_apr').classList.toggle('req', !aprEntered);
  if (!aprEntered) {
    // Don't show any solved figure without an APR.
    if (targetOn && solveFor === 'price') $('f_price').value = '';
    if (targetOn && solveFor === 'down') $('f_down').value = '';
    setShare(null);
    $('results').innerHTML = '<div class="empty req"><b>Enter the APR</b> to see your numbers.<br>Without it the math assumes 0% and shows a fake great deal — put in the lender\\'s real rate.</div>';
    return;
  }

  var affNote = '';
  if (aff.income > 0 && aff.level && num('f_target') > 0) {
    affNote = '<b>' + AFFORDABILITY[aff.level].label + '</b> · ' + money(num('f_target')) + '/mo for this car' +
      (aff.existing > 0 ? ' (after ' + money(aff.existing) + '/mo current cars)' : '') + '. ';
  }
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
      note = affNote + 'At ' + money(num('f_target')) + '/mo you can afford about <b>' + money(solved) + '</b> (before tax + fees).';
    } else {
      $('f_price').value = '';
      note = 'That payment is not reachable with these terms. Raise the down, extend the term, or lift the target.';
    }
  } else if (targetOn && solveFor === 'down') {
    var dn = solveFinanceDown({
      price: num('f_price'), docFee: num('f_doc'), govFees: govFees, addons: num('f_addons'),
      rebates: num('f_rebates'), tradeEquity: num('f_trade'), taxPct: taxPct,
      apr: num('f_apr'), term: num('f_term'), taxTradeCredit: tradeCredit,
    }, num('f_target'));
    if (dn == null) {
      note = affNote + 'Enter the car price and we solve the down payment to hit this payment.';
    } else if (dn <= 0) {
      $('f_down').value = 0;
      note = affNote + 'At ' + money(num('f_target')) + '/mo you need <b>$0 down</b> — even nothing down lands under it.';
    } else {
      $('f_down').value = Math.round(dn);
      note = affNote + 'To hit ' + money(num('f_target')) + '/mo on this car, put about <b>' + money(dn) + '</b> down.';
    }
  }

  var priceVal = num('f_price');
  var inputs = {
    isUsed: finUsed, msrp: num('f_msrp') > 0 ? num('f_msrp') : priceVal, price: priceVal,
    rebates: num('f_rebates'), tradeEquity: num('f_trade'), down: num('f_down'), apr: num('f_apr'),
    term: num('f_term'), benchmarkApr: num('f_bench'), docFee: num('f_doc'),
    govFees: govFees, addons: num('f_addons'), taxPct: taxPct,
    docFeeCap: docCap, stateLabel: stateLabel, taxTradeCredit: tradeCredit,
  };
  var res = scoreFinance(inputs);
  if (!res) {
    setShare(null);
    $('results').innerHTML = '<div class="empty">' + (note ? '<div class="solvebox" style="text-align:left">' + note + '</div>' : '') +
      'Enter the car&rsquo;s price' + (finUsed ? ' and market value' : '') + ' to see the score.</div>';
    return;
  }
  var q = res.quote;
  setShare({ type: 'finance', finUsed: finUsed, region: loc ? loc.region : '', inputs: inputs, q: q, res: res,
    bestBank: bestBank, benchAvg: inputs.benchmarkApr,
    affLabel: (aff.income > 0 && aff.level) ? AFFORDABILITY[aff.level].label : '',
    target: targetOn ? num('f_target') : 0 });
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
  var finChips = [
    'Out the door ' + money(q.amountFinanced + inputs.down + inputs.rebates + inputs.tradeEquity),
    'LTV ' + q.ltv.toFixed(0) + '%',
  ];
  if (bestBank != null) finChips.push('Top-bank rate ' + bestBank.toFixed(1) + '%');
  renderResult(res, [
    ['Monthly payment', money2(q.monthly)],
    ['Amount financed', money(q.amountFinanced)],
    ['Total interest', money(q.totalInterest)],
  ], finChips, note, exitHtml);
}

function recalc() {
  if (mode === 'lease') recalcLease(); else recalcFinance();
  save();
}

// ------------------------------------------------------------- wiring ----
var LEASE_IDS = ['l_zip','l_target','l_solvefor','l_msrp','l_price','l_rebates','l_down','l_mf','l_residual','l_term','l_miles','l_acq','l_doc','l_reg','l_tax'];
var FIN_IDS = ['f_income','f_existing','f_level','f_target','f_solvefor','f_zip','f_msrp','f_price','f_apr','f_term','f_tier','f_bench','f_down','f_trade','f_rebates','f_addons','f_doc','f_reg','f_tax','f_exit'];
var CHECK_IDS = ['l_zipauto','f_zipauto','f_bench_auto','l_tax_on','l_reg_on','f_tax_on','f_reg_on','l_target_on'];

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
      if (data.finUsed === false) setUsed(false); else setUsed(true);
      if (data.mode === 'lease') setMode('lease'); else setMode('finance');
    } catch (e) {}
  } else {
    // First visit: default to Finance + Used car.
    setUsed(true);
    setMode('finance');
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
$('share_btn').addEventListener('click', downloadShare);
$('f_new').addEventListener('click', function () { setUsed(false); recalc(); });
$('f_used').addEventListener('click', function () { setUsed(true); recalc(); });

// A manually typed payment overrides the affordability level (clear before recalc).
$('f_target').addEventListener('input', function () { $('f_level').value = ''; });

var all = LEASE_IDS.concat(FIN_IDS);
for (var i = 0; i < all.length; i++) {
  $(all[i]).addEventListener('input', recalc);
  $(all[i]).addEventListener('change', recalc);
}
// Affordability level buttons.
var levelEls = document.querySelectorAll('#pane-finance .level');
for (var li = 0; li < levelEls.length; li++) {
  levelEls[li].addEventListener('click', function () {
    $('f_level').value = this.getAttribute('data-level');
    recalc();
  });
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
  setUsed(true);
  $('f_zip').value = '92618'; $('l_zip').value = '92618';
  $('f_income').value = ''; $('f_existing').value = ''; $('f_level').value = ''; $('f_target').value = '';
  $('f_msrp').value = 22000; $('f_price').value = 20000; $('f_rebates').value = 0;
  $('f_trade').value = 0; $('f_down').value = 3000; $('f_apr').value = 8.4;
  $('f_term').value = 60; $('f_tier').value = 'prime'; $('f_addons').value = 0;
  $('f_doc').value = 85; $('f_exit').value = 24;
  $('f_solvefor').value = 'price'; $('f_zipauto').checked = true;
  $('f_bench_auto').checked = true; $('f_tax_on').checked = true; $('f_reg_on').checked = true;
  recalc();
});
$('f_reset').addEventListener('click', function () {
  for (var i = 0; i < FIN_IDS.length; i++) $(FIN_IDS[i]).value = '';
  setUsed(true);
  $('f_zip').value = '92618'; $('f_rebates').value = 0; $('f_trade').value = 0;
  $('f_down').value = 0; $('f_addons').value = 0; $('f_doc').value = 85; $('f_tax').value = 7.75;
  $('f_term').value = 60; $('f_tier').value = 'prime'; $('f_reg').value = 0;
  $('f_solvefor').value = 'price'; $('f_zipauto').checked = true;
  $('f_bench_auto').checked = true; $('f_tax_on').checked = true; $('f_reg_on').checked = true;
  recalc();
});

load();
recalc();
</script>
</body>
</html>`;
