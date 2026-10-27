# Trust layer

A working prototype of a quality layer for a fresh-food grocery app. It has three parts:

- **Customer side.** A freshness card on product pages shows where the food came from, when it was picked and what was checked at the hub. After delivery, a one-tap check asks about each fresh item. A bad item gets an instant replacement, decided from an AI check of the customer's photo plus a simple trust rule.
- **Ops side.** A console lists quality claims and their decisions, and lists batches from farm to dark store. A batch comes off every shelf automatically once its claims pass a threshold.
- **Product docs.** A PRD, a metric tree and an experiment plan, rendered inside the app.

The case for it comes from two earlier analyses of mine:
- [Who Comes Back](https://github.com/krishxyz1/grocery-retention) found that fresh food is what brings grocery shoppers back.
- [Spoilt](https://github.com/krishxyz1/quick-commerce-quality) found that freshness and slow refunds are where quick-commerce trust breaks.

## Try it

- **Customer preview** (`/preview`): add to cart, mark an item "Not right", optionally add a photo, and see the decision with the reason behind it.
- **Quality claims** (`/claims`): filter by needs-review or instant, and open any claim to see why it was decided that way.
- **Batches** (`/batches`): open a pulled batch to see the cold-chain leg where the temperature rose.

Claims, batches and farms are **sample data**, generated deterministically in `lib/sample.ts` and labelled as sample data on every screen. The photo check is real.

## The decision rule

One function (`decide` in `lib/sample.ts`) is used by the customer prototype, the ops console and the PRD:

```
more than 2 claims in 90 days            -> a person reviews it
photo doesn't show the item              -> a person reviews it
photo shows the problem, confidence 0.7+ -> replace now
item ₹150 or less, or item missing       -> approve on trust
anything else                            -> a person, within 10 minutes
```

The model never decides. It only reports whether the photo shows the item and a visible problem (`app/api/check-photo/route.ts`, Gemini with a structured-output schema).

## Run it

```bash
npm install
cp .env.example .env.local   # add a Google AI Studio key for the photo check
npm run dev                  # localhost:3000
```

## Deploy

Import the repo into Vercel and set `GEMINI_API_KEY` in the environment variables. Without it, everything works except the photo check, which then falls back to "send without a photo".
