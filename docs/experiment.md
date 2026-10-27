# Experiment plan: freshness card and instant replacement

## Hypotheses

1. **Freshness card.** Showing where and when a product was picked, and what was checked, raises fresh add-to-cart without raising claims.
2. **Instant replacement.** Resolving a bad item in minutes instead of days keeps the shopper: more of them order again within 14 days of a claim.

## Design

| | |
|---|---|
| Unit | Household, randomised once, sticky for 4 weeks |
| Arms | A: today's app · B: freshness card + post-delivery check + instant decision |
| Scope | Bengaluru, fruit and vegetables |
| Length | 4 weeks after a 1-week A/A check |

Both changes ship together in arm B because the second only works with the first: the check after delivery is what produces the claims the instant decision acts on. If B wins, a follow-up splits them to learn which part did the work.

## Metrics

| Type | Metric | Read |
|---|---|---|
| Primary | Fresh orders per household per week | Day 28 |
| Secondary | Fresh add-to-cart rate on product pages | Weekly |
| Secondary | Repeat order within 14 days of a claim | Day 28 |
| Guardrail | Cost of claims / fresh sales ≤ 1.5% | Daily, stop if breached 3 days running |
| Guardrail | Claims declined on review ≤ 5% | Daily |
| Guardrail | App rating and support tickets per order | Weekly |

## Sample size

Fresh orders per household per week is a mean, not a share. Assuming a mean of 1.6 and a standard deviation of 1.4, detecting a +4% lift (0.064) at α = 0.05 and 80% power needs about **7,500 households per arm**:

```
n = 2 × (1.96 + 0.84)² × 1.4² / 0.064² ≈ 7,500
```

The A/A week replaces these assumptions with the real mean and variance before launch.

## Decision rule

| Result | Decision |
|---|---|
| Primary up ≥ 4%, guardrails held | Ship to all fresh categories in Bengaluru, then Hyderabad |
| Primary flat, claim-repeat up | Ship instant replacement only; rethink the card |
| Cost of claims over 1.5% | Tighten the trust limit (₹150 → ₹100) and re-run |
| Claims declined over 5% | Raise the photo-check confidence bar and re-run |

## What could fool us

- **Claim volume rises in B.** That's expected, because the check makes reporting easy. Judge B by fresh orders and cost, not by claim count.
- **Novelty.** Read weeks 1–2 and 3–4 separately.
- **Supply shocks.** A bad monsoon week hits both arms equally, which is why the split is by household, not by store.
