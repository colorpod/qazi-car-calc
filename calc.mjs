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
  // Benchmark = the rate you could realistically get from a MAINSTREAM bank
  // (Ally, Wells Fargo, Chase, Bank of America, Capital One) — not a blended
  // industry average that includes captive/buy-here-pay-here/credit-union rates.
  // `benchmarks` is the average across those banks (drives the score); the
  // top-tier banks (best rate in each tier) are the barometer shown to aim for.
  benchmarksAsOf: 'Mainstream bank avg (Ally · Wells · Chase · BofA · Cap One), 2026',
  benchmarksLenders: 'Ally, Wells Fargo, Chase, Bank of America, Capital One',
  benchmarks: {
    new:  { superprime: 5.4, prime: 6.9, nearprime: 9.9, subprime: 13.5, deepsub: 16.0 },
    used: { superprime: 7.0, prime: 9.2, nearprime: 13.8, subprime: 18.8, deepsub: 21.5 },
  },
  // Top-tier mainstream banks (best advertised rate per tier) — the barometer.
  benchmarksBest: {
    new:  { superprime: 4.8, prime: 6.2, nearprime: 9.0, subprime: 12.6, deepsub: 15.0 },
    used: { superprime: 6.3, prime: 8.4, nearprime: 12.8, subprime: 17.8, deepsub: 20.5 },
  },
  // APR rises with term. Adjustment in points vs the 60-month baseline above.
  benchmarkTermAdj: [[36, -0.4], [48, -0.2], [60, 0], [72, 0.3], [84, 0.6]],
  tierLabels: {
    superprime: 'Super prime (781+)',
    prime: 'Prime (661-780)',
    nearprime: 'Near prime (601-660)',
    subprime: 'Subprime (501-600)',
    deepsub: 'Deep subprime (<501)',
  },
};

// Mainstream-bank average APR for a credit tier, adjusted for new/used and term.
export function marketApr(isUsed, tier, term) {
  const table = isUsed ? CONFIG.benchmarks.used : CONFIG.benchmarks.new;
  const base = table[tier];
  if (base == null) return null;
  return Math.max(0, +(base + lerpCurve(CONFIG.benchmarkTermAdj, term || 60)).toFixed(2));
}

// Best top-tier mainstream-bank APR — the barometer to aim for / negotiate to.
export function bestBankApr(isUsed, tier, term) {
  const table = isUsed ? CONFIG.benchmarksBest.used : CONFIG.benchmarksBest.new;
  const base = table[tier];
  if (base == null) return null;
  return Math.max(0, +(base + lerpCurve(CONFIG.benchmarkTermAdj, term || 60)).toFixed(2));
}

// Recommended car payment as a share of GROSS monthly income, by appetite.
// Conservative ~= the textbook "10% of take-home" rule; aggressive is car-guy.
export const AFFORDABILITY = {
  conservative: { pct: 0.08, label: 'Conservative', tag: 'Safe' },
  comfortable:  { pct: 0.12, label: 'Comfortable', tag: 'Balanced' },
  aggressive:   { pct: 0.18, label: 'Aggressive', tag: 'Car guy' },
};
// The tier is a TOTAL monthly car budget. Any existing car costs (other
// payments + insurance) come off the top, leaving room for the new car. The
// result can be <= 0, meaning the current fleet already uses the whole budget.
export function affordabilityPayment(grossMonthly, level, existingMonthly) {
  const a = AFFORDABILITY[level];
  if (!(grossMonthly > 0) || !a) return null;
  const budget = grossMonthly * a.pct;
  return Math.round(budget - (existingMonthly > 0 ? existingMonthly : 0));
}

