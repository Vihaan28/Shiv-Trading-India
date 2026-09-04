# WhatsApp Business API — Future Integration

**Status: not implemented, and deliberately so.**

The website currently uses **click-to-chat** links, which need no API, no
approval and no running cost. This document explains what is in place now, when
it is worth upgrading, and exactly how to do it when that day comes.

---

## What is built today

Click-to-chat links (`https://wa.me/<number>?text=<message>`), generated in
`assets/js/ui.js`:

```js
UI.whatsappLink = function (message) {
  var num = UI.whatsappNumber();          // digits only, from CMS settings
  if (!num) return '';
  return 'https://wa.me/' + num + (message ? '?text=' + encodeURIComponent(message) : '');
};
```

They appear in three places:

| Where | Message the customer sends |
|---|---|
| Floating green button, every page | "Hello Shiv Trading India, I would like to enquire about your products." |
| Contact page | Same |
| "Ask on WhatsApp" on each product page | "Hello Shiv Trading India, I am interested in **[product name]**. [link to the product]" |

The number comes from **Website Settings → Contact Details → WhatsApp number** in
the CMS. An employee can change it in seconds, and clearing it removes every
WhatsApp button from the site. No code change either way.

### What this gives you

- Zero cost, zero setup, works today
- Customer arrives with the product name and link already typed
- Works on desktop (WhatsApp Web) and mobile (the app)

### What it cannot do

- Send an automatic confirmation when someone submits a quote request
- Notify your team on WhatsApp when an enquiry arrives
- Any automated reply, template message or broadcast
- Keep a record of conversations anywhere but the phone itself

For a business at this scale, click-to-chat is very often enough. **Do not build
the API integration because it sounds impressive — build it when one of the
triggers below actually applies.**

---

## When to upgrade

Consider the Cloud API when:

- Enquiry volume is high enough that a manual WhatsApp reply to each one is a
  real burden
- You want customers to get an instant, automatic acknowledgement of a quote
  request
- More than one person needs to answer from the same number
- You need conversation history retained outside a single handset
- You want order or dispatch status updates sent proactively

If none of these are true yet, leave it alone.

---

## Recommended architecture

The current site is static, and the goal is to keep it that way. WhatsApp
requires a server-side component only because the API key must never be exposed
in browser JavaScript.

**Netlify Functions** are the right fit: small server-side functions that live in
the same repository and deploy with the site. No separate server to maintain.

```
                        ┌──────────────────────────────┐
   Customer submits ───▶│  rfq.html (unchanged)        │
   the quote request    │  fetch POST → Netlify Forms  │
                        └──────────────┬───────────────┘
                                       │
                        Netlify Forms stores the submission
                                       │
                        Netlify emits a submission-created event
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  netlify/functions/                  │
                    │    submission-created.js             │
                    │                                      │
                    │  1. read the submission payload      │
                    │  2. POST to WhatsApp Cloud API:      │
                    │       → alert the sales team         │
                    │       → confirm to the customer      │
                    └──────────────────┬───────────────────┘
                                       │
                              Meta WhatsApp Cloud API
                                       │
                                       ▼
                        Sales team phone   +   Customer phone
```

**The key point:** `submission-created` is a Netlify event function. It fires
automatically whenever a form is submitted. **The frontend does not change at
all** — no new code on `rfq.html`, and if the function fails the enquiry is still
safely stored in Netlify Forms. The WhatsApp layer is purely additive, which is
exactly the property you want.

For inbound messages, add a second function as a webhook endpoint.

---

## What you need from Meta

1. A **Meta Business account** with your business verified. Verification requires
   company registration documents and takes days, sometimes weeks. Start early.
