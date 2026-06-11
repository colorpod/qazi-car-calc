// Generates the qazi-car-calc repo logo: a cream speedometer gauge on the
// suite's orange squircle. Matches the Qazi Agent OS house style (see the other
// repos' assets/brand/qazi-repo-logo*). Colors sampled from the existing suite
// logos. Run: node scripts/gen-logo.mjs   (needs the sharp devDependency)
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'assets', 'brand');
fs.mkdirSync(outDir, { recursive: true });

const S = 1024;
const CORNER = '#c8580f';     // outside the squircle (matches suite corner pixel)
const CREAM = '#fedca3';      // suite cream
const HUB = '#ec6204';        // gauge hub center (orange)

// Polar helper, SVG y-down: angle increases clockwise over the top.
const pt = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

function buildSvg() {
  const cx = 512, cyArc = 600, R = 300, sw = 66;
  // ~210-degree speedometer arc dipping just below horizontal at both ends.
  const a0 = Math.PI - 0.27, a1 = 2 * Math.PI + 0.27;
  const [sx, sy] = pt(cx, cyArc, R, a0);
  const [ex, ey] = pt(cx, cyArc, R, a1);
  const arc = `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${R} ${R} 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;

  // Needle pointing into the upper-right ("great") zone.
  const na = -1.02;                      // radians
  const L = 248, baseHalf = 22;
  const dir = [Math.cos(na), Math.sin(na)];
  const perp = [-Math.sin(na), Math.cos(na)];
  const tip = [cx + dir[0] * L, cyArc + dir[1] * L];
  const bl = [cx + perp[0] * baseHalf, cyArc + perp[1] * baseHalf];
  const br = [cx - perp[0] * baseHalf, cyArc - perp[1] * baseHalf];
  const needle = `${bl[0].toFixed(1)},${bl[1].toFixed(1)} ${tip[0].toFixed(1)},${tip[1].toFixed(1)} ${br[0].toFixed(1)},${br[1].toFixed(1)}`;

  // A few ticks just inside the arc so it reads as a meter.
  let ticks = '';
  const tickFracs = [0.06, 0.5, 0.94];
  for (const f of tickFracs) {
    const a = a0 + (a1 - a0) * f;
    const [x1, y1] = pt(cx, cyArc, R - sw / 2 - 18, a);
    const [x2, y2] = pt(cx, cyArc, R - sw / 2 - 60, a);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${CREAM}" stroke-width="20" stroke-linecap="round"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stop-color="#f5780f"/>
      <stop offset="52%" stop-color="#ec6204"/>
      <stop offset="100%" stop-color="#cf5d0d"/>
    </radialGradient>
    <filter id="lift" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#7a3408" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="${S}" height="${S}" fill="${CORNER}"/>
  <rect x="0" y="0" width="${S}" height="${S}" rx="232" ry="232" fill="url(#bg)"/>
  <g filter="url(#lift)" fill="none" stroke="${CREAM}" stroke-linecap="round">
    <path d="${arc}" stroke-width="${sw}"/>
    ${ticks}
    <polygon points="${needle}" fill="${CREAM}" stroke="${CREAM}" stroke-width="14" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cyArc}" r="50" fill="${CREAM}" stroke="none"/>
    <circle cx="${cx}" cy="${cyArc}" r="19" fill="${HUB}" stroke="none"/>
  </g>
</svg>`;
}

const svg = buildSvg();
fs.writeFileSync(path.join(outDir, 'qazi-repo-logo.svg'), svg);

const sizes = [1024, 512, 256, 192, 180, 128, 64, 32];
const buf = Buffer.from(svg);
for (const n of sizes) {
  await sharp(buf, { density: 384 })
    .resize(n, n)
    .flatten({ background: CORNER })   // opaque, like the rest of the suite
    .png()
    .toFile(path.join(outDir, `qazi-repo-logo-${n}.png`));
}
// Base file mirrors the 1024 master.
fs.copyFileSync(path.join(outDir, 'qazi-repo-logo-1024.png'), path.join(outDir, 'qazi-repo-logo.png'));
console.log('Wrote', sizes.length + 2, 'files to', outDir);
