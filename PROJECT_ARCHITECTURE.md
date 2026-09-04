# Project Architecture — Shiv Trading India

Technical reference for the website. For deployment steps see
[README.md](README.md); for full project context and history see
[CLAUDE.md](CLAUDE.md).

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript | Client requirement. No framework, no frontend build. |
| Content manager | Decap CMS 3.x | Git-based, free, runs entirely in the browser |
| Authentication | Netlify Identity + Git Gateway | Employees get a login without needing a GitHub account |
| Hosting | Netlify | Static CDN, atomic deploys, built-in forms |
| Content storage | Markdown + YAML front matter in Git | Versioned, diffable, no database |
| Content build | Node script, one dependency (`js-yaml`) | Turns Markdown into browser-readable JSON |
| Enquiry forms | Netlify Forms | No server, no Git commit per enquiry |

---

## The content pipeline

```
  content/products/*.md        ← Decap CMS writes these
  content/categories/*.md
  content/settings/*.md
            │
            │  npm run build   (Netlify runs this on every deploy)
            ▼
  scripts/build-content.js
            │  · parses YAML front matter
            │  · drops unpublished items
            │  · normalises field shapes and fills defaults
            │  · validates category references, warns without failing
            ▼
  data.json          all published content, one file
  sitemap.xml        every public URL
            │
            │  fetch('/data.json')  — once per page load
            ▼
  window.STI.data    read helpers in assets/js/data-loader.js
            │
            ▼
  Vanilla JS renders products, categories, search, cart
```

### Why a build step exists

Decap writes Markdown with YAML front matter. Browsers cannot parse that. Rather
than shipping a YAML parser to every visitor and issuing one request per product,
the build flattens everything into a single JSON file fetched once.

It also gives us a place to enforce invariants **before** content reaches a
browser:

- Unpublished products and categories are removed at build time, not hidden with
  CSS. Draft content never leaves the server.
- Missing images fall back to a placeholder rather than rendering broken.
- A `priceType` of `fixed` with no price is downgraded to `price-on-request`
  rather than rendering an empty price.
- Unknown enum values are coerced to safe defaults with a warning.

### Failure behaviour

The build **never throws on a single bad content file**. It warns and skips. One
malformed product must not be able to take the whole website offline. A build
that fails outright indicates something structural — a missing `content` folder,
or `js-yaml` failing to install.

---

## Data shapes

### Product (as emitted into `data.json`)

```jsonc
{
  "slug": "enamelled-copper-winding-wire",
  "name": "Enamelled Copper Winding Wire",
  "category": "copper-winding-wires",
  "shortDescription": "…",       // product card, meta description fallback
  "description": "…",            // product page body
  "body": "…",                   // optional extra Markdown
  "priceType": "price-on-request",  // fixed | starting-from | price-on-request | hidden
  "price": "",
  "priceUnit": "per kg",
  "primaryImage": "/assets/images/…",
  "images": ["…"],               // primary first, de-duplicated
  "specifications": [{ "key": "Material", "value": "Electrolytic copper" }],
  "availability": "in-stock",    // in-stock | limited | on-request | out-of-stock | discontinued
  "featured": true,
  "showOnHomepage": true,
  "displayOrder": 1,
  "seoTitle": "…",               // falls back to "<name> - Shiv Trading India"
  "seoDescription": "…"          // falls back to shortDescription
}
```

`published` is **not** in the output — unpublished products are absent entirely.

### Category

```jsonc
{
  "slug": "copper-winding-wires",
  "name": "Copper Winding Wires",
  "description": "…",
  "body": "…",
  "image": "/assets/images/…",
  "featured": true,
  "displayOrder": 1,
  "seoTitle": "…",
  "seoDescription": "…"
}
```

### Settings

Keyed by filename: `settings.contact`, `settings.homepage`, `settings.about`,
`settings.general`. Read through `STI.setting(group, key, fallback)`, which
always returns the fallback for missing or empty values — so a blank CMS field
degrades gracefully instead of printing `undefined`.

---

## URL architecture

One template serves each dynamic page type. Netlify rewrites give them real URLs:

```toml
[[redirects]]
  from = "/product/*"
  to = "/product.html"
  status = 200          # rewrite, not redirect — the pretty URL stays

[[redirects]]
  from = "/category/*"
  to = "/category.html"
  status = 200
```