2. A **WhatsApp Business Platform** app in the
   [Meta for Developers](https://developers.facebook.com) console.
3. A **phone number** registered to the platform.
   > ⚠️ A number registered on the Cloud API **cannot** be used in the normal
   > WhatsApp or WhatsApp Business app at the same time. Use a dedicated number,
   > and keep the click-to-chat number separate if staff still answer that
   > personally.
4. **Message templates** approved by Meta. Any message your business sends first
   — outside a 24-hour window opened by the customer — must use a pre-approved
   template. Approval takes hours to days. See below.

### Costs

Meta charges per *conversation*, not per message, and pricing varies by country
and category. Service conversations initiated by the customer have a monthly free
allowance. Business-initiated (template) conversations are charged.

Check [Meta's current pricing](https://developers.facebook.com/docs/whatsapp/pricing)
before committing — the model has changed several times.

---

## Environment variables

Set these in **Netlify → Site configuration → Environment variables**. Never put
them in the repository.

| Variable | What it is | Where to find it |
|---|---|---|
| `WHATSAPP_TOKEN` | Permanent access token | Meta app → System user → Generate token |
| `WHATSAPP_PHONE_NUMBER_ID` | ID of your sending number | Meta app → WhatsApp → API Setup |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID | Same screen |
| `WHATSAPP_VERIFY_TOKEN` | A random string you invent | Make one up; it must match what you enter in Meta's webhook config |
| `WHATSAPP_APP_SECRET` | App secret, for verifying webhook signatures | Meta app → Settings → Basic |
| `SALES_TEAM_NUMBERS` | Comma-separated numbers to alert | e.g. `919810000000,919810000001` |

> Use a **permanent** System User token. The temporary token shown during setup
> expires after 24 hours and will silently break the integration.

---

## Implementation

### 1. Tell Netlify where the functions live

Add to `netlify.toml`:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

### 2. Notify the team, and confirm to the customer

`netlify/functions/submission-created.js`:

```js
// Fires automatically whenever a Netlify form is submitted.
// The customer's enquiry is already stored before this runs, so a failure
// here loses a notification -- never the enquiry itself.

const API = 'https://graph.facebook.com/v21.0';

exports.handler = async (event) => {
  try {
    const { payload } = JSON.parse(event.body);

    // Only act on quote requests, not general contact messages.
    if (payload.form_name !== 'rfq') {
      return { statusCode: 200, body: 'ignored' };
    }

    const d = payload.data || {};

    // --- 1. Alert the sales team ------------------------------------------
    // Uses a pre-approved template because we are initiating the conversation.
    const team = (process.env.SALES_TEAM_NUMBERS || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);

    await Promise.all(
      team.map((to) =>
        send({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: 'new_quote_request',
            language: { code: 'en' },
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: d.name || 'Unknown' },
                { type: 'text', text: d.company || 'Not given' },
                { type: 'text', text: d.phone || 'Not given' },
                { type: 'text', text: summarise(d.products) },
              ],
            }],
          },
        })
      )
    );

    // --- 2. Acknowledge to the customer -----------------------------------
    const customer = normalise(d.phone);
    if (customer) {
      await send({
        messaging_product: 'whatsapp',
        to: customer,
        type: 'template',
        template: {
          name: 'quote_request_received',
          language: { code: 'en' },
          components: [{
            type: 'body',
            parameters: [{ type: 'text', text: d.name || 'there' }],
          }],
        },
      });
    }

    return { statusCode: 200, body: 'sent' };
  } catch (err) {
    // Log and swallow. The enquiry is safe in Netlify Forms either way, and
    // throwing here would only produce a confusing failure in the dashboard.
    console.error('WhatsApp notification failed:', err);
    return { statusCode: 200, body: 'notification failed, submission retained' };
  }
};

async function send(body) {
  const res = await fetch(
    `${API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
  return res.json();
}

// Template parameters cannot contain newlines or exceed 1024 characters.
function summarise(products) {
  if (!products) return 'No products listed';
  return String(products).replace(/\n/g, ' | ').slice(0, 900);
}

// Cloud API wants digits only, with a country code and no leading +.
function normalise(phone) {
  if (!phone) return null;
  let n = String(phone).replace(/\D/g, '');
  if (n.length === 10) n = '91' + n;          // assume India for local numbers
  return n.length >= 11 ? n : null;
}
```

### 3. Receive inbound messages

`netlify/functions/whatsapp-webhook.js`:

```js
const crypto = require('crypto');

exports.handler = async (event) => {
  // --- Meta's one-time verification handshake ---------------------------
  if (event.httpMethod === 'GET') {
    const q = event.queryStringParameters || {};
    if (
      q['hub.mode'] === 'subscribe' &&
      q['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      return { statusCode: 200, body: q['hub.challenge'] };
    }
    return { statusCode: 403, body: 'Forbidden' };
  }

  // --- Reject anything not actually signed by Meta ----------------------
  if (!verifySignature(event)) {
    return { statusCode: 401, body: 'Invalid signature' };
  }

  const body = JSON.parse(event.body);
  const messages =
    body.entry?.[0]?.changes?.[0]?.value?.messages || [];

  for (const msg of messages) {
    console.log('Inbound from', msg.from, ':', msg.text?.body);
    // Forward to your CRM, email, or an internal notification here.
  }

  // Always 200 quickly. Meta retries on anything else, and will eventually
  // disable a webhook that keeps failing.
  return { statusCode: 200, body: 'ok' };
};

function verifySignature(event) {
  const signature = event.headers['x-hub-signature-256'];
  if (!signature) return false;
  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
      .update(event.body, 'utf8')
      .digest('hex');
  // Constant-time compare, so the check cannot be probed byte by byte.
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

Register the webhook in Meta → your app → **WhatsApp → Configuration**:

- **Callback URL:** `https://www.shivtradingindia.com/.netlify/functions/whatsapp-webhook`
- **Verify token:** whatever you set as `WHATSAPP_VERIFY_TOKEN`
- **Subscribe to:** `messages`

---

## Message templates to submit

Submit these in Meta Business Manager → **WhatsApp Manager → Message templates**.
Both are category **Utility** (cheaper than Marketing, and appropriate here).

**`new_quote_request`** — to your team:

```
New quote request from {{1}} ({{2}}).
Phone: {{3}}
Products: {{4}}
```

**`quote_request_received`** — to the customer:

```
Hello {{1}}, thank you for your enquiry with Shiv Trading India.
We have received your quote request and will respond with availability
and pricing shortly.
```

Template rules that catch people out:

- No two variables next to each other (`{{1}} {{2}}` is fine, `{{1}}{{2}}` is not)
- A template cannot start or end with a variable
- Variables cannot contain newlines
- Any change requires re-approval
- Rejected templates are usually rejected for sounding promotional — keep the
  wording strictly transactional

---

## Rollout

1. **Verify the business with Meta.** Start here; it is the long pole.
2. **Get a dedicated number** that is not in use in any WhatsApp app.
3. **Submit both templates** and wait for approval.
4. **Set the environment variables** in Netlify.
5. **Add the two functions** and the `[functions]` block in `netlify.toml`.
6. **Test on a Netlify deploy preview** with your own number in
   `SALES_TEAM_NUMBERS` before touching production.
7. **Ship it.** Watch **Netlify → Functions → Logs** for the first few days.
8. **Keep click-to-chat.** The two coexist happily, and click-to-chat is your
   fallback if the API integration has a problem.

---

## Security

- **Never put the token in frontend code.** Anything in `assets/js` is public.
  This is the entire reason a serverless function is needed.
- **Always verify the webhook signature.** An unverified endpoint can be fed
  fabricated messages by anyone who finds the URL.
- **Use a System User token**, not a temporary one.
- **Rotate the token** if a developer with access leaves.
- **Do not log message bodies** in production — they contain customer data. Log
  identifiers and status codes.
- **Update the privacy policy** before going live. Sending customer data to Meta
  is a new processing purpose and a new third-party processor, and must be
  disclosed.
- **Rate limits:** the Cloud API throttles per number. Batch or queue if you ever
  send to many recipients at once.

---

## Why the current architecture supports this cleanly

Three properties of the site as built make this a genuinely additive change:

1. **The RFQ already produces a complete, structured payload.** The hidden
   `products` field carries every selected product with quantity, unit and URL.
   The function has everything it needs without touching the frontend.

2. **Netlify Forms already stores the enquiry before any notification runs.**
   WhatsApp is a notification layer on top of a system of record that already
   works. A WhatsApp outage cannot lose an enquiry.

3. **The WhatsApp number is already a CMS setting, not a hardcoded value.** If
   you move to a dedicated API number, an employee updates it in
   **Website Settings → Contact Details** and every click-to-chat link on the
   site follows. No deploy required.
