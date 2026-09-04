# Admin Guide — Shiv Trading India Website

For whoever owns the website. Covers access, backups, recovery and
troubleshooting. Written for a non-developer, but it assumes you can sign in to
Netlify and GitHub.

For adding products, see [EMPLOYEE-GUIDE.md](EMPLOYEE-GUIDE.md). For first-time
deployment, see [README.md](README.md).

---

## The three accounts you own

| Service | What it holds | Sign in at |
|---|---|---|
| **GitHub** | The website's files and full history of every change | github.com |
| **Netlify** | Hosting, employee logins, form submissions | app.netlify.com |
| **Domain registrar** | `shivtradingindia.com` itself | wherever you bought it |

Keep all three logins somewhere safe and shared with at least one other trusted
person. If you lose the Netlify account, the website goes offline. If you lose
the registrar account, you lose the domain.

**Turn on two-factor authentication on GitHub and Netlify.** These accounts can
change what the world sees at your company's address.

---

## How a change reaches the live site

```
Employee clicks Publish at /admin
   → Decap CMS commits the change to GitHub
   → Netlify sees the commit and runs "npm run build"
   → build regenerates data.json and sitemap.xml
   → Netlify publishes
```

Usually 1–2 minutes end to end. Every step is visible: the commit in GitHub, the
build in Netlify's **Deploys** tab.

---

# Employee access

## Inviting an employee

1. Netlify → your site → **Site configuration → Identity**
2. **Invite users**
3. Enter their work email address → **Send**

They get an email, click the link, set a password, and land in `/admin`.

The invitation link expires. If they leave it too long, delete the pending user
and invite them again.

> **If clicking the invite link just opens the ordinary website and nothing
> happens:** the site needs to be redeployed first. Netlify's invite links
> point at your homepage with a token in the address bar (something like
> `yoursite.com/#invite_token=...`), and only the homepage's own code can
> notice that token and act on it — a fresh deploy of this project adds exactly
> that. Once the new deploy is live, **click the same link from the original
> email again** (the token is only consumed once it's actually used, so
> nothing was lost the first time) — it should now prompt to set a password
> and then drop them straight into `/admin`. If the link errors out as expired
> after that, delete the pending user in Identity and send a fresh invite.

## Removing an employee

**Do this the same day someone leaves.**

1. Netlify → **Identity**
2. Find them in the user list
3. Click the **⋮** menu on their row → **Delete user**

They lose access immediately. Anything they published stays — it is the
company's content, and it is all in the Git history under their name.

## Resetting someone's access

They can reset their own password using **Forgot password?** on the login screen.

If that fails (usually a bad email address), delete the user and re-invite them.

## Checking who has access

Netlify → **Identity** shows every user and when they last logged in. **Review
this quarterly.** Delete anyone who no longer needs access.

## When an employee leaves — checklist

- [ ] Delete their Netlify Identity user
- [ ] If they had a GitHub account on the repository, remove it
      (GitHub → repository → **Settings → Collaborators**)
- [ ] If they knew the Netlify or registrar account passwords, change them
- [ ] Check **Deploys** for anything published in their last few days

## Locking down registration

Netlify → **Identity → Registration preferences** must be set to **Invite
only**.

If it is set to **Open**, anyone on the internet can create an account and edit
your website. Check this now, and check it again after any change to Identity
settings.

---

# Backups and recovery

## You already have backups

Every change ever made is stored permanently in GitHub. Nothing is truly lost.
Each save records what changed, who changed it and when.

## Downloading a full copy

Worth doing every few months and keeping somewhere off GitHub.

1. GitHub → your repository
2. Green **Code** button → **Download ZIP**
3. Save it somewhere safe, dated

That ZIP contains the entire website: pages, styling, all product content and
all images.

## Looking at the history

GitHub → your repository → **Commits**

You will see entries like `Update products "nomex-insulation-paper"` with the
date and who did it. Click any one to see exactly what changed — removed lines in
red, added lines in green.

## Undoing one bad change

1. GitHub → **Commits**
2. Find the change
3. Click it, then the **⋮** button at the top right → **Revert**
4. GitHub creates a change that undoes it → **Create pull request** → **Merge**

Netlify rebuilds automatically.

## Recovering a deleted product

1. GitHub → **Commits**
2. Find the `Delete products "..."` entry
3. Click it — the deleted file is shown in full, in red
4. Copy the content
5. Either re-create the product in the CMS by hand, or use **Revert** as above

## Rolling the whole site back

If a deploy breaks the site badly:

1. Netlify → **Deploys**
2. Find the last deploy that was working
3. Click it → **Publish deploy**

The site returns to that exact state within seconds. This does **not** change
GitHub — it only changes what is being served. Fix the underlying problem
afterwards.

---

# Reading customer enquiries

Netlify → your site → **Forms**

Two forms:
- **`rfq`** — quote requests, including the full product list with quantities
- **`contact`** — general messages

## Set up email notifications

If you do not do this, you have to remember to check the dashboard.

1. **Forms → Form notifications → Add notification → Email notification**
2. Pick the form, enter the email address, save
3. **Repeat for the second form**

You can add several addresses by adding several notifications.

## Spam

