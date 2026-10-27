// Sample data for the prototype. Deterministic (seeded) so the server and the
// browser render the same numbers. Every screen that shows it says so.

export const TODAY = Date.UTC(2026, 9, 27, 18, 0); // 27 Oct 2026, 18:00 UTC
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

let seed = 7;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];

export type BatchStatus = 'live' | 'watch' | 'pulled';
export type Category = 'Fruit and veg' | 'Dairy and eggs' | 'Bakery';

export interface Batch {
  id: string;
  product: string;
  category: Category;
  source: string;
  region: string;
  harvested: number;
  graded: number;
  grade: string;
  checks: { name: string; value: string; pass: boolean }[];
  rejectedAtHub: number; // share of the lot rejected at grading
  coldChain: { stage: string; at: number; tempC: number | null }[];
  bestWithinDays: number;
  stores: string[];
  unitsSold: number;
  claims: number;
  healthClaims: number;
  priceRs: number;
}

export interface Claim {
  id: string;
  at: number;
  customer: string;
  batchId: string;
  product: string;
  reason: 'Spoiled' | 'Bruised or damaged' | 'Missing' | 'Wrong item' | 'Expired';
  photo: boolean;
  ai: { match: boolean; issue: string; confidence: number } | null;
  decision: 'Replaced' | 'Refunded' | 'In review' | 'Declined';
  minutesToResolve: number | null;
  valueRs: number;
  priorClaims90d: number;
}

const PRODUCTS: { product: string; category: Category; source: string; region: string; price: number; best: number; checks: Batch['checks'] }[] = [
  { product: 'Tomato, hybrid, 500 g', category: 'Fruit and veg', source: 'Srinivasa FPO', region: 'Kolar, Karnataka', price: 34, best: 4, checks: [{ name: 'Colour stage', value: 'Breaker to pink', pass: true }, { name: 'Firmness', value: '3.1 kg/cm²', pass: true }, { name: 'Size', value: '55–65 mm', pass: true }] },
  { product: 'Spinach, 250 g bunch', category: 'Fruit and veg', source: 'Hosahalli Greens', region: 'Chikkaballapur, Karnataka', price: 29, best: 2, checks: [{ name: 'Leaf turgor', value: 'Crisp', pass: true }, { name: 'Yellowing', value: '< 3% of leaves', pass: true }, { name: 'Washed and dried', value: 'Yes', pass: true }] },
  { product: 'Yelakki banana, 6 pcs', category: 'Fruit and veg', source: 'Cauvery Growers', region: 'Mandya, Karnataka', price: 58, best: 3, checks: [{ name: 'Ripeness', value: 'Stage 5 of 7', pass: true }, { name: 'Bruising', value: 'None visible', pass: true }, { name: 'Crown rot', value: 'Absent', pass: true }] },
  { product: 'Coriander, 100 g', category: 'Fruit and veg', source: 'Hosahalli Greens', region: 'Chikkaballapur, Karnataka', price: 15, best: 2, checks: [{ name: 'Leaf turgor', value: 'Crisp', pass: true }, { name: 'Roots trimmed', value: 'Yes', pass: true }, { name: 'Yellowing', value: '4% of leaves', pass: false }] },
  { product: 'Shimla apple, 4 pcs', category: 'Fruit and veg', source: 'Kotgarh Orchards', region: 'Shimla, Himachal Pradesh', price: 189, best: 10, checks: [{ name: 'Sugar (Brix)', value: '13.2°', pass: true }, { name: 'Firmness', value: '7.4 kg/cm²', pass: true }, { name: 'Skin defects', value: '< 5% of surface', pass: true }] },
  { product: 'A2 cow milk, 500 ml', category: 'Dairy and eggs', source: 'Kanakapura Dairy Co-op', region: 'Kanakapura, Karnataka', price: 48, best: 3, checks: [{ name: 'Milk fat', value: '4.2%', pass: true }, { name: 'Bacterial count', value: '< 30,000 cfu/ml', pass: true }, { name: 'Packed within', value: '6 h of milking', pass: true }] },
  { product: 'Set curd, 400 g', category: 'Dairy and eggs', source: 'Kanakapura Dairy Co-op', region: 'Kanakapura, Karnataka', price: 52, best: 5, checks: [{ name: 'pH', value: '4.5', pass: true }, { name: 'Set', value: 'Firm', pass: true }, { name: 'Packed within', value: '12 h', pass: true }] },
  { product: 'Brown eggs, 6 pcs', category: 'Dairy and eggs', source: 'Doddaballapur Farms', region: 'Doddaballapur, Karnataka', price: 72, best: 14, checks: [{ name: 'Candled', value: 'All clear', pass: true }, { name: 'Shell cracks', value: 'None', pass: true }, { name: 'Laid within', value: '48 h', pass: true }] },
  { product: 'Sourdough loaf, 400 g', category: 'Bakery', source: 'Indiranagar Bakehouse', region: 'Bengaluru', price: 145, best: 3, checks: [{ name: 'Baked', value: 'Same morning', pass: true }, { name: 'Crumb', value: 'Open, set', pass: true }, { name: 'Mould check', value: 'Clear', pass: true }] },
];

