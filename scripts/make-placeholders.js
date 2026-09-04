#!/usr/bin/env node
/**
 * make-placeholders.js
 * ----------------------------------------------------------------------------
 * Generates the abstract SVG placeholder imagery in /assets/images/placeholders.
 *
 * These are stand-ins. Replace them with real photographs of the actual
 * material through the CMS media library as they become available -- nothing in
 * the site depends on these files by name except as a fallback.
 *
 * Run with:  npm run placeholders
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'assets', 'images', 'placeholders');
fs.mkdirSync(OUT, { recursive: true });

/* Industrial palette, kept close to the site's CSS custom properties. */
const INK = '#16181b';
const INK_2 = '#22262b';

const TONES = {
  copper: ['#c07d3f', '#8d5527'],
  aluminium: ['#9aa6b0', '#68727c'],
  kraft: ['#b08a5c', '#7d6039'],
  aramid: ['#c2ae86', '#8c7b58'],
  film: ['#7f97a6', '#4f6774'],
  neutral: ['#8c8f94', '#5c6066'],
  varnish: ['#a9632c', '#6b3d16'],
  glass: ['#c9cdd1', '#9aa0a6'],
};

const wrap = (w, h, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Abstract material illustration">
<defs>${defs}</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
${body}
</svg>
`;

const bgDef = () =>
  `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${INK_2}"/><stop offset="1" stop-color="${INK}"/>
  </linearGradient>`;

const toneDef = (tone) =>
  `<linearGradient id="tone" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${TONES[tone][0]}"/><stop offset="1" stop-color="${TONES[tone][1]}"/>
  </linearGradient>`;

/* -- motifs -------------------------------------------------------------- */

/** Wound conductor: tightly packed strands across a spool. */
function coil(w, h, tone) {
  const cy = h / 2;
  const bodyW = w * 0.62;
  const x0 = (w - bodyW) / 2;
  const strands = 26;
  const gap = bodyW / strands;
  const rows = [];
  for (let i = 0; i < strands; i++) {
    const x = x0 + i * gap + gap / 2;
    const o = (0.32 + 0.5 * Math.abs(Math.sin((i / strands) * Math.PI))).toFixed(3);
    rows.push(
      `<rect x="${x.toFixed(1)}" y="${(cy - h * 0.19).toFixed(1)}" width="${(gap * 0.62).toFixed(2)}" height="${(h * 0.38).toFixed(1)}" rx="${(gap * 0.31).toFixed(2)}" fill="url(#tone)" opacity="${o}"/>`
    );
  }
  return (
    `<g>` +
    `<rect x="${(x0 - w * 0.05).toFixed(1)}" y="${(cy - h * 0.27).toFixed(1)}" width="${(bodyW + w * 0.1).toFixed(1)}" height="${(h * 0.54).toFixed(1)}" rx="6" fill="#ffffff" opacity="0.03"/>` +
    rows.join('') +
    `<rect x="${(x0 - w * 0.05).toFixed(1)}" y="${(cy - h * 0.3).toFixed(1)}" width="${(w * 0.035).toFixed(1)}" height="${(h * 0.6).toFixed(1)}" rx="3" fill="${TONES.neutral[1]}" opacity="0.55"/>` +
    `<rect x="${(x0 + bodyW + w * 0.015).toFixed(1)}" y="${(cy - h * 0.3).toFixed(1)}" width="${(w * 0.035).toFixed(1)}" height="${(h * 0.6).toFixed(1)}" rx="3" fill="${TONES.neutral[1]}" opacity="0.55"/>` +
    `</g>`
  );
}

/** Stacked sheets, seen at a slight angle. */
function sheets(w, h, tone) {
  const layers = 5;
  const out = [];
  for (let i = layers - 1; i >= 0; i--) {
    const off = i * (h * 0.045);
    const x = w * 0.2 + off * 0.7;
    const y = h * 0.24 + off;
    const o = (0.9 - i * 0.14).toFixed(2);
    out.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(w * 0.5).toFixed(1)}" height="${(h * 0.34).toFixed(1)}" rx="2" fill="url(#tone)" opacity="${o}"/>`
    );
  }
  return `<g>${out.join('')}</g>`;
}

/** Overlapping translucent films with a sheen. */
function film(w, h, tone) {
  return (
    `<g>` +
    `<rect x="${w * 0.16}" y="${h * 0.26}" width="${w * 0.46}" height="${h * 0.44}" rx="2" fill="url(#tone)" opacity="0.55"/>` +
    `<rect x="${w * 0.3}" y="${h * 0.2}" width="${w * 0.46}" height="${h * 0.44}" rx="2" fill="url(#tone)" opacity="0.42"/>` +
    `<rect x="${w * 0.24}" y="${h * 0.33}" width="${w * 0.46}" height="${h * 0.44}" rx="2" fill="url(#tone)" opacity="0.3"/>` +
    `<path d="M${w * 0.16} ${h * 0.62} L${w * 0.62} ${h * 0.26}" stroke="#fff" stroke-width="1.5" opacity="0.18"/>` +
    `</g>`
  );
}

/** Rectangular bars, as strip stock. */
function bars(w, h, tone) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const y = h * 0.3 + i * (h * 0.1);
    out.push(
      `<rect x="${(w * 0.2 + i * w * 0.02).toFixed(1)}" y="${y.toFixed(1)}" width="${(w * 0.56).toFixed(1)}" height="${(h * 0.062).toFixed(1)}" rx="2" fill="url(#tone)" opacity="${(0.9 - i * 0.15).toFixed(2)}"/>`
    );
  }
  return `<g>${out.join('')}</g>`;
}

