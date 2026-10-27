# Metric tree

> **North star: weekly fresh-repeat households.** Households that bought fresh items in at least 3 of the last 4 weeks. It moves only if shoppers trust the fresh aisle enough to make it a habit.

```
Weekly fresh-repeat households
├── Households trying fresh
│   ├── Fresh product page views
│   └── Fresh add-to-cart rate            ← freshness card
├── Fresh orders that arrive good
│   ├── Fresh claim rate per 1,000 units  ← batch auto-pull, cold chain
│   └── Batches pulled before 15 / 1,000
└── Households that stay after a bad item
    ├── Time from claim to resolution     ← photo check + trust rule
    ├── Share of claims resolved instantly
    └── Repeat order within 14 days of a claim
```

## Inputs, owners and targets

| Input | Today (sample) | Target | Moved by |
|---|---|---|---|
| Fresh add-to-cart rate | baseline from A/A week | +5% relative | Freshness card |
| Fresh claim rate per 1,000 units | 7.3 | under 5 | Batch auto-pull, cold-chain fixes |
| Median time to resolution | 2 min | under 5 min | Photo check, trust rule |
| Claims resolved instantly | 78% | over 75% | Trust rule tuning |
| Repeat within 14 days after a claim | baseline | +10 pts | Instant replacement |

## Guardrails

| Guardrail | Limit | Why |
|---|---|---|
| Cost of claims / fresh sales | ≤ 1.5% | Instant approval must not become a cost leak |
| Claims declined after review | ≤ 5% of claims | Rising means the trust rule is too loose or the photo check too lenient |
| Claims needing a human | ≤ 25% | Above this the support team, not the product, sets resolution time |

## How the inputs add up

A household stays on the fresh habit when three things hold: it tries fresh, what arrives is good, and when it isn't, the fix is fast enough not to sour the next order. Each branch has one owner: category for trying, supply chain for arriving good, product and support for recovery. The north star only moves when all three hold.