`STI.ui.readSlug('product')` reads the slug from the path, falling back to
`?slug=` so older links keep working.

| URL | Serves |
|---|---|
| `/` | index.html |
| `/products.html` | Full catalogue |
| `/product/<slug>` | product.html |
| `/category/<slug>` | category.html |
| `/rfq.html` | Quote request (noindex) |
| `/search.html` | Search (noindex) |
| `/thank-you.html` | Post-submission (noindex) |
| anything else | 404.html |

There is deliberately **no catch-all redirect**. A SPA-style
`/* → /index.html 200` would make every mistyped URL return a 200 with homepage
content, which is bad for users and actively harmful for SEO.

### SEO with client-side rendering

Product and category pages set their title, meta description, Open Graph tags,
canonical URL and JSON-LD from JavaScript after `data.json` loads. Googlebot
renders JavaScript, so this indexes correctly, and every product and category URL
is listed in `sitemap.xml` with strong internal linking from the catalogue,
footer and related-products sections.

Unknown slugs render an explicit empty state **and inject
`<meta name="robots" content="noindex">`**, so mistyped or retired URLs cannot
enter the index as thin pages.

If indexing ever proves too slow, the upgrade path is to prerender product pages
at build time — `build-content.js` already holds every product in memory when it
runs.

---

## Frontend module structure

Everything hangs off one global, `window.STI`. Plain scripts in a fixed order —
no bundler, no module system.

```
data-loader.js   STI.load(), STI.products(), STI.setting(), STI.searchProducts()
ui.js            STI.ui.*  — ALL shared rendering
navigation.js    header, drawer, search panel, CMS contact details
animations.js    STI.reveal(), hero parallax
rfq.js           STI.cart.*, RFQ page, form submission
catalog.js       products.html and category.html
product.js       product.html
search.js        search.html and the header search form
main.js          homepage, about, contact; Organization JSON-LD
```

Load order on every page:

```
data-loader → ui → navigation → animations → rfq → search → [page module] → main
```

Every page module begins with `STI.load().then(...)`. `STI.load()` caches its
promise and **never rejects** — on failure it logs, resolves to empty data, and
sets a `data-failed` class on `<html>`.

### Single-source rendering

`ui.js` owns every product card, category card, price, availability badge and
toast on the site. Nothing else builds that markup. The first draft of this
project duplicated card markup across three files and they drifted apart within a
single revision.

### Escaping

All CMS content passes through `UI.esc()` before entering `innerHTML`. Product
names are user input; an unescaped apostrophe broke the original build's
`onclick` handlers, and unescaped angle brackets are an injection vector. Event
handling is delegated via `data-` attributes rather than inline `onclick`.

---

## RFQ cart

Stored in `localStorage` under `sti.rfq.v1` as:

```json
[{ "slug": "nomex-insulation-paper", "quantity": 20, "unit": "sheets" }]
```

**Only the slug, quantity and unit.** Names, images, categories and prices are
looked up fresh from `data.json` on every render, so an edit in the CMS is
reflected immediately in a cart that was filled a week ago.

- `Cart.prune()` drops entries whose product no longer exists or was unpublished,
  and the RFQ page tells the customer this happened.
- All storage access is wrapped in `try/catch` — private browsing and disabled
  storage degrade to a session-only cart rather than throwing.
- A `sti:cart-changed` event drives badge updates and keeps the hidden Netlify
  field in sync.
- A `storage` listener keeps multiple tabs consistent.

---

## Form submission

Both forms are Netlify Forms. The **static markup** in `rfq.html` and
`contact.html` is what registers them at deploy time — Netlify parses the
deployed HTML for `data-netlify="true"` and records the field names. Removing a
field from the HTML stops Netlify accepting it.

Submission goes through `fetch` rather than a native POST
(`STI.submitNetlifyForm`), so the page can validate first, show inline errors,
and only clear the cart once the send has actually succeeded. `action` is still
set on the form as a no-JavaScript fallback.

The cart is serialised into a hidden `products` textarea:

```
1. Nomex Insulation Paper — 20 sheets (/product/nomex-insulation-paper)
2. Cotton Binding Tape — 5 rolls (/product/cotton-binding-tape)
```

