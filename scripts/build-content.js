#!/usr/bin/env node
/**
 * build-content.js
 * ----------------------------------------------------------------------------
 * Turns the Decap CMS content files in /content into two generated artefacts
 * that the vanilla-JS frontend can consume directly:
 *
 *     /data.json     -- every published product, category and setting
 *     /sitemap.xml   -- all public URLs, including one per product & category
 *
 * Run with:  npm run build
 * Netlify runs this automatically on every deploy (see netlify.toml), which is
 * what makes the "employee clicks Publish -> website updates" loop work.
 *
 * Design notes
 * ------------
 * 1. Unpublished products/categories are removed HERE, at build time, so draft
 *    content is never shipped to the browser at all.
 * 2. Field shapes are normalised so the frontend only ever sees one flat shape,
 *    even if an older CMS config nested pricing/SEO fields inside objects.
 * 3. The script never throws on a single bad file -- it warns and skips, so one
 *    malformed product can't take the whole website offline.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const SITE_URL = 'https://www.shivtradingindia.com';

/* ------------------------------------------------------------------ helpers */

const warnings = [];
const warn = (msg) => {
  warnings.push(msg);
  console.warn('  ! ' + msg);
};

/** Read every .md/.yml file in a folder. Returns [] if the folder is absent. */
function readFolder(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(md|markdown|yml|yaml)$/i.test(f))
    .sort()
    .map((file) => ({ file, raw: fs.readFileSync(path.join(dir, file), 'utf8') }));
}

/**
 * Split a Decap "yaml-frontmatter" file into { data, body }.
 * Also tolerates a plain .yml file with no fences.
 */