const STORES = ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar', 'Hebbal'];
const NAMES = ['Ananya R.', 'Rohit K.', 'Meera S.', 'Arjun P.', 'Kavya N.', 'Vikram T.', 'Divya M.', 'Siddharth B.', 'Neha G.', 'Karthik V.', 'Pooja A.', 'Rahul D.', 'Sneha I.', 'Aditya J.', 'Ishita L.'];

const code = (p: string) => p.split(/[ ,]/)[0].slice(0, 3).toUpperCase();

export const batches: Batch[] = PRODUCTS.flatMap((p, pi) =>
  [0, 1].map((k) => {
    const harvested = TODAY - (1 + pi % 3 + k * 2) * DAY - Math.round(rand() * 10) * HOUR;
    const graded = harvested + (6 + Math.round(rand() * 8)) * HOUR;
    const unitsSold = 300 + Math.round(rand() * 900);
    // A couple of batches are deliberately bad, so the screen has something to act on.
    const bad = (pi === 1 && k === 1) || (pi === 6 && k === 0);
    const watch = (pi === 0 && k === 1) || (pi === 3 && k === 0);
    const rate = bad ? 0.02 + rand() * 0.01 : watch ? 0.009 + rand() * 0.004 : 0.001 + rand() * 0.004;
    const claims = Math.max(0, Math.round(unitsSold * rate));
    const hubTemp = p.category === 'Fruit and veg' ? 8 + Math.round(rand() * 3) : 3 + Math.round(rand() * 2);
    return {
      id: `${code(p.product)}-${1027 - pi - k * 2}-${'AB'[k]}`,
      product: p.product,
      category: p.category,
      source: p.source,
      region: p.region,
      harvested,
      graded,
      grade: bad ? 'B+' : 'A',
      checks: p.checks,
      rejectedAtHub: Math.round((4 + rand() * 8) * 10) / 1000,
      coldChain: [
        { stage: p.category === 'Bakery' ? 'Baked' : p.category === 'Dairy and eggs' ? 'Collected' : 'Harvested', at: harvested, tempC: null },
        { stage: 'Graded at hub', at: graded, tempC: hubTemp },
        { stage: 'Reached dark store', at: graded + (10 + Math.round(rand() * 6)) * HOUR, tempC: hubTemp + (bad ? 6 : 1) },
      ],
      bestWithinDays: p.best,
      stores: STORES.filter(() => rand() > 0.45).slice(0, 4),
      unitsSold,
      claims,
      healthClaims: bad ? 2 + Math.round(rand() * 2) : 0,
      priceRs: p.price,
    };
  }),
);

export const claimRate = (b: Batch) => (b.claims / b.unitsSold) * 1000;

// Auto-pull rule, stated once and used everywhere.
export const PULL_RULE = { perThousand: 15, healthClaims: 3 };
export const WATCH_RULE = { perThousand: 8 };
export const statusOf = (b: Batch): BatchStatus =>
  claimRate(b) >= PULL_RULE.perThousand || b.healthClaims >= PULL_RULE.healthClaims
    ? 'pulled'
    : claimRate(b) >= WATCH_RULE.perThousand
      ? 'watch'
      : 'live';

