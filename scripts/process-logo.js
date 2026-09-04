#!/usr/bin/env node
/**
 * process-logo.js
 * ----------------------------------------------------------------------------
 * Turns the supplied brand artwork (assets/images/logo.png — the STI lockup on
 * a white background) into the variants the site actually needs:
 *
 *   logo-mark.png         the "STi" wordmark + arc, whitespace trimmed,
 *                         white background made transparent
 *   logo-mark-light.png   the same, with the black recoloured to near-white for
 *                         use on the dark footer (the orange is preserved)
 *   logo-full.png         the complete lockup including the tagline,
 *                         trimmed and transparent
 *
 * The source file is never modified. Re-run with:  npm run logo
 *
 * How the transparency works
 * --------------------------
 * The artwork is foreground colour F composited over white at coverage a:
 *     P = a·F + (1 − a)·255
 * For any ink with at least one dark channel, a ≈ 1 − min(P)/255, and F can then
 * be un-premultiplied back out. That keeps anti-aliased edges smooth instead of
 * producing the jagged halo a plain white-key would give.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const IMAGES = path.resolve(__dirname, '..', 'assets', 'images');
const SOURCE = path.join(IMAGES, 'logo.png');

if (!fs.existsSync(SOURCE)) {
  console.error('No assets/images/logo.png found — nothing to process.');
  process.exit(0);
}

const src = PNG.sync.read(fs.readFileSync(SOURCE));
const { width: W, height: H } = src;

const at = (x, y) => (W * y + x) << 2;

/** How much ink is at this pixel: 0 for pure white, 1 for saturated colour. */
function coverage(x, y) {
  const i = at(x, y);
  const min = Math.min(src.data[i], src.data[i + 1], src.data[i + 2]);
  return 1 - min / 255;
}

const INK = 0.12; // below this a pixel counts as background

/* ------------------------------------------------------- find the content -- */

function rowHasInk(y, x0, x1) {
  for (let x = x0; x <= x1; x++) if (coverage(x, y) > INK) return true;
  return false;
}

function colHasInk(x, y0, y1) {
  for (let y = y0; y <= y1; y++) if (coverage(x, y) > INK) return true;
  return false;
}

/** Tightest box containing ink, within the given vertical band. */
function boundsIn(top, bottom) {
  let t = top, b = bottom, l = 0, r = W - 1;
  while (t < b && !rowHasInk(t, 0, W - 1)) t++;
  while (b > t && !rowHasInk(b, 0, W - 1)) b--;
  while (l < r && !colHasInk(l, t, b)) l++;
  while (r > l && !colHasInk(r, t, b)) r--;
  return { left: l, top: t, right: r, bottom: b };
}

const full = boundsIn(0, H - 1);

/**
 * Find the blank horizontal band that separates the wordmark from the tagline.
 * Scanning upward from the bottom finds the tagline first, then the gap above it.
 */
function findTaglineSplit() {
  const rows = [];
  for (let y = full.top; y <= full.bottom; y++) rows.push(rowHasInk(y, full.left, full.right));

  // Walk up from the bottom: skip the tagline's ink, then measure the gap.
  let y = rows.length - 1;
  while (y > 0 && !rows[y]) y--;          // trailing blank (shouldn't happen after trim)
  while (y > 0 && rows[y]) y--;           // the tagline itself
  const gapBottom = y;
  while (y > 0 && !rows[y]) y--;          // the gap
  const gapTop = y;

  const gap = gapBottom - gapTop;
  // Only trust it if the gap is a real design break, not letter spacing.
  if (gap < (full.bottom - full.top) * 0.04) return null;

  return full.top + Math.round((gapTop + gapBottom) / 2);
}

const split = findTaglineSplit();
const markBounds = split ? boundsIn(full.top, split) : full;

/* --------------------------------------------------------------- writing -- */

/**
 * Crops to `box` and writes a transparent PNG, downscaled to `maxHeight`.
 *
 * The source is ~1400px wide but the header renders it at 40px tall, so
 * shipping it at full size would mean a 600 KB request for a logo. Output is
 * sized for a 3x display and no larger.
 *
 * `recolour` optionally maps each recovered foreground colour.
 */