// ---------------------------------------------------------- VEHICLES ----
// Curated 2026 starting points so you can pick a car instead of hunting specs.
// msrp = sticker for new cars. For used cars, msrp is the nationwide average
// clean-title/no-accident retail value for cars under ~40k miles — not a local
// cheapest listing that may hide history, damage, branded title, or condition issues.
// mf + res are TYPICAL lease terms at 36mo/12k for new leaseable cars (captives reset
// these monthly, so confirm with the dealer). Editable after you pick.
export const VEHICLES = [
  // Economy / low-payment lease targets
  { mk: 'Chevrolet', md: 'Trax LT', msrp: 24000, mf: 0.00125, res: 58, body: 'SUV', band: 'economy' },
  { mk: 'Honda', md: 'Civic Sport', msrp: 28000, mf: 0.00110, res: 62, body: 'sedan', band: 'economy' },
  { mk: 'Honda', md: 'HR-V Sport', msrp: 30000, mf: 0.00120, res: 60, body: 'SUV', band: 'economy' },
  { mk: 'Hyundai', md: 'Elantra SEL', msrp: 24000, mf: 0.00105, res: 60, body: 'sedan', band: 'economy' },
  { mk: 'Hyundai', md: 'Tucson SEL', msrp: 33000, mf: 0.00125, res: 60, body: 'SUV', band: 'mainstream' },
  { mk: 'Kia', md: 'K4 EX', msrp: 26000, mf: 0.00110, res: 59, body: 'sedan', band: 'economy' },
  { mk: 'Mazda', md: 'Mazda3 Preferred', msrp: 28000, mf: 0.00120, res: 58, body: 'sedan', band: 'economy' },
  { mk: 'Mazda', md: 'CX-5 Preferred', msrp: 32000, mf: 0.00115, res: 59, body: 'SUV', band: 'mainstream' },
  { mk: 'Nissan', md: 'Sentra SV', msrp: 24000, mf: 0.00120, res: 57, body: 'sedan', band: 'economy' },
  { mk: 'Nissan', md: 'Altima SV', msrp: 30000, mf: 0.00135, res: 56, body: 'sedan', band: 'mainstream' },
  { mk: 'Subaru', md: 'Impreza Sport', msrp: 27000, mf: 0.00120, res: 58, body: 'hatch', band: 'economy' },
  { mk: 'Subaru', md: 'Outback Premium', msrp: 33000, mf: 0.00120, res: 60, body: 'wagon', band: 'mainstream' },
  { mk: 'Toyota', md: 'Corolla LE', msrp: 23000, mf: 0.00100, res: 63, body: 'sedan', band: 'economy' },
  { mk: 'Toyota', md: 'Camry SE', msrp: 30000, mf: 0.00100, res: 62, body: 'sedan', band: 'mainstream' },
  { mk: 'Toyota', md: 'RAV4 XLE', msrp: 34000, mf: 0.00110, res: 64, body: 'SUV', band: 'mainstream' },
  { mk: 'Volkswagen', md: 'Jetta SE', msrp: 26000, mf: 0.00115, res: 58, body: 'sedan', band: 'economy' },
  { mk: 'Volkswagen', md: 'Tiguan SE', msrp: 34000, mf: 0.00135, res: 57, body: 'SUV', band: 'mainstream' },

  // Mainstream / family / truck
  { mk: 'Acura', md: 'Integra A-Spec', msrp: 36000, mf: 0.00130, res: 58, body: 'sedan', band: 'mainstream' },
  { mk: 'Acura', md: 'MDX Technology', msrp: 56000, mf: 0.00150, res: 57, body: 'SUV', band: 'premium' },
  { mk: 'Chevrolet', md: 'Silverado 1500 LT', msrp: 47000, mf: 0.00150, res: 56, body: 'truck', band: 'mainstream' },
  { mk: 'Ford', md: 'F-150 XLT', msrp: 48000, mf: 0.00140, res: 58, body: 'truck', band: 'mainstream' },
  { mk: 'Ford', md: 'Mustang Mach-E Premium', msrp: 50000, mf: 0.00150, res: 53, body: 'EV', band: 'premium' },
  { mk: 'Honda', md: 'Accord EX', msrp: 31000, mf: 0.00115, res: 60, body: 'sedan', band: 'mainstream' },
  { mk: 'Honda', md: 'CR-V EX', msrp: 34000, mf: 0.00120, res: 63, body: 'SUV', band: 'mainstream' },
  { mk: 'Hyundai', md: 'Ioniq 5 SEL', msrp: 47000, mf: 0.00120, res: 55, body: 'EV', band: 'premium' },
  { mk: 'Jeep', md: 'Grand Cherokee Laredo', msrp: 45000, mf: 0.00170, res: 55, body: 'SUV', band: 'mainstream' },
  { mk: 'Kia', md: 'EV6 Wind', msrp: 49000, mf: 0.00125, res: 55, body: 'EV', band: 'premium' },
  { mk: 'Kia', md: 'Telluride EX', msrp: 44000, mf: 0.00120, res: 60, body: 'SUV', band: 'mainstream' },
  { mk: 'Toyota', md: 'Tacoma SR5', msrp: 38000, mf: 0.00100, res: 68, body: 'truck', band: 'mainstream' },

  // Premium / luxury lease-sensitive cars
  { mk: 'Audi', md: 'A4 Premium', msrp: 45000, mf: 0.00160, res: 57, body: 'sedan', band: 'premium' },
  { mk: 'Audi', md: 'Q5 45 Premium', msrp: 50000, mf: 0.00155, res: 59, body: 'SUV', band: 'premium' },
  { mk: 'Audi', md: 'Q7 Premium Plus', msrp: 65000, mf: 0.00175, res: 55, body: 'SUV', band: 'luxury' },
  { mk: 'BMW', md: '330i', msrp: 47000, mf: 0.00160, res: 60, body: 'sedan', band: 'premium' },
  { mk: 'BMW', md: 'X3 30i', msrp: 51000, mf: 0.00150, res: 61, body: 'SUV', band: 'premium' },
  { mk: 'BMW', md: 'X5 xDrive40i', msrp: 67000, mf: 0.00160, res: 60, body: 'SUV', band: 'luxury' },
  { mk: 'BMW', md: 'M3 Competition', msrp: 87000, mf: 0.00210, res: 55, body: 'sedan', band: 'performance' },
  { mk: 'Cadillac', md: 'Escalade Premium Luxury', msrp: 98000, mf: 0.00220, res: 53, body: 'SUV', band: 'luxury' },
  { mk: 'Genesis', md: 'GV70 2.5T', msrp: 50000, mf: 0.00140, res: 56, body: 'SUV', band: 'premium' },
  { mk: 'Land Rover', md: 'Defender 110 S', msrp: 70000, mf: 0.00210, res: 56, body: 'SUV', band: 'luxury' },
  { mk: 'Lexus', md: 'ES 350', msrp: 46000, mf: 0.00125, res: 60, body: 'sedan', band: 'premium' },
  { mk: 'Lexus', md: 'RX 350', msrp: 52000, mf: 0.00130, res: 63, body: 'SUV', band: 'premium' },
  { mk: 'Mercedes-Benz', md: 'C 300', msrp: 49000, mf: 0.00165, res: 58, body: 'sedan', band: 'premium' },
  { mk: 'Mercedes-Benz', md: 'GLC 300', msrp: 52000, mf: 0.00160, res: 60, body: 'SUV', band: 'premium' },
  { mk: 'Mercedes-Benz', md: 'GLE 450', msrp: 76000, mf: 0.00190, res: 57, body: 'SUV', band: 'luxury' },
  { mk: 'Porsche', md: 'Macan', msrp: 65000, mf: 0.00170, res: 60, body: 'SUV', band: 'luxury' },
  { mk: 'Porsche', md: 'Cayenne', msrp: 92000, mf: 0.00230, res: 58, body: 'SUV', band: 'luxury' },
  { mk: 'Rivian', md: 'R1S Adventure', msrp: 78000, mf: 0.00250, res: 52, body: 'EV', band: 'luxury' },
  { mk: 'Rivian', md: 'R1T Adventure', msrp: 72000, mf: 0.00250, res: 53, body: 'EV', band: 'luxury' },
  { mk: 'Tesla', md: 'Model 3 Long Range', msrp: 47000, mf: 0.00180, res: 57, body: 'EV', band: 'premium' },
  { mk: 'Tesla', md: 'Model Y Long Range', msrp: 50000, mf: 0.00180, res: 58, body: 'EV', band: 'premium' },
  { mk: 'Tesla', md: 'Model S Plaid', msrp: 90000, mf: 0.00220, res: 50, body: 'EV', band: 'performance' },

  // Used finance targets. Values are nationwide clean-title/no-accident retail brackets under ~40k miles.
  // Keep low/mid used shoppers contextual too, then graduate into the exotic pool for high cash/payment searches.
  { mk: 'Acura', md: 'Integra A-Spec (used)', msrp: 31000, mf: 0.00280, res: 52, body: 'hatch', band: 'mainstream', used: true, lease: false },
  { mk: 'Acura', md: 'MDX Technology (used)', msrp: 46000, mf: 0.00290, res: 50, body: 'SUV', band: 'premium', used: true, lease: false },
  { mk: 'Audi', md: 'A5 Sportback (used)', msrp: 42000, mf: 0.00280, res: 52, body: 'sedan', band: 'premium', used: true, lease: false },
  { mk: 'Audi', md: 'SQ5 Prestige (used)', msrp: 55000, mf: 0.00300, res: 50, body: 'SUV', band: 'performance', used: true, lease: false },
  { mk: 'BMW', md: 'M340i (used)', msrp: 52000, mf: 0.00290, res: 53, body: 'sedan', band: 'performance', used: true, lease: false },
  { mk: 'BMW', md: 'M4 Competition (used)', msrp: 78000, mf: 0.00300, res: 52, body: 'coupe', band: 'performance', used: true, lease: false },
  { mk: 'Chevrolet', md: 'Corvette C8 Z51 (used)', msrp: 82000, mf: 0.00310, res: 54, body: 'sports', band: 'performance', used: true, lease: false },
  { mk: 'Porsche', md: '718 Cayman GTS 4.0 (used)', msrp: 90000, mf: 0.00300, res: 57, body: 'sports', band: 'performance', used: true, lease: false },
  { mk: 'Porsche', md: '718 Cayman GT4 RS (used)', msrp: 205000, mf: 0.00320, res: 62, body: 'sports', band: 'exotic', used: true, lease: false },

  // Supercar / exotic pool: only surface these when the payment/cash/solved-price context is in this range.
  { mk: 'Aston Martin', md: 'Vantage Coupe (used)', msrp: 125000, mf: 0.00320, res: 48, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Aston Martin', md: 'DB11 V8 (used)', msrp: 145000, mf: 0.00330, res: 48, body: 'exotic GT', band: 'exotic', used: true, lease: false },
  { mk: 'Aston Martin', md: 'DBS Superleggera (used)', msrp: 245000, mf: 0.00370, res: 46, body: 'exotic GT', band: 'exotic', used: true, lease: false },
  { mk: 'Audi', md: 'R8 V8 Manual (used)', msrp: 120000, mf: 0.00300, res: 52, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Audi', md: 'R8 V10 Coupe (used)', msrp: 165000, mf: 0.00300, res: 52, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Audi', md: 'R8 V10 Performance (used)', msrp: 205000, mf: 0.00320, res: 53, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Bentley', md: 'Continental GT V8 (used)', msrp: 155000, mf: 0.00320, res: 47, body: 'exotic GT', band: 'exotic', used: true, lease: false },
  { mk: 'Ferrari', md: 'California T (used)', msrp: 145000, mf: 0.00350, res: 50, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Ferrari', md: 'Portofino (used)', msrp: 210000, mf: 0.00350, res: 52, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Ferrari', md: '488 GTB (used)', msrp: 245000, mf: 0.00380, res: 54, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Ferrari', md: 'F8 Tributo (used)', msrp: 310000, mf: 0.00390, res: 55, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Lamborghini', md: 'Gallardo LP560-4 (used)', msrp: 145000, mf: 0.00360, res: 50, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Lamborghini', md: 'Huracan LP610-4 (used)', msrp: 225000, mf: 0.00380, res: 54, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Lamborghini', md: 'Huracan Performante (used)', msrp: 280000, mf: 0.00400, res: 55, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Lamborghini', md: 'Huracan STO (used)', msrp: 335000, mf: 0.00420, res: 54, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Lamborghini', md: 'Aventador S (used)', msrp: 355000, mf: 0.00420, res: 52, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Lamborghini', md: 'Urus (used)', msrp: 235000, mf: 0.00360, res: 52, body: 'exotic SUV', band: 'exotic', used: true, lease: false },
  { mk: 'McLaren', md: '570S (used)', msrp: 150000, mf: 0.00380, res: 50, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'McLaren', md: '600LT (used)', msrp: 205000, mf: 0.00390, res: 51, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'McLaren', md: '650S Spider (used)', msrp: 155000, mf: 0.00380, res: 48, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'McLaren', md: '675LT (used)', msrp: 285000, mf: 0.00400, res: 50, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'McLaren', md: '720S (used)', msrp: 240000, mf: 0.00400, res: 50, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'McLaren', md: '765LT (used)', msrp: 390000, mf: 0.00440, res: 50, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'McLaren', md: 'Artura (used)', msrp: 205000, mf: 0.00380, res: 52, body: 'exotic hybrid', band: 'exotic', used: true, lease: false },
  { mk: 'Mercedes-Benz', md: 'AMG GT S (used)', msrp: 105000, mf: 0.00300, res: 49, body: 'performance', band: 'performance', used: true, lease: false },
  { mk: 'Mercedes-Benz', md: 'AMG GT R (used)', msrp: 145000, mf: 0.00310, res: 48, body: 'performance', band: 'exotic', used: true, lease: false },
  { mk: 'Mercedes-Benz', md: 'AMG GT Black Series (used)', msrp: 325000, mf: 0.00410, res: 49, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Mercedes-Benz', md: 'SLS AMG GT (used)', msrp: 235000, mf: 0.00380, res: 48, body: 'exotic', band: 'exotic', used: true, lease: false },
  { mk: 'Nissan', md: 'GT-R Premium (used)', msrp: 125000, mf: 0.00320, res: 51, body: 'performance', band: 'exotic', used: true, lease: false },
  { mk: 'Porsche', md: '911 Carrera S (used)', msrp: 135000, mf: 0.00280, res: 58, body: 'sports', band: 'performance', used: true, lease: false },
  { mk: 'Porsche', md: '911 GT3 (used)', msrp: 230000, mf: 0.00320, res: 62, body: 'sports', band: 'exotic', used: true, lease: false },
  { mk: 'Porsche', md: '911 Turbo S (used)', msrp: 220000, mf: 0.00300, res: 60, body: 'sports', band: 'exotic', used: true, lease: false },
  { mk: 'Rolls-Royce', md: 'Ghost (used)', msrp: 230000, mf: 0.00400, res: 45, body: 'ultra-luxury', band: 'exotic', used: true, lease: false },
].sort((a, b) => a.mk.localeCompare(b.mk) || a.md.localeCompare(b.md));

// ------------------------------------------------------ LOCATION / TAX ----
// ZIP -> state, then state -> vehicle sales-tax rate, DMV fee model, doc-fee
// cap, and whether the state credits a trade-in against the taxable price.
// California is resolved at metro level (the home market); other states use a
// representative statewide combined rate. Everything is editable in the UI and
// the detected rate is shown, so any local override is visible, not hidden.

// First-3-digit ZIP prefix ranges -> USPS state. Deterministic and complete.
const ZIP_STATE_RANGES = [
  [5, 5, 'NY'], [6, 9, 'PR'], [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'],
  [39, 49, 'ME'], [50, 54, 'VT'], [55, 59, 'MA'], [60, 69, 'CT'], [70, 89, 'NJ'],
  [100, 149, 'NY'], [150, 196, 'PA'], [197, 199, 'DE'], [200, 205, 'DC'],
  [206, 219, 'MD'], [220, 246, 'VA'], [247, 268, 'WV'], [270, 289, 'NC'],
  [290, 299, 'SC'], [300, 319, 'GA'], [320, 349, 'FL'], [350, 369, 'AL'],
  [370, 385, 'TN'], [386, 397, 'MS'], [398, 399, 'GA'], [400, 427, 'KY'],
  [430, 459, 'OH'], [460, 479, 'IN'], [480, 499, 'MI'], [500, 528, 'IA'],
  [530, 549, 'WI'], [550, 567, 'MN'], [570, 577, 'SD'], [580, 588, 'ND'],
  [590, 599, 'MT'], [600, 629, 'IL'], [630, 658, 'MO'], [660, 679, 'KS'],
  [680, 693, 'NE'], [700, 714, 'LA'], [716, 729, 'AR'], [730, 749, 'OK'],
  [750, 799, 'TX'], [800, 816, 'CO'], [820, 831, 'WY'], [832, 838, 'ID'],
  [840, 847, 'UT'], [850, 865, 'AZ'], [870, 884, 'NM'], [889, 898, 'NV'],
  [900, 961, 'CA'], [967, 968, 'HI'], [970, 979, 'OR'], [980, 994, 'WA'],
  [995, 999, 'AK'],
];

// state -> { name, tax (combined %), docCap ($ or null = no legal cap),
//   noTrade (true if trade-in is NOT credited against tax), note, taxCap }
const STATE_TAX = {
  AL: { name: 'Alabama', tax: 3.5, docCap: null },
  AK: { name: 'Alaska', tax: 1.8, docCap: null },
  AZ: { name: 'Arizona', tax: 8.4, docCap: null },
  AR: { name: 'Arkansas', tax: 9.5, docCap: null },
  CA: { name: 'California', tax: 7.75, docCap: 85, noTrade: true },
  CO: { name: 'Colorado', tax: 7.5, docCap: null },
  CT: { name: 'Connecticut', tax: 6.35, docCap: null, note: '7.75% over $50k' },
  DE: { name: 'Delaware', tax: 4.25, docCap: null, note: 'Doc fee is the 4.25% state levy' },
  DC: { name: 'D.C.', tax: 6.0, docCap: null, noTrade: true },
  FL: { name: 'Florida', tax: 7.0, docCap: null },
  GA: { name: 'Georgia', tax: 7.0, docCap: null, note: 'TAVT title tax ~7%, paid once' },
  HI: { name: 'Hawaii', tax: 4.5, docCap: null, noTrade: true },
  ID: { name: 'Idaho', tax: 6.0, docCap: null },
  IL: { name: 'Illinois', tax: 8.25, docCap: 347 },
  IN: { name: 'Indiana', tax: 7.0, docCap: null },
  IA: { name: 'Iowa', tax: 5.0, docCap: 180, note: 'One-time 5% new-registration fee' },
  KS: { name: 'Kansas', tax: 8.7, docCap: null },
  KY: { name: 'Kentucky', tax: 6.0, docCap: null, noTrade: true },
  LA: { name: 'Louisiana', tax: 9.5, docCap: 200 },
  ME: { name: 'Maine', tax: 5.5, docCap: null },
  MD: { name: 'Maryland', tax: 6.0, docCap: 500, noTrade: true },
  MA: { name: 'Massachusetts', tax: 6.25, docCap: null },
  MI: { name: 'Michigan', tax: 6.0, docCap: 260, note: 'Trade-in credit capped' },
  MN: { name: 'Minnesota', tax: 7.5, docCap: 125 },
  MS: { name: 'Mississippi', tax: 5.0, docCap: null },
  MO: { name: 'Missouri', tax: 8.0, docCap: 700 },
  MT: { name: 'Montana', tax: 0, docCap: null, note: 'No sales tax' },
  NE: { name: 'Nebraska', tax: 6.5, docCap: 299 },
  NV: { name: 'Nevada', tax: 8.25, docCap: null },
  NH: { name: 'New Hampshire', tax: 0, docCap: null, note: 'No sales tax' },
  NJ: { name: 'New Jersey', tax: 6.625, docCap: null },
  NM: { name: 'New Mexico', tax: 4.0, docCap: null, note: '4% excise on vehicles' },
  NY: { name: 'New York', tax: 8.0, docCap: 175 },
  NC: { name: 'North Carolina', tax: 3.0, docCap: null, note: '3% highway-use tax' },
  ND: { name: 'North Dakota', tax: 5.0, docCap: null },
  OH: { name: 'Ohio', tax: 7.25, docCap: 250 },
  OK: { name: 'Oklahoma', tax: 4.5, docCap: null },
  OR: { name: 'Oregon', tax: 0.5, docCap: 250, note: '0.5% vehicle privilege tax' },
  PA: { name: 'Pennsylvania', tax: 6.0, docCap: null },
  RI: { name: 'Rhode Island', tax: 7.0, docCap: null },
  SC: { name: 'South Carolina', tax: 5.0, docCap: null, taxCap: 500, note: 'Sales tax capped at $500' },
  SD: { name: 'South Dakota', tax: 4.0, docCap: null },
  TN: { name: 'Tennessee', tax: 9.55, docCap: 699 },
  TX: { name: 'Texas', tax: 6.25, docCap: 225 },
  UT: { name: 'Utah', tax: 7.1, docCap: null },
  VT: { name: 'Vermont', tax: 6.0, docCap: null },
  VA: { name: 'Virginia', tax: 4.15, docCap: 599, noTrade: true, note: 'Min 4.15% motor-vehicle tax' },
  WA: { name: 'Washington', tax: 8.9, docCap: 200, noTrade: true },
  WV: { name: 'West Virginia', tax: 6.0, docCap: null },
  WI: { name: 'Wisconsin', tax: 5.5, docCap: 250 },
  WY: { name: 'Wyoming', tax: 5.0, docCap: null },
  PR: { name: 'Puerto Rico', tax: 11.5, docCap: null },
};

// California combined vehicle tax by ZIP3 (home market, metro-accurate). Any CA
// ZIP not listed falls back to STATE_TAX.CA.tax (7.75%, the common OC/SD/Inland/
// Sacramento rate). High-rate metros are pinned here.
const CA_ZIP3_TAX = {
  '900': 9.5, '901': 9.5, '902': 9.5, '903': 9.5, '904': 10.25, '905': 9.5,
  '906': 9.5, '907': 10.25, '908': 10.25,                 // LA metro + Long Beach/SM
  '910': 9.5, '911': 9.5, '912': 9.5, '913': 9.5, '914': 9.5, '915': 9.5,
  '916': 9.5, '917': 9.5, '918': 9.5,                      // greater LA
  '926': 7.75, '927': 7.75, '928': 7.75,                   // Orange County
  '940': 9.375, '941': 8.625, '943': 9.125, '944': 9.375,  // SF peninsula / SF
  '945': 10.25, '946': 10.25, '947': 10.25, '948': 8.75,   // Oakland / Alameda
  '950': 9.375, '951': 9.25,                               // San Jose / Santa Clara
};

// Region label per CA ZIP3, for the detected-location readout.
const CA_REGION = {
  '900': 'Los Angeles', '901': 'Los Angeles', '902': 'Inglewood', '903': 'Inglewood',
  '904': 'Santa Monica', '905': 'Torrance', '906': 'Long Beach', '907': 'Long Beach',
  '908': 'Long Beach', '910': 'Pasadena', '911': 'Pasadena', '912': 'Glendale',
  '913': 'Van Nuys', '914': 'Van Nuys', '915': 'Burbank', '916': 'North Hollywood',
  '917': 'Industry', '918': 'Industry', '919': 'San Diego', '920': 'San Diego',
  '921': 'San Diego', '922': 'Palm Springs', '923': 'San Bernardino', '924': 'San Bernardino',
  '925': 'Riverside', '926': 'Orange County', '927': 'Orange County', '928': 'Orange County',
  '930': 'Oxnard', '931': 'Santa Barbara', '932': 'Bakersfield', '933': 'Bakersfield',
  '934': 'Bakersfield', '935': 'Mojave', '936': 'Fresno', '937': 'Fresno', '938': 'Fresno',
  '939': 'Salinas', '940': 'San Mateo', '941': 'San Francisco', '942': 'Sacramento',
  '943': 'Palo Alto', '944': 'San Mateo', '945': 'Oakland', '946': 'Oakland',
  '947': 'Berkeley', '948': 'Richmond', '949': 'San Rafael', '950': 'San Jose',
  '951': 'San Jose', '952': 'Stockton', '953': 'Stockton', '954': 'Santa Rosa',
  '955': 'Eureka', '956': 'Sacramento', '957': 'Sacramento', '958': 'Sacramento',
  '959': 'Marysville', '960': 'Redding', '961': 'Susanville',
};

function stateForPrefix(p) {
  for (let i = 0; i < ZIP_STATE_RANGES.length; i++) {
    if (p >= ZIP_STATE_RANGES[i][0] && p <= ZIP_STATE_RANGES[i][1]) return ZIP_STATE_RANGES[i][2];
  }
  return null;
}

// Resolve a 5-digit ZIP to { state, name, region, taxRate, docCap, tradeCredit,
//   taxCap, note }. Returns null for anything that is not a valid US ZIP.
export function resolveZip(zip) {
  const z = String(zip == null ? '' : zip).trim();
  if (!/^\d{5}$/.test(z)) return null;
  const pre = z.slice(0, 3);
  const st = stateForPrefix(parseInt(pre, 10));
  if (!st || !STATE_TAX[st]) return null;
  const info = STATE_TAX[st];
  let taxRate = info.tax;
  let region = info.name;
  if (st === 'CA') {
    if (CA_ZIP3_TAX[pre] !== undefined) taxRate = CA_ZIP3_TAX[pre];
    if (CA_REGION[pre]) region = CA_REGION[pre] + ', CA';
  }
  return {
    state: st, name: info.name, region: region, taxRate: taxRate,
    docCap: info.docCap != null ? info.docCap : null,
    tradeCredit: !info.noTrade, taxCap: info.taxCap || null, note: info.note || null,
  };
}

export function docFeeCapForState(state) {
  const info = STATE_TAX[state];
  return info && info.docCap != null ? info.docCap : null;
}

// Registration / DMV bundle estimate (registration + title + plates + any
// value-based fee like CA's VLF). A handful of states levy a value-based first-
// year fee; the rest are modeled as a representative flat. Labeled "estimated".
const REG_MODEL = {
  CA: [190, 0.0065],  // reg + CHP + title + plates + 0.65% VLF
  CO: [120, 0.021],   // ownership tax is steep in year one
  MN: [40, 0.0125],
  NE: [60, 0.005],
};
export function estimateRegistration(price, state) {
  if (!(price > 0)) return 0;
  const m = REG_MODEL[state] || [150, 0];
  return Math.round(m[0] + m[1] * price);
}

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

export function verdictFor(score) {
  if (score >= 85) return { label: 'GREAT DEAL', tone: 'great' };
  if (score >= 70) return { label: 'GOOD DEAL', tone: 'good' };
  if (score >= 55) return { label: 'FAIR DEAL', tone: 'fair' };
  if (score >= 40) return { label: 'BELOW AVERAGE', tone: 'weak' };
  return { label: 'BAD DEAL', tone: 'bad' };
}

// Doc-fee flag, state-aware. docCap: a dollar legal cap, or null for states
// with no cap (where a high doc fee is just negotiable, not illegal).
function docFeeFlag(docFee, docCap, stateLabel) {
  docFee = docFee || 0;
  const where = stateLabel || 'the state';
  if (docCap != null) {
    if (docFee > docCap) {
      return { level: 'warn', msg: 'Doc fee $' + docFee + ' is over ' + where + "'s legal cap of $" + docCap + '.' };
    }
  } else if (docFee > 700) {
    return { level: 'warn', msg: 'Doc fee $' + docFee + ' is high. ' + where + ' has no legal cap, so push back on it.' };
  }
  return null;
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

// Inverse: the negotiated selling price that produces a target monthly payment,
// holding MF / residual / term / fees fixed. Lease payment is linear in price,
// so this is exact. Returns null if inputs are insufficient or the target is
// unreachable (would require a negative price).
export function solveLeasePrice(i, targetPayment) {
  const taxRate = (i.taxPct || 0) / 100;
  if (!(i.msrp > 0) || !(i.term > 0) || !(i.residualPct > 0) || !(i.mf >= 0) || !(targetPayment > 0)) {
    return null;
  }
  const residual = i.msrp * (i.residualPct / 100);
  const capReduction = (i.down || 0) + (i.rebates || 0);
  const basePayment = targetPayment / (1 + taxRate);
  const k = 1 / i.term + i.mf;                       // adjCap coefficient
  const adjCap = (basePayment - residual * (i.mf - 1 / i.term)) / k;
  const price = adjCap + capReduction - (i.acqFee || 0);
  if (!(price > 0)) return null;
  return Math.round(price);
}

// Inverse: the down payment (cap-cost reduction) that produces a target monthly
// payment on a KNOWN car (price held fixed). Returns the dollar down payment,
// which may be negative (meaning $0 down already lands under the target), or
// null if inputs are insufficient.
export function solveLeaseDown(i, targetPayment) {
  const taxRate = (i.taxPct || 0) / 100;
  if (!(i.msrp > 0) || !(i.price > 0) || !(i.term > 0) || !(i.residualPct > 0) || !(i.mf >= 0) || !(targetPayment > 0)) {
    return null;
  }
  const residual = i.msrp * (i.residualPct / 100);
  const basePayment = targetPayment / (1 + taxRate);
  const k = 1 / i.term + i.mf;
  const adjCap = (basePayment - residual * (i.mf - 1 / i.term)) / k;
  const capReduction = i.price + (i.acqFee || 0) - adjCap;
  return Math.round(capReduction - (i.rebates || 0));
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

  let critical = false;
  let feeScore = 100;
  const leaseDocCap = ('docFeeCap' in i) ? i.docFeeCap : CONFIG.docFeeCap;
  const leaseDocFlag = docFeeFlag(i.docFee, leaseDocCap, i.stateLabel);
  if (leaseDocFlag) { feeScore -= 30; flags.push(leaseDocFlag); }
  if ((i.acqFee || 0) > CONFIG.acqFeeHigh) {
    feeScore -= 25;
    flags.push({ level: 'warn', msg: 'Acquisition fee $' + i.acqFee + ' looks marked up (typical $595-$' + CONFIG.acqFeeHigh + ').' });
  }
  if ((i.govFees || 0) > 0.025 * i.price) {
    feeScore -= 20;
    flags.push({ level: 'warn', msg: 'Government fees over 2.5% of price; check the worksheet for padded charges.' });
  }
  if ((i.down || 0) > 0.10 * i.msrp) {
    feeScore -= 35;
    critical = true;
    flags.push({ level: 'critical', msg: 'This payment only works with a huge lease down payment ($' + Math.round(i.down).toLocaleString('en-US') + '). That is not a clean lease — if the car is totaled, that cash can disappear.' });
  } else if ((i.down || 0) > 2000) {
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
  // Sales tax on the negotiated price. Manufacturer rebates do NOT reduce the
  // taxable amount. Most states credit a trade-in against the taxable price;
  // CA (and a few others) do not — driven by i.taxTradeCredit.
  const taxableTrade = (i.taxTradeCredit && (i.tradeEquity || 0) > 0) ? Math.min(i.tradeEquity, i.price) : 0;
  const salesTax = Math.max(0, i.price - taxableTrade) * taxRate;
  const tradeTaxSaved = taxableTrade * taxRate;
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
    salesTax, tradeTaxSaved, docWithTax, amountFinanced, monthly, totalPayments,
    totalInterest, totalOutOfPocket, ltv, interestBurden, discountPct, aprDelta,
  };
}

// Inverse: the negotiated price that produces a target monthly payment, holding
// APR / term / fees / down fixed. Amount financed is linear in price, so exact.
export function solveFinancePrice(i, targetPayment) {
  const taxRate = (i.taxPct || 0) / 100;
  if (!(i.term > 0) || !(i.apr >= 0) || !(targetPayment > 0)) return null;
  const r = i.apr / 100 / 12;
  const n = i.term;
  const factor = (r === 0) ? (1 / n) : (r / (1 - Math.pow(1 + r, -n)));
  const targetAF = targetPayment / factor;
  // amountFinanced = price*(1+taxRate) + K, exact while price > trade value.
  // In trade-credit states the trade reduces the taxable base, folded into K.
  const docWithTax = (i.docFee || 0) * (1 + taxRate);
  const taxableTrade = (i.taxTradeCredit && (i.tradeEquity || 0) > 0) ? i.tradeEquity : 0;
  const k = docWithTax + (i.govFees || 0) + (i.addons || 0)
    - (i.down || 0) - (i.rebates || 0) - (i.tradeEquity || 0) - taxableTrade * taxRate;
  const price = (targetAF - k) / (1 + taxRate);
  if (!(price > 0)) return null;
  return Math.round(price);
}

// Inverse: the down payment that produces a target monthly payment on a KNOWN
// car (price held fixed). Returns the dollar down payment, which may be negative
// (meaning $0 down already lands under the target), or null if insufficient.
export function solveFinanceDown(i, targetPayment) {
  const taxRate = (i.taxPct || 0) / 100;
  if (!(i.price > 0) || !(i.term > 0) || !(i.apr >= 0) || !(targetPayment > 0)) return null;
  const r = i.apr / 100 / 12;
  const n = i.term;
  const factor = (r === 0) ? (1 / n) : (r / (1 - Math.pow(1 + r, -n)));
  const targetAF = targetPayment / factor;
  const taxableTrade = (i.taxTradeCredit && (i.tradeEquity || 0) > 0) ? Math.min(i.tradeEquity, i.price) : 0;
  const salesTax = Math.max(0, i.price - taxableTrade) * taxRate;
  const docWithTax = (i.docFee || 0) * (1 + taxRate);
  // amountFinanced = price + salesTax + docWithTax + gov + addons - down - rebates - trade
  const down = i.price + salesTax + docWithTax + (i.govFees || 0) + (i.addons || 0)
    - (i.rebates || 0) - (i.tradeEquity || 0) - targetAF;
  return Math.round(down);
}

// Standard amortization through `k` payments: how much of an `amountFinanced`
// loan is interest vs principal, and the remaining payoff balance. Because early
// payments are mostly interest, interestPaid/k is front-loaded vs the full term.
export function amortizeThrough(amountFinanced, apr, term, k) {
  if (!(amountFinanced > 0) || !(term > 0) || !(k > 0)) return null;
  k = Math.min(Math.round(k), term);
  const r = apr / 100 / 12;
  const monthly = (r === 0) ? amountFinanced / term
    : amountFinanced * r / (1 - Math.pow(1 + r, -term));
  let balance;
  if (r === 0) balance = amountFinanced - monthly * k;
  else balance = amountFinanced * Math.pow(1 + r, k) - monthly * (Math.pow(1 + r, k) - 1) / r;
  balance = Math.max(0, balance);
  const principalPaid = amountFinanced - balance;
  const paid = monthly * k;
  const interestPaid = Math.max(0, paid - principalPaid);
  return { monthly, k, balance, principalPaid, interestPaid, paid };
}

// "What if I sell / pay off the car early?" Interest paid by month `exitMonth`
// vs the loan's lifetime interest, plus the payoff balance you'd owe to clear it
// and the total cash you'd have sunk in by then (down + payments + payoff).
export function financeEarlyExit(i, exitMonth) {
  const q = financeQuote(i);
  if (!q || !(exitMonth > 0)) return null;
  const a = amortizeThrough(q.amountFinanced, i.apr, i.term, exitMonth);
  if (!a) return null;
  const interestShare = q.totalInterest > 0 ? (a.interestPaid / q.totalInterest) * 100 : 0;
  const termShare = (a.k / i.term) * 100;
  const cashToClear = (i.down || 0) + a.paid + a.balance;
  return {
    exitMonth: a.k, term: i.term, monthly: a.monthly,
    interestPaid: a.interestPaid, totalInterest: q.totalInterest,
    interestShare, termShare, balance: a.balance,
    principalPaid: a.principalPaid, paymentsMade: a.paid, cashToClear,
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
      '% mainstream-bank avg (' + (q.aprDelta >= 0 ? '+' : '') + q.aprDelta.toFixed(2) +
      ' pts). At or below the bank average is where you want to be.',
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
  const finDocCap = ('docFeeCap' in i) ? i.docFeeCap : CONFIG.docFeeCap;
  const finDocFlag = docFeeFlag(i.docFee, finDocCap, i.stateLabel);
  if (finDocFlag) { feeScore -= 40; flags.push(finDocFlag); }
  if ((i.govFees || 0) > 0.025 * i.price) {
    feeScore -= 20;
    flags.push({ level: 'warn', msg: 'Government fees over 2.5% of price; check for padded charges.' });
  }
  if ((i.addons || 0) > 500) {
    feeScore -= 30;
    flags.push({ level: 'warn', msg: '$' + i.addons + ' in dealer add-ons. Nitrogen, etch, protection packages: decline them.' });
  }
  if ((i.down || 0) > 0.30 * i.price) {
    feeScore -= 35;
    flags.push({ level: 'critical', msg: 'This payment only works because you are putting a massive amount down ($' + Math.round(i.down).toLocaleString('en-US') + '). The car is not actually cheap; the cash is hiding the real cost.' });
  } else if ((i.down || 0) > 0.20 * i.price) {
    feeScore -= 18;
    flags.push({ level: 'warn', msg: 'Large down payment: your monthly looks low because you prepaid a big chunk of the car.' });
  }
  feeScore = Math.max(0, feeScore);
  components.push({
    key: 'fees', label: 'Fees and add-ons', score: feeScore, weight: 5,
    detail: 'Doc fee, government fees, dealer add-ons.',
  });

  let critical = false;
  if ((i.down || 0) > 0.30 * i.price) {
    critical = true;
  }
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
  if ((i.rebates || 0) > 0 && (i.taxPct || 0) > 0) {
    flags.push({ level: 'info', msg: 'Sales tax applies to the price before manufacturer rebates, so the rebate does not cut your tax.' });
  }
  if (q.tradeTaxSaved > 0) {
    flags.push({ level: 'info', msg: 'Your state credits the trade-in against the taxable price, saving about $' + Math.round(q.tradeTaxSaved).toLocaleString('en-US') + ' in tax.' });
  }

  let score = 0, wsum = 0;
  for (const c of components) { score += c.score * c.weight; wsum += c.weight; }
  score = score / wsum;
  if (critical) score = Math.min(score, 49);
  score = Math.round(score);

  return { score, verdict: verdictFor(score), components, flags, quote: q, critical };
}
