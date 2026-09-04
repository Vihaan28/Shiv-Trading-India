# Shiv Trading India — Website

A B2B product catalogue website with a browser-based content manager, built so
that non-technical staff can add products, change prices and update contact
details without a developer.

- **Frontend:** HTML5, CSS3, vanilla JavaScript. No frameworks, no build tooling
  for the frontend.
- **Content manager:** [Decap CMS](https://decapcms.org) at `/admin`
- **Hosting:** [Netlify](https://netlify.com)
- **Content storage:** Markdown files in this Git repository
- **Enquiry forms:** Netlify Forms

If you are an employee who just needs to add a product, you want
**[EMPLOYEE-GUIDE.md](EMPLOYEE-GUIDE.md)**, not this file.

---

## How the website works

This matters, because it explains why there is a "build" at all.

```
1.  An employee opens shivtradingindia.com/admin and clicks Publish
              ↓
2.  Decap CMS saves a Markdown file into content/products/ in GitHub
              ↓
3.  Netlify sees the new commit and runs:  npm run build
              ↓
4.  scripts/build-content.js reads every file in /content and writes:
          data.json     — every published product, category and setting
          sitemap.xml   — every public URL, for Google
              ↓
5.  Netlify publishes the site
              ↓
6.  A visitor's browser loads the page, fetches data.json once, and the
    JavaScript renders the catalogue
```

**Why the build step is necessary.** Decap CMS writes Markdown with YAML front
matter. A browser cannot read that. The build converts it into one JSON file the
frontend can fetch in a single request. It also removes unpublished products (so
drafts never reach a visitor), fills in sensible defaults, and warns about
problems like a product pointing at a category that no longer exists.

The whole cycle from Publish to live is usually **one to two minutes**.

---

## Running it on your own computer

You need [Node.js](https://nodejs.org) version 18 or newer.

```bash
npm install        # once
npm run build      # generate data.json and sitemap.xml
npm run dev        # build, then serve at http://localhost:3000
```

Two other commands you will rarely need:

```bash
npm run placeholders   # regenerate the stand-in product artwork
npm run logo           # regenerate the logo variants from assets/images/logo.png
```

> **Replacing the logo:** drop the new artwork in as `assets/images/logo.png`
> and run `npm run logo`. It trims the whitespace, makes the background
> transparent, produces a light version for the dark footer, and resizes for the
> web. Do not edit `logo-mark.png` by hand — it is regenerated.

> **Important:** you must open the site through `http://localhost:3000`, not by
> double-clicking `index.html`. Browsers block `fetch()` on `file://` addresses,
> so the catalogue will be empty if you open the file directly.

### Editing content locally

To run the CMS on your own machine against local files:

1. Uncomment `local_backend: true` in `admin/config.yml`.
2. In one terminal: `npx decap-server`
3. In another: `npm run dev`
4. Open `http://localhost:3000/admin`

Remember to re-comment `local_backend` before pushing.

---

## Project structure

```
index.html               Homepage
about.html               About page
products.html            All 15 categories, as cards
product.html             ONE template that serves every product
category.html            ONE template that serves every category (lists the brands stocked in it)
rfq.html                 Multi-product quote request
contact.html             Contact details and form
search.html              Site search
privacy-policy.html      Privacy policy
thank-you.html           Shown after a form is sent
404.html                 Not found

admin/
  index.html             Loads Decap CMS
  config.yml             Defines the forms employees see

content/                 THE SOURCE OF TRUTH — edited by the CMS
  products/*.md
  categories/*.md
  settings/               homepage, about, contact, general

assets/
  css/                   variables → main → components → pages → responsive
  js/                    see the table below
  images/
    logo.png             client-supplied master artwork (never edit)
    logo-mark*.png       derived header/footer variants (npm run logo)
    uploads/             where CMS image uploads land
    placeholders/        generated stand-in artwork

scripts/
  build-content.js       Turns /content into data.json + sitemap.xml
  make-placeholders.js   Regenerates the placeholder artwork
  process-logo.js        Derives the header/footer logos from logo.png

data.json                GENERATED — do not edit by hand
sitemap.xml              GENERATED — do not edit by hand
netlify.toml             Build, redirects, headers
robots.txt
```

### JavaScript

| File | What it does |
|---|---|
| `data-loader.js` | Loads `data.json`; all the read helpers |
| `ui.js` | Shared rendering: product cards, prices, badges, toasts, Markdown |
| `navigation.js` | Header, mobile menu, contact details pulled from the CMS |
| `animations.js` | Scroll reveals and the hero parallax |
| `rfq.js` | The quote cart and form submission |
| `catalog.js` | The products page and category pages |
| `product.js` | The product detail page |
| `search.js` | Search |
| `main.js` | Homepage, about page, contact page |

---

# Deployment — step by step

Written for someone who has not done this before. Follow it in order.

### Step 1 — Prepare the project

Make sure the site runs locally first:

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:3000` and check that products appear.

### Step 2 — Create a GitHub repository

1. Sign in at [github.com](https://github.com) and click **New repository**.
2. Name it `shiv-trading-india`.
3. Choose **Private**.
4. Do **not** tick "Add a README" — this project already has one.
5. Click **Create repository**.

### Step 3 — Upload the project

From this folder:

```bash
git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/shiv-trading-india.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

> The branch **must** be called `main` — `admin/config.yml` refers to it by name.

### Step 4 — Connect the repository to Netlify

1. Sign in at [netlify.com](https://netlify.com) with your GitHub account.
2. **Add new site → Import an existing project → GitHub**.
3. Authorise Netlify and pick `shiv-trading-india`.

### Step 5 — Configure build settings

Netlify reads these from `netlify.toml` automatically. Confirm they show:

| Setting | Value |
|---|---|
| Branch to deploy | `main` |
| Build command | `npm run build` |
| Publish directory | `.` |

### Step 6 — Deploy

Click **Deploy site**. The first build takes a minute or two. Netlify gives you
a temporary address like `https://cheerful-otter-12ab34.netlify.app` — open it
and check the site works.

### Step 7 — Configure the CMS

Nothing to do. `/admin` is already in the project and deploys with the site.
It will not let anyone in until you finish Step 8.

### Step 8 — Turn on authentication

1. In Netlify: **Site configuration → Identity → Enable Identity**.
2. Under **Registration preferences**, choose **Invite only**.
   **Do not skip this.** "Open" registration means anyone on the internet can
   sign up and edit your website.
3. Optional but recommended: under **External providers**, enable **Google** so
   staff can sign in with a Google account instead of another password.

### Step 9 — Enable Git Gateway

Still under **Identity**, scroll to **Services → Git Gateway → Enable Git
Gateway**.

This is what lets the CMS save changes to GitHub on an employee's behalf,
without giving them a GitHub account. Nothing at `/admin` works until this is on.

### Step 10 — Invite employees

1. **Identity → Invite users**.
2. Enter their email address and send.
3. They get an email, click the link, set a password, and are taken to `/admin`.

Invite yourself first and check it works before inviting anyone else.

### Step 11 — Open the content manager

Go to `https://your-site.netlify.app/admin` (later
`https://www.shivtradingindia.com/admin`) and sign in.

You should see **Products**, **Categories** and **Website Settings**.

### Step 12 — Add a product

**Products → New Product**, fill in the form, then **Publish**.

The most important fields:
- **Product name** — what customers see.
- **Web address (slug)** — lowercase with hyphens. Do not change it later.
- **Category** — pick one. Create the category first if it is not listed.
- **Short description** — one or two lines, shown on the product card.

### Step 13 — Upload product images

In the product form, click **Main image → Choose an image → Upload**. Pick a
photo from your computer. It uploads into `assets/images/uploads/` automatically.

Add extras under **More images** — they become thumbnails under the main image.

### Step 14 — Change availability

Open the product, change the **Availability** dropdown, click **Publish**.
The badge on the website updates on the next deploy.

### Step 15 — Change a price

Set **How should the price be shown?** to one of:

| Option | What visitors see |
|---|---|
| Price on request | "Price on request" |
| Fixed price | ₹450 per kg |
| Starting from | "Starting from ₹450 per kg" |
| Hide pricing completely | Nothing at all |

For the middle two, put a plain number in **Price** (`450`, not `₹450`) and pick
a **Price unit**.

### Step 16 — Create a category

**Categories → New Category**. Fill in the name, slug, description and image,
then **Publish**.

The category page at `/category/your-slug` starts working immediately. No
developer, no new files.

### Step 17 — Publish

**Publish** in the CMS commits to GitHub, which triggers a Netlify build.

### Step 18 — Confirm it is live

Watch **Deploys** in the Netlify dashboard. When the newest deploy says
**Published** (usually one to two minutes), reload the website. If you do not
see the change, hard-refresh with `Ctrl+Shift+R`.

---

# Connecting the custom domain

Assumes you own `shivtradingindia.com` through a registrar such as GoDaddy,
BigRock or Namecheap.

### 1. Add the domain in Netlify

**Domain management → Add a domain →** enter `shivtradingindia.com` → **Verify**
→ **Add domain**.

Netlify will then show you what DNS to configure. There are two routes.

### 2a. Easiest — let Netlify run your DNS

Netlify shows four nameservers like:

```
dns1.p03.nsone.net
dns2.p03.nsone.net
dns3.p03.nsone.net
dns4.p03.nsone.net
```

Sign in to your registrar, find **Nameservers** (sometimes "DNS management" or
"Custom DNS"), replace whatever is there with those four, and save.

> **Warning:** this moves *all* DNS for the domain to Netlify. If you have email
> on this domain, copy your existing MX records into Netlify's DNS panel
> **before** switching, or email will stop arriving.

### 2b. Keep your existing DNS

At your registrar, add:

| Type | Name | Value |
|---|---|---|
| A | `@` | `75.2.60.5` |
| CNAME | `www` | `your-site.netlify.app` |

Netlify shows the exact values to use — copy them from the dashboard rather than
from here, as they can change.

### 3. Wait

DNS changes take anywhere from a few minutes to 48 hours. Netlify's domain panel
shows the current status.

### 4. HTTPS

Once DNS resolves, Netlify issues a free Let's Encrypt certificate
automatically. If it has not appeared after an hour, click **Verify DNS
configuration** then **Provision certificate**.

### 5. www or not

Netlify redirects one to the other automatically. Set your preference under
**Domain management → Primary domain**. `www.shivtradingindia.com` is the
default assumed throughout this project — it is what appears in `sitemap.xml`,
`robots.txt` and the canonical tags.

If you choose the non-www version instead, update the `SITE_URL` constant at the
top of `scripts/build-content.js`, the `UI.absoluteUrl` function in
`assets/js/ui.js`, and the `<link rel="canonical">` tags in the HTML files.

---

# Where enquiries arrive

Both the quote request form and the contact form submit to **Netlify Forms**.
Nothing is committed to Git, and no server is involved.

**To read them:** Netlify dashboard → your site → **Forms** → `rfq` or `contact`.

**To get an email when one arrives** (do this — otherwise you have to remember
to check the dashboard):

1. **Forms → Form notifications → Add notification → Email notification**
2. Choose the form, enter the email address to notify, save.

Repeat for both forms.

The quote request includes a `products` field listing every product the customer
selected, with quantities and links. Both forms have a hidden honeypot field that
silently discards most spam bots.

---

# Images and scaling

Images uploaded through the CMS are committed into this Git repository under
`assets/images/uploads/`.

| Catalogue size | Recommendation |
|---|---|
| **10–50 products** | Git storage is completely fine. Nothing to do. |
| **50–200 products** | Still fine, but compress before uploading. Aim for under 300 KB per image, roughly 1600px on the long edge. [Squoosh](https://squoosh.app) is free and needs no account. |
| **200–500 products** | Watch the repository size. Once it passes ~1 GB, Git operations get slow. Start planning a media service. |
| **500+ products** | Move media to [Cloudinary](https://cloudinary.com). Decap supports it natively — replace the `media_folder` lines in `admin/config.yml` with a `media_library` block for Cloudinary. Existing image paths keep working, so it can be done gradually. |

Git never forgets: deleting a large image from the CMS removes it from the site
but not from the repository's history.

---

# Search engine setup

Once the custom domain is live:

1. Add the site to [Google Search Console](https://search.google.com/search-console).
2. Verify ownership (the DNS TXT record method is easiest if Netlify runs your DNS).
3. Submit `https://www.shivtradingindia.com/sitemap.xml`.

The sitemap regenerates on every deploy, so new products appear in it
automatically.

Each product page carries its own title, meta description, Open Graph tags and
Product structured data. Fill in the **Google title** and **Google description**
fields in the CMS for the products you most want found — otherwise the product
name and short description are used, which is adequate but generic.

---

# Other documentation

| File | For |
|---|---|
| [EMPLOYEE-GUIDE.md](EMPLOYEE-GUIDE.md) | Staff adding products. Assumes zero technical knowledge. |
| [ADMIN-GUIDE.md](ADMIN-GUIDE.md) | Managing access, backups, restoring, troubleshooting. |
| [WHATSAPP-INTEGRATION.md](WHATSAPP-INTEGRATION.md) | Adding the WhatsApp Business API later. |
| [CLAUDE.md](CLAUDE.md) | Full technical context and project history. |
| [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) | Architecture reference. |

---

# Before you launch

- [ ] Replace the placeholder phone numbers in **Website Settings → Contact Details**
- [ ] Replace the placeholder WhatsApp number
- [ ] Confirm the email address is correct
- [ ] Replace the placeholder product images with real photographs
- [ ] Check the eleven sample products — descriptions and specifications were
      drafted as examples and need a subject-matter review
- [ ] Have the privacy policy reviewed
- [ ] Set Netlify Identity registration to **Invite only**
- [ ] Turn on email notifications for both forms
- [ ] Submit the sitemap to Google Search Console