Spam protection: a honeypot field (`company-website`) hidden off-screen,
declared to Netlify via `netlify-honeypot`.

**Enquiries are read at** Netlify → the site → **Forms** → `rfq` / `contact`.

---

## CSS organisation

Load order matters:

```
variables.css    design tokens only
main.css         reset, typography, layout primitives, forms
components.css   buttons, header, drawer, cards, badges, footer, toasts
pages.css        page-specific layouts
responsive.css   breakpoints and reveal-animation states — must load last
```

Principles:

- Radii and shadows are deliberately small. The design reads premium through
  spacing, type and hairlines rather than rounded boxes and drop shadows.
- Copper is an accent, never dominant.
- Mobile layouts are re-composed at each breakpoint, not shrunk — the catalogue
  sidebar becomes a collapsible panel, the RFQ row re-flows to a grid-area
  layout, the nav becomes a drawer.
- Everything animated is inert under `prefers-reduced-motion: reduce`.
- `[data-reveal]` starts at `opacity: 0`, but `.no-js [data-reveal]` forces it
  visible — so a JavaScript failure leaves content readable rather than blank.

---

## Caching

| Path | Policy | Reason |
|---|---|---|
| `/assets/images/*` | 1 year, immutable | Uploads get unique names |
| `/assets/css/*`, `/assets/js/*` | `max-age=0, must-revalidate` | **Filenames are not content-hashed.** A long cache would strand visitors on stale code for months. |
| `/data.json` | `max-age=0, must-revalidate` | A newly published product must appear immediately |
| `/*.html` | `max-age=0, must-revalidate` | Same |
| `/admin/*` | `no-store` + `X-Robots-Tag: noindex` | Config changes take effect on reload; the CMS stays out of search |

Netlify serves ETags, so revalidation is a cheap 304 in practice.

---

## Performance

- One `fetch` for the entire catalogue, cached by the browser across navigations.
- No framework, no bundler, no runtime dependencies. Total JS is roughly 40 KB
  uncompressed.
- All non-hero images `loading="lazy"` with explicit `width`/`height` to avoid
  layout shift; the hero uses `fetchpriority="high"`.
- Scroll handlers are `requestAnimationFrame`-throttled and `passive`. The hero
  parallax stops computing once the hero leaves the viewport.
- `IntersectionObserver` for reveals, with observers disconnected after firing.
- Placeholder artwork is SVG — a few kilobytes each, and resolution-independent.

---

## Accessibility

- Semantic landmarks, one `<h1>` per page, skip link.
- Focus is visible everywhere (`:focus-visible`, copper ring).
- The mobile drawer traps focus, closes on `Escape`, restores focus on close, and
  is `inert` while shut.
- Forms use real `<label>` elements, `aria-invalid`, and inline error text.
- Dynamic regions are `aria-live="polite"`; toasts are in a `role="status"`
  region.
- Product card images are `alt=""` with the accessible name on the title link, so
  screen readers do not hear the product name twice.
- Availability is conveyed by text, not colour alone.

---

## Scaling

| Products | Position |
|---|---|
| 10–50 | Current architecture, no changes |
| 50–200 | Compress images before upload; consider `Cache-Control` tuning |
| 200–500 | Watch repository size; plan media migration |
| 500+ | Move media to Cloudinary; consider splitting `data.json` per category and prerendering product pages |

`data.json` at 500 products with this field set would be roughly 500 KB
uncompressed and well under 100 KB gzipped — still a single acceptable request.
The pressure point is Git repository size from images, not the JSON.

---

## Known limitations

- Product pages are client-rendered. Correct for Google, but non-rendering
  crawlers and some social scrapers see the template's default meta tags.
- Search is a linear scan over all products. Fine to a few thousand; beyond that
  it needs an index.
- The canonical host `https://www.shivtradingindia.com` is hardcoded in three
  places: `SITE_URL` in `scripts/build-content.js`, `UI.absoluteUrl` in
  `assets/js/ui.js`, and the `<link rel="canonical">` tags in the HTML.
- The header and footer are duplicated across the HTML files. Intentional —
  it keeps navigation crawlable and avoids a flash of unstyled chrome — but any
  change to them must be applied to every page.