/* The decision rule. The same function runs on the sample claims, on the live
   prototype's claims and is quoted in the PRD. */
export const TRUST = { autoValueRs: 150, maxPriorClaims: 2, minConfidence: 0.7 };

export function decide({
  photo,
  ai,
  valueRs,
  priorClaims90d,
  reason,
}: {
  photo: boolean;
  ai: { match: boolean; issue: string; confidence: number } | null;
  valueRs: number;
  priorClaims90d: number;
  reason: Claim['reason'];
}): { decision: Claim['decision']; why: string } {
  if (priorClaims90d > TRUST.maxPriorClaims) {
    return { decision: 'In review', why: `More than ${TRUST.maxPriorClaims} claims in 90 days, so a person checks this one.` };
  }
  if (photo && ai) {
    if (!ai.match) return { decision: 'In review', why: 'The photo does not seem to show the item ordered, so a person checks it.' };
    if (ai.confidence >= TRUST.minConfidence) return { decision: 'Replaced', why: `The photo shows the problem (${ai.issue.toLowerCase()}), so the replacement is approved instantly.` };
  }
  if (reason === 'Missing' || valueRs <= TRUST.autoValueRs) {
    return { decision: reason === 'Missing' ? 'Refunded' : 'Replaced', why: `Under ₹${TRUST.autoValueRs} and a good claim history, so it is approved on trust.` };
  }
  return { decision: 'In review', why: 'Higher-value item without a clear photo, so a person checks within 10 minutes.' };
}

const REASONS: Claim['reason'][] = ['Spoiled', 'Spoiled', 'Bruised or damaged', 'Bruised or damaged', 'Expired', 'Missing', 'Wrong item'];

export const claims: Claim[] = batches
  .flatMap((b) =>
    Array.from({ length: Math.min(b.claims, 9) }, () => {
      const reason = b.category === 'Dairy and eggs' && rand() > 0.5 ? 'Expired' : pick(REASONS);
      const photo = reason !== 'Missing' && rand() > 0.15;
      const confidence = Math.round((0.55 + rand() * 0.44) * 100) / 100;
      const match = rand() > 0.06;
      const priorClaims90d = rand() > 0.9 ? 3 + Math.round(rand() * 3) : Math.round(rand() * 1.4);
      const value = b.priceRs * (1 + Math.round(rand()));
      const ai = photo ? { match, issue: match ? (reason === 'Expired' ? 'Past date on pack' : reason === 'Spoiled' ? 'Rot or mould visible' : reason === 'Bruised or damaged' ? 'Bruising or crush' : 'Item visible') : 'Different item in photo', confidence } : null;
      const decision: Claim['decision'] = decide({ photo, ai, valueRs: value, priorClaims90d, reason }).decision;
      return {
        id: '',
        at: TODAY - Math.round(rand() * 13.5 * DAY),
        customer: pick(NAMES),
        batchId: b.id,
        product: b.product,
        reason,
        photo,
        ai,
        decision,
        minutesToResolve: decision === 'In review' ? null : decision === 'Replaced' || decision === 'Refunded' ? (ai ? 1 : 2) + Math.round(rand() * 2) : 9 + Math.round(rand() * 14),
        valueRs: value,
        priorClaims90d,
      } satisfies Claim;
    }),
  )
  .sort((a, b) => b.at - a.at)
  .map((c, i, all) => ({ ...c, id: `CLM-${String(4800 + all.length - i)}` }));

/* Daily counts for the last 14 days. */
export const daily = Array.from({ length: 14 }, (_, i) => {
  const start = TODAY - (13 - i) * DAY - (TODAY % DAY);
  const inDay = claims.filter((c) => c.at >= start && c.at < start + DAY);
  return { day: start, claims: inDay.length, auto: inDay.filter((c) => c.decision === 'Replaced' || c.decision === 'Refunded').length };
});

export const fmtDate = (t: number) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(t);
export const fmtDateTime = (t: number) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(t);
export const ago = (t: number) => {
  const h = Math.round((TODAY - t) / HOUR);
  return h < 1 ? 'just now' : h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};
export const rs = (v: number) => `₹${v.toLocaleString('en-IN')}`;
