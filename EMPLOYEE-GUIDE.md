# Employee Guide — Managing the Shiv Trading India Website

This guide is for staff who update the website. You do **not** need to know
anything about computers beyond using a web browser.

You will never need to open a code editor, install anything, or ask a developer
for a normal daily change.

---

## Contents

1. [How to log in](#1-how-to-log-in)
2. [What you will see](#2-what-you-will-see)
3. [How to add a product](#3-how-to-add-a-product)
4. [How to upload images](#4-how-to-upload-images)
5. [How to set the main image](#5-how-to-set-the-main-image)
6. [How to add more images](#6-how-to-add-more-images)
7. [How to change a price](#7-how-to-change-a-price)
8. [How to change the price type](#8-how-to-change-the-price-type)
9. [How to change availability](#9-how-to-change-availability)
10. [How to edit a product](#10-how-to-edit-a-product)
11. [How to hide a product](#11-how-to-hide-a-product)
12. [How to delete a product](#12-how-to-delete-a-product)
13. [How to create a category](#13-how-to-create-a-category)
14. [How to edit a category](#14-how-to-edit-a-category)
15. [How to change the homepage](#15-how-to-change-the-homepage)
16. [How to change phone numbers](#16-how-to-change-phone-numbers)
17. [How to change the email address](#17-how-to-change-the-email-address)
18. [How to publish changes](#18-how-to-publish-changes)
19. [How to check that a change is live](#19-how-to-check-that-a-change-is-live)
20. [Where customer enquiries go](#20-where-customer-enquiries-go)
21. [Common problems](#21-common-problems)

---

## 1. How to log in

1. Open your web browser.
2. Go to **www.shivtradingindia.com/admin**
3. Click **Log in with Netlify Identity**.
4. Type your email address and password.
5. Click **Log in**.

**First time here?** You will have received an invitation email. Click the link
in it and choose a password. If you cannot find the email, check your spam
folder, then ask your administrator to send it again.

**Forgotten your password?** Click **Forgot password?** on the login box and
follow the email.

---

## 2. What you will see

Down the left side there are three sections:

| Section | What it is for |
|---|---|
| **Products** | Everything in the catalogue |
| **Categories** | The groups products belong to |
| **Website Settings** | Contact details, homepage text, About page text |

Click any one to see what is in it.

---

## 3. How to add a product

1. Click **Products** on the left.
2. Click the **New Product** button (top right).
3. Fill in the form. The fields are explained below.
4. Click **Publish** (top right).

### The fields, explained

**Product name**
What customers will see. For example: `Enamelled Copper Winding Wire`.

**Web address (slug)**
This becomes the page address. Type the product name in **lowercase with hyphens
instead of spaces**:

- Product name: `Enamelled Copper Winding Wire`
- Slug: `enamelled-copper-winding-wire`

Rules: lowercase letters, numbers and hyphens only. No spaces, no capitals, no
symbols.

> ⚠️ **Once a product is live, do not change its slug.** Anyone who bookmarked
> or shared the old link will get an error page, and Google will lose the page.

**Category**
Click the box and pick one from the list. If the category you want is not there,
you need to [create it first](#13-how-to-create-a-category).

**Short description**
One or two sentences. This is what appears on the product card and in search
results. Keep it under about 25 words.

**Full description**
The main description on the product page. You can write several paragraphs —
leave a blank line between them.

**How should the price be shown?** — see [section 8](#8-how-to-change-the-price-type)

**Price** — see [section 7](#7-how-to-change-a-price)

**Price unit**
Pick from the dropdown: per kg, per sheet, per roll, per metre, per piece, per
tonne or per coil. This also decides the default unit customers see when they add
the product to a quote request.

**Main image** — see [section 5](#5-how-to-set-the-main-image)

**More images** — see [section 6](#6-how-to-add-more-images)

**Technical specifications**
Click **Add specification** to add a row. Each row has:
- **Property** — for example `Thickness`
- **Value** — for example `0.05 mm to 0.51 mm`

Add as many rows as you like. They appear as a table on the product page.

**Availability** — see [section 9](#9-how-to-change-availability)

**Show this product on the website**
Leave this **on** for normal products. Turning it off hides the product without
deleting it.

**Mark as featured**
Adds a small "Featured" badge and moves the product to the top of the catalogue.

**Show on the homepage**
Adds the product to the "Selected products" section on the homepage. Use this for
four to eight of your best products — not all of them.

**Display order**
A number that controls the order. Lower numbers come first. So `1` appears
before `10`. Products with the same number are sorted alphabetically. If you do
not care, leave it as `50`.

**Google title** and **Google description**
Optional. These control what Google shows in search results. If you leave them
blank, the product name and short description are used, which is fine.

If you do fill them in:
- Google title: under about 60 characters
- Google description: under about 155 characters

**Extra details**
Optional. Anything else worth adding below the description — typical
applications, ordering notes, and so on.

---

## 4. How to upload images

Anywhere you see an image field:

1. Click **Choose an image**.
2. The media library opens, showing images already uploaded.
3. To use an existing image, click it and click **Choose selected**.
4. To add a new one, click **Upload** (top right), pick the file from your
   computer, then click it and click **Choose selected**.

### Getting good images

- **Format:** JPG for photographs, PNG if it needs a transparent background.
- **Size:** around 1600 pixels on the longest edge is plenty.
- **File size:** try to stay under 300 KB per image. If your photos come off a
  phone they will be much bigger than that. Shrink them first at
  [squoosh.app](https://squoosh.app) — it is free, works in your browser, and you
  do not need an account.
- **Shape:** landscape (wider than tall) works best. Very tall images get cropped
  on product cards.

You never have to worry about where the file goes or what it is called. The
website handles all of that.

---

## 5. How to set the main image

The **Main image** field *is* the primary image. It is what shows on:

- the product card in the catalogue
- the top of the product page
- the customer's quote request list
- link previews when someone shares the page

To change it, click the image, then **Choose an image**, and pick a different one.

---

## 6. How to add more images

Under **More images**:

1. Click **Add image**.
2. Click **Choose an image** on the new row.
3. Upload or pick an image.
4. Repeat for as many as you want.

They appear as small thumbnails under the main image on the product page.
Clicking a thumbnail swaps the large image.

To reorder them, drag a row by its handle. To remove one, click the **✕** on
that row.

---

## 7. How to change a price

1. **Products →** click the product.
2. Find the **Price** box.
3. Type **numbers only**: `450`, not `₹450` or `Rs 450`.
4. Check the **Price unit** dropdown is right.
5. Click **Publish**.

The website adds the ₹ symbol for you, so `450` with unit `per kg` shows as
**₹450 per kg**.

> If you leave **Price** blank while the price type is "Fixed price" or "Starting
> from", the website falls back to showing "Price on request" rather than
> displaying something broken.

---

## 8. How to change the price type

The **How should the price be shown?** dropdown has four options:

| Choose this | Customers see |
|---|---|
| **Price on request** | "Price on request" — no number |
| **Fixed price** | ₹450 per kg |
| **Starting from** | "Starting from ₹450 per kg" |
| **Hide pricing completely** | Nothing at all about price |

**Which to use:**

- **Price on request** — the safe default, and correct for anything priced off
  the metal market. Copper and aluminium prices move daily.
- **Fixed price** — only where the price genuinely holds for a while.
- **Starting from** — where price varies by size or quantity but you want to show
  the entry point.
- **Hide pricing completely** — where price should not be discussed on the
  website at all.

Whichever you choose, the **Add to quote** button still works. Customers can
always ask.

---

## 9. How to change availability

1. **Products →** click the product.
2. Change the **Availability** dropdown.
3. Click **Publish**.

| Option | Shown on the website | Use it when |
|---|---|---|
| In stock | In stock | You have it now |
| Limited availability | Limited | Low stock, or only some sizes |
| Available on request | On request | Not held in stock but you can get it |
| Out of stock | Out of stock | Temporarily unavailable |
| Discontinued | Discontinued | No longer supplied |

**Discontinued** is different from the others: the **Add to quote** button is
removed, and customers are pointed to the contact page for an alternative.

---

## 10. How to edit a product

1. Click **Products**.
2. Click the product in the list.
3. Change whatever you need.
4. Click **Publish**.

To find a product quickly, use the search box at the top of the product list.

---

## 11. How to hide a product

Use this instead of deleting when you might sell it again.

1. **Products →** click the product.
2. Turn **Show this product on the website** **off**.
3. Click **Publish**.

The product disappears from the catalogue, search, the homepage and its own page
— but everything you typed is kept. Turn the switch back on to bring it back
exactly as it was.

> If a customer already has the product in a quote request, it is removed from
> their list automatically and they are told.

---

## 12. How to delete a product

Deleting is permanent from the website's point of view. **Consider
[hiding it](#11-how-to-hide-a-product) instead.**

1. **Products →** click the product.
2. Scroll to the bottom.
3. Click **Delete entry**.
4. Confirm.

> Your administrator can still recover a deleted product from the version
> history — see ADMIN-GUIDE.md. But hiding is simpler and instant.

---

## 13. How to create a category

Categories are the groups on the homepage and in the catalogue filter.

1. Click **Categories**.
2. Click **New Category**.
3. Fill in:
   - **Category name** — for example `Polyester Films`
   - **Web address (slug)** — for example `polyester-films` (lowercase, hyphens)
   - **Description** — one or two sentences
   - **Category image** — a photo representing the group
   - **Show this category on the website** — leave on
   - **Show on the homepage** — on if it should appear in the homepage grid
   - **Display order** — lower numbers first
4. Click **Publish**.

The new category page starts working immediately at
`www.shivtradingindia.com/category/your-slug`. It appears in the homepage grid,
the catalogue filter and the footer automatically. **Nobody needs to build
anything.**

A new category will show "0 products" until you assign products to it.

---

## 14. How to edit a category

1. Click **Categories**.
2. Click the category.
3. Make your changes.
4. Click **Publish**.

> ⚠️ **Do not change the slug** of a category that already has products in it.
> The products point at the old slug and would come unlinked. If you must change
> it, edit every product in that category afterwards and re-select the category.

To hide a category, turn **Show this category on the website** off. The category
disappears from the site, but its products stay in the catalogue — they just show
no category name until you move them.

---

## 15. How to change the homepage

1. Click **Website Settings**.
2. Click **Homepage**.
3. Edit whatever you need.
4. Click **Publish**.

You can change:

- **The banner at the top** — the small line above the headline, the headline
  itself, the paragraph, the background image, and both button labels and links.
- **The highlights strip** — the four short highlights across the bottom of the
  banner. Each has a big line and a small line.
  > Only put things here that are actually true. Do not invent numbers.
- **Section headings** — the heading and subheading above the categories, the
  products, the industries and the "why us" sections.
- **The About block** — its heading, text and image.
- **Industries** — add, remove or reorder the list of who you supply.
- **Why-us points** — same.
- **The closing banner** — the heading and text at the bottom of the page.

Which *products* appear on the homepage is not set here — it comes from the
**Show on the homepage** switch on each individual product. Same for categories
and their **Show on the homepage** switch.

---

## 16. How to change phone numbers

Do this **once** and it updates everywhere on the website — footer, contact page,
mobile menu, every page.

1. **Website Settings → Contact Details**.
2. Edit **Phone number** (and **Second phone number** if you have one).
3. Click **Publish**.

Include the country code: `+91 98100 00000`.

Leave **Second phone number** blank if you only have one — the extra line
disappears rather than showing an empty gap.

### The WhatsApp number

Same screen, the **WhatsApp number** field. This powers the green WhatsApp button
in the corner of every page and the "Ask on WhatsApp" button on product pages.

Include the country code. If you clear this field, the WhatsApp buttons disappear
from the whole site.

---

## 17. How to change the email address

1. **Website Settings → Contact Details**.
2. Edit the **Email address** field.
3. Click **Publish**.

It updates in the footer and on the contact page, and the click-to-email links
update with it.

---

## 18. How to publish changes

Every screen has a **Publish** button at the top right. Nothing you type takes
effect on the live website until you click it.

Decap saves a draft as you type, so if your browser crashes your work is usually
still there when you come back.

---

## 19. How to check that a change is live

After clicking **Publish**, the website rebuilds itself. This normally takes
**one to two minutes**.

1. Wait two minutes.
2. Open the website in a new tab.
3. Go to the page you changed.

**Still showing the old version?** Your browser has cached it. Force a fresh
copy:

- **Windows:** hold `Ctrl` and press `Shift+R`
- **Mac:** hold `Cmd` and press `Shift+R`

**Still not there after five minutes?** Something went wrong with the build.
Tell your administrator — they can see the error in the Netlify dashboard.

---

## 20. Where customer enquiries go

Quote requests and contact form messages do **not** appear in the CMS.

They go to the **Netlify dashboard**, under **Forms**. Your administrator can set
this up to email you whenever one arrives — ask them to, if it has not been done.

A quote request includes the customer's name, company, email, phone, delivery
city, their notes, and the full list of products with quantities.

---

## 21. Common problems

**"I cannot log in"**
Check the address is exactly `www.shivtradingindia.com/admin`. If the login box
never appears, hard-refresh (`Ctrl+Shift+R`). If it says your account does not
exist, ask your administrator to re-invite you.

**"My product is not showing on the website"**
Check, in order:
1. Did you click **Publish**?
2. Is **Show this product on the website** turned on?
3. Have you waited two minutes and hard-refreshed?
4. Is the product's **Category** set to a category that is itself published?

**"The image will not upload"**
It is probably too large. Shrink it at [squoosh.app](https://squoosh.app) and try
again. Use JPG or PNG.

**"I cannot pick a category"**
The category has to exist first. Go to **Categories**, create it, publish it,
then come back to the product.

**"I changed the price but it still says Price on request"**
The **How should the price be shown?** dropdown is still set to "Price on
request". Change it to "Fixed price". Also check the **Price** box has a number
in it — if it is empty, the website falls back to "Price on request" on purpose.

**"I made a mistake and published it"**
Just fix it and publish again. If you deleted something you needed, your
administrator can recover it from the version history.

**"Two of us edited the same thing"**
The one who published last wins. Agree between yourselves who is editing what,
especially for Website Settings.

---

## The golden rules

1. **Always click Publish.** Nothing is live until you do.
2. **Never change a slug** on something that is already live.
3. **Never invent facts** — certifications, numbers, awards, customer names. If
   it is not true and confirmed, it does not go on the website.
4. **Shrink images before uploading.**
5. **Wait two minutes and hard-refresh** before deciding something is broken.

If you are stuck, hiding something is always safer than deleting it.