Both forms have a hidden honeypot field that catches most bots. If spam gets
through, enable Netlify's built-in spam filtering under **Forms → Settings**, or
add a reCAPTCHA (Netlify documents this; it requires adding a small block to the
form markup).

## Submission limits

Netlify's free tier allows 100 form submissions per month. Beyond that you need a
paid plan, or submissions are rejected. Keep an eye on it once enquiry volume
picks up.

---

# Troubleshooting

## The website is showing old content

**Most likely: browser cache.** Hard-refresh with `Ctrl+Shift+R`
(`Cmd+Shift+R` on Mac). Ask whoever is complaining to do the same.

**If it persists:** Netlify → **Deploys**. Is the newest deploy marked
**Published**? If it says **Failed**, see below.

## A deploy failed

1. Netlify → **Deploys** → click the failed deploy
2. Read the log — the error is near the bottom

Common causes:

| Log says | Cause | Fix |
|---|---|---|
| `Cannot find module 'js-yaml'` | Dependencies did not install | Retry the deploy. If it persists, check `package.json` is in the repository. |
| `invalid YAML front matter` | A content file was corrupted | The log names the file. Open that product in the CMS, re-save it. |
| `ENOENT ... /content` | The content folder is missing | Restore it from GitHub history. |

Click **Retry deploy** first — transient network failures during `npm install`
are the most common cause and a retry usually fixes them.

Note that the build is designed **not** to fail on bad content. It warns and
skips. If a build actually fails, something structural is wrong.

## Products are missing from the website

Check in order:

1. **Is the product published?** CMS → the product → is **Show this product on
   the website** on?
2. **Did the deploy succeed?** Netlify → **Deploys**.
3. **Is its category published?** A product in an unpublished category still
   appears in the catalogue, but with no category name.
4. **Check the build log** for a warning like
   `Product "X" points at category "y", which is missing or unpublished`.

## The whole catalogue is empty

Every page shows no products at all. Open `www.shivtradingindia.com/data.json`
in a browser.

- **404 or an error page** — the build did not run or did not finish. Check
  **Deploys**.
- **JSON loads but `"products": []`** — every product is unpublished, or the
  content folder is empty.
- **JSON looks correct but the site is still empty** — a JavaScript error. Open
  the site, press `F12`, click **Console**, and send a screenshot of any red text
  to your developer.

## /admin will not load or will not log in

| Symptom | Cause | Fix |
|---|---|---|
| Login box never appears | Identity is off | Netlify → **Identity → Enable Identity** |
| Can log in, but saving fails | Git Gateway is off | Netlify → **Identity → Services → Enable Git Gateway** |
| "Failed to load config.yml" | The file is malformed | Check the most recent change to `admin/config.yml` in GitHub and revert it |
| Nothing loads at all, blank screen | Usually a browser extension | Try a private window with extensions disabled |

## Images are not appearing

1. Was the image actually uploaded? Open the media library in the CMS and look.
2. Was it uploaded before the last deploy? Images upload as part of a save; if
   the save failed, the image did not arrive.
3. Is the file enormous? Anything over about 10 MB may fail to upload silently.

## The domain has stopped working

1. Netlify → **Domain management** — does it show errors?
2. Is the domain still registered? Check with your registrar. **Domain
   expiry is the single most common cause of a site vanishing.**
   Turn on auto-renew.
3. Did the DNS change? Compare against what Netlify's domain panel says it
   should be.

## HTTPS certificate warnings

Netlify → **Domain management → HTTPS → Renew certificate**.

Certificates renew automatically. Failures are almost always caused by DNS
having been changed.

---

# Routine maintenance

## Monthly
- [ ] Skim **Forms** for enquiries that were missed
- [ ] Check the site loads correctly on a phone

## Quarterly
- [ ] Review the Identity user list; remove anyone who has left
- [ ] Download a ZIP backup from GitHub
- [ ] Check the repository size (GitHub → **Settings**); plan a media migration
      if it is heading past 1 GB
- [ ] Check Google Search Console for crawl errors

## Annually
- [ ] Confirm the domain auto-renew is on and the card on file is valid
- [ ] Review prices and availability across the catalogue

---

# Custom domain — reference

The full walkthrough is in [README.md](README.md). Quick reference:

- Domain settings live in Netlify → **Domain management**
- SSL is free and automatic once DNS is correct
- www ↔ non-www redirects are handled automatically; set which one is primary
- If you change the primary domain, the canonical URLs in the code assume
  `www.shivtradingindia.com` — tell your developer, as three files need updating

---

# What needs a developer

You can do almost everything yourself. These need someone technical:

- Changing the layout, colours or fonts
- Adding a new page type or a new kind of content
- Adding a field to the product form
- WhatsApp Business API (see [WHATSAPP-INTEGRATION.md](WHATSAPP-INTEGRATION.md))
- Moving images to Cloudinary
- Anything that involves editing files in the repository directly

When you hire someone, point them at [CLAUDE.md](CLAUDE.md) — it explains the
whole architecture and the rules the project is built on.

---

# Emergency contacts

Fill this in and keep it with the account passwords:

```
Domain registrar:        ________________  Account: ________________
Netlify account email:   ________________
GitHub account:          ________________
Developer / agency:      ________________
```