function parseFrontmatter(raw, label) {
  const text = raw.replace(/^﻿/, '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  let front = text;
  let body = '';

  if (match) {
    front = match[1];
    body = match[2] || '';
  }

  try {
    const data = yaml.load(front) || {};
    if (typeof data !== 'object' || Array.isArray(data)) {
      warn(`${label}: front matter is not a key/value block - skipped.`);
      return null;
    }
    return { data, body: body.trim() };
  } catch (err) {
    warn(`${label}: invalid YAML front matter (${err.message}) - skipped.`);
    return null;
  }
}

/** Turn "Some Product Name" into "some-product-name". */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Decap booleans can arrive as true/false/"true"/undefined. */
function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

/**
 * Older CMS configs nested fields inside `pricing:` / `seo:` objects. Accept
 * both shapes so content written under either config keeps working.
 */
function pick(data, key, groups) {
  if (data[key] !== undefined) return data[key];
  for (const group of groups) {
    if (data[group] && typeof data[group] === 'object' && data[group][key] !== undefined) {
      return data[group][key];
    }
  }
  return undefined;
}

/** Ensure an image path is site-absolute so it resolves from any page depth. */
function imagePath(value) {
  const v = str(value);
  if (!v) return '';
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v;
  return v.startsWith('/') ? v : '/' + v;
}

const PRICE_TYPES = ['fixed', 'starting-from', 'price-on-request', 'hidden'];
const AVAILABILITIES = ['in-stock', 'limited', 'on-request', 'out-of-stock', 'discontinued'];

const PLACEHOLDER_PRODUCT = '/assets/images/placeholders/product.svg';
const PLACEHOLDER_CATEGORY = '/assets/images/placeholders/category.svg';

/* ----------------------------------------------------------------- products */

function buildProducts() {
  const files = readFolder(path.join(CONTENT, 'products'));
  const products = [];
  const seen = new Set();

  for (const { file, raw } of files) {
    const parsed = parseFrontmatter(raw, `products/${file}`);
    if (!parsed) continue;

    const d = parsed.data;
    const name = str(d.name);
    if (!name) {
      warn(`products/${file}: missing "name" - skipped.`);
      continue;
    }

    const slug = slugify(d.slug || name);
    if (!slug) {
      warn(`products/${file}: could not derive a slug - skipped.`);
      continue;
    }
    if (seen.has(slug)) {
      warn(`products/${file}: duplicate slug "${slug}" - skipped.`);
      continue;
    }

    if (!bool(d.published, true)) continue; // draft: never leaves the build
    seen.add(slug);

    let priceType = str(pick(d, 'priceType', ['pricing']), 'price-on-request');
    if (!PRICE_TYPES.includes(priceType)) {
      warn(`products/${file}: unknown priceType "${priceType}" - using price-on-request.`);
      priceType = 'price-on-request';
    }

    let availability = str(d.availability, 'on-request');
    if (!AVAILABILITIES.includes(availability)) {
      warn(`products/${file}: unknown availability "${availability}" - using on-request.`);
      availability = 'on-request';
    }

    const price = str(pick(d, 'price', ['pricing']));
    if ((priceType === 'fixed' || priceType === 'starting-from') && !price) {
      warn(`products/${file}: priceType is "${priceType}" but no price is set - it will show as Price on Request.`);
      priceType = 'price-on-request';
    }

    const primaryImage = imagePath(d.primaryImage) || PLACEHOLDER_PRODUCT;

    // Gallery = primary image first, then extras, de-duplicated.
    const extra = Array.isArray(d.images) ? d.images.map(imagePath).filter(Boolean) : [];
    const images = [primaryImage, ...extra].filter((v, i, a) => a.indexOf(v) === i);

    const specifications = (Array.isArray(d.specifications) ? d.specifications : [])
      .map((s) => ({ key: str(s && s.key), value: str(s && s.value) }))
      .filter((s) => s.key && s.value);

    const shortDescription = str(d.shortDescription);

    products.push({
      slug,
      name,
      category: slugify(d.category),
      brand: str(d.brand),
      shortDescription,
      description: str(d.description) || shortDescription,
      body: parsed.body,
      priceType,
      price,
      priceUnit: str(pick(d, 'priceUnit', ['pricing'])),
      primaryImage,
      images,
      specifications,
      availability,
      featured: bool(d.featured, false),
      showOnHomepage: bool(d.showOnHomepage, false),
      displayOrder: num(d.displayOrder, 99),
      seoTitle: str(pick(d, 'seoTitle', ['seo'])) || `${name} - Shiv Trading India`,
      seoDescription: str(pick(d, 'seoDescription', ['seo'])) || shortDescription,
    });
  }

  products.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  return products;
}

/* --------------------------------------------------------------- categories */

function buildCategories() {
  const files = readFolder(path.join(CONTENT, 'categories'));
  const categories = [];
  const seen = new Set();

  for (const { file, raw } of files) {
    const parsed = parseFrontmatter(raw, `categories/${file}`);
    if (!parsed) continue;

    const d = parsed.data;
    const name = str(d.name);
    if (!name) {
      warn(`categories/${file}: missing "name" - skipped.`);
      continue;
    }

    const slug = slugify(d.slug || name);
    if (!slug || seen.has(slug)) {
      warn(`categories/${file}: missing or duplicate slug - skipped.`);
      continue;
    }
    if (!bool(d.published, true)) continue;
    seen.add(slug);

    categories.push({
      slug,
      name,
      description: str(d.description),
      body: parsed.body,
      image: imagePath(d.image) || PLACEHOLDER_CATEGORY,
      featured: bool(d.featured, false),
      displayOrder: num(d.displayOrder, 99),
      seoTitle: str(d.seoTitle) || `${name} - Shiv Trading India`,
      seoDescription: str(d.seoDescription) || str(d.description),
    });
  }

  categories.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  return categories;
}

/* ----------------------------------------------------------------- settings */

function buildSettings() {
  const files = readFolder(path.join(CONTENT, 'settings'));
  const settings = {};

  for (const { file, raw } of files) {
    const parsed = parseFrontmatter(raw, `settings/${file}`);
    if (!parsed) continue;
    const key = file.replace(/\.(md|markdown|yml|yaml)$/i, '');
    settings[key] = parsed.data;
  }

  // Normalise image paths anywhere in the settings tree.
  for (const group of Object.values(settings)) {
    for (const [k, v] of Object.entries(group)) {
      if (/image|logo|photo/i.test(k) && typeof v === 'string') group[k] = imagePath(v);
    }
  }

  return settings;
}

/* ------------------------------------------------------------- integrity check */

function crossCheck(products, categories) {
  const slugs = new Set(categories.map((c) => c.slug));
  for (const p of products) {
    if (!p.category) {
      warn(`Product "${p.name}" has no category assigned.`);
    } else if (!slugs.has(p.category)) {
      warn(`Product "${p.name}" points at category "${p.category}", which is missing or unpublished.`);
    }
  }
}

/* ------------------------------------------------------------------ sitemap */

function buildSitemap(products, categories) {
  const today = new Date().toISOString().slice(0, 10);

  const staticPages = [
    ['/', '1.0'],
    ['/products.html', '0.9'],
    ['/about.html', '0.7'],
    ['/contact.html', '0.7'],
    ['/rfq.html', '0.6'],
    ['/search.html', '0.3'],
  ];

  const urls = [
    ...staticPages.map(([loc, priority]) => ({ loc, priority, changefreq: 'monthly' })),
    ...categories.map((c) => ({ loc: `/category/${c.slug}`, priority: '0.8', changefreq: 'weekly' })),
    ...products.map((p) => ({ loc: `/product/${p.slug}`, priority: '0.8', changefreq: 'weekly' })),
  ];

  const body = urls
    .map(
      (u) =>
        '  <url>\n' +
        `    <loc>${SITE_URL}${u.loc}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${u.changefreq}</changefreq>\n` +
        `    <priority>${u.priority}</priority>\n` +
        '  </url>'
    )
    .join('\n');

  return {
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    count: urls.length,
  };
}

/* --------------------------------------------------------------------- main */

function main() {
  console.log('\nShiv Trading India - building site content\n');

  if (!fs.existsSync(CONTENT)) {
    console.error('ERROR: /content folder not found. Nothing to build.');
    process.exit(1);
  }

  const products = buildProducts();
  const categories = buildCategories();
  const settings = buildSettings();

  crossCheck(products, categories);

  const data = {
    generatedAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    products,
    categories,
    settings,
  };

  const sitemap = buildSitemap(products, categories);

  fs.writeFileSync(path.join(ROOT, 'data.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap.xml, 'utf8');

  console.log(`  data.json     ${products.length} products, ${categories.length} categories, ${Object.keys(settings).length} settings files`);
  console.log(`  sitemap.xml   ${sitemap.count} URLs`);

  if (warnings.length) {
    console.log(`\n  Finished with ${warnings.length} warning(s). The site will still deploy.`);
  } else {
    console.log('\n  Finished with no warnings.');
  }
  console.log('');
}

main();