/** A roll seen face-on: concentric rings. */
function roll(w, h, tone) {
  const cx = w / 2;
  const cy = h / 2;
  const out = [];
  for (let i = 0; i < 7; i++) {
    const r = h * 0.34 - i * (h * 0.042);
    out.push(
      `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="url(#tone)" stroke-width="${(h * 0.026).toFixed(1)}" opacity="${(0.85 - i * 0.09).toFixed(2)}"/>`
    );
  }
  out.push(`<circle cx="${cx}" cy="${cy}" r="${(h * 0.05).toFixed(1)}" fill="${INK}" opacity="0.8"/>`);
  return `<g>${out.join('')}</g>`;
}

/** Wide hero: a field of vertical conductor strands fading out. */
function heroField(w, h) {
  const out = [];
  const n = 54;
  for (let i = 0; i < n; i++) {
    const x = (i / n) * w;
    const t = i / n;
    const o = (0.06 + 0.5 * Math.pow(Math.sin(t * Math.PI), 2)).toFixed(3);
    const hh = h * (0.4 + 0.5 * Math.pow(Math.sin(t * Math.PI + 0.6), 2));
    out.push(
      `<rect x="${x.toFixed(1)}" y="${((h - hh) / 2).toFixed(1)}" width="${(w / n) * 0.5}" height="${hh.toFixed(1)}" rx="${((w / n) * 0.25).toFixed(2)}" fill="url(#tone)" opacity="${o}"/>`
    );
  }
  return `<g>${out.join('')}<rect width="${w}" height="${h}" fill="url(#vig)"/></g>`;
}

/* -- generation ---------------------------------------------------------- */

const MOTIFS = { coil, sheets, film, bars, roll };

function make(name, w, h, motif, tone) {
  const svg = wrap(w, h, bgDef() + toneDef(tone), MOTIFS[motif](w, h, tone));
  fs.writeFileSync(path.join(OUT, name), svg, 'utf8');
  return name;
}

const files = [];

/* Generic fallbacks used by the build script when a product/category has no
   image set at all. */
files.push(make('product.svg', 800, 600, 'coil', 'neutral'));
files.push(make('category.svg', 800, 600, 'sheets', 'neutral'));

/*
 * One image per category, in assets/images/placeholders/cat-<slug>.svg.
 * Products reuse their category's image (there is no way to visually tell
 * brands of the same raw material apart without real photography, so a
 * fabricated distinction would be more misleading than sharing one).
 *
 * This list must stay in step with the CATEGORIES table in the one-off
 * content-authoring script used to generate /content -- if a category slug,
 * tone or motif changes there, regenerate here too.
 */
const CATEGORY_IMAGES = [
  { slug: 'enamelled-copper-winding-wire', tone: 'copper', motif: 'coil' },
  { slug: 'submersible-copper-wire', tone: 'copper', motif: 'coil' },
  { slug: 'enamelled-aluminium-winding-wire', tone: 'aluminium', motif: 'coil' },
  { slug: 'submersible-aluminium-wire', tone: 'aluminium', motif: 'coil' },
  { slug: 'f-class-insulation-paper', tone: 'aramid', motif: 'sheets' },
  { slug: 'polyester-film-electrical-grade', tone: 'film', motif: 'film' },
  { slug: 'kraft-paper-electrical-grade', tone: 'kraft', motif: 'sheets' },
  { slug: 'insulating-varnish', tone: 'varnish', motif: 'roll' },
  { slug: 'b-class-insulating-paper', tone: 'aramid', motif: 'sheets' },
  { slug: 'fiber-glass-wire', tone: 'glass', motif: 'coil' },
  { slug: 'insulating-sleeves', tone: 'aluminium', motif: 'bars' },
  { slug: 'insulating-tapes-threads', tone: 'kraft', motif: 'roll' },
  { slug: 'dcc-dpc-copper-aluminium-wires', tone: 'neutral', motif: 'coil' },
  { slug: 'bare-copper-winding-wire', tone: 'copper', motif: 'coil' },
  { slug: 'copper-strips', tone: 'copper', motif: 'bars' },
];

CATEGORY_IMAGES.forEach((c) => {
  files.push(make(`cat-${c.slug}.svg`, 800, 600, c.motif, c.tone));
});

/* Wide imagery. */
const vig = `<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
  <stop offset="0.45" stop-color="${INK}" stop-opacity="0"/>
  <stop offset="1" stop-color="${INK}" stop-opacity="0.85"/>
</radialGradient>`;

fs.writeFileSync(
  path.join(OUT, 'hero.svg'),
  wrap(1600, 900, bgDef() + toneDef('copper') + vig, heroField(1600, 900)),
  'utf8'
);
files.push('hero.svg');

fs.writeFileSync(
  path.join(OUT, 'about.svg'),
  wrap(1000, 750, bgDef() + toneDef('copper'), sheets(1000, 750, 'copper')),
  'utf8'
);
files.push('about.svg');

console.log(`\nWrote ${files.length} placeholder images to assets/images/placeholders/`);
console.log('The brand logo and favicon are real assets, not generated here.');
console.log('To regenerate the logo variants, run: npm run logo\n');
