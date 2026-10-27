# Paste-Ready Code Steps for Zapier, n8n and Make

No-code automations break on messy data: a phone typed five ways, a name in CAPS, a date in someone else's time zone, "1.234,56 €", or an order's items as a JSON blob. Each file here is one small, tested fix you paste into a code step.

| Step | Turns this | Into this |
|---|---|---|
| [`phone.cjs`](steps/phone.cjs) | `(555) 010-4477`, `0044 20 7946 0958` | `+15550104477`, `+442079460958` (E.164, what Twilio and CRMs want) |
| [`names.cjs`](steps/names.cjs) | `DR. MARY O'NEIL-SMITH JR.`, `JAN VAN DER BERG` | first / middle / last / prefix / suffix, proper case: `Mary` `O'Neil-Smith`, `Jan` `van der Berg` |
| [`dates.cjs`](steps/dates.cjs) | `10/27/2026 3:15 PM` in `America/Chicago`, `27.10.2026 15:15` | `2026-10-27T20:15:00.000Z`. Daylight saving is handled, including the skipped spring-forward hour. Invalid dates like `02/30` are reported, not guessed. |
| [`money.cjs`](steps/money.cjs) | `$1,234.56`, `1.234,56 €`, `(45.00)`, `£3k` | `1234.56 USD`, `1234.56 EUR`, `-45.00`, `3000.00 GBP` |
| [`line-items.cjs`](steps/line-items.cjs) | Shopify / WooCommerce / Stripe line items (JSON) | Zapier line-item lists (one sheet row per item), a one-cell summary, item count and subtotal |

## Use one

**Zapier:**
1. Add a step: *Code by Zapier > Run JavaScript*.
2. Under *Input Data*, add the fields named at the top of the file (for example `phone`, `country_code`).
3. Paste the whole file. Its fields are output for the next steps.

**n8n:**
1. Add a *Code* node set to *Run Once for Each Item*.
2. Paste the file and add `const inputData = $json;` as its first line.

**Anywhere else** (Make's code module, Pipedream, a Cloudflare Worker): each file's function is plain JavaScript with no imports. Copy the function and call it.

## Tested

```bash
npm test   # every step, including running each file exactly as Code by Zapier runs it
```

Each step returns an `error` field instead of throwing. A Zap keeps running, and a later *Filter* or *Paths* step can route the rows that need a human.