function write(name, box, maxHeight, recolour) {
  const w = box.right - box.left + 1;
  const h = box.bottom - box.top + 1;
  const rgba = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = at(box.left + x, box.top + y);
      const d = (w * y + x) << 2;

      const r = src.data[s];
      const g = src.data[s + 1];
      const b = src.data[s + 2];

      const a = 1 - Math.min(r, g, b) / 255;

      if (a <= 0.004) {
        rgba[d] = rgba[d + 1] = rgba[d + 2] = rgba[d + 3] = 0;
        continue;
      }

      // Un-premultiply: recover the ink colour from the white-composited pixel.
      let fr = clamp((r - 255 * (1 - a)) / a);
      let fg = clamp((g - 255 * (1 - a)) / a);
      let fb = clamp((b - 255 * (1 - a)) / a);

      if (recolour) {
        const mapped = recolour(fr, fg, fb);
        fr = mapped[0];
        fg = mapped[1];
        fb = mapped[2];
      }

      rgba[d] = fr;
      rgba[d + 1] = fg;
      rgba[d + 2] = fb;
      rgba[d + 3] = Math.round(a * 255);
    }
  }

  const scaled = downscale(rgba, w, h, maxHeight);

  const out = new PNG({ width: scaled.width, height: scaled.height });
  out.data.set(scaled.data);

  const file = path.join(IMAGES, name);
  fs.writeFileSync(file, PNG.sync.write(out, { deflateLevel: 9 }));
  console.log(
    `  ${name.padEnd(22)} ${scaled.width} x ${scaled.height}`.padEnd(48) +
      `${(fs.statSync(file).size / 1024).toFixed(0)} KB`
  );
  return scaled;
}

/**
 * Box-filter downscale in premultiplied alpha. Averaging straight RGBA would
 * drag the (arbitrary) colour of fully transparent pixels into the edges and
 * leave a dark fringe around the letterforms.
 */
function downscale(rgba, w, h, maxHeight) {
  if (h <= maxHeight) return { data: rgba, width: w, height: h };

  const scale = maxHeight / h;
  const dw = Math.max(1, Math.round(w * scale));
  const dh = maxHeight;
  const out = new Uint8ClampedArray(dw * dh * 4);

  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor((y * h) / dh);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * h) / dh));

    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor((x * w) / dw);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * w) / dw));

      let r = 0, g = 0, b = 0, a = 0, n = 0;

      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (w * sy + sx) << 2;
          const al = rgba[i + 3] / 255;
          r += rgba[i] * al;
          g += rgba[i + 1] * al;
          b += rgba[i + 2] * al;
          a += al;
          n++;
        }
      }

      const d = (dw * y + x) << 2;
      if (a > 0) {
        out[d] = r / a;
        out[d + 1] = g / a;
        out[d + 2] = b / a;
        out[d + 3] = (a / n) * 255;
      }
    }
  }

  return { data: out, width: dw, height: dh };
}

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

/**
 * Recolours the black wordmark to near-white for the dark footer, leaving the
 * orange alone.
 *
 * Note the brightness floor. Relative saturation is useless near black: a pixel
 * of (0, 4, 9) in the glossy lettering scores a saturation of 1.0 and would be
 * mistaken for brand colour. Absolute chroma plus a minimum brightness is what
 * actually separates the orange from near-black.
 */
function darkToLight(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;

  if (max > 90 && chroma > 60) return [r, g, b]; // the orange — leave it alone

  // Invert the neutral ink rather than flattening it, so the gloss on the
  // letterforms survives as subtle shading instead of a solid white slab.
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const v = clamp(250 - luminance * 0.35);
  return [v, v, v];
}

/* ------------------------------------------------------------------ main -- */

console.log('\nProcessing brand artwork from assets/images/logo.png\n');
console.log(`  source                 ${W} x ${H}`);
console.log(`  tagline split          ${split ? 'found at y=' + split : 'not found — using whole lockup'}\n`);

/* The header shows the mark at 38px tall; 84px covers a 2x display. The
   artwork has glossy gradients, which PNG compresses poorly, so this is the
   size/weight trade-off rather than a 3x asset. */
const mark = write('logo-mark.png', markBounds, 84);
write('logo-mark-light.png', markBounds, 84, darkToLight);
/* The full lockup is available for social cards and print, so allow more. */
write('logo-full.png', full, 220);

console.log(`\n  Header aspect ratio: ${(mark.width / mark.height).toFixed(2)}:1`);
console.log(`  At 38px tall the mark renders ${Math.round(38 * (mark.width / mark.height))}px wide.\n`);
