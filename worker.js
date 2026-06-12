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

  /* Launch concierge */
  .prewizard .tabs, .prewizard .grid, .prewizard .foot { display: none; }
  .wizard { background: #151820; border: 1px solid rgba(244,129,32,0.42); box-shadow: 0 18px 44px rgba(0,0,0,0.28); }
  .wizard-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
  .wizard-kicker { color: var(--accent); font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
  .wizard-title { font-size: 22px; font-weight: 900; letter-spacing: -0.03em; line-height: 1.02; }
  .wizard-copy { color: var(--muted); font-size: 12.5px; line-height: 1.38; margin-top: 7px; }
  .wizard-toggle { flex: none; padding: 9px 11px; border-radius: 999px; border: 1px solid var(--line); background: var(--card2); color: var(--muted); font-size: 12px; font-weight: 800; cursor: pointer; }
  .wizard-toggle.on { background: rgba(244,129,32,0.16); border-color: var(--accent); color: var(--accent); }
  .wizard-body.hidden { display: none; }
  .wprogress { height: 6px; background: rgba(15,17,21,0.72); border: 1px solid var(--line); border-radius: 999px; overflow: hidden; margin: 4px 0 14px; }
  .wprogress i { display: block; height: 100%; width: 14%; background: var(--accent); border-radius: 999px; transition: width 0.18s ease; }
  .wstep { display: none; margin-top: 13px; min-height: 226px; }
  .wstep.active { display: block; }
  .wlabel { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--text); font-size: 13px; font-weight: 800; margin-bottom: 8px; }
  .wlabel small { color: var(--muted); font-weight: 600; }
  .choicegrid { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .choicegrid.three { grid-template-columns: 1fr 1fr 1fr; }
  .choice { padding: 12px 9px; border-radius: 12px; border: 1px solid var(--line); background: #171a21; color: var(--text); cursor: pointer; text-align: center; font-weight: 850; font-size: 13px; }
  .choice small { display: block; margin-top: 3px; color: var(--muted); font-size: 10px; font-weight: 650; }
  .choice.on { border-color: var(--accent); background: rgba(244,129,32,0.18); color: var(--accent); }
  .wizard input, .wizard select { width: 100%; padding: 12px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; color: var(--text); font-size: 16px; }
  .wizard input:focus, .wizard select:focus { outline: none; border-color: var(--accent); }
  .wizard .row { margin-bottom: 0; }
  .wizard-summary { margin-top: 13px; background: #0f1115; border: 1px solid var(--line); border-radius: 13px; padding: 12px; }
  .wizard-summary .big { font-size: 24px; color: var(--accent); font-weight: 950; letter-spacing: -0.02em; }
  .wizard-summary .muted { color: var(--muted); font-size: 12px; line-height: 1.4; }
  .wizard-nav { display: flex; gap: 8px; margin-top: 12px; }
  .wizard-nav .back-btn { flex: 0.72; padding: 14px; border-radius: 13px; border: 1px solid var(--line); background: var(--card2); color: var(--muted); font-size: 14px; font-weight: 850; cursor: pointer; }
  .start-btn { flex: 1.4; width: 100%; padding: 15px; border-radius: 13px; border: none; background: var(--accent); color: #14100b; font-size: 16px; font-weight: 950; cursor: pointer; }
  .start-btn:active, .wizard-nav .back-btn:active { filter: brightness(0.92); }
  .start-btn:disabled, .wizard-nav .back-btn:disabled { opacity: 0.45; cursor: default; background: var(--card2); color: var(--muted); }
  .hidden { display: none; }
</style>
</head>
<body>
<div class="wrap prewizard" id="app_wrap">
  <div class="brand"><img class="brand-logo" src="/icon.png" alt="Car Deal Gauge" width="46" height="46"><h1>Car Deal Gauge</h1></div>
  <p class="sub">Score any car deal 0-100. Enter your income and the dealer's numbers; tax, DMV fees, and market APR auto-fill from your ZIP and credit.</p>

  <div class="card wizard" id="wizard-card">
    <div class="wizard-head">
      <div>
        <div class="wizard-kicker">Quick setup</div>
        <div class="wizard-title">Build my car budget</div>
        <div class="wizard-copy">Answer a few things and I'll pre-fill the calculator: lease/buy, income, credit, comfort level, down payment, ZIP, and car.</div>
      </div>
      <button class="wizard-toggle on" id="wiz_toggle" type="button">Hide</button>
    </div>
    <div class="wizard-body" id="wiz_body">
      <div class="wprogress"><i id="wiz_progress"></i></div>
      <div class="wstep active" data-step="0">
        <div class="wlabel">1. What are you trying to do?</div>
        <div class="choicegrid three" id="wiz_deal_choices">
          <button class="choice on" type="button" data-deal="lease">Lease<small>new car</small></button>
          <button class="choice" type="button" data-deal="new">Buy new<small>finance</small></button>
          <button class="choice" type="button" data-deal="used">Buy used<small>finance</small></button>
        </div>
      </div>
      <div class="wstep" data-step="1">
        <div class="wlabel">2. What's your monthly gross income?</div>
        <div class="field"><input id="wiz_income" type="text" inputmode="numeric" placeholder="$10,000"></div>
      </div>
      <div class="wstep" data-step="2">
        <div class="wlabel">3. How much are you already paying for cars?</div>
        <div class="field"><input id="wiz_existing" type="text" inputmode="numeric" placeholder="0 — include payments + insurance"><div class="hint">This comes off the budget first. Three other cars changes the answer.</div></div>
      </div>
      <div class="wstep" data-step="3">
        <div class="wlabel">4. What's your credit score?</div>
        <div class="field"><input id="wiz_credit" type="number" inputmode="numeric" placeholder="720"></div>
      </div>
      <div class="wstep" data-step="4">
        <div class="wlabel">5. What monthly payment feels right? <small>customizable</small></div>
        <div class="choicegrid three" id="wiz_level_choices">
          <button class="choice" type="button" data-level="conservative">Conservative<small>safe</small></button>
          <button class="choice on" type="button" data-level="comfortable">Comfortable<small>balanced</small></button>
          <button class="choice" type="button" data-level="aggressive">Aggressive<small>car guy</small></button>
        </div>
        <div class="wizard-summary">
          <div class="muted">Suggested target payment after current cars</div>
          <div class="big" id="wiz_target_big">—</div>
          <div class="muted" id="wiz_avg_note">Enter income, current car costs, and credit to see the target and market average.</div>
          <div class="field" style="margin:10px 0 0"><label>Want less or more? Override target payment</label><input id="wiz_target" type="number" step="10" placeholder="optional"></div>
        </div>
      </div>
      <div class="wstep" data-step="5">
        <div class="wlabel">6. What are you comfortable putting down?</div>
        <div class="field"><input id="wiz_down" type="number" step="100" placeholder="0 or skip"></div>
      </div>
      <div class="wstep" data-step="6">
        <div class="wlabel">7. What's your ZIP code?</div>
        <div class="field"><input id="wiz_zip" type="text" inputmode="numeric" maxlength="5" placeholder="92618"><div class="hint">ZIP sets tax, DMV estimate, and doc-fee rules.</div></div>
      </div>
      <div class="wstep" data-step="7">
        <div class="wlabel">8. Pick a car <small>or skip</small></div>
        <div class="field"><select id="wiz_vehicle"><option value="">Pick make / model — or skip</option></select></div>
      </div>
      <div class="wizard-nav">
        <button class="back-btn" id="wiz_back" type="button">Back</button>
        <button class="start-btn" id="wiz_next" type="button">Next</button>
      </div>
    </div>
  </div>


  <div class="tabs">
    <div class="tab active" id="tab-lease">Lease</div>
    <div class="tab" id="tab-finance">Finance</div>
  </div>

  <div class="grid">
    <div class="card">
      <h2 id="inputs-title">Lease inputs</h2>

      <div id="pane-lease">
        <div class="field"><label>Pick a vehicle (optional)</label><select id="l_vehicle"><option value="">— choose make / model —</option></select><div class="hint">Fills MSRP, money factor + residual (typical 36mo/12k, confirm with the dealer).</div></div>
        <div class="row">
          <div class="field"><label>ZIP code</label><input id="l_zip" type="text" inputmode="numeric" maxlength="5" placeholder="92618"></div>
          <div class="field"><label>Detected location</label><div id="l_loc" class="readout">—</div></div>
        </div>
        <div class="afford">
          <div class="lab">Target monthly payment (optional)</div>
          <div class="field" style="margin:0 0 9px"><input id="l_target" type="number" step="10" placeholder="$/mo cap"></div>
          <div class="field" style="margin:0"><label>Then solve for</label><select id="l_solvefor">
            <option value="down">Find down payment</option>
            <option value="price">Find max price</option>
          </select></div>
          <div class="hint" id="l_target_hint">Lock a payment and we solve the rest. Blank = score a deal you already have.</div>
        </div>
        <div class="row">
          <div class="field"><label>MSRP (sticker) $</label><input id="l_msrp" type="number" step="100" placeholder="50000"></div>
          <div class="field"><label id="l_price_label">Negotiated selling price $</label><input id="l_price" type="number" step="100" placeholder="46500"><div class="hint" id="l_price_hint">Before rebates. The number you negotiate.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Money factor</label><input id="l_mf" type="number" step="0.00001" placeholder="0.00225"><div class="hint" id="l_mf_hint">x2400 = APR equivalent.</div></div>
          <div class="field"><label>Residual %</label><input id="l_residual" type="number" step="0.5" placeholder="58"><div class="hint">% of MSRP, from the worksheet.</div></div>
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
          <div class="field"><label>Rebates / incentives $</label><input id="l_rebates" type="number" step="100" value="0"></div>
          <div class="field"><label id="l_down_label">Down payment (cap reduction) $</label><input id="l_down" type="number" step="100" value="0"><div class="hint">$0 down is the smart structure.</div></div>
        </div>
        <div class="row">
          <div class="field"><label>Acquisition fee $</label><input id="l_acq" type="number" step="5" value="695"></div>
          <div class="field"><label>Doc fee $</label><input id="l_doc" type="number" step="5" value="85"><div class="hint" id="l_doc_hint">CA legal max is $85.</div></div>
        </div>
        <div class="row">
          <div class="field"><label class="tlabel"><input id="l_tax_on" type="checkbox" checked> Sales tax %</label><input id="l_tax" type="number" step="0.05" value="7.75"><div class="hint">Uncheck to exclude.</div></div>
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
          <div class="field" style="margin:12px 0 9px"><label>Target monthly payment $</label><input id="f_target" type="number" step="10" placeholder="auto from level above"></div>
          <div class="field" style="margin:0"><label>Then solve for</label><select id="f_solvefor">
            <option value="down">Find down payment</option>
            <option value="price">Find max car price</option>
          </select></div>
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
        <div class="field"><label>Pick a vehicle (optional)</label><select id="f_vehicle"><option value="">— choose make / model —</option></select><div class="hint">Fills MSRP / starting price (typical, confirm with the dealer).</div></div>
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
import { CONFIG, estimateRegistration, resolveZip, marketApr, bestBankApr, solveLeasePrice, solveFinancePrice, solveLeaseDown, solveFinanceDown, financeEarlyExit, affordabilityPayment, AFFORDABILITY, VEHICLES, scoreLease, scoreFinance } from '/calc.mjs';

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
    var manualTarget = $('f_target').getAttribute('data-manual') === '1';
    if (target > 0) {
      if (!manualTarget) $('f_target').value = target;
    } else {
      overBudget = true;
      if (!manualTarget) $('f_target').value = '';
    }
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

// Populate a vehicle <select> grouped by make, from the bundled inventory.
function populateVehicles(id) {
  var sel = $(id);
  var lastMk = '';
  var grp = null;
  for (var i = 0; i < VEHICLES.length; i++) {
    var v = VEHICLES[i];
    if (v.mk !== lastMk) { grp = document.createElement('optgroup'); grp.label = v.mk; sel.appendChild(grp); lastMk = v.mk; }
    var o = document.createElement('option');
    o.value = String(i);
    o.textContent = v.md + ' — $' + v.msrp.toLocaleString('en-US');
    grp.appendChild(o);
  }
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

  var solveFor = $('l_solvefor').value;
  var targetOn = $('l_target').value.trim() !== '' && num('l_target') > 0;
  applySolveFields('l', targetOn, solveFor);
  $('l_target_hint').textContent = targetOn
    ? (solveFor === 'down' ? 'Enter the car price; we solve the down payment.' : 'Enter your down; we solve the highest selling price.')
    : 'Lock a payment and we solve the rest. Blank = score a deal you already have.';
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



// ---------------------------------------------------------- launch wizard ----
var wizDeal = 'lease';
var wizLevel = 'comfortable';
var WIZ_LEVEL_LABELS = { conservative: 'Conservative', comfortable: 'Comfortable', aggressive: 'Aggressive' };
var wizardCompleted = false;
var wizStep = 0;
var WIZ_TOTAL_STEPS = 8;

function creditTierFromScore(score) {
  if (score >= 781) return 'superprime';
  if (score >= 661) return 'prime';
  if (score >= 601) return 'nearprime';
  if (score >= 501) return 'subprime';
  return 'deepsub';
}

function aprFromCredit(score, used, term) {
  var tier = creditTierFromScore(score);
  var avg = marketApr(used, tier, term);
  var best = bestBankApr(used, tier, term);
  return { tier: tier, avg: avg, best: best };
}

function hasWizardManualTarget() { return $('wiz_target').value.trim() !== '' && num('wiz_target') > 0; }

function selectedWizardTarget() {
  var manual = num('wiz_target');
  if (manual > 0) return manual;
  var income = parseMoney('wiz_income');
  var existing = parseMoney('wiz_existing');
  if (income <= 0) return 0;
  return affordabilityPayment(income, wizLevel, existing);
}

function updateWizardChoices(rootId, attr, val) {
  var nodes = document.querySelectorAll('#' + rootId + ' .choice');
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].classList.toggle('on', nodes[i].getAttribute(attr) === val);
  }
}

function updateWizard() {
  updateWizardChoices('wiz_deal_choices', 'data-deal', wizDeal);
  updateWizardChoices('wiz_level_choices', 'data-level', wizLevel);
  var income = parseMoney('wiz_income');
  var existing = parseMoney('wiz_existing');
  var score = num('wiz_credit');
  var target = selectedWizardTarget();
  var manualTarget = hasWizardManualTarget();
  $('wiz_target_big').textContent = target > 0 ? money(target) + '/mo' + (manualTarget ? ' custom' : '') : '—';
  var used = wizDeal === 'used';
  var isFinance = wizDeal !== 'lease';
  var note = '';
  if (income > 0) {
    var rawBudget = Math.round(income * AFFORDABILITY[wizLevel].pct);
    note += WIZ_LEVEL_LABELS[wizLevel] + ' is ' + Math.round(AFFORDABILITY[wizLevel].pct * 100) + '% of gross monthly income (' + money(rawBudget) + '/mo). ';
    if (existing > 0) note += 'Current cars use ' + money(existing) + '/mo, leaving ' + (target > 0 ? money(target) : '$0') + '/mo. ';
    if (manualTarget) note += 'Using your custom payment, not the tier default. ';
  } else {
    note += 'Enter income to calculate conservative / comfortable / aggressive payment targets. ';
  }
  if (score > 0) {
    var apr = aprFromCredit(score, used, isFinance ? numOr('f_term', 60) : 60);
    if (isFinance && apr.avg != null) {
      note += 'Credit maps to ' + apr.tier + '; bank average ~' + apr.avg.toFixed(1) + '% APR';
      if (apr.best != null) note += ', top banks ~' + apr.best.toFixed(1) + '%';
      note += '.';
    } else {
      note += 'Credit maps to ' + apr.tier + '. Lease money factor still comes from the dealer worksheet.';
    }
  } else {
    note += isFinance ? 'Add credit score to pre-fill APR benchmark.' : 'Add credit score for context; lease still needs dealer MF/residual.';
  }
  $('wiz_avg_note').textContent = note;
}

function fillFromWizardVehicle(prefix) {
  var x = $('wiz_vehicle').value;
  $(prefix + '_vehicle').value = x;
  if (x === '') {
    $(prefix + '_msrp').value = '';
    $(prefix + '_price').value = '';
    if (prefix === 'l') {
      $('l_mf').value = '';
      $('l_residual').value = '';
    }
    return;
  }
  var v = VEHICLES[+x];
  $(prefix + '_msrp').value = v.msrp;
  $(prefix + '_price').value = v.msrp;
  if (prefix === 'l') {
    $('l_mf').value = v.mf;
    $('l_residual').value = v.res;
    $('l_term').value = 36;
    $('l_miles').value = 12000;
  }
}

function runWizard() {
  var income = parseMoney('wiz_income');
  var score = num('wiz_credit');
  var existing = parseMoney('wiz_existing');
  var zip = $('wiz_zip').value.trim() || '92618';
  var down = num('wiz_down');
  var target = selectedWizardTarget();
  var manualTarget = hasWizardManualTarget();
  $('l_zip').value = zip; $('f_zip').value = zip;
  if (wizDeal === 'lease') {
    setMode('lease');
    $('l_target').value = target > 0 ? target : '';
    $('l_solvefor').value = down > 0 ? 'price' : 'down';
    $('l_down').value = down > 0 ? down : 0;
    fillFromWizardVehicle('l');
    $('l_zipauto').checked = true;
    $('l_tax_on').checked = true; $('l_reg_on').checked = true;
  } else {
    setMode('finance');
    setUsed(wizDeal === 'used');
    $('f_income').value = income > 0 ? income : '';
    $('f_existing').value = existing > 0 ? existing : '';
    $('f_level').value = wizLevel;
    $('f_target').value = target > 0 ? target : '';
    if (manualTarget) $('f_target').setAttribute('data-manual', '1');
    else $('f_target').removeAttribute('data-manual');
    $('f_solvefor').value = down > 0 ? 'price' : 'down';
    $('f_down').value = down > 0 ? down : 0;
    if (score > 0) {
      var apr = aprFromCredit(score, wizDeal === 'used', numOr('f_term', 60));
      $('f_tier').value = apr.tier;
      if (apr.avg != null) $('f_apr').value = apr.avg;
      $('f_bench_auto').checked = true;
    }
    fillFromWizardVehicle('f');
    $('f_zipauto').checked = true;
    $('f_tax_on').checked = true; $('f_reg_on').checked = true;
  }
  wizardCompleted = true;
  $('app_wrap').classList.remove('prewizard');
  $('wizard-card').classList.add('hidden');
  recalc();
  document.getElementById('inputs-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderWizardStep() {
  var steps = document.querySelectorAll('#wiz_body .wstep');
  for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('active', i === wizStep);
  $('wiz_progress').style.width = Math.round(((wizStep + 1) / WIZ_TOTAL_STEPS) * 100) + '%';
  $('wiz_back').disabled = wizStep === 0;
  $('wiz_next').textContent = wizStep === WIZ_TOTAL_STEPS - 1 ? 'Start — fill it out' : 'Next';
}

function advanceWizard() {
  if (wizStep < WIZ_TOTAL_STEPS - 1) {
    wizStep += 1;
    renderWizardStep();
    updateWizard();
  } else {
    runWizard();
  }
}

function wireWizard() {
  populateVehicles('wiz_vehicle');
  $('wiz_zip').value = $('f_zip').value || $('l_zip').value || '92618';
  var dnodes = document.querySelectorAll('#wiz_deal_choices .choice');
  for (var i = 0; i < dnodes.length; i++) dnodes[i].addEventListener('click', function () { wizDeal = this.getAttribute('data-deal'); updateWizard(); advanceWizard(); });
  var lnodes = document.querySelectorAll('#wiz_level_choices .choice');
  for (var j = 0; j < lnodes.length; j++) lnodes[j].addEventListener('click', function () { wizLevel = this.getAttribute('data-level'); $('wiz_target').value = ''; updateWizard(); });
  ['wiz_income','wiz_existing','wiz_credit','wiz_target','wiz_down','wiz_zip','wiz_vehicle'].forEach(function (id) { $(id).addEventListener('input', updateWizard); $(id).addEventListener('change', updateWizard); });
  $('wiz_next').addEventListener('click', advanceWizard);
  $('wiz_back').addEventListener('click', function () { if (wizStep > 0) { wizStep -= 1; renderWizardStep(); updateWizard(); } });
  $('wiz_toggle').addEventListener('click', function () {
    var hide = !$('wiz_body').classList.contains('hidden');
    $('wiz_body').classList.toggle('hidden', hide);
    this.classList.toggle('on', !hide);
    this.textContent = hide ? 'Show' : 'Hide';
  });
  renderWizardStep();
  updateWizard();
}
// ------------------------------------------------------------- wiring ----
var LEASE_IDS = ['l_vehicle','l_zip','l_target','l_solvefor','l_msrp','l_price','l_rebates','l_down','l_mf','l_residual','l_term','l_miles','l_acq','l_doc','l_reg','l_tax'];
var FIN_IDS = ['f_vehicle','f_income','f_existing','f_level','f_target','f_solvefor','f_zip','f_msrp','f_price','f_apr','f_term','f_tier','f_bench','f_down','f_trade','f_rebates','f_addons','f_doc','f_reg','f_tax','f_exit'];
var CHECK_IDS = ['l_zipauto','f_zipauto','f_bench_auto','l_tax_on','l_reg_on','f_tax_on','f_reg_on'];

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
$('f_target').addEventListener('input', function () { $('f_level').value = ''; $('f_target').removeAttribute('data-manual'); });

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
  $('l_vehicle').value = ''; $('l_target').value = '';
  $('l_zip').value = '92618'; $('f_zip').value = '92618';
  $('l_msrp').value = 58000; $('l_price').value = 52200; $('l_rebates').value = 1500;
  $('l_down').value = 0; $('l_mf').value = 0.00180; $('l_residual').value = 60;
  $('l_term').value = 36; $('l_acq').value = 695; $('l_doc').value = 85;
  $('l_solvefor').value = 'down'; $('l_zipauto').checked = true;
  $('l_tax_on').checked = true; $('l_reg_on').checked = true;
  recalc();
});
$('l_reset').addEventListener('click', function () {
  for (var i = 0; i < LEASE_IDS.length; i++) $(LEASE_IDS[i]).value = '';
  $('l_zip').value = '92618'; $('l_rebates').value = 0; $('l_down').value = 0;
  $('l_acq').value = 695; $('l_doc').value = 85; $('l_tax').value = 7.75;
  $('l_term').value = 36; $('l_reg').value = 0;
  $('l_solvefor').value = 'down'; $('l_zipauto').checked = true;
  $('l_tax_on').checked = true; $('l_reg_on').checked = true;
  recalc();
});
$('f_example').addEventListener('click', function () {
  setUsed(true);
  $('f_zip').value = '92618'; $('l_zip').value = '92618';
  $('f_vehicle').value = ''; $('f_income').value = ''; $('f_existing').value = ''; $('f_level').value = ''; $('f_target').value = '';
  $('f_msrp').value = 22000; $('f_price').value = 20000; $('f_rebates').value = 0;
  $('f_trade').value = 0; $('f_down').value = 3000; $('f_apr').value = 8.4;
  $('f_term').value = 60; $('f_tier').value = 'prime'; $('f_addons').value = 0;
  $('f_doc').value = 85; $('f_exit').value = 24;
  $('f_solvefor').value = 'down'; $('f_zipauto').checked = true;
  $('f_bench_auto').checked = true; $('f_tax_on').checked = true; $('f_reg_on').checked = true;
  recalc();
});
$('f_reset').addEventListener('click', function () {
  for (var i = 0; i < FIN_IDS.length; i++) $(FIN_IDS[i]).value = '';
  setUsed(true);
  $('f_zip').value = '92618'; $('f_rebates').value = 0; $('f_trade').value = 0;
  $('f_down').value = 0; $('f_addons').value = 0; $('f_doc').value = 85; $('f_tax').value = 7.75;
  $('f_term').value = 60; $('f_tier').value = 'prime'; $('f_reg').value = 0;
  $('f_solvefor').value = 'down'; $('f_zipauto').checked = true;
  $('f_bench_auto').checked = true; $('f_tax_on').checked = true; $('f_reg_on').checked = true;
  recalc();
});

// Vehicle pickers — populate from inventory and fill on choice.
populateVehicles('l_vehicle');
populateVehicles('f_vehicle');
wireWizard();
$('l_vehicle').addEventListener('change', function () {
  var x = $('l_vehicle').value; if (x === '') { recalc(); return; }
  var v = VEHICLES[+x];
  $('l_msrp').value = v.msrp; $('l_price').value = v.msrp;
  $('l_mf').value = v.mf; $('l_residual').value = v.res;
  $('l_term').value = 36; $('l_miles').value = 12000;
  recalc();
});
$('f_vehicle').addEventListener('change', function () {
  var x = $('f_vehicle').value; if (x === '') { recalc(); return; }
  var v = VEHICLES[+x];
  $('f_msrp').value = v.msrp; $('f_price').value = v.msrp;
  recalc();
});

load();
recalc();
</script>
</body>
</html>`;
