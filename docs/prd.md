# PRD: Trust layer for fresh food

**Owner:** Krish Gujral · **Status:** prototype built, ready for a test · **Surfaces:** product page, post-delivery screen, ops console

## Problem, in three sentences

A shopper can't judge freshness before buying online, so every fresh order is a small bet on the store. When the bet goes wrong, the usual fix is a support chat and a refund days later. That turns one bad tomato into a lost customer. Fresh food is also why shoppers come back at all, so a fresh-quality failure costs the most loyal shoppers.

## Evidence

- **Fresh drives return.** In 3.4M Instacart orders, fresh aisles are re-bought 69% of the time against 55% for the rest of the store. Shoppers whose first basket was mostly fresh are 1.8× as likely to still be ordering at month 11. *(Who Comes Back, my retention analysis)*
- **Freshness is where quick commerce breaks.** In 10,321 Play Store reviews of five Indian quick-commerce apps, 4–13% of reviews report stale or spoiled food. Fruit, vegetables and dairy are 62% of the freshness complaints that name a food. *(Spoilt, my review analysis)*
- **Slow recovery is what makes people leave.** Reviews about refunds and support say the customer is leaving 28% of the time, the highest of any issue. For pricing complaints it's 14%.

## Goals

1. Make freshness visible before purchase, so the shopper's bet is informed.
2. Make recovery instant when it does go wrong, so one bad item doesn't cost the customer.
3. Make every complaint count against a batch, so the supply chain fixes the cause instead of support paying for it again and again.

**Non-goals:** discounts as compensation, a general support chatbot, non-fresh categories (phase 2).

## Users and jobs

| User | Job | Today | With this |
|---|---|---|---|
| Shopper choosing tomatoes | "Will these be good?" | Trusts the photo | Sees harvest date, source, hub checks and batch rating |
| Shopper with a bad item | "Make this right, fast" | Chat, wait, refund in days | One tap, optional photo, replacement in ~15 min |
| Quality ops lead | "Which lot is the problem?" | Complaints scattered across tickets | Claims grouped by batch, auto-pull at a threshold |

## Solution

**1. Freshness card (product page).** Harvest or production date, farm or co-op and district, the checks done at grading (firmness, colour, Brix, bacterial count), the cold-chain legs, a "best within" window, and the share of this batch's buyers who rated it fresh. It's collapsed to one line, "Picked 2 days ago in Kolar", and expands on tap.

**2. Post-delivery check.** Ten minutes after delivery, the order screen asks for one tap per fresh item: *Fresh* or *Not right*. "Not right" opens a claim with a reason and an optional photo.

**3. Instant decision.** A vision model checks whether the photo shows the item ordered and a visible problem. A fixed rule then decides:

```
if prior claims in 90 days > 2           -> human review
if photo and item doesn't match          -> human review
if photo shows the problem, conf >= 0.7  -> replace now
if item value <= ₹150 or item missing    -> approve on trust
else                                     -> human review within 10 min
```

**4. Batch accountability (ops console).** Every claim is tied to a batch. A batch is *watched* at 8 claims per 1,000 units and *pulled from every store* at 15, or after 3 health-risk claims. The batch page shows the cold-chain leg where temperature rose, so the fix lands on the right team.

## Metrics

- **North star:** weekly fresh-repeat households, the households buying fresh items in 3 of the last 4 weeks.
- **Inputs:** fresh add-to-cart rate on product pages, fresh claim rate per 1,000 units, time to resolution, repeat rate within 14 days after a claim.
- **Guardrails:** cost of claims as a share of fresh sales (cap 1.5%), abuse rate (claims declined on review), share of claims needing a human.

See the metric tree and the experiment plan.

## Risks

| Risk | Mitigation |
|---|---|
| Abuse of instant refunds | Trust limit (₹150, 2 claims in 90 days), photo check, every claim visible per customer |
| Freshness card shows a bad number | Show batch rating only above 50 ratings; ops can hide a card while a batch is under review |
| Model errors on photos | The model only decides "match" and "visible problem". The rule makes the call, and anything unclear goes to a person |
| Cold-chain data gaps | Show only legs with a real reading; never invent a temperature |

## Launch plan

1. Bengaluru, fruit and vegetables only, 50/50 user split for 4 weeks (see experiment plan).
2. Add dairy and eggs once the photo check is tuned for packs and dates.
3. Ship the batch auto-pull to all stores regardless of the test result. It needs no customer change.
